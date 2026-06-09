<?php

namespace App\Http\Resources;

use App\Services\UploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PromotionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'MaCTKM' => $this->MaCTKM,
            'TenKM' => $this->TenKM,
            'NoiDung' => $this->NoiDung,
            'AnhDaiDien' => $this->AnhDaiDien,
            'image_url' => $this->imageUrl($this->AnhDaiDien),
            'PhanTramGiam' => $this->PhanTramGiam,
            'NgayBatDau' => $this->NgayBatDau,
            'NgayKetThuc' => $this->NgayKetThuc,
            'TrangThai' => $this->TrangThai,
            'tour_count' => $this->whenCounted('tours'),
        ];
    }

    protected function imageUrl(?string $path): ?string
    {
        return app(UploadService::class)->publicUrl($path);
    }
}
