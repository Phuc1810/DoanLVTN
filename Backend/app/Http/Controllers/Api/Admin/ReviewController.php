<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminReviewService;
use Illuminate\Http\Request;
use Exception;

class ReviewController extends Controller
{
    protected $adminReviewService;

    public function __construct(AdminReviewService $adminReviewService)
    {
        $this->adminReviewService = $adminReviewService;
    }

    public function index(Request $request)
    {
        try {
            $filters = $request->only(['q', 'sosao', 'trangthai']);
            $perPage = $request->input('per_page', 10);

            $reviews = $this->adminReviewService->getReviews($filters, $perPage);

            return response()->json([
                'success' => true,
                'data' => $reviews
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tải danh sách đánh giá: ' . $e->getMessage()
            ], 500);
        }
    }

    public function toggleStatus(int $id)
    {
        try {
            $review = $this->adminReviewService->toggleStatus($id);
            return response()->json([
                'success' => true,
                'message' => 'Đã cập nhật trạng thái đánh giá thành công',
                'data' => $review
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật trạng thái: ' . $e->getMessage()
            ], 500);
        }
    }

    public function reply(Request $request, int $id)
    {
        try {
            $request->validate([
                'PhanHoi' => 'required|string'
            ]);

            $review = $this->adminReviewService->replyToReview($id, $request->input('PhanHoi'));
            
            return response()->json([
                'success' => true,
                'message' => 'Đã gửi phản hồi thành công',
                'data' => $review
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi gửi phản hồi: ' . $e->getMessage()
            ], 500);
        }
    }
}
