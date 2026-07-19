<?php

namespace App\Http\Resources;

use App\Services\UploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BusinessRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $trangThai = $this->TrangThai;

        $ngayKhoiHanhRaw = $this->ThoiGianKhoiHanh;
        
        if ($trangThai === 'Đã thanh toán' && $ngayKhoiHanhRaw) {
            $today = \Carbon\Carbon::today();
            $khoiHanh = \Carbon\Carbon::parse($ngayKhoiHanhRaw)->startOfDay();
            
            $ketThuc = null;
            if (!empty($this->NgayKetThuc)) {
                $ketThuc = \Carbon\Carbon::parse($this->NgayKetThuc)->startOfDay();
            }
            
            if ($ketThuc) {
                if ($today > $ketThuc) {
                    $trangThai = 'Đã hoàn tất';
                } elseif ($today >= $khoiHanh && $today <= $ketThuc) {
                    $trangThai = 'Đang diễn ra';
                }
            } else {
                if ($today->equalTo($khoiHanh)) {
                    $trangThai = 'Đang diễn ra';
                } elseif ($today > $khoiHanh) {
                    $trangThai = 'Đã hoàn tất';
                }
            }
        }

        return [
            'MaYC' => $this->MaYC,
            'TenCongTy' => $this->TenCongTy,
            'NguoiLienHe' => $this->NguoiLienHe,
            'SDT' => $this->SDT,
            'SoNguoi' => $this->SoNguoi,
            'ThoiGianKhoiHanh' => $this->ThoiGianKhoiHanh,
            'GiaTriHopDong' => $this->GiaTriHopDong,
            'NgayThanhToan' => $this->NgayThanhToan,
            'TrangThai' => $trangThai,
            'RawTrangThai' => $this->TrangThai,
            'MaKH' => $this->MaKH,
            'MaNV' => $this->MaNV,
            'MaTour' => $this->MaTour,
            'TenTour' => $this->tour?->TenTour,
            'DiaDiem' => $this->tour?->DiaDiem,
            'ThoiLuong' => $this->tour?->ThoiLuong,
            'GiaGoc' => $this->tour?->GiaGoc,
            'GiaGiam' => $this->tour?->GiaGiam,
            'PhanTramGiam' => $this->tour?->PhanTramGiam,
            'AnhChinh' => $this->tour?->anhChinh?->DuongDan,
            'image_url' => $this->imageUrl($this->tour?->anhChinh?->DuongDan),
            'tour' => $this->whenLoaded('tour', fn () => $this->tour ? [
                'MaTour' => $this->tour->MaTour,
                'TenTour' => $this->tour->TenTour,
                'DiaDiem' => $this->tour->DiaDiem,
                'ThoiLuong' => $this->tour->ThoiLuong,
                'GiaGoc' => $this->tour->GiaGoc,
                'GiaGiam' => $this->tour->GiaGiam,
                'PhanTramGiam' => $this->tour->PhanTramGiam,
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
        return app(UploadService::class)->publicUrl($path);
    }
}
