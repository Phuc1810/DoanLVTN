<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChuongTrinhKhuyenMai;
use Illuminate\Http\Request;

class ChuongTrinhKhuyenMaiController extends Controller
{
    public function index(Request $request)
    {
        $query = ChuongTrinhKhuyenMai::query();

        if ($request->filled('trang_thai')) {
            $query->where('TrangThai', $request->query('trang_thai'));
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderByDesc('MaCTKM')->paginate(15),
        ]);
    }

    public function show($id)
    {
        $chuongTrinhKhuyenMai = ChuongTrinhKhuyenMai::with('tours.anhChinh')->find($id);

        if (! $chuongTrinhKhuyenMai) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy dữ liệu',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $chuongTrinhKhuyenMai,
        ]);
    }
}
