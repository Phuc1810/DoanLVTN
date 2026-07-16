<?php

namespace App\Http\Resources;

use App\Services\UploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StaffOrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $latestPayment = $this->relationLoaded('thanhToans') ? $this->thanhToans->first() : null;
        $latestRefund = $this->relationLoaded('hoanTiens') ? $this->hoanTiens->first() : null;

        return [
            'MaDon' => $this->MaDon,
            'NgayDat' => $this->NgayDat,
            'TrangThai' => $this->TrangThai,
            'SoLuongNguoiLon' => $this->SoLuongNguoiLon,
            'SoLuongTreEm' => $this->SoLuongTreEm,
            'SoLuongTreNho' => $this->SoLuongTreNho,
            'SoNguoi' => (int) $this->SoLuongNguoiLon + (int) $this->SoLuongTreEm + (int) $this->SoLuongTreNho,
            'TongTienGoc' => $this->TongTienGoc,
            'TongTienPhaiTra' => $this->TongTienPhaiTra,
            'MaKH' => $this->MaKH,
            'MaTour' => $this->MaTour,
            'MaCTKM' => $this->MaCTKM,
            'khach_hang' => $this->customerPayload(),
            'tour' => $this->tourPayload(),
            'payment' => $latestPayment ? $this->paymentPayload($latestPayment) : null,
            'refund' => $latestRefund ? $this->refundPayload($latestRefund) : null,
        ];
    }

    protected function customerPayload(): ?array
    {
        if (! $this->relationLoaded('khachHang') || ! $this->khachHang) {
            return null;
        }

        return [
            'MaKH' => $this->khachHang->MaKH,
            'HoTen' => $this->khachHang->HoTen,
            'Email' => $this->khachHang->Email,
            'SoDienThoai' => $this->khachHang->SoDienThoai,
            'DiaChi' => $this->khachHang->DiaChi,
        ];
    }

    protected function tourPayload(): ?array
    {
        if (! $this->relationLoaded('tour') || ! $this->tour) {
            return null;
        }

        $image = $this->tour->relationLoaded('anhChinh') ? $this->tour->anhChinh?->DuongDan : null;

        return [
            'MaTour' => $this->tour->MaTour,
            'TenTour' => $this->tour->TenTour,
            'DiaDiem' => $this->tour->DiaDiem,
            'ThoiLuong' => $this->tour->ThoiLuong,
            'NgayKhoiHanh' => $this->tour->NgayKhoiHanh,
            'NgayKetThuc' => $this->tour->NgayKetThuc,
            'SoCho' => $this->tour->SoCho,
            'SoChoDaDat' => $this->tour->SoChoDaDat,
            'AnhChinh' => $image,
            'image_url' => $this->imageUrl($image),
        ];
    }

    protected function paymentPayload($payment): array
    {
        return [
            'MaTT' => $payment->MaTT,
            'NgayTT' => $payment->NgayTT,
            'SoTien' => $payment->SoTien,
            'PhuongThuc' => $payment->PhuongThuc,
            'TrangThaiTT' => $payment->TrangThaiTT,
            'MaDon' => $payment->MaDon,
        ];
    }

    protected function refundPayload($refund): array
    {
        return [
            'MaHT' => $refund->MaHT,
            'SoTienHoan' => $refund->SoTienHoan,
            'PhanTramHoan' => $refund->PhanTramHoan,
            'NgayHoan' => $refund->NgayHoan,
            'LyDo' => $refund->LyDo,
            'NganHang' => $refund->NganHang,
            'SoTaiKhoan' => $refund->SoTaiKhoan,
            'TenTaiKhoan' => $refund->TenTaiKhoan,
            'MaDon' => $refund->MaDon,
        ];
    }

    protected function imageUrl(?string $path): ?string
    {
        return app(UploadService::class)->publicUrl($path);
    }
}
