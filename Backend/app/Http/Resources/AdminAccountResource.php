<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminAccountResource extends JsonResource
{
    public function __construct($resource, private ?int $currentUserId = null)
    {
        parent::__construct($resource);
    }

    public function toArray(Request $request): array
    {
        return [
            'MaTK' => $this->MaTK,
            'TenDangNhap' => $this->TenDangNhap,
            'VaiTro' => $this->VaiTro,
            'TrangThai' => $this->TrangThai,
            'Provider' => $this->Provider,
            'profile' => $this->profilePayload(),
            'is_current_user' => $this->currentUserId !== null && (int) $this->MaTK === $this->currentUserId,
        ];
    }

    private function profilePayload(): ?array
    {
        if ($this->VaiTro === 'KH' && $this->relationLoaded('khachHang') && $this->khachHang) {
            return [
                'HoTen' => $this->khachHang->HoTen,
                'Email' => $this->khachHang->Email,
                'SoDienThoai' => $this->khachHang->SoDienThoai,
                'DiaChi' => $this->khachHang->DiaChi,
            ];
        }

        if ($this->VaiTro === 'NV' && $this->relationLoaded('nhanVien') && $this->nhanVien) {
            return [
                'HoTen' => $this->nhanVien->HoTen,
                'Email' => $this->nhanVien->Email,
                'SoDienThoai' => $this->nhanVien->SDT,
                'ChucVu' => $this->nhanVien->ChucVu,
            ];
        }

        if ($this->VaiTro === 'AD' && $this->relationLoaded('nhanVien') && $this->nhanVien) {
            return [
                'HoTen' => $this->nhanVien->HoTen,
                'Email' => $this->nhanVien->Email,
                'SoDienThoai' => $this->nhanVien->SDT,
                'ChucVu' => $this->nhanVien->ChucVu,
            ];
        }

        return null;
    }
}
