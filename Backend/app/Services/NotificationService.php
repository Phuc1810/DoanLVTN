<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    public function sendOtp(string $channel, string $destination, string $otp, array $context = []): bool
    {
        return $this->sendResetPasswordOtp($channel, $destination, $otp, $context);
    }

    public function sendResetPasswordOtp(string $channel, string $destination, string $otp, array $context = []): bool
    {
        $minutes = (int) ($context['expires_minutes'] ?? config('services.otp.expires_minutes', 5));

        if ($channel === 'email') {
            return $this->sendEmail(
                $destination,
                'Mã OTP đặt lại mật khẩu',
                "Mã OTP của bạn là: <b>{$otp}</b><br>Mã có hiệu lực {$minutes} phút."
            );
        }

        if ($channel === 'sms') {
            return $this->sendSms($destination, "Ma OTP TourDuLich: {$otp} (hieu luc {$minutes} phut)");
        }

        Log::warning('Unsupported OTP notification channel.', ['channel' => $channel]);

        return false;
    }

    public function sendPaymentSuccess(array $orderInfo): bool
    {
        $orderId = (int) ($orderInfo['MaDon'] ?? 0);
        $money = number_format((float) ($orderInfo['TongTienPhaiTra'] ?? $orderInfo['amount'] ?? 0), 0, ',', '.');
        $departureDate = $this->formatDate($orderInfo['NgayKhoiHanh'] ?? null);

        $subject = "Xác nhận thanh toán đơn tour #DH{$orderId}";
        $html = "
            <div style='font-family:Arial,sans-serif;line-height:1.6'>
                <h2 style='margin:0 0 8px'>Thanh toán thành công</h2>
                <p>Xin chào <b>".e((string) ($orderInfo['HoTen'] ?? ''))."</b>,</p>
                <p>Đơn tour <b>#DH{$orderId}</b> đã được thanh toán thành công.</p>
                <ul>
                    <li><b>Tour:</b> ".e((string) ($orderInfo['TenTour'] ?? ''))."</li>
                    <li><b>Địa điểm:</b> ".e((string) ($orderInfo['DiaDiem'] ?? ''))."</li>
                    <li><b>Khởi hành:</b> {$departureDate}</li>
                    <li><b>Số lượng:</b> Người lớn ".(int) ($orderInfo['SoLuongNguoiLon'] ?? 0).", Trẻ em ".(int) ($orderInfo['SoLuongTreEm'] ?? 0).", Trẻ nhỏ ".(int) ($orderInfo['SoLuongTreNho'] ?? 0)."</li>
                    <li><b>Số tiền:</b> {$money} VND</li>
                    <li><b>Trạng thái:</b> Đã thanh toán</li>
                </ul>
                <p>Bạn có thể xem chi tiết đơn tại website.</p>
                <p style='color:#64748b;font-size:12px'>VietJourney Tour</p>
            </div>
        ";
        $sms = "VietJourney: DH{$orderId} thanh toan thanh cong. Tour: ".($orderInfo['TenTour'] ?? '').". Khoi hanh: {$departureDate}. So tien: {$money} VND.";

        return $this->sendPreferredChannel($orderInfo, $subject, $html, $sms);
    }

    public function sendSoldOutNotice(array $orderInfo): bool
    {
        $orderId = (int) ($orderInfo['MaDon'] ?? 0);
        $subject = "Thông báo tour đã hết chỗ cho đơn #DH{$orderId}";
        $html = "
            <div style='font-family:Arial,sans-serif;line-height:1.6'>
                <h2 style='margin:0 0 8px;color:#b45309'>Tour đã hết chỗ</h2>
                <p>Xin chào <b>".e((string) ($orderInfo['HoTen'] ?? ''))."</b>,</p>
                <p>Hệ thống đã nhận tiền cho đơn <b>#DH{$orderId}</b> nhưng tour <b>".e((string) ($orderInfo['TenTour'] ?? ''))."</b> hiện không còn đủ chỗ.</p>
                <p>Vui lòng liên hệ để được hỗ trợ xử lý.</p>
                <p style='color:#64748b;font-size:12px'>VietJourney Tour</p>
            </div>
        ";
        $sms = "VietJourney: Don DH{$orderId} da nhan tien nhung tour da het cho. Vui long lien he ho tro.";

        return $this->sendPreferredChannel($orderInfo, $subject, $html, $sms);
    }

    public function sendEmail(string $to, string $subject, string $html): bool
    {
        if (! filter_var($to, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        try {
            Mail::html($html, fn ($message) => $message->to($to)->subject($subject));

            return true;
        } catch (\Throwable $e) {
            Log::error('Email notification failed.', [
                'to' => $to,
                'subject' => $subject,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    public function sendSms(string $phone, string $message): bool
    {
        $baseUrl = config('services.infobip.base_url');
        $apiKey = config('services.infobip.api_key');
        $from = config('services.infobip.from');
        $to = $this->normalizePhoneToE164($phone);

        if (! $baseUrl || ! $apiKey || ! $from || $to === '') {
            Log::warning('Infobip SMS is not configured or destination is invalid.');

            return false;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'App '.$apiKey,
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])->post(rtrim((string) $baseUrl, '/').'/sms/2/text/advanced', [
                'messages' => [[
                    'from' => $from,
                    'destinations' => [
                        ['to' => $to],
                    ],
                    'text' => $message,
                ]],
            ]);

            if (! $response->successful()) {
                Log::error('SMS notification failed.', ['http_status' => $response->status()]);

                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::error('SMS notification failed.', ['error' => $e->getMessage()]);

            return false;
        }
    }

    public function normalizePhoneToE164(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?: '';

        if ($digits === '') {
            return '';
        }

        if (str_starts_with($digits, '0')) {
            return '+84'.substr($digits, 1);
        }

        if (str_starts_with($digits, '84')) {
            return '+'.$digits;
        }

        return '+'.$digits;
    }

    public function sendPaymentPaid(array $info): bool
    {
        return $this->sendPaymentSuccess($info);
    }

    public function sendPaymentSoldOut(array $info): bool
    {
        return $this->sendSoldOutNotice($info);
    }

    private function sendPreferredChannel(array $orderInfo, string $subject, string $html, string $sms): bool
    {
        $username = trim((string) ($orderInfo['TenDangNhap'] ?? ''));

        if ($username !== '' && filter_var($username, FILTER_VALIDATE_EMAIL)) {
            return $this->sendEmail($username, $subject, $html);
        }

        if ($username !== '' && preg_match('/^\d{9,12}$/', $username)) {
            return $this->sendSms($username, $sms);
        }

        $email = trim((string) ($orderInfo['Email'] ?? ''));
        if ($email !== '' && $this->sendEmail($email, $subject, $html)) {
            return true;
        }

        $phone = trim((string) ($orderInfo['SoDienThoai'] ?? ''));

        return $phone !== '' && $this->sendSms($phone, $sms);
    }

    private function formatDate($date): string
    {
        if (! $date) {
            return 'Đang cập nhật';
        }

        $timestamp = strtotime((string) $date);

        return $timestamp ? date('d/m/Y', $timestamp) : 'Đang cập nhật';
    }
}
