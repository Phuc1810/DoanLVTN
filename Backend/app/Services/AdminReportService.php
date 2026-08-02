<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdminReportService
{
    /**
     * Lấy dữ liệu doanh thu dựa trên khoảng thời gian
     *
     * @param string|null $startDate
     * @param string|null $endDate
     * @return array
     */
    public function getRevenueData(?string $startDate = null, ?string $endDate = null): array
    {
        $query = DB::table('dondattour as d')
            ->join('tour as t', 't.MaTour', '=', 'd.MaTour')
            ->whereIn('d.TrangThai', ['Đã thanh toán', 'Đang diễn ra', 'Đã hoàn tất']);

        if (!empty($startDate)) {
            $query->whereDate('d.NgayDat', '>=', $startDate);
        }

        if (!empty($endDate)) {
            $query->whereDate('d.NgayDat', '<=', $endDate);
        }

        $rows = $query->selectRaw('
                t.MaTour,
                t.TenTour,
                COUNT(d.MaDon) as TongSoDon,
                SUM(d.SoLuongNguoiLon + d.SoLuongTreEm + d.SoLuongTreNho) as TongSoVeDaBan,
                SUM(d.TongTienPhaiTra) as TongDoanhThu
            ')
            ->groupBy('t.MaTour', 't.TenTour')
            ->orderByDesc('TongDoanhThu')
            ->get();

        $totalRevenue = 0;
        $totalTickets = 0;
        $totalOrders = 0;

        foreach ($rows as $row) {
            $totalRevenue += $row->TongDoanhThu;
            $totalTickets += $row->TongSoVeDaBan;
            $totalOrders += $row->TongSoDon;
        }

        // Lấy top 5 tour có doanh thu cao nhất
        $topTours = $rows->take(5)->map(function ($row) {
            return [
                'name' => $row->TenTour,
                'revenue' => (float)$row->TongDoanhThu,
                'tickets' => (int)$row->TongSoVeDaBan,
            ];
        })->values()->all();

        return [
            'summary' => [
                'total_revenue' => $totalRevenue,
                'total_tickets' => $totalTickets,
                'total_orders' => $totalOrders,
            ],
            'top_tours' => $topTours,
            'details' => $rows->all()
        ];
    }
}
