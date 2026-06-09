<?php

namespace App\Services;

use App\Models\Tour;
use App\Models\ChuongTrinhKhuyenMai;
use Illuminate\Database\Eloquent\Builder;

class PromotionService
{
    public function syncPromotionStatuses(): void
    {
        $today = now()->toDateString();

        ChuongTrinhKhuyenMai::whereDate('NgayKetThuc', '<', $today)
            ->update(['TrangThai' => 'Hết hạn']);

        ChuongTrinhKhuyenMai::whereDate('NgayBatDau', '>', $today)
            ->whereDate('NgayKetThuc', '>=', $today)
            ->update(['TrangThai' => 'Sắp diễn ra']);

        ChuongTrinhKhuyenMai::whereDate('NgayBatDau', '<=', $today)
            ->whereDate('NgayKetThuc', '>=', $today)
            ->update(['TrangThai' => 'Hoạt động']);
    }

    public function statusForDates(string $startDate, string $endDate): string
    {
        $today = now()->toDateString();

        if ($endDate < $today) {
            return 'Hết hạn';
        }

        if ($startDate > $today) {
            return 'Sắp diễn ra';
        }

        return 'Hoạt động';
    }

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

    public function bestDiscountForTour(Tour $tour, float $baseAmount): array
    {
        $tourPercent = $this->tourDiscountPercent($tour);
        $promotion = $tour->khuyenMais()
            ->where('chuongtrinhkhuyenmai.TrangThai', 'Hoạt động')
            ->whereDate('chuongtrinhkhuyenmai.NgayBatDau', '<=', now()->toDateString())
            ->whereDate('chuongtrinhkhuyenmai.NgayKetThuc', '>=', now()->toDateString())
            ->orderByDesc('tour_khuyenmai.PhanTramGiamKM')
            ->first();

        $promotionPercent = $promotion ? (float) $promotion->pivot->PhanTramGiamKM : 0.0;

        if ($promotionPercent > $tourPercent) {
            $discountAmount = round($baseAmount * $promotionPercent / 100);

            return [
                'type' => 'CTKM',
                'name' => $promotion->TenKM,
                'percent' => $promotionPercent,
                'discount_amount' => $discountAmount,
                'amount_after_discount' => round($baseAmount - $discountAmount),
                'MaCTKM' => $promotion->MaCTKM,
            ];
        }

        if ($tourPercent > 0) {
            $discountAmount = round($baseAmount * $tourPercent / 100);

            return [
                'type' => 'TOUR',
                'name' => 'Giảm theo tour',
                'percent' => $tourPercent,
                'discount_amount' => $discountAmount,
                'amount_after_discount' => round($baseAmount - $discountAmount),
                'MaCTKM' => null,
            ];
        }

        return [
            'type' => null,
            'name' => null,
            'percent' => 0,
            'discount_amount' => 0,
            'amount_after_discount' => round($baseAmount),
            'MaCTKM' => null,
        ];
    }

    private function tourDiscountPercent(Tour $tour): float
    {
        if ((float) $tour->PhanTramGiam > 0) {
            return (float) $tour->PhanTramGiam;
        }

        if ((float) $tour->GiaGoc > 0 && (float) $tour->GiaGiam > 0 && (float) $tour->GiaGiam < (float) $tour->GiaGoc) {
            return 100 - ((float) $tour->GiaGiam / (float) $tour->GiaGoc * 100);
        }

        return 0.0;
    }
}
