<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tour;
use Illuminate\Http\Request;

class TourController extends Controller
{
    public function index(Request $request)
    {
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

        if ($request->filled('trang_thai')) {
            $query->where('TrangThai', $request->query('trang_thai'));
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderByDesc('MaTour')->paginate(12),
        ]);
    }

    public function show($id)
    {
        $tour = Tour::with([
            'anhChinh',
            'hinhAnhs',
            'lichTrinhs',
            'danhGias.khachHang',
            'nhanVien',
            'khuyenMais',
        ])->find($id);

        if (! $tour) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy dữ liệu',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $tour,
        ]);
    }
}
