<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReviewService;
use App\Services\TourService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TourController extends Controller
{
    public function __construct(
        private TourService $tourService,
        private ReviewService $reviewService
    )
    {
    }

    public function locations()
    {
        return response()->json([
            'success' => true,
            'data' => $this->tourService->locations(),
        ]);
    }

    public function index(Request $request)
    {
        $filters = $request->only([
            'page',
            'per_page',
            'keyword',
            'q',
            'mien',
            'loai_tour',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách tour thành công',
            'data' => $this->tourService->listActive($filters),
        ]);
    }

    public function featured(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách tour nổi bật thành công',
            'data' => $this->tourService->featured($request->only(['per_page'])),
        ]);
    }

    public function banners(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách banner tour thành công',
            'data' => $this->tourService->banners($request->only(['per_page'])),
        ]);
    }

    public function show($id)
    {
        if (! ctype_digit((string) $id)) {
            throw ValidationException::withMessages([
                'id' => ['ID tour phải là số.'],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết tour thành công',
            'data' => $this->tourService->detail((int) $id),
        ]);
    }

    public function search(Request $request)
    {
        $filters = $request->only([
            'page',
            'per_page',
            'keyword',
            'q',
            'dia_diem',
            'ngay_khoi_hanh',
            'thoi_luong',
            'gia',
            'loai_tour',
            'mien',
        ]);

        $this->tourService->validateSearchFilters($filters);

        return response()->json([
            'success' => true,
            'message' => 'Tìm kiếm tour thành công',
            'data' => $this->tourService->search($filters),
        ]);
    }

    public function region(string $mien, Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lọc tour theo miền thành công',
            'data' => $this->tourService->byRegion($mien, $request->only(['page', 'per_page'])),
        ]);
    }

    public function promotions(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách tour khuyến mãi thành công',
            'data' => $this->tourService->promotions($request->only(['page', 'per_page'])),
        ]);
    }

    public function reviews($id)
    {
        if (! ctype_digit((string) $id)) {
            throw ValidationException::withMessages([
                'id' => ['ID tour phải là số.'],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách đánh giá thành công',
            'data' => $this->reviewService->tourReviews((int) $id),
        ]);
    }

    public function schedules($id)
    {
        if (! ctype_digit((string) $id)) {
            throw ValidationException::withMessages([
                'id' => ['ID tour phải là số.'],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lấy lịch trình tour thành công',
            'data' => $this->tourService->schedules((int) $id),
        ]);
    }
}
