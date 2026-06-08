<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use RuntimeException;

class NotificationService
{
    public function sendPaymentPaid(array $info): void
    {
        $message = "VietJourney: DH{$info['MaDon']} thanh toan thanh cong. Tour: {$info['TenTour']}. So tien: {$info['amount']} VND.";
        $this->sendPaymentNotice($info, "Xác nhận thanh toán đơn tour #DH{$info['MaDon']}", $message);
    }

    public function sendPaymentSoldOut(array $info): void
    {
        $message = "VietJourney: Don DH{$info['MaDon']} da nhan tien nhung tour da het cho. Vui long lien he ho tro.";
        $this->sendPaymentNotice($info, "Thông báo tour đã hết chỗ cho đơn #DH{$info['MaDon']}", $message);
    }

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

    private function sendPaymentNotice(array $info, string $subject, string $message): void
    {
        $email = $this->preferredEmail($info);
        $phone = $this->preferredPhone($info);

        if ($email) {
            Mail::raw($message, fn ($mail) => $mail->to($email)->subject($subject));

            return;
        }

        if ($phone) {
            $this->sendSmsMessage($phone, $message);
        }
    }

    private function preferredEmail(array $info): ?string
    {
        $username = trim((string) ($info['TenDangNhap'] ?? ''));

        if ($username !== '' && filter_var($username, FILTER_VALIDATE_EMAIL)) {
            return $username;
        }

        $email = trim((string) ($info['Email'] ?? ''));

        return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : null;
    }

    private function preferredPhone(array $info): ?string
    {
        $username = trim((string) ($info['TenDangNhap'] ?? ''));

        if ($username !== '' && preg_match('/^\d{9,12}$/', $username)) {
            return $username;
        }

        $phone = trim((string) ($info['SoDienThoai'] ?? ''));

        return $phone !== '' ? $phone : null;
    }

    private function sendSmsOtp(string $phone, string $otp): void
    {
        $this->sendSmsMessage($phone, "Ma OTP TourDuLich: {$otp} (hieu luc 5 phut)");
    }

    private function sendSmsMessage(string $phone, string $text): void
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
                'text' => $text,
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
