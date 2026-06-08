<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KhachHang;

class KhachHangController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => KhachHang::with('taiKhoan')->orderByDesc('MaKH')->paginate(15),
        ]);
    }

    public function show($id)
    {
        $khachHang = KhachHang::with([
            'taiKhoan',
            'donDatTours.tour',
            'danhGias',
        ])->find($id);

        if (! $khachHang) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy dữ liệu',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $khachHang,
        ]);
    }
}
