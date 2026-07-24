<?php

namespace App\Http\Resources;

use App\Services\UploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StaffTourResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $mainImage = $this->whenLoaded('anhChinh', fn () => $this->anhChinh);

        $trangThai = $this->TrangThai;
        $tienDo = 'Sắp khởi hành';

        if (in_array($trangThai, ['Hoạt động', 'Hết chỗ']) && $this->NgayKhoiHanh) {
            $today = \Carbon\Carbon::today();
            $khoiHanh = \Carbon\Carbon::parse($this->NgayKhoiHanh)->startOfDay();
            $ketThuc = $this->NgayKetThuc ? \Carbon\Carbon::parse($this->NgayKetThuc)->startOfDay() : null;

            if ($ketThuc) {
                if ($today > $ketThuc) {
                    $tienDo = 'Đã hoàn tất';
                } elseif ($today >= $khoiHanh && $today <= $ketThuc) {
                    $tienDo = 'Đang diễn ra';
                }
            } else {
                if ($today->equalTo($khoiHanh)) {
                    $tienDo = 'Đang diễn ra';
                } elseif ($today > $khoiHanh) {
                    $tienDo = 'Đã hoàn tất';
                }
            }
        }

        return [
            'MaTour' => $this->MaTour,
            'TenTour' => $this->TenTour,
            'DiaDiem' => $this->DiaDiem,
            'GiaGoc' => $this->GiaGoc,
            'GiaGiam' => $this->GiaGiam,
            'PhanTramGiam' => $this->PhanTramGiam,
            'ThoiLuong' => $this->ThoiLuong,
            'NgayKhoiHanh' => $this->NgayKhoiHanh,
            'NgayKetThuc' => $this->NgayKetThuc,
            'SoCho' => $this->SoCho,
            'SoChoDaDat' => $this->SoChoDaDat,
            'SoChoConLai' => max(0, (int) $this->SoCho - (int) $this->SoChoDaDat),
            'Mien' => $this->Mien,
            'LoaiTour' => $this->LoaiTour,
            'TrangThai' => $trangThai,
            'TienDo' => $tienDo,
            'MaNV' => $this->MaNV,
            'AnhChinh' => $mainImage?->DuongDan,
            'LoaiAnh' => $mainImage?->LoaiAnh,
            'image_url' => $this->imageUrl($mainImage?->DuongDan),
            'lich_trinh' => $this->whenLoaded('lichTrinhs', fn () => $this->lichTrinhs->map(fn ($item) => [
                'MaLT' => $item->MaLT,
                'NgayThu' => $item->NgayThu,
                'TieuDe' => $item->TieuDe,
                'NoiDung' => $item->NoiDung,
                'MaTour' => $item->MaTour,
            ])->values()),
        ];
    }

    private function imageUrl(?string $path): ?string
    {
        return app(UploadService::class)->publicUrl($path);
    }
}
