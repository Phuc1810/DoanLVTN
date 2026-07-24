<?php

use App\Http\Controllers\Api\ChuongTrinhKhuyenMaiController;
use App\Http\Controllers\Api\Admin\AccountController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\BusinessRequestController;
use App\Http\Controllers\Api\DonDatTourController;
use App\Http\Controllers\Api\KhachHangController;
use App\Http\Controllers\Api\NewsController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\Staff\BusinessRequestManagementController;
use App\Http\Controllers\Api\Staff\DashboardController;
use App\Http\Controllers\Api\Staff\OmniSearchController;
use App\Http\Controllers\Api\Staff\NewsManagementController;
use App\Http\Controllers\Api\Staff\OrderManagementController;
use App\Http\Controllers\Api\Staff\PromotionManagementController;
use App\Http\Controllers\Api\Staff\TourManagementController;
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
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });
});

Route::get('/test-db', function () {
    try {
        return response()->json([
            'success' => true,
            'message' => 'Káº¿t ná»‘i database thÃ nh cÃ´ng',
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
            'message' => 'Káº¿t ná»‘i database tháº¥t báº¡i',
            'error' => $e->getMessage(),
        ], 500);
    }
});

Route::post('/bookings', [BookingController::class, 'store'])
    ->middleware(['auth:sanctum', 'role:KH']);

Route::post('/business-requests', [BusinessRequestController::class, 'store'])
    ->middleware(['auth:sanctum', 'role:KH']);
Route::get('/business-requests', [BusinessRequestController::class, 'index'])
    ->middleware(['auth:sanctum', 'role:KH']);
Route::get('/business-requests/{id}', [BusinessRequestController::class, 'show'])
    ->whereNumber('id')
    ->middleware(['auth:sanctum', 'role:KH']);

Route::get('/payments/{orderId}', [PaymentController::class, 'show'])
    ->whereNumber('orderId')
    ->middleware(['auth:sanctum', 'role:KH']);
Route::get('/payments/{orderId}/check', [PaymentController::class, 'check'])
    ->whereNumber('orderId')
    ->middleware(['auth:sanctum', 'role:KH']);
Route::post('/webhooks/sepay', [PaymentController::class, 'sepayWebhook'])
    ->middleware('sepay.webhook');
Route::post('/webhooks/sepay-refund', [PaymentController::class, 'sepayRefundWebhook'])
    ->middleware('sepay.webhook');

Route::get('/orders', [OrderController::class, 'index'])
    ->middleware(['auth:sanctum', 'role:KH']);
Route::get('/orders/{id}', [OrderController::class, 'show'])
    ->whereNumber('id')
    ->middleware(['auth:sanctum', 'role:KH']);
Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel'])
    ->whereNumber('id')
    ->middleware(['auth:sanctum', 'role:KH']);
Route::post('/orders/{id}/review', [ReviewController::class, 'store'])
    ->whereNumber('id')
    ->middleware(['auth:sanctum', 'role:KH']);

Route::prefix('admin')->middleware(['auth:sanctum', 'role:AD'])->group(function () {
    Route::get('/accounts', [AccountController::class, 'index']);
    Route::get('/accounts/stats', [AccountController::class, 'stats']);
    Route::get('/accounts/{id}', [AccountController::class, 'show'])->whereNumber('id');
    Route::post('/accounts/staff', [AccountController::class, 'storeStaff']);
    Route::patch('/accounts/{id}/role', [AccountController::class, 'updateRole'])->whereNumber('id');
    Route::patch('/accounts/{id}/status', [AccountController::class, 'toggleStatus'])->whereNumber('id');
    Route::patch('/accounts/{id}/reset-password', [AccountController::class, 'resetPassword'])->whereNumber('id');
});

