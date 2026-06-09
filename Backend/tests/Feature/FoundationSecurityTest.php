<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\VerifySepayWebhook;
use App\Models\TaiKhoan;
use App\Services\NotificationService;
use App\Services\UploadService;
use Illuminate\Http\Request;
use Tests\TestCase;

class FoundationSecurityTest extends TestCase
{
    public function test_notification_service_normalizes_vietnam_phone_numbers(): void
    {
        $service = app(NotificationService::class);

        $this->assertSame('+84901234567', $service->normalizePhoneToE164('0901234567'));
        $this->assertSame('+84901234567', $service->normalizePhoneToE164('84901234567'));
        $this->assertSame('', $service->normalizePhoneToE164(''));
    }

    public function test_upload_service_public_url_supports_old_and_new_paths(): void
    {
        config(['app.url' => 'http://localhost']);
        $service = app(UploadService::class);

        $this->assertSame('http://localhost/storage/tours/tour_1.jpg', $service->publicUrl('tours/tour_1.jpg'));
        $this->assertSame('http://localhost/storage/news/news_1.jpg', $service->publicUrl('storage/news/news_1.jpg'));
        $this->assertSame('http://localhost/assets/img/old.jpg', $service->publicUrl('img/old.jpg'));
        $this->assertSame('https://cdn.example.com/a.jpg', $service->publicUrl('https://cdn.example.com/a.jpg'));
        $this->assertNull($service->publicUrl(null));
    }

    public function test_sepay_webhook_middleware_rejects_invalid_token(): void
    {
        config(['payment.sepay.webhook_token' => 'secret-token']);

        $request = Request::create('/api/webhooks/sepay', 'POST', [], [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer wrong-token',
        ]);

        $response = app(VerifySepayWebhook::class)->handle($request, fn () => response()->json(['ok' => true]));

        $this->assertSame(401, $response->getStatusCode());
        $this->assertFalse($response->getData(true)['success']);
    }

    public function test_sepay_webhook_middleware_accepts_bearer_or_api_key_token(): void
    {
        config(['payment.sepay.webhook_token' => 'secret-token']);

        $bearer = Request::create('/api/webhooks/sepay', 'POST', [], [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer secret-token',
        ]);
        $apiKey = Request::create('/api/webhooks/sepay', 'POST', [], [], [], [
            'HTTP_X_API_KEY' => 'secret-token',
        ]);

        $this->assertSame(200, app(VerifySepayWebhook::class)->handle($bearer, fn () => response()->json(['ok' => true]))->getStatusCode());
        $this->assertSame(200, app(VerifySepayWebhook::class)->handle($apiKey, fn () => response()->json(['ok' => true]))->getStatusCode());
    }

    public function test_role_middleware_blocks_wrong_role(): void
    {
        $request = Request::create('/api/staff/orders', 'GET');
        $request->setUserResolver(fn () => new TaiKhoan([
            'VaiTro' => 'KH',
        ]));

        $response = app(EnsureRole::class)->handle($request, fn () => response()->json(['ok' => true]), 'NV', 'AD');

        $this->assertSame(403, $response->getStatusCode());
        $this->assertFalse($response->getData(true)['success']);
    }

    public function test_tai_khoan_does_not_serialize_password_hash(): void
    {
        $account = new TaiKhoan([
            'TenDangNhap' => 'tester',
            'MatKhau' => 'hashed-password',
            'VaiTro' => 'KH',
            'TrangThai' => 'Hoạt động',
        ]);

        $this->assertArrayNotHasKey('MatKhau', $account->toArray());
    }
}
