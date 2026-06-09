<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BusinessRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'MaYC' => $this->MaYC,
            'TenCongTy' => $this->TenCongTy,
            'NguoiLienHe' => $this->NguoiLienHe,
            'SDT' => $this->SDT,
            'SoNguoi' => $this->SoNguoi,
            'ThoiGianKhoiHanh' => $this->ThoiGianKhoiHanh,
            'GiaTriHopDong' => $this->GiaTriHopDong,
            'NgayThanhToan' => $this->NgayThanhToan,
            'TrangThai' => $this->TrangThai,
            'MaKH' => $this->MaKH,
            'MaNV' => $this->MaNV,
            'MaTour' => $this->MaTour,
            'tour' => $this->whenLoaded('tour', fn () => $this->tour ? [
                'MaTour' => $this->tour->MaTour,
                'TenTour' => $this->tour->TenTour,
                'DiaDiem' => $this->tour->DiaDiem,
                'ThoiLuong' => $this->tour->ThoiLuong,
                'SoCho' => $this->tour->SoCho,
                'SoChoDaDat' => $this->tour->SoChoDaDat,
                'TrangThai' => $this->tour->TrangThai,
                'LoaiTour' => $this->tour->LoaiTour,
                'AnhChinh' => $this->tour->anhChinh?->DuongDan,
                'image_url' => $this->imageUrl($this->tour->anhChinh?->DuongDan),
            ] : null),
            'khach_hang' => $this->whenLoaded('khachHang', fn () => $this->khachHang ? [
                'MaKH' => $this->khachHang->MaKH,
                'HoTen' => $this->khachHang->HoTen,
                'Email' => $this->khachHang->Email,
                'SoDienThoai' => $this->khachHang->SoDienThoai,
                'DiaChi' => $this->khachHang->DiaChi,
            ] : null),
            'nhan_vien' => $this->whenLoaded('nhanVien', fn () => $this->nhanVien ? [
                'MaNV' => $this->nhanVien->MaNV,
                'HoTen' => $this->nhanVien->HoTen,
                'Email' => $this->nhanVien->Email,
                'SDT' => $this->nhanVien->SDT,
                'ChucVu' => $this->nhanVien->ChucVu,
            ] : null),
        ];
    }

    private function imageUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (preg_match('/^https?:\/\//i', $path)) {
            return $path;
        }

        return url('assets/'.ltrim($path, '/'));
    }
}
