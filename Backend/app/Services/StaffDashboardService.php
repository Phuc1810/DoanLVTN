<?php

namespace App\Services;

use App\Models\DonDatTour;
use App\Models\ThanhToan;
use App\Models\Tour;
use App\Models\YeuCauDoanhNghiep;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class StaffDashboardService
{
    /**
     * Thống kê tổng quan cho 4 Stat Cards.
     */
    public function stats(): array
    {
        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();
        $endOfMonth = $now->copy()->endOfMonth();
        $startOfLastMonth = $now->copy()->subMonth()->startOfMonth();
        $endOfLastMonth = $now->copy()->subMonth()->endOfMonth();

        // --- Đơn đặt tour ---
        $ordersThisMonth = DonDatTour::whereBetween('NgayDat', [$startOfMonth, $endOfMonth])->count();
        $ordersLastMonth = DonDatTour::whereBetween('NgayDat', [$startOfLastMonth, $endOfLastMonth])->count();
        $ordersTotal = DonDatTour::count();

        // --- Doanh thu (đơn đã thanh toán) ---
        $revenueThisMonth = ThanhToan::where('TrangThaiTT', 'Thành công')
            ->whereBetween('NgayTT', [$startOfMonth, $endOfMonth])
            ->sum('SoTien');
        $revenueLastMonth = ThanhToan::where('TrangThaiTT', 'Thành công')
            ->whereBetween('NgayTT', [$startOfLastMonth, $endOfLastMonth])
            ->sum('SoTien');

        // --- Tour đang hoạt động ---
        $activeTours = Tour::where('TrangThai', 'Hoạt động')->count();

        // --- Yêu cầu doanh nghiệp cần xử lý ---
        $pendingRequests = YeuCauDoanhNghiep::where('TrangThai', 'Chờ xử lý')->count();
        $requestsThisMonth = YeuCauDoanhNghiep::where('TrangThai', 'Chờ xử lý')
            ->whereBetween('ThoiGianKhoiHanh', [$startOfMonth, $endOfMonth])
            ->count();
        $requestsLastMonth = YeuCauDoanhNghiep::where('TrangThai', 'Chờ xử lý')
            ->whereBetween('ThoiGianKhoiHanh', [$startOfLastMonth, $endOfLastMonth])
            ->count();

        return [
            'total_orders'            => $ordersTotal,
            'orders_this_month'       => $ordersThisMonth,
            'orders_growth_percent'   => $this->growthPercent($ordersThisMonth, $ordersLastMonth),

            'total_revenue'           => (float) $revenueThisMonth,
            'revenue_growth_percent'  => $this->growthPercent($revenueThisMonth, $revenueLastMonth),

            'active_tours'            => $activeTours,

            'pending_requests'        => $pendingRequests,
            'requests_growth_percent' => $this->growthPercent($requestsThisMonth, $requestsLastMonth),
        ];
    }

    /**
     * Doanh thu theo từng ngày trong tuần hiện tại (T2 → CN).
     */
    public function revenueWeekly(): array
    {
        $now = Carbon::now();
        // Lấy thứ 2 đầu tuần và chủ nhật cuối tuần
        $startOfWeek = $now->copy()->startOfWeek(Carbon::MONDAY);
        $endOfWeek = $now->copy()->endOfWeek(Carbon::SUNDAY);

        $dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

        // Truy vấn doanh thu nhóm theo ngày
        $revenues = ThanhToan::select(
                DB::raw('DATE(NgayTT) as ngay'),
                DB::raw('SUM(SoTien) as tong')
            )
            ->where('TrangThaiTT', 'Thành công')
            ->whereBetween('NgayTT', [$startOfWeek, $endOfWeek])
            ->groupBy(DB::raw('DATE(NgayTT)'))
            ->pluck('tong', 'ngay');

        $result = [];
        for ($i = 0; $i < 7; $i++) {
            $date = $startOfWeek->copy()->addDays($i);
            $dateStr = $date->toDateString();
            $result[] = [
                'day'     => $dayLabels[$i],
                'date'    => $dateStr,
                'revenue' => (float) ($revenues[$dateStr] ?? 0),
            ];
        }

        return $result;
    }

    /**
     * Phân loại trạng thái tour cho Donut Chart.
     */
    public function tourStatus(): array
    {
        $today = Carbon::today()->toDateString();

        // Sắp khởi hành: NgayKhoiHanh > hôm nay VÀ TrangThai = Hoạt động
        $upcoming = Tour::where('TrangThai', 'Hoạt động')
            ->where('NgayKhoiHanh', '>', $today)
            ->count();

        // Đang diễn ra: NgayKhoiHanh <= hôm nay <= NgayKetThuc
        $ongoing = Tour::where('TrangThai', 'Hoạt động')
            ->where('NgayKhoiHanh', '<=', $today)
            ->where('NgayKetThuc', '>=', $today)
            ->count();

        // Đã hoàn thành: NgayKetThuc < hôm nay
        $completed = Tour::where('NgayKetThuc', '<', $today)->count();

        $total = $upcoming + $ongoing + $completed;

        $data = [
            [
                'label'   => 'Sắp khởi hành',
                'count'   => $upcoming,
                'percent' => $total > 0 ? round($upcoming / $total * 100, 1) : 0,
                'color'   => '#3b82f6',
            ],
            [
                'label'   => 'Đang diễn ra',
                'count'   => $ongoing,
                'percent' => $total > 0 ? round($ongoing / $total * 100, 1) : 0,
                'color'   => '#f97316',
            ],
            [
                'label'   => 'Đã hoàn thành',
                'count'   => $completed,
                'percent' => $total > 0 ? round($completed / $total * 100, 1) : 0,
                'color'   => '#22c55e',
            ],
        ];

        return [
            'data'  => $data,
            'total' => $total,
        ];
    }

    /**
     * Tính phần trăm tăng trưởng.
     */
    private function growthPercent(float|int $current, float|int $previous): float
    {
        if ($previous == 0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round(($current - $previous) / $previous * 100, 1);
    }
}
