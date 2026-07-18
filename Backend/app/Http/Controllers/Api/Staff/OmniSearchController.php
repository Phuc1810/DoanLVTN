<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\Tour;
use App\Models\DonDatTour;
use App\Models\TinTuc;
use App\Models\ChuongTrinhKhuyenMai;
use Illuminate\Http\Request;

class OmniSearchController extends Controller
{
    public function search(Request $request)
    {
        $q = $request->query('q', '');

        if (empty($q)) {
            return response()->json([
                'success' => true,
                'data' => [
                    'tours' => [],
                    'orders' => [],
                    'news' => [],
                    'promotions' => []
                ]
            ]);
        }

        $limit = 5;

        // 1. Tìm Tour
        $tours = Tour::where('TenTour', 'like', "%{$q}%")
            ->orWhere('MaTour', 'like', "%{$q}%")
            ->with('anhChinh:MaTour,DuongDan')
            ->take($limit)
            ->get(['MaTour', 'TenTour', 'TrangThai']);

        // 2. Tìm Đơn Đặt Tour
        $orders = DonDatTour::where('MaDon', 'like', "%{$q}%")
            ->orWhereHas('khachHang', function ($query) use ($q) {
                $query->where('SoDienThoai', 'like', "%{$q}%")
                    ->orWhere('HoTen', 'like', "%{$q}%")
                    ->orWhere('Email', 'like', "%{$q}%");
            })
            ->with('khachHang:MaKH,HoTen,SoDienThoai')
            ->take($limit)
            ->get(['MaDon', 'MaKH', 'TongTienPhaiTra', 'TrangThai', 'NgayDat']);

        // 3. Tìm Tin Tức
        $news = TinTuc::where('TieuDe', 'like', "%{$q}%")
            ->take($limit)
            ->get(['MaTin', 'TieuDe', 'TrangThai', 'AnhDaiDien']);

        // 4. Tìm Khuyến Mãi
        $promotions = ChuongTrinhKhuyenMai::where('TenKM', 'like', "%{$q}%")
            ->orWhere('MaCTKM', 'like', "%{$q}%")
            ->take($limit)
            ->get(['MaCTKM', 'TenKM', 'TrangThai', 'NgayBatDau', 'NgayKetThuc']);

        return response()->json([
            'success' => true,
            'data' => [
                'tours' => $tours,
                'orders' => $orders,
                'news' => $news,
                'promotions' => $promotions
            ]
        ]);
    }
}
