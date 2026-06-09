<?php

namespace Tests\Feature;

use App\Models\KhachHang;
use App\Models\NhanVien;
use App\Models\TaiKhoan;
use App\Models\TinTuc;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NewsApiTest extends TestCase
{
    use DatabaseTransactions;

    public function test_public_can_list_visible_news(): void
    {
        $this->news(['TrangThai' => 'Hiển thị', 'LoaiTin' => 'tintuc']);
        $this->news(['TrangThai' => 'Ẩn', 'LoaiTin' => 'tintuc']);

        $this->getJson('/api/news?loai=tintuc')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'items',
                    'pagination',
                ],
            ]);
    }

    public function test_public_cannot_view_hidden_news(): void
    {
        $news = $this->news(['TrangThai' => 'Ẩn']);

        $this->getJson("/api/news/{$news->MaTin}")
            ->assertNotFound()
            ->assertJsonPath('success', false);
    }

    public function test_customer_cannot_access_staff_news(): void
    {
        Sanctum::actingAs($this->customerAccount());

        $this->getJson('/api/staff/news')
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_staff_can_list_news(): void
    {
        $news = $this->news();

        Sanctum::actingAs($this->staffAccount());

        $this->getJson('/api/staff/news?q='.$news->MaTin)
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'items',
                    'pagination',
                ],
            ]);
    }

    public function test_store_news_validates_required_fields(): void
    {
        Sanctum::actingAs($this->staffAccount());

        $this->postJson('/api/staff/news', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['TieuDe', 'MoTa', 'NoiDung', 'AnhDaiDien']);
    }

    public function test_staff_can_create_news(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($this->staffAccount());

        $response = $this->withHeader('Accept', 'application/json')->post('/api/staff/news', array_merge($this->payload(), [
            'AnhDaiDien' => UploadedFile::fake()->image('news.jpg', 800, 600),
        ]));

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.TieuDe', 'Tin Staff Test');

        $this->assertDatabaseHas('tintuc', [
            'MaTin' => $response->json('data.MaTin'),
            'TieuDe' => 'Tin Staff Test',
            'LoaiTin' => 'tintuc',
            'TrangThai' => 'Hiển thị',
        ]);
    }

    public function test_update_news_keeps_old_image_when_no_new_upload(): void
    {
        $news = $this->news(['AnhDaiDien' => 'img/old-news.jpg']);

        Sanctum::actingAs($this->staffAccount());

        $this->putJson("/api/staff/news/{$news->MaTin}", $this->payload([
            'TieuDe' => 'Tin Updated',
            'TrangThai' => 'Ẩn',
        ]))
            ->assertOk()
            ->assertJsonPath('data.TieuDe', 'Tin Updated')
            ->assertJsonPath('data.AnhDaiDien', 'img/old-news.jpg');
    }

    public function test_toggle_news_status_uses_legacy_logic(): void
    {
        $news = $this->news(['TrangThai' => 'Hiển thị']);

        Sanctum::actingAs($this->staffAccount());

        $this->patchJson("/api/staff/news/{$news->MaTin}/toggle")
            ->assertOk()
            ->assertJsonPath('data.TrangThai', 'Ẩn');

        $this->patchJson("/api/staff/news/{$news->MaTin}/toggle")
            ->assertOk()
            ->assertJsonPath('data.TrangThai', 'Hiển thị');
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'TieuDe' => 'Tin Staff Test',
            'MoTa' => 'Mo ta tin staff test',
            'NoiDung' => 'Noi dung tin staff test',
            'LoaiTin' => 'tintuc',
            'TrangThai' => 'Hiển thị',
        ], $overrides);
    }

    private function news(array $overrides = []): TinTuc
    {
        return TinTuc::create(array_merge([
            'TieuDe' => 'Tin Seed '.uniqid(),
            'MoTa' => 'Mo ta tin seed',
            'NoiDung' => 'Noi dung tin seed',
            'LoaiTin' => 'tintuc',
            'AnhDaiDien' => 'img/news-seed.jpg',
            'NgayDang' => now()->toDateString(),
            'TrangThai' => 'Hiển thị',
            'MaNV' => $this->staffAccount()->nhanVien->MaNV,
        ], $overrides));
    }

    private function staffAccount(): TaiKhoan
    {
        $user = TaiKhoan::create([
            'TenDangNhap' => 'news_nv_'.uniqid(),
            'MatKhau' => 'unused',
            'VaiTro' => 'NV',
            'TrangThai' => 'Hoạt động',
            'Provider' => 'local',
        ]);

        NhanVien::create([
            'HoTen' => 'Nhan Vien News Test',
            'Email' => 'news_nv_'.uniqid().'@example.com',
            'SDT' => '0987654321',
            'ChucVu' => 'Test',
            'MaTK' => $user->MaTK,
        ]);

        return $user;
    }

    private function customerAccount(): TaiKhoan
    {
        $user = TaiKhoan::create([
            'TenDangNhap' => 'news_kh_'.uniqid(),
            'MatKhau' => 'unused',
            'VaiTro' => 'KH',
            'TrangThai' => 'Hoạt động',
            'Provider' => 'local',
        ]);

        KhachHang::create([
            'HoTen' => 'Khach Hang News Test',
            'Email' => 'news_kh_'.uniqid().'@example.com',
            'SoDienThoai' => '0900000000',
            'DiaChi' => 'Test',
            'NgaySinh' => '1999-01-01',
            'GioiTinh' => 'Nam',
            'MaTK' => $user->MaTK,
        ]);

        return $user;
    }
}
