<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminReportService;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private AdminReportService $reportService)
    {
    }

    /**
     * Lấy dữ liệu thống kê doanh thu
     */
    public function revenue(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        return response()->json([
            'success' => true,
            'message' => 'Lấy dữ liệu báo cáo thành công',
            'data' => $this->reportService->getRevenueData($startDate, $endDate),
        ]);
    }

    /**
     * Xuất báo cáo doanh thu ra file CSV (Excel)
     */
    public function exportRevenue(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $data = $this->reportService->getRevenueData($startDate, $endDate);
        $rows = $data['details'];

        return response()->streamDownload(function () use ($rows, $startDate, $endDate) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM để Excel hiển thị tiếng Việt chuẩn
            fwrite($handle, chr(239) . chr(187) . chr(191));

            // Thông tin báo cáo
            fputcsv($handle, ['BÁO CÁO DOANH THU CÔNG TY']);
            fputcsv($handle, ['Từ ngày:', $startDate ?: 'Tất cả', 'Đến ngày:', $endDate ?: 'Tất cả']);
            fputcsv($handle, []);

            // Header row
            fputcsv($handle, [
                'Mã Tour',
                'Tên Tour',
                'Tổng Số Đơn Khách Đặt',
                'Tổng Số Vé Đã Bán',
                'Tổng Doanh Thu',
            ]);

            $tongTatCaDon = 0;
            $tongTatCaVe = 0;
            $tongTatCaDoanhThu = 0;

            foreach ($rows as $row) {
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
        }, 'Bao_Cao_Doanh_Thu_' . date('Ymd_His') . '.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
