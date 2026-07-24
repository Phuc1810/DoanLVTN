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

    /**
     * Xuất báo cáo doanh thu ra file CSV (UTF-8 BOM).
     */
    public function exportRevenue()
    {
        $rows = $this->dashboardService->revenueExportData();

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM để Excel hiển thị tiếng Việt đúng
            fwrite($handle, chr(239) . chr(187) . chr(191));

            // Header row
            fputcsv($handle, [
                'Mã Tour',
                'Tên Tour',
                'Tổng Số Đơn Khách Đặt',
                'Tổng Số Vé Đã Bán',
                'Tổng Doanh Thu',
            ]);

            // Khởi tạo các biến tổng
            $tongTatCaDon = 0;
            $tongTatCaVe = 0;
            $tongTatCaDoanhThu = 0;

            // Data rows
            foreach ($rows as $row) {
                // Cộng dồn
                $tongTatCaDon += $row->TongSoDon;
                $tongTatCaVe += $row->TongSoVeDaBan;
                $tongTatCaDoanhThu += $row->TongDoanhThu;

                fputcsv($handle, [
                    $row->MaTour,
                    $row->TenTour,
                    $row->TongSoDon,
                    $row->TongSoVeDaBan,
                    $row->TongDoanhThu,
                ]);
            }

            // Ghi dòng cuối cùng (TỔNG CỘNG)
            fputcsv($handle, [
                '',
                'TỔNG CỘNG',
                $tongTatCaDon,
                $tongTatCaVe,
                $tongTatCaDoanhThu,
            ]);

            fclose($handle);
        }, 'bao_cao_doanh_thu_' . now()->format('Y_m_d') . '.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Xuất Báo cáo Vận hành & Khách hàng ra file CSV (UTF-8 BOM).
     */
    public function exportOperations()
    {
        $data = $this->dashboardService->operationsExportData();

        return response()->streamDownload(function () use ($data) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM để Excel hiển thị tiếng Việt đúng
            fwrite($handle, chr(239) . chr(187) . chr(191));

            // --- PHẦN 1: TÌNH TRẠNG TOUR ---
            fputcsv($handle, ['--- PHẦN 1: TÌNH TRẠNG TOUR ---']);
            fputcsv($handle, ['Tên chỉ số', 'Con số']);
            fputcsv($handle, ['Tổng số tour đang mở bán', $data['tourStats']['hoat_dong']]);
            fputcsv($handle, ['Tổng số tour sắp khởi hành (7 ngày tới)', $data['tourStats']['sap_khoi_hanh']]);
            fputcsv($handle, ['Tổng số tour đã hết chỗ', $data['tourStats']['het_cho']]);
            
            fputcsv($handle, []); // Dòng trống
            
            // --- PHẦN 2: BÁO CÁO SỐ LƯỢNG KHÁCH ---
            fputcsv($handle, ['--- PHẦN 2: BÁO CÁO SỐ LƯỢNG KHÁCH ---']);
            fputcsv($handle, ['Nhóm tuổi', 'Tổng số lượng']);
            fputcsv($handle, ['Người Lớn', $data['customerStats']->TongNguoiLon ?? 0]);
            fputcsv($handle, ['Trẻ Em', $data['customerStats']->TongTreEm ?? 0]);
            fputcsv($handle, ['Trẻ Nhỏ', $data['customerStats']->TongTreNho ?? 0]);
            
            fputcsv($handle, []); // Dòng trống
            
            // --- PHẦN 3: DANH SÁCH ĐƠN HỦY & LÝ DO ---
            fputcsv($handle, ['--- PHẦN 3: DANH SÁCH ĐƠN HỦY & LÝ DO ---']);
            fputcsv($handle, ['Mã Đơn', 'Tên Khách Hàng', 'Tên Tour', 'Ngày Hủy/Ngày Đặt', 'Lý Do Hủy']);
            foreach ($data['cancelledOrders'] as $order) {
                fputcsv($handle, [
                    $order->MaDon,
                    $order->HoTen,
                    $order->TenTour,
                    $order->NgayDat,
                    $order->LyDo ?? 'Hết hạn thanh toán / Không rõ'
                ]);
            }

            fclose($handle);
        }, 'bao_cao_van_hanh_' . now()->format('Y_m_d') . '.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
