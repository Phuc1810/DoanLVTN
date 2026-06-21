<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class TourDetailResource extends TourResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'hinhAnhs' => $this->whenLoaded('hinhAnhs', function () {
                return $this->hinhAnhs->map(fn ($image) => [
                    'MaAnh' => $image->MaAnh,
                    'DuongDan' => $image->DuongDan,
                    'LaAnhChinh' => $image->LaAnhChinh,
                    'LoaiAnh' => $image->LoaiAnh,
                    'image_url' => $this->imageUrl($image->DuongDan),
                ]);
            }),
            'lichTrinhs' => $this->whenLoaded('lichTrinhs', function () {
                return $this->lichTrinhs->map(fn ($schedule) => [
                    'NgayThu' => $schedule->NgayThu,
                    'TieuDe' => $schedule->TieuDe,
                    'NoiDung' => $schedule->NoiDung,
                ]);
            }),
            'danhGias' => $this->whenLoaded('danhGias', fn () => ReviewResource::collection($this->danhGias)),
            'review_stats' => [
                'average_rating' => round((float) ($this->danh_gias_avg_so_sao ?? 0), 1),
                'total_reviews' => (int) ($this->danh_gias_count ?? 0),
            ],
            'khuyenMais' => $this->whenLoaded('khuyenMais'),
        ]);
    }
}
