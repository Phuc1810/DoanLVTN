<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class VerifySepayWebhook
{
    public function handle(Request $request, Closure $next): Response
    {
        $expected = trim((string) config('payment.sepay.webhook_token', ''));

        if ($expected === '') {
            Log::warning('SEPAY_WEBHOOK_TOKEN is empty; webhook token verification is bypassed.');

            return $next($request);
        }

        $valid = $this->hasValidToken($request, $expected);

        if (! $valid) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized webhook',
                'errors' => [
                    'token' => ['Webhook token không hợp lệ.'],
                ],
            ], 401);
        }

        return $next($request);
    }

    private function hasValidToken(Request $request, string $expected): bool
    {
        $authorization = trim((string) $request->header('Authorization', ''));
        $apiKey = trim((string) ($request->header('X-Api-Key') ?: $request->header('X-API-Key')));
        $webhookToken = trim((string) $request->header('X-Webhook-Token', ''));
        $queryToken = trim((string) $request->query('token', ''));

        return in_array($authorization, [
            'Bearer '.$expected,
            'Apikey '.$expected,
            'APIKEY '.$expected,
            'ApiKey '.$expected,
            $expected,
        ], true)
            || $apiKey === $expected
            || $webhookToken === $expected
            || $queryToken === $expected;
    }
}
