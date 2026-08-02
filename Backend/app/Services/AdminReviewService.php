<?php

namespace App\Services;

use App\Models\DanhGia;
use Illuminate\Support\Facades\DB;

class AdminReviewService
{
    /**
     * Get a paginated list of reviews with optional filters
     */
    public function getReviews(array $filters = [], int $perPage = 10)
    {
        $query = DanhGia::with(['khachHang:MaKH,HoTen', 'tour:MaTour,TenTour'])
            ->orderBy('NgayDG', 'desc');

        if (!empty($filters['q'])) {
            $keyword = '%' . $filters['q'] . '%';
            $query->where(function ($q) use ($keyword) {
                $q->where('NoiDung', 'LIKE', $keyword)
                  ->orWhereHas('khachHang', function ($kh) use ($keyword) {
                      $kh->where('HoTen', 'LIKE', $keyword);
                  })
                  ->orWhereHas('tour', function ($t) use ($keyword) {
                      $t->where('TenTour', 'LIKE', $keyword);
                  });
            });
        }

        if (!empty($filters['sosao'])) {
            $query->where('SoSao', $filters['sosao']);
        }

        if (!empty($filters['trangthai'])) {
            $query->where('TrangThai', $filters['trangthai']);
        } else {
            // Default may not want to filter by trangthai, or maybe we want to include nulls
            // MySQL might treat null differently. Let's just return all if not specified.
        }

        return $query->paginate($perPage);
    }

    /**
     * Toggle the visibility status of a review
     */
    public function toggleStatus(int $id): DanhGia
    {
        $review = DanhGia::findOrFail($id);
        
        if ($review->TrangThai === 'Đã ẩn') {
            $review->TrangThai = 'Hiển thị';
        } else {
            $review->TrangThai = 'Đã ẩn';
        }
        
        $review->save();

        return $review;
    }

    /**
     * Reply to a review
     */
    public function replyToReview(int $id, string $replyContent): DanhGia
    {
        $review = DanhGia::findOrFail($id);
        
        $review->PhanHoi = $replyContent;
        $review->save();

        return $review;
    }
}
