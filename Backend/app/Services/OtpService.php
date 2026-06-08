<?php

namespace App\Services;

use App\Models\KhachHang;
use App\Models\PasswordResetOtp;
use App\Models\TaiKhoan;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class OtpService
{
    public function __construct(private NotificationService $notificationService)
    {
    }

    public function requestOtp(string $contact): array
    {
        [$channel, $normalizedContact] = $this->resolveChannel($contact);

        $khachHang = KhachHang::with('taiKhoan')
            ->where('Email', $normalizedContact)
            ->orWhere('SoDienThoai', $normalizedContact)
            ->orWhereHas('taiKhoan', fn ($query) => $query->where('TenDangNhap', $normalizedContact))
            ->first();

        if (! $khachHang || ! $khachHang->taiKhoan) {
            return [
                'message' => 'Nếu thông tin đúng, hệ thống đã gửi OTP.',
                'data' => null,
            ];
        }

        if ($khachHang->taiKhoan->Provider !== 'local') {
            throw ValidationException::withMessages([
                'contact' => ['Tài khoản này đăng nhập bằng Google. Vui lòng dùng đăng nhập Google.'],
            ]);
        }

        $destination = $channel === 'email' ? $khachHang->Email : $khachHang->SoDienThoai;
        if (! $destination) {
            throw ValidationException::withMessages([
                'contact' => ['Tài khoản không có thông tin nhận OTP phù hợp.'],
            ]);
        }

        $otp = (string) random_int(100000, 999999);
        $record = PasswordResetOtp::create([
            'MaTK' => $khachHang->MaTK,
            'channel' => $channel,
            'destination' => $destination,
            'otp_hash' => Hash::make($otp),
            'expires_at' => now()->addMinutes((int) config('services.otp.expires_minutes', 5)),
            'attempts' => 0,
            'created_at' => now(),
        ]);

        $this->notificationService->sendOtp($channel, $destination, $otp);

        return [
            'message' => 'Đã gửi OTP. Vui lòng kiểm tra thông tin nhận mã.',
            'data' => [
                'otp_id' => $record->id,
                'channel' => $channel,
                'destination_masked' => $this->maskDestination($channel, $destination),
                'expires_at' => $record->expires_at,
            ],
        ];
    }

    public function resendOtp(int $otpId): array
    {
        $old = PasswordResetOtp::find($otpId);

        if (! $old || $old->used_at) {
            throw ValidationException::withMessages([
                'otp_id' => ['Yêu cầu OTP không hợp lệ.'],
            ]);
        }

        $cooldown = (int) config('services.otp.resend_cooldown_seconds', 20);
        $createdAt = Carbon::parse($old->created_at);
        $remaining = $cooldown - $createdAt->diffInSeconds(now());

        if ($remaining > 0) {
            throw ValidationException::withMessages([
                'otp_id' => ["Vui lòng đợi {$remaining} giây để gửi lại OTP."],
            ]);
        }

        $otp = (string) random_int(100000, 999999);
        $record = PasswordResetOtp::create([
            'MaTK' => $old->MaTK,
            'channel' => $old->channel,
            'destination' => $old->destination,
            'otp_hash' => Hash::make($otp),
            'expires_at' => now()->addMinutes((int) config('services.otp.expires_minutes', 5)),
            'attempts' => 0,
            'created_at' => now(),
        ]);

        $this->notificationService->sendOtp($record->channel, $record->destination, $otp);

        return [
            'otp_id' => $record->id,
            'channel' => $record->channel,
            'destination_masked' => $this->maskDestination($record->channel, $record->destination),
            'expires_at' => $record->expires_at,
        ];
    }

    public function verifyOtp(int $otpId, string $otp): array
    {
        $record = PasswordResetOtp::find($otpId);

        if (! $record) {
            throw ValidationException::withMessages(['otp_id' => ['Yêu cầu OTP không tồn tại.']]);
        }

        if ($record->used_at) {
            throw ValidationException::withMessages(['otp_id' => ['OTP đã được sử dụng.']]);
        }

        if (Carbon::parse($record->expires_at)->isPast()) {
            throw ValidationException::withMessages(['otp_id' => ['OTP đã hết hạn.']]);
        }

        $maxAttempts = (int) config('services.otp.max_attempts', 5);
        if ((int) $record->attempts >= $maxAttempts) {
            throw ValidationException::withMessages(['otp' => ['Bạn nhập sai quá nhiều lần. Vui lòng tạo yêu cầu mới.']]);
        }

        if (! Hash::check($otp, $record->otp_hash)) {
            $record->increment('attempts');
            throw ValidationException::withMessages(['otp' => ['OTP không đúng. Vui lòng thử lại.']]);
        }

        $resetToken = Crypt::encryptString(json_encode([
            'otp_id' => $record->id,
            'MaTK' => $record->MaTK,
            'verified_at' => now()->timestamp,
        ]));

        return [
            'reset_token' => $resetToken,
            'otp_id' => $record->id,
        ];
    }

    public function validateResetToken(string $resetToken): PasswordResetOtp
    {
        try {
            $payload = json_decode(Crypt::decryptString($resetToken), true, flags: JSON_THROW_ON_ERROR);
        } catch (\Throwable) {
            throw ValidationException::withMessages(['reset_token' => ['Reset token không hợp lệ.']]);
        }

        $record = PasswordResetOtp::where('id', $payload['otp_id'] ?? null)
            ->where('MaTK', $payload['MaTK'] ?? null)
            ->first();

        if (! $record || $record->used_at || Carbon::parse($record->expires_at)->isPast()) {
            throw ValidationException::withMessages(['reset_token' => ['Reset token không hợp lệ hoặc đã hết hạn.']]);
        }

        return $record;
    }

    private function resolveChannel(string $contact): array
    {
        $contact = trim($contact);

        if (filter_var($contact, FILTER_VALIDATE_EMAIL)) {
            return ['email', $contact];
        }

        if (preg_match('/^\d{10}$/', $contact)) {
            return ['sms', $contact];
        }

        throw ValidationException::withMessages([
            'contact' => ['Email/SĐT không hợp lệ.'],
        ]);
    }

    private function maskDestination(string $channel, string $destination): string
    {
        if ($channel === 'email') {
            [$name, $domain] = array_pad(explode('@', $destination, 2), 2, '');

            return substr($name, 0, 2).str_repeat('*', max(0, strlen($name) - 2)).'@'.$domain;
        }

        return substr($destination, 0, 2).str_repeat('*', 6).substr($destination, -2);
    }
}
