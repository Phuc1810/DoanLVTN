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

        $authorization = trim((string) $request->header('Authorization', ''));
        $apiKey = trim((string) ($request->header('X-Api-Key') ?: $request->header('X-API-Key')));

        $valid = $authorization === 'Bearer '.$expected
            || $authorization === 'Apikey '.$expected
            || $authorization === 'APIKEY '.$expected
            || $authorization === 'ApiKey '.$expected
            || $authorization === $expected
            || $apiKey === $expected;

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
}
