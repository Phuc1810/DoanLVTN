<?php

namespace App\Services;

use App\Models\Tour;
use App\Models\YeuCauDoanhNghiep;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CalendarService
{
    /**
     * Retrieve calendar events between start and end dates.
     *
     * @param string $start (Y-m-d)
     * @param string $end (Y-m-d)
     * @return array
     */
    public function getEvents(string $start, string $end): array
    {
        $events = [];

        $parsedStart = Carbon::parse($start)->startOfDay();
        $parsedEnd = Carbon::parse($end)->endOfDay();

        // 1. Lấy các Tour Cá nhân / Khác Doanh nghiệp
        $tours = Tour::where('LoaiTour', '!=', 'Doanh nghiệp')
            ->where('TrangThai', '!=', 'Ngừng hoạt động')
            ->where(function ($q) use ($parsedStart, $parsedEnd) {
                // Tour bắt đầu trong khoảng hoặc đang diễn ra trong khoảng
                $q->whereBetween('NgayKhoiHanh', [$parsedStart, $parsedEnd])
                  ->orWhere(function ($q2) use ($parsedStart, $parsedEnd) {
                      $q2->where('NgayKhoiHanh', '<=', $parsedStart)
                         ->where('NgayKetThuc', '>=', $parsedStart);
                  });
            })
            ->get();

        foreach ($tours as $tour) {
            $startDate = Carbon::parse($tour->NgayKhoiHanh);
            $realEndDate = $tour->NgayKetThuc ? Carbon::parse($tour->NgayKetThuc) : $startDate->copy();
            
            // Render as a single day event on the calendar (departure day only)
            $calendarEndDate = $startDate->copy();

            // Status logic
            $now = Carbon::today();
            $statusStr = 'Sắp khởi hành';
            if ($now->greaterThan($realEndDate)) {
                $statusStr = 'Đã hoàn tất';
            } elseif ($now->between($startDate, $realEndDate)) {
                $statusStr = 'Đang diễn ra';
            }

            $events[] = [
                'id' => 'tour_' . $tour->MaTour,
                'title' => $tour->TenTour,
                'start' => $startDate->format('Y-m-d'),
                'end' => $calendarEndDate->format('Y-m-d'),
                'type' => 'Cá nhân',
                'status' => $statusStr,
                'url' => '/staff/tours/' . $tour->MaTour,
                'raw' => [
                    'MaTour' => $tour->MaTour,
                    'SoCho' => $tour->SoCho,
                    'SoChoDaDat' => $tour->SoChoDaDat,
                ]
            ];
        }

        // 2. Lấy các Tour Doanh nghiệp (từ yeucaudoanhnghiep)
        $businessRequests = YeuCauDoanhNghiep::whereIn('TrangThai', ['Đã thanh toán', 'Đang diễn ra', 'Đã hoàn tất'])
            ->whereNotNull('ThoiGianKhoiHanh')
            ->where(function ($q) use ($parsedStart, $parsedEnd) {
                $q->whereBetween('ThoiGianKhoiHanh', [$parsedStart, $parsedEnd])
                  ->orWhere(function ($q2) use ($parsedStart, $parsedEnd) {
                      $q2->where('ThoiGianKhoiHanh', '<=', $parsedStart)
                         ->where(function($q3) {
                             $q3->whereNotNull('NgayKetThuc')->where('NgayKetThuc', '!=', '');
                         })
                         ->where('NgayKetThuc', '>=', $parsedStart);
                  });
            })
            ->with(['tour'])
            ->get();

        foreach ($businessRequests as $request) {
            $startDate = Carbon::parse($request->ThoiGianKhoiHanh);
            $realEndDate = null;
            if (!empty($request->NgayKetThuc)) {
                $realEndDate = Carbon::parse($request->NgayKetThuc);
            } else {
                $realEndDate = $startDate->copy();
                if ($request->tour && !empty($request->tour->ThoiLuong)) {
                    if (preg_match('/^\D*(\d+)/', $request->tour->ThoiLuong, $matches)) {
                        $days = (int) $matches[1];
                        if ($days > 0) {
                            $realEndDate = $startDate->copy()->addDays($days - 1);
                        }
                    }
                }
            }
            
            // Render as a single day event on the calendar (departure day only)
            $calendarEndDate = $startDate->copy();

            $now = Carbon::today();
            $statusStr = 'Sắp khởi hành';
            if ($request->TrangThai === 'Đã hoàn tất') {
                $statusStr = 'Đã hoàn tất';
            } elseif ($request->TrangThai === 'Đang diễn ra') {
                $statusStr = 'Đang diễn ra';
            } else {
                if ($now->greaterThan($realEndDate)) {
                    $statusStr = 'Đã hoàn tất';
                } elseif ($now->between($startDate, $realEndDate)) {
                    $statusStr = 'Đang diễn ra';
                }
            }

            $events[] = [
                'id' => 'ycdn_' . $request->MaYC,
                'title' => ($request->TenCongTy ?: 'Doanh nghiệp') . ' - ' . ($request->tour ? $request->tour->TenTour : 'Tùy chỉnh'),
                'start' => $startDate->format('Y-m-d'),
                'end' => $calendarEndDate->format('Y-m-d'),
                'type' => 'Doanh nghiệp',
                'status' => $statusStr,
                'url' => '/staff/business-requests/' . $request->MaYC,
                'raw' => [
                    'MaYC' => $request->MaYC,
                    'SoNguoi' => $request->SoNguoi,
                ]
            ];
        }

        return $events;
    }
}
