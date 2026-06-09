<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NewsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'MaTin' => $this->MaTin,
            'TieuDe' => $this->TieuDe,
            'MoTa' => $this->MoTa,
            'LoaiTin' => $this->LoaiTin,
            'type_label' => $this->typeLabel($this->LoaiTin),
            'AnhDaiDien' => $this->AnhDaiDien,
            'image_url' => $this->imageUrl($this->AnhDaiDien),
            'NgayDang' => $this->NgayDang,
            'TrangThai' => $this->TrangThai,
            'MaNV' => $this->MaNV,
            'nguoi_dang' => $this->whenLoaded('nhanVien', fn () => $this->nhanVien?->HoTen),
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

        if (str_starts_with($path, 'storage/')) {
            return url($path);
        }

        return url('assets/'.ltrim($path, '/'));
    }

    protected function typeLabel(?string $type): string
    {
        return $type === 'kinhnghiem' ? 'Kinh nghiệm' : 'Tin tức';
    }
}
