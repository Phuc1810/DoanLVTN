<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TourResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $anhChinh = $this->whenLoaded('anhChinh', fn () => $this->anhChinh);
        $duongDan = $anhChinh && ! $anhChinh instanceof \Illuminate\Http\Resources\MissingValue
            ? $anhChinh->DuongDan
            : null;

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
            'AnhChinh' => $duongDan,
            'image_url' => $this->imageUrl($duongDan),
            'discount_percent' => $this->discountPercent(),
            'promotion' => $this->promotionPayload(),
        ];
    }

    protected function imageUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (preg_match('/^https?:\/\//i', $path)) {
            return $path;
        }

        return url('assets/'.ltrim($path, '/'));
    }

    protected function discountPercent(): int
    {
        if ((float) $this->PhanTramGiam > 0) {
            return (int) round((float) $this->PhanTramGiam);
        }

        if ((float) $this->GiaGoc > 0 && (float) $this->GiaGiam > 0 && (float) $this->GiaGiam < (float) $this->GiaGoc) {
            return (int) round(100 - ((float) $this->GiaGiam / (float) $this->GiaGoc * 100));
        }

        return 0;
    }

    protected function promotionPayload(): ?array
    {
        if (! $this->relationLoaded('khuyenMais') || $this->khuyenMais->isEmpty()) {
            return null;
        }

        $promotion = $this->khuyenMais->first();
        $percent = (float) ($promotion->pivot->PhanTramGiamKM ?? $promotion->PhanTramGiam ?? 0);

        return [
            'MaCTKM' => $promotion->MaCTKM,
            'TenKM' => $promotion->TenKM,
            'PhanTramGiamApDung' => $percent,
            'GiaSauKhuyenMai' => (float) $this->GiaGoc * (100 - $percent) / 100,
        ];
    }
}
