<?php

namespace App\Services;

use App\Models\Tour;
use Illuminate\Database\Eloquent\Builder;

class PromotionService
{
    public function activePromotionConstraint($query)
    {
        return $query->where('chuongtrinhkhuyenmai.TrangThai', 'Hoạt động')
            ->whereDate('chuongtrinhkhuyenmai.NgayBatDau', '<=', now()->toDateString())
            ->whereDate('chuongtrinhkhuyenmai.NgayKetThuc', '>=', now()->toDateString());
    }

    public function withActivePromotions(Builder $query): Builder
    {
        return $query->whereHas('khuyenMais', function (Builder $promotionQuery) {
            $this->activePromotionConstraint($promotionQuery);
        })->with(['khuyenMais' => function ($promotionQuery) {
            $this->activePromotionConstraint($promotionQuery);
        }]);
    }

    public function activePromotionsForTour(Tour $tour): void
    {
        $tour->load(['khuyenMais' => function ($promotionQuery) {
            $this->activePromotionConstraint($promotionQuery);
        }]);
    }
}
