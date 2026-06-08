<?php

use App\Http\Controllers\Api\ChuongTrinhKhuyenMaiController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
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

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/staff-login', [AuthController::class, 'staffLogin']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/resend-otp', [AuthController::class, 'resendOtp']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/google', [AuthController::class, 'google']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });
});

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

Route::post('/bookings', [BookingController::class, 'store'])
    ->middleware(['auth:sanctum', 'role:KH']);

Route::get('/tours', [TourController::class, 'index']);
Route::get('/tours/search', [TourController::class, 'search']);
Route::get('/tours/region/{mien}', [TourController::class, 'region']);
Route::get('/tours/promotions', [TourController::class, 'promotions']);
Route::get('/tours/{id}/reviews', [TourController::class, 'reviews'])->whereNumber('id');
Route::get('/tours/{id}/schedules', [TourController::class, 'schedules'])->whereNumber('id');
Route::get('/tours/{id}', [TourController::class, 'show'])->whereNumber('id');

Route::get('/khach-hang', [KhachHangController::class, 'index']);
Route::get('/khach-hang/{id}', [KhachHangController::class, 'show']);

Route::get('/don-dat-tour', [DonDatTourController::class, 'index']);
Route::get('/don-dat-tour/{id}', [DonDatTourController::class, 'show']);

Route::get('/tin-tuc', [TinTucController::class, 'index']);
Route::get('/tin-tuc/{id}', [TinTucController::class, 'show']);

Route::get('/khuyen-mai', [ChuongTrinhKhuyenMaiController::class, 'index']);
Route::get('/khuyen-mai/{id}', [ChuongTrinhKhuyenMaiController::class, 'show']);
