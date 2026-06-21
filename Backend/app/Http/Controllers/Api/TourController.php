<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReviewService;
use App\Services\TourService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TourController extends Controller
{
<<<<<<< Updated upstream
    public function __construct(
        private TourService $tourService,
        private ReviewService $reviewService
    )
    {
=======
    public function locations()
    {
        $locations = Tour::query()
            ->whereNotNull('DiaDiem')
            ->where('DiaDiem', '<>', '')
            ->distinct()
            ->orderBy('DiaDiem')
            ->pluck('DiaDiem')
            ->values();

        return response()->json([
            'success' => true,
            'data' => $locations,
        ]);
>>>>>>> Stashed changes
    }

    public function index(Request $request)
    {
<<<<<<< Updated upstream
        $filters = $request->only([
            'page',
            'per_page',
            'keyword',
            'q',
            'mien',
            'loai_tour',
        ]);
=======
        $query = Tour::with('anhChinh');

        if ($request->filled('keyword')) {
            $keyword = $request->query('keyword');
            $query->where(function ($q) use ($keyword) {
                $q->where('TenTour', 'like', "%{$keyword}%")
                    ->orWhere('DiaDiem', 'like', "%{$keyword}%");
            });
        }

        if ($request->filled('mien')) {
            $query->where('Mien', $request->query('mien'));
        }

        if ($request->filled('loai_tour')) {
            $query->where('LoaiTour', $request->query('loai_tour'));
        }

        if ($request->filled('ngay_khoi_hanh')) {
            $query->whereDate('NgayKhoiHanh', $request->query('ngay_khoi_hanh'));
        }

        if ($request->filled('thoi_luong')) {
            $query->where('ThoiLuong', $request->query('thoi_luong'));
        }

        if ($request->filled('gia')) {
            switch ((string) $request->query('gia')) {
                case '1':
                    $query->where('GiaGiam', '<', 1000000);
                    break;
                case '2':
                    $query->where('GiaGiam', '>=', 1000000)
                        ->where('GiaGiam', '<', 2000000);
                    break;
                case '3':
                    $query->where('GiaGiam', '>=', 2000000)
                        ->where('GiaGiam', '<', 3000000);
                    break;
                case '4':
                    $query->where('GiaGiam', '>=', 3000000);
                    break;
            }
        }

        if ($request->filled('trang_thai')) {
            $query->where('TrangThai', $request->query('trang_thai'));
        }
>>>>>>> Stashed changes

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách tour thành công',
            'data' => $this->tourService->listActive($filters),
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
