<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DonDatTour;
use Illuminate\Http\Request;

class DonDatTourController extends Controller
{
    public function index(Request $request)
    {
        $query = DonDatTour::with([
            'khachHang',
            'tour',
            'chuongTrinhKhuyenMai',
        ]);

        if ($request->filled('trang_thai')) {
            $query->where('TrangThai', $request->query('trang_thai'));
        }

        if ($request->filled('ma_kh')) {
            $query->where('MaKH', $request->query('ma_kh'));
        }

        if ($request->filled('ma_tour')) {
            $query->where('MaTour', $request->query('ma_tour'));
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderByDesc('MaDon')->paginate(15),
        ]);
    }

    public function show($id)
    {
        $donDatTour = DonDatTour::with([
            'khachHang',
            'tour',
            'chuongTrinhKhuyenMai',
            'thanhToans',
            'hoanTiens',
        ])->find($id);

        if (! $donDatTour) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy dữ liệu',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $donDatTour,
        ]);
    }
}
