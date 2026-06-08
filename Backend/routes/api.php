<?php

use App\Http\Controllers\Api\ChuongTrinhKhuyenMaiController;
use App\Http\Controllers\Api\DonDatTourController;
use App\Http\Controllers\Api\KhachHangController;
use App\Http\Controllers\Api\TinTucController;
use App\Http\Controllers\Api\TourController;
use App\Models\DonDatTour;
use App\Models\KhachHang;
use App\Models\NhanVien;
use App\Models\TaiKhoan;
use App\Models\Tour;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/test-db', function () {
    try {
        return response()->json([
            'success' => true,
            'message' => 'Kết nối database thành công',
            'tong_so_tour' => Tour::count(),
            'tong_so_khach_hang' => KhachHang::count(),
            'tong_so_don_dat_tour' => DonDatTour::count(),
            'tong_so_tai_khoan' => TaiKhoan::count(),
            'tong_so_nhan_vien' => NhanVien::count(),
            'danh_sach_tour_mau' => Tour::with('anhChinh')->orderBy('MaTour')->take(5)->get(),
            'danh_sach_don_mau' => DonDatTour::with(['khachHang', 'tour'])->orderBy('MaDon')->take(5)->get(),
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'success' => false,
            'message' => 'Kết nối database thất bại',
            'error' => $e->getMessage(),
        ], 500);
    }
});

Route::get('/tours', [TourController::class, 'index']);
Route::get('/tours/{id}', [TourController::class, 'show']);

Route::get('/khach-hang', [KhachHangController::class, 'index']);
Route::get('/khach-hang/{id}', [KhachHangController::class, 'show']);

Route::get('/don-dat-tour', [DonDatTourController::class, 'index']);
Route::get('/don-dat-tour/{id}', [DonDatTourController::class, 'show']);

Route::get('/tin-tuc', [TinTucController::class, 'index']);
Route::get('/tin-tuc/{id}', [TinTucController::class, 'show']);

Route::get('/khuyen-mai', [ChuongTrinhKhuyenMaiController::class, 'index']);
Route::get('/khuyen-mai/{id}', [ChuongTrinhKhuyenMaiController::class, 'show']);
