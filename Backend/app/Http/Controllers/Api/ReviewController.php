<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Review\StoreReviewRequest;
use App\Services\ReviewService;

class ReviewController extends Controller
{
    public function __construct(private ReviewService $reviewService)
    {
    }

    public function store(StoreReviewRequest $request, int $id)
    {
        $data = $this->reviewService->storeForOrder($request->user(), $id, $request->validated());

        return response()->json([
            'success' => true,
            'message' => $data['action'] === 'created'
                ? 'Đánh giá tour thành công'
                : 'Cập nhật đánh giá thành công',
            'data' => $data,
        ]);
    }
}
