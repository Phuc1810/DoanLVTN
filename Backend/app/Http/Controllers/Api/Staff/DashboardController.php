<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Services\StaffDashboardService;

class DashboardController extends Controller
{
    public function __construct(private StaffDashboardService $dashboardService)
    {
    }

    /**
     * Thống kê tổng quan (4 Stat Cards).
     */
    public function stats()
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy thống kê dashboard thành công',
            'data' => $this->dashboardService->stats(),
        ]);
    }

    /**
     * Doanh thu theo tuần (Bar Chart).
     */
    public function revenueWeekly()
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy doanh thu tuần thành công',
            'data' => $this->dashboardService->revenueWeekly(),
        ]);
    }

    /**
     * Phân loại trạng thái tour (Donut Chart).
     */
    public function tourStatus()
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy trạng thái tour thành công',
            'data' => $this->dashboardService->tourStatus(),
        ]);
    }
}
