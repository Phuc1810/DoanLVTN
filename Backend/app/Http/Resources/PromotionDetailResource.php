<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class PromotionDetailResource extends PromotionResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'tours' => $this->whenLoaded('tours', fn () => $this->tours->map(fn ($tour) => [
                'MaTour' => $tour->MaTour,
                'TenTour' => $tour->TenTour,
                'DiaDiem' => $tour->DiaDiem,
                'GiaGoc' => $tour->GiaGoc,
                'GiaGiam' => $tour->GiaGiam,
                'PhanTramGiamKM' => $tour->pivot?->PhanTramGiamKM,
                'TrangThai' => $tour->TrangThai,
                'AnhChinh' => $tour->anhChinh?->DuongDan,
                'image_url' => $this->imageUrl($tour->anhChinh?->DuongDan),
            ])->values()),
        ]);
    }
}
