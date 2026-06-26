<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PromotionDetailResource;
use App\Http\Resources\PromotionResource;
use App\Models\ChuongTrinhKhuyenMai;
use App\Services\PromotionService;
use Illuminate\Http\Request;

class ChuongTrinhKhuyenMaiController extends Controller
{
    public function __construct(private PromotionService $promotionService)
    {
    }

    public function index(Request $request)
    {
        $this->promotionService->syncPromotionStatuses();

        $query = ChuongTrinhKhuyenMai::query()
            ->whereIn('TrangThai', ['Hoạt động', 'Sắp diễn ra']);

        if ($request->filled('trang_thai')) {
            $query->where('TrangThai', $request->query('trang_thai'));
        }

        return response()->json([
            'success' => true,
            'data' => PromotionResource::collection(
                $query->orderByRaw("FIELD(TrangThai, 'Hoạt động', 'Sắp diễn ra')")
                    ->orderByDesc('NgayBatDau')
                    ->get()
            )->resolve(),
        ]);
    }

    public function show($id)
    {
        $this->promotionService->syncPromotionStatuses();

        $chuongTrinhKhuyenMai = ChuongTrinhKhuyenMai::with('tours.anhChinh')->find($id);

        if (! $chuongTrinhKhuyenMai) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy dữ liệu',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => (new PromotionDetailResource($chuongTrinhKhuyenMai))->resolve(),
        ]);
    }
}
