<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use RuntimeException;

class NotificationService
{
    public function sendOtp(string $channel, string $destination, string $otp): void
    {
        if ($channel === 'email') {
            $this->sendEmailOtp($destination, $otp);

            return;
        }

        if ($channel === 'sms') {
            $this->sendSmsOtp($destination, $otp);

            return;
        }

        throw new RuntimeException('Kênh gửi OTP không hợp lệ.');
    }

    private function sendEmailOtp(string $email, string $otp): void
    {
        Mail::raw("Mã OTP của bạn là: {$otp}\nMã có hiệu lực 5 phút.", function ($message) use ($email) {
            $message->to($email)->subject('Mã OTP đặt lại mật khẩu');
        });
    }

    private function sendSmsOtp(string $phone, string $otp): void
    {
        $baseUrl = config('services.infobip.base_url');
        $apiKey = config('services.infobip.api_key');
        $from = config('services.infobip.from');

        if (! $baseUrl || ! $apiKey || ! $from) {
            throw new RuntimeException('Chưa cấu hình SMS Infobip.');
        }

        $response = Http::withHeaders([
            'Authorization' => 'App '.$apiKey,
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ])->post(rtrim($baseUrl, '/').'/sms/2/text/advanced', [
            'messages' => [[
                'from' => $from,
                'destinations' => [
                    ['to' => $this->vnPhoneToE164($phone)],
                ],
                'text' => "Ma OTP TourDuLich: {$otp} (hieu luc 5 phut)",
            ]],
        ]);

        if (! $response->successful()) {
            throw new RuntimeException('Gửi SMS OTP thất bại.');
        }
    }

    private function vnPhoneToE164(string $phone): string
    {
        return '+84'.substr($phone, 1);
    }
}
