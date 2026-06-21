<?php

namespace App\Services;

use App\Models\KhachHang;
use App\Models\NhanVien;
use App\Models\TaiKhoan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(private OtpService $otpService)
    {
    }

    public function registerCustomer(array $data): array
    {
        $hoten = trim($data['hoten']);
        $contact = trim($data['contact']);
        $diachi = trim($data['diachi']);
        $ngaysinh = trim($data['ngaysinh']);
        $gioitinh = trim($data['gioitinh']);
        $password = (string) $data['password'];

        $this->validateFullName($hoten);
        [$email, $phone] = $this->resolveRegisterContact($contact);
        $this->validateStrongPassword($password);

        $loginKey = $email ?: $phone;

        if (TaiKhoan::where('TenDangNhap', $loginKey)->exists()) {
            throw ValidationException::withMessages([
                'contact' => ['Email/SĐT này đã được dùng để đăng ký.'],
            ]);
        }

        $duplicateCustomer = KhachHang::query()
            ->when($email, fn ($query) => $query->orWhere('Email', $email))
            ->when($phone, fn ($query) => $query->orWhere('SoDienThoai', $phone))
            ->first();

        if ($duplicateCustomer) {
            throw ValidationException::withMessages([
                'contact' => [$email ? 'Email đã tồn tại.' : 'Số điện thoại đã tồn tại.'],
            ]);
        }

        return DB::transaction(function () use ($hoten, $email, $phone, $diachi, $ngaysinh, $gioitinh, $password, $loginKey) {
            $taiKhoan = TaiKhoan::create([
                'TenDangNhap' => $loginKey,
                'MatKhau' => Hash::make($password),
                'VaiTro' => 'KH',
                'TrangThai' => 'Hoạt động',
                'Provider' => 'local',
                'GoogleSub' => null,
            ]);

            $khachHang = KhachHang::create([
                'HoTen' => $hoten,
                'Email' => $email,
                'SoDienThoai' => $phone,
                'DiaChi' => $diachi,
                'NgaySinh' => $ngaysinh,
                'GioiTinh' => $gioitinh,
                'MaTK' => $taiKhoan->MaTK,
            ]);

            return [
                'tai_khoan' => $this->accountPayload($taiKhoan, $khachHang),
            ];
        });
    }

    public function loginCustomer(array $data): array
    {
        $loginKey = trim($data['login_key'] ?? $data['username'] ?? '');
        $password = (string) $data['password'];

        $taiKhoan = TaiKhoan::with('khachHang')
            ->where('Provider', 'local')
            ->where(function ($query) use ($loginKey) {
                $query->where('TenDangNhap', $loginKey)
                    ->orWhereHas('khachHang', function ($q) use ($loginKey) {
                        $q->where('Email', $loginKey)
                            ->orWhere('SoDienThoai', $loginKey);
                    });
            })
            ->first();

        if (! $taiKhoan) {
            throw ValidationException::withMessages([
                'login_key' => ['Không tìm thấy tài khoản với Email/SĐT này.'],
            ]);
        }

        if ($taiKhoan->VaiTro !== 'KH') {
            throw ValidationException::withMessages([
                'login_key' => ['Tài khoản này là Nhân viên/Admin, vui lòng đăng nhập tại trang quản trị.'],
            ]);
        }

        $this->ensureActive($taiKhoan);
        $this->ensurePassword($taiKhoan, $password);

        return $this->tokenPayload($taiKhoan, 'customer-api-token');
    }

    public function loginStaff(array $data): array
    {
        $username = trim($data['username'] ?? $data['login_key'] ?? '');
        $password = (string) $data['password'];

        $taiKhoan = TaiKhoan::with('nhanVien')
            ->where('TenDangNhap', $username)
            ->whereIn('VaiTro', ['NV', 'AD'])
            ->first();

        if (! $taiKhoan) {
            throw ValidationException::withMessages([
                'login_key' => ['Tài khoản không tồn tại hoặc không có quyền truy cập.'],
            ]);
        }

        $this->ensureActive($taiKhoan);
        $this->ensurePassword($taiKhoan, $password);

        return $this->tokenPayload($taiKhoan, 'staff-api-token');
    }

    public function me(TaiKhoan $taiKhoan): array
    {
        $taiKhoan->loadMissing(['khachHang', 'nhanVien', 'admin']);

        return [
            'tai_khoan' => $this->accountPayload($taiKhoan),
            'khach_hang' => $taiKhoan->VaiTro === 'KH' ? $taiKhoan->khachHang : null,
            'nhan_vien' => in_array($taiKhoan->VaiTro, ['NV', 'AD'], true) ? $taiKhoan->nhanVien : null,
            'admin' => $taiKhoan->VaiTro === 'AD' ? $taiKhoan->admin : null,
        ];
    }

    public function changePassword(TaiKhoan $taiKhoan, array $data): void
    {
        $this->ensurePassword($taiKhoan, (string) $data['current_password']);
        $this->validateStrongPassword((string) $data['password']);

        $taiKhoan->update([
            'MatKhau' => Hash::make((string) $data['password']),
        ]);
    }

    public function resetPassword(array $data): void
    {
        $record = $this->otpService->validateResetToken($data['reset_token']);
        $this->validateStrongPassword((string) $data['password']);

        DB::transaction(function () use ($record, $data) {
            TaiKhoan::where('MaTK', $record->MaTK)->update([
                'MatKhau' => Hash::make((string) $data['password']),
            ]);

            $record->update([
                'used_at' => now(),
            ]);
        });
    }

    public function googleLogin(string $credential): array
    {
        $clientId = config('services.google.client_id');

        if (! $clientId) {
            throw ValidationException::withMessages([
                'google' => ['Chưa cấu hình GOOGLE_CLIENT_ID trong .env.'],
            ]);
        }

        $response = Http::timeout(10)->get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $credential,
        ]);

        if (! $response->successful()) {
            throw ValidationException::withMessages([
                'credential' => ['Không verify được Google token.'],
            ]);
        }

        $tokenInfo = $response->json();
        if (($tokenInfo['aud'] ?? '') !== $clientId) {
            throw ValidationException::withMessages([
                'credential' => ['Google token không hợp lệ.'],
            ]);
        }

        $email = $tokenInfo['email'] ?? null;
        $sub = $tokenInfo['sub'] ?? null;
        $name = $tokenInfo['name'] ?? 'Google User';

        if (! $email || ! $sub) {
            throw ValidationException::withMessages([
                'credential' => ['Google token thiếu email hoặc sub.'],
            ]);
        }

        $taiKhoan = DB::transaction(function () use ($email, $sub, $name) {
            $taiKhoan = TaiKhoan::with('khachHang')
                ->where('GoogleSub', $sub)
                ->orWhereHas('khachHang', fn ($query) => $query->where('Email', $email))
                ->first();

            if ($taiKhoan) {
                $this->ensureActive($taiKhoan);
                $taiKhoan->update([
                    'Provider' => 'google',
                    'GoogleSub' => $taiKhoan->GoogleSub ?: $sub,
                ]);

                return $taiKhoan->fresh(['khachHang']);
            }

            $newTaiKhoan = TaiKhoan::create([
                'TenDangNhap' => mb_strtolower($email, 'UTF-8'),
                'MatKhau' => Hash::make(bin2hex(random_bytes(16))),
                'VaiTro' => 'KH',
                'TrangThai' => 'Hoạt động',
                'Provider' => 'google',
                'GoogleSub' => $sub,
            ]);

            KhachHang::create([
                'HoTen' => $name,
                'Email' => $email,
                'SoDienThoai' => null,
                'MaTK' => $newTaiKhoan->MaTK,
            ]);

            return $newTaiKhoan->fresh(['khachHang']);
        });

        return $this->tokenPayload($taiKhoan, 'google-api-token');
    }

    private function tokenPayload(TaiKhoan $taiKhoan, string $tokenName): array
    {
        $token = $taiKhoan->createToken($tokenName)->plainTextToken;

        return [
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->accountPayload($taiKhoan),
        ];
    }

    private function accountPayload(TaiKhoan $taiKhoan, ?KhachHang $khachHang = null): array
    {
        $khachHang ??= $taiKhoan->khachHang;
        $nhanVien = $taiKhoan->nhanVien;

        return [
            'MaTK' => $taiKhoan->MaTK,
            'TenDangNhap' => $taiKhoan->TenDangNhap,
            'VaiTro' => $taiKhoan->VaiTro,
            'TrangThai' => $taiKhoan->TrangThai,
            'Provider' => $taiKhoan->Provider,
            'HoTen' => $khachHang->HoTen ?? $nhanVien->HoTen ?? null,
            'Email' => $khachHang->Email ?? $nhanVien->Email ?? null,
            'SoDienThoai' => $khachHang->SoDienThoai ?? $nhanVien->SDT ?? null,
        ];
    }

    private function validateFullName(string $fullName): void
    {
        $words = array_values(array_filter(preg_split('/\s+/', trim($fullName))));

        if (count($words) < 2) {
            throw ValidationException::withMessages([
                'hoten' => ['Họ tên phải có ít nhất 2 từ.'],
            ]);
        }
    }

    private function resolveRegisterContact(string $contact): array
    {
        if (filter_var($contact, FILTER_VALIDATE_EMAIL)) {
            if (! preg_match('/@gmail\.com$/i', $contact)) {
                throw ValidationException::withMessages([
                    'contact' => ['Email phải có đuôi @gmail.com.'],
                ]);
            }

            return [$contact, null];
        }

        if (preg_match('/^\d{10}$/', $contact)) {
            return [null, $contact];
        }

        throw ValidationException::withMessages([
            'contact' => ['Email/SĐT không hợp lệ.'],
        ]);
    }

    private function validateStrongPassword(string $password): void
    {
        $message = match (true) {
            strlen($password) < 8 => 'Mật khẩu phải >= 8 ký tự.',
            ! preg_match('/[a-z]/', $password) => 'Mật khẩu phải có chữ thường.',
            ! preg_match('/[A-Z]/', $password) => 'Mật khẩu phải có chữ hoa.',
            ! preg_match('/\d/', $password) => 'Mật khẩu phải có số.',
            ! preg_match('/[^a-zA-Z0-9]/', $password) => 'Mật khẩu phải có ký tự đặc biệt.',
            default => null,
        };

        if ($message) {
            throw ValidationException::withMessages([
                'password' => [$message],
            ]);
        }
    }

    private function ensureActive(TaiKhoan $taiKhoan): void
    {
        if ($taiKhoan->TrangThai !== 'Hoạt động') {
            throw ValidationException::withMessages([
                'account' => ['Tài khoản đang bị khóa hoặc không hoạt động.'],
            ]);
        }
    }

    private function ensurePassword(TaiKhoan $taiKhoan, string $password): void
    {
        if (! Hash::check($password, $taiKhoan->MatKhau)) {
            throw ValidationException::withMessages([
                'password' => ['Mật khẩu không đúng.'],
            ]);
        }
    }
}
