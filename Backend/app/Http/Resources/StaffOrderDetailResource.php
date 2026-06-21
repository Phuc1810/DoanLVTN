<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class StaffOrderDetailResource extends StaffOrderResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'GiaNguoiLonApDung' => $this->GiaNguoiLonApDung,
            'GiaTreEmApDung' => $this->GiaTreEmApDung,
            'tai_khoan' => $this->accountPayload(),
            'lich_trinh' => $this->schedulePayload(),
            'payments' => $this->relationLoaded('thanhToans')
                ? $this->thanhToans->map(fn ($payment) => $this->paymentPayload($payment))->values()
                : [],
            'refunds' => $this->relationLoaded('hoanTiens')
                ? $this->hoanTiens->map(fn ($refund) => $this->refundPayload($refund))->values()
                : [],
            'promotion' => $this->promotionPayload(),
        ]);
    }

    private function accountPayload(): ?array
    {
        if (! $this->relationLoaded('khachHang') || ! $this->khachHang?->relationLoaded('taiKhoan') || ! $this->khachHang->taiKhoan) {
            return null;
        }

        return [
            'MaTK' => $this->khachHang->taiKhoan->MaTK,
            'TenDangNhap' => $this->khachHang->taiKhoan->TenDangNhap,
            'VaiTro' => $this->khachHang->taiKhoan->VaiTro,
            'TrangThai' => $this->khachHang->taiKhoan->TrangThai,
            'Provider' => $this->khachHang->taiKhoan->Provider,
        ];
    }

    private function schedulePayload(): array
    {
        if (! $this->relationLoaded('tour') || ! $this->tour?->relationLoaded('lichTrinhs')) {
            return [];
        }

        return $this->tour->lichTrinhs->map(fn ($schedule) => [
            'MaLT' => $schedule->MaLT,
            'NgayThu' => $schedule->NgayThu,
            'TieuDe' => $schedule->TieuDe,
            'NoiDung' => $schedule->NoiDung,
            'MaTour' => $schedule->MaTour,
        ])->values()->all();
    }

    private function promotionPayload(): ?array
    {
        if (! $this->relationLoaded('chuongTrinhKhuyenMai') || ! $this->chuongTrinhKhuyenMai) {
            return null;
        }

        return [
            'MaCTKM' => $this->chuongTrinhKhuyenMai->MaCTKM,
            'TenKM' => $this->chuongTrinhKhuyenMai->TenKM,
            'PhanTramGiam' => $this->chuongTrinhKhuyenMai->PhanTramGiam,
            'NgayBatDau' => $this->chuongTrinhKhuyenMai->NgayBatDau,
            'NgayKetThuc' => $this->chuongTrinhKhuyenMai->NgayKetThuc,
            'TrangThai' => $this->chuongTrinhKhuyenMai->TrangThai,
        ];
    }
}