Route::prefix('staff')->middleware(['auth:sanctum', 'role:NV,AD'])->group(function () {
    // Dashboard thá»‘ng kÃª
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/revenue-weekly', [DashboardController::class, 'revenueWeekly']);
    Route::get('/dashboard/tour-status', [DashboardController::class, 'tourStatus']);
    Route::get('/dashboard/export-revenue', [DashboardController::class, 'exportRevenue']);
    Route::get('/dashboard/export-operations', [DashboardController::class, 'exportOperations']);

    Route::get('/omni-search', [OmniSearchController::class, 'search']);

    Route::get('/orders', [OrderManagementController::class, 'index']);
    Route::get('/orders/stats', [OrderManagementController::class, 'stats']);
    Route::get('/orders/{id}', [OrderManagementController::class, 'show'])->whereNumber('id');
    Route::post('/orders/{id}/approve-cancel', [OrderManagementController::class, 'approveCancel'])->whereNumber('id');

    Route::get('/tours', [TourManagementController::class, 'index']);
    Route::get('/tours/metadata', [TourManagementController::class, 'metadata']);
    Route::get('/tours/selection', [TourManagementController::class, 'selection']);
    Route::get('/tours/stats', [TourManagementController::class, 'stats']);
    Route::post('/tours', [TourManagementController::class, 'store']);
    Route::patch('/tours/{id}/toggle', [TourManagementController::class, 'toggle'])->whereNumber('id');
    Route::get('/tours/{id}', [TourManagementController::class, 'show'])->whereNumber('id');
    Route::put('/tours/{id}', [TourManagementController::class, 'update'])->whereNumber('id');

    Route::get('/promotions', [PromotionManagementController::class, 'index']);
    Route::get('/promotions/stats', [PromotionManagementController::class, 'stats']);
    Route::get('/promotions/chart-data', [PromotionManagementController::class, 'chartData']);
    Route::post('/promotions', [PromotionManagementController::class, 'store']);
    Route::patch('/promotions/{id}/toggle', [PromotionManagementController::class, 'toggle'])->whereNumber('id');
    Route::post('/promotions/{id}/tours', [PromotionManagementController::class, 'attachTours'])->whereNumber('id');
    Route::delete('/promotions/{id}/tours/{tourId}', [PromotionManagementController::class, 'detachTour'])
        ->whereNumber('id')
        ->whereNumber('tourId');
    Route::get('/promotions/{id}', [PromotionManagementController::class, 'show'])->whereNumber('id');
    Route::put('/promotions/{id}', [PromotionManagementController::class, 'update'])->whereNumber('id');

    Route::get('/news', [NewsManagementController::class, 'index']);
    Route::get('/news/stats', [NewsManagementController::class, 'stats']);
    Route::post('/news', [NewsManagementController::class, 'store']);
    Route::post('/news/upload-editor-image', [NewsManagementController::class, 'uploadEditorImage']);
    Route::patch('/news/{id}/toggle', [NewsManagementController::class, 'toggle'])->whereNumber('id');
    Route::get('/news/{id}', [NewsManagementController::class, 'show'])->whereNumber('id');
    Route::put('/news/{id}', [NewsManagementController::class, 'update'])->whereNumber('id');

    Route::get('/business-requests', [BusinessRequestManagementController::class, 'index']);
    Route::get('/business-requests/stats', [BusinessRequestManagementController::class, 'stats']);
    Route::get('/business-requests/{id}', [BusinessRequestManagementController::class, 'show'])->whereNumber('id');
    Route::patch('/business-requests/{id}', [BusinessRequestManagementController::class, 'update'])->whereNumber('id');
});

Route::get('/news', [NewsController::class, 'index']);
Route::get('/news/{id}', [NewsController::class, 'show'])->whereNumber('id');

Route::get('/tours', [TourController::class, 'index']);
Route::get('/tours/banners', [TourController::class, 'banners']);
Route::get('/tours/featured', [TourController::class, 'featured']);
Route::get('/tours/locations', [TourController::class, 'locations']);
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
Route::get('/tin-tuc/{id}/comments', [TinTucController::class, 'getComments']);
Route::post('/tin-tuc/{id}/comments', [TinTucController::class, 'postComment'])->middleware(['auth:sanctum', 'role:KH']);

Route::get('/khuyen-mai', [ChuongTrinhKhuyenMaiController::class, 'index']);
Route::get('/khuyen-mai/{id}', [ChuongTrinhKhuyenMaiController::class, 'show']);

