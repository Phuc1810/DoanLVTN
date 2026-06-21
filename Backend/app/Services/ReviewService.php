<?php

namespace App\Services;

use App\Http\Resources\ReviewResource;
use App\Models\DanhGia;
use App\Models\DonDatTour;
use App\Models\TaiKhoan;
use App\Models\Tour;
use Illuminate\Http\Exceptions\HttpResponseException;

class ReviewService
{
    private const STATUS_COMPLETED = 'Đã hoàn tất';

    public function tourReviews(int $tourId): array
    {
        $tour = Tour::where('MaTour', $tourId)->first();

        if (! $tour) {
            $this->throwNotFound('tour', 'Tour không tồn tại.');
        }

        $reviews = DanhGia::with('khachHang')
            ->where('MaTour', $tourId)
            ->orderByDesc('NgayDG')
            ->orderByDesc('MaDG')
            ->get();

        $ratingCounts = [];
        for ($star = 1; $star <= 5; $star++) {
            $ratingCounts[$star] = $reviews->where('SoSao', $star)->count();
        }

        return [
            'items' => ReviewResource::collection($reviews)->resolve(),
            'summary' => [
                'average_rating' => round((float) $reviews->avg('SoSao'), 1),
                'total_reviews' => $reviews->count(),
                'rating_counts' => $ratingCounts,
            ],
        ];
    }

    public function storeForOrder(TaiKhoan $user, int $orderId, array $payload): array
    {
        $customer = $user->khachHang()->first();

        if (! $customer) {
            $this->throwNotFound('customer', 'Không tìm thấy hồ sơ khách hàng.');
        }

        $order = DonDatTour::where('MaDon', $orderId)
            ->where('MaKH', $customer->MaKH)
            ->first();

        if (! $order) {
            $this->throwNotFound('order', 'Đơn không tồn tại hoặc không thuộc khách hàng hiện tại.');
        }

        if ($order->TrangThai !== self::STATUS_COMPLETED) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Đơn chưa đủ điều kiện đánh giá.',
                'errors' => [
                    'TrangThai' => ['Chỉ được đánh giá khi đơn tour đã ở trạng thái "Đã hoàn tất".'],
                ],
            ], 422));
        }

        $review = DanhGia::where('MaKH', $customer->MaKH)
            ->where('MaTour', $order->MaTour)
            ->first();

        $action = $review ? 'updated' : 'created';

        if ($review) {
            $review->update([
                'SoSao' => (int) $payload['SoSao'],
                'NoiDung' => $payload['NoiDung'] ?? '',
                'NgayDG' => now()->toDateString(),
            ]);
        } else {
            $review = DanhGia::create([
                'SoSao' => (int) $payload['SoSao'],
                'NoiDung' => $payload['NoiDung'] ?? '',
                'NgayDG' => now()->toDateString(),
                'MaKH' => $customer->MaKH,
                'MaTour' => $order->MaTour,
            ]);
        }

        return array_merge(
            (new ReviewResource($review->refresh()->load('khachHang')))->resolve(),
            ['action' => $action]
        );
    }

    private function throwNotFound(string $key, string $message): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Không tìm thấy dữ liệu',
            'errors' => [
                $key => [$message],
            ],
        ], 404));
    }
}
