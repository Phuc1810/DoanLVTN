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
            'TrangThai' => $this->TrangThai,
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
