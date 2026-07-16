<?php

namespace App\Services;

use App\Http\Resources\StaffOrderDetailResource;
use App\Http\Resources\StaffOrderResource;
use App\Models\DonDatTour;
use App\Models\ThanhToan;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;

class StaffOrderService
{
    private const STATUS_PENDING = 'Chờ thanh toán';
    private const STATUS_PAID = 'Đã thanh toán';
    private const STATUS_RUNNING = 'Đang diễn ra';
    private const STATUS_DONE = 'Đã hoàn tất';
    private const STATUS_SOLD_OUT = 'Hết chỗ';
    private const STATUS_CANCELLED = 'Đã huỷ';
    private const STATUS_REFUNDED = 'Đã hoàn tiền';

    private const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_PAID,
        self::STATUS_RUNNING,
        self::STATUS_DONE,
        self::STATUS_SOLD_OUT,
        self::STATUS_CANCELLED,
        'Yêu cầu huỷ',
        self::STATUS_REFUNDED,
    ];

    public function syncOrderStatusesByDate(): void
    {
        $today = now()->toDateString();

        DB::table('dondattour as d')
            ->join('tour as t', 't.MaTour', '=', 'd.MaTour')
            ->where('d.TrangThai', self::STATUS_PAID)
            ->whereNotNull('t.NgayKhoiHanh')
            ->whereNotNull('t.NgayKetThuc')
            ->whereDate('t.NgayKhoiHanh', '<=', $today)
            ->whereDate('t.NgayKetThuc', '>=', $today)
            ->update(['d.TrangThai' => self::STATUS_RUNNING]);

        DB::table('dondattour as d')
            ->join('tour as t', 't.MaTour', '=', 'd.MaTour')
            ->whereIn('d.TrangThai', [self::STATUS_PAID, self::STATUS_RUNNING])
            ->whereNotNull('t.NgayKetThuc')
            ->whereDate('t.NgayKetThuc', '<', $today)
            ->update(['d.TrangThai' => self::STATUS_DONE]);
    }

    /**
     * Thống kê tổng quan cho trang Quản lý Đơn đặt tour (4 Stat Cards).
     */
    public function stats(): array
    {
        $this->syncOrderStatusesByDate();

        $today = now()->toDateString();

        $revenueTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $label = now()->subDays($i)->format('d/m');
            $revenue = (float) ThanhToan::where('TrangThaiTT', 'Thành công')
                ->whereDate('NgayTT', $date)
                ->sum('SoTien');
            $revenueTrend[] = [
                'date' => $label,
                'revenue' => $revenue,
            ];
        }

        $statusRatioRaw = DonDatTour::select('TrangThai', \DB::raw('count(*) as count'))
            ->groupBy('TrangThai')
            ->get();
            
        $statusRatio = [];
        foreach ($statusRatioRaw as $item) {
            $statusRatio[] = [
                'name' => $item->TrangThai,
                'value' => $item->count,
            ];
        }

        return [
            'pending_orders'   => DonDatTour::where('TrangThai', self::STATUS_PENDING)->count(),
            'paid_orders'      => DonDatTour::where('TrangThai', self::STATUS_PAID)->count(),
            'cancelled_orders' => DonDatTour::where('TrangThai', self::STATUS_CANCELLED)->count(),
            'daily_revenue'    => (float) ThanhToan::where('TrangThaiTT', 'Thành công')
                ->whereDate('NgayTT', $today)
                ->sum('SoTien'),
            'revenue_trend'    => $revenueTrend,
            'status_ratio'     => $statusRatio,
        ];
    }

    public function list(array $filters): array
    {
        $this->syncOrderStatusesByDate();

        $query = DonDatTour::query()->with([
            'khachHang',
            'tour.anhChinh',
            'thanhToans' => fn ($q) => $q->orderByDesc('MaTT'),
            'hoanTiens' => fn ($q) => $q->orderByDesc('MaHT'),
        ]);

        $this->applyFilters($query, $filters);

        $paginator = $query->orderByDesc('MaDon')
            ->paginate($this->normalizePerPage((int) ($filters['per_page'] ?? 10)));

        return [
            'items' => StaffOrderResource::collection($paginator->getCollection())->resolve(),
            'pagination' => $this->paginationPayload($paginator),
        ];
    }

    public function detail(int $id): array
    {
        $this->syncOrderStatusesByDate();

        $order = DonDatTour::query()
            ->with([
                'khachHang.taiKhoan',
                'tour.anhChinh',
                'tour.lichTrinhs' => fn ($q) => $q->orderBy('NgayThu')->orderBy('MaLT'),
                'thanhToans' => fn ($q) => $q->orderByDesc('MaTT'),
                'hoanTiens' => fn ($q) => $q->orderByDesc('MaHT'),
                'chuongTrinhKhuyenMai',
            ])
            ->where('MaDon', $id)
            ->first();

        if (! $order) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Không tìm thấy đơn hàng',
                'errors' => [
                    'id' => ['Đơn hàng không tồn tại.'],
                ],
            ], 404));
        }

        return (new StaffOrderDetailResource($order))->resolve();
    }

    public function approveCancel(int $id): array
    {
        return DB::transaction(function () use ($id) {
            $order = DonDatTour::query()
                ->with(['tour', 'hoanTiens' => fn($q) => $q->orderByDesc('MaHT')])
                ->where('MaDon', $id)
                ->lockForUpdate()
                ->first();

            if (! $order) {
                throw new HttpResponseException(response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy đơn hàng',
                    'errors' => ['id' => ['Đơn hàng không tồn tại.']],
                ], 404));
            }

            if ($order->TrangThai !== 'Yêu cầu huỷ') {
                throw new HttpResponseException(response()->json([
                    'success' => false,
                    'message' => 'Đơn hàng không ở trạng thái yêu cầu huỷ',
                    'errors' => ['status' => ['Chỉ có thể duyệt hoàn tiền cho các đơn hàng có trạng thái Yêu cầu huỷ.']],
                ], 400));
            }

            // Calculate refund percentage based on business rules
            $start = $order->tour?->NgayKhoiHanh;
            $rate = 0;
            if ($start) {
                $today = now()->startOfDay();
                $startDate = \Carbon\Carbon::parse($start)->startOfDay();
                $days = (int) $today->diffInDays($startDate, false);

                if ($days >= 10) {
                    $rate = 0.7;
                } elseif ($days >= 5) {
                    $rate = 0.5;
                } elseif ($days >= 3) {
                    $rate = 0.25;
                } else {
                    $rate = 0;
                }
            }

            $refundAmount = (int) round($order->TongTienPhaiTra * $rate);

            // Update hoanTien record
            $hoanTien = $order->hoanTiens->first();
            if ($hoanTien) {
                $hoanTien->update([
                    'PhanTramHoan' => round($rate * 100),
                    'SoTienHoan' => $refundAmount,
                    'NgayHoan' => now(),
                ]);
            }

            // Update order status
            $order->update(['TrangThai' => self::STATUS_REFUNDED]);

            // Dispatch Email
            try {
                $orderInfo = array_merge($order->toArray(), [
                    'HoTen' => $order->khachHang?->HoTen,
                    'Email' => $order->khachHang?->Email,
                    'SoDienThoai' => $order->khachHang?->SoDienThoai,
                    'TenTour' => $order->tour?->TenTour,
                ]);
                app(\App\Services\NotificationService::class)->sendRefundSuccess($orderInfo, $refundAmount);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Failed to send refund email: ' . $e->getMessage());
            }

            return $this->detail($id);
        });
    }

    private function applyFilters(Builder $query, array $filters): void
    {
        $keyword = trim((string) ($filters['q'] ?? ''));
        if ($keyword !== '') {
            $query->where(function (Builder $q) use ($keyword) {
                if (ctype_digit($keyword)) {
                    $q->where('MaDon', (int) $keyword);
                }

                $q->orWhereHas('khachHang', function (Builder $customerQuery) use ($keyword) {
                    $customerQuery->where('HoTen', 'like', '%'.$keyword.'%')
                        ->orWhere('Email', 'like', '%'.$keyword.'%')
                        ->orWhere('SoDienThoai', 'like', '%'.$keyword.'%');
                })->orWhereHas('tour', function (Builder $tourQuery) use ($keyword) {
                    $tourQuery->where('TenTour', 'like', '%'.$keyword.'%')
                        ->orWhere('DiaDiem', 'like', '%'.$keyword.'%');
                });
            });
        }

        $status = $this->validStatus($filters['status'] ?? $filters['TrangThai'] ?? null);
        if ($status !== null) {
            $query->where('TrangThai', $status);
        }

        $paymentStatus = trim((string) ($filters['payment_status'] ?? ''));
        if ($paymentStatus !== '') {
            $query->whereHas('thanhToans', fn (Builder $paymentQuery) => $paymentQuery->where('TrangThaiTT', $paymentStatus));
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('NgayDat', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('NgayDat', '<=', $filters['date_to']);
        }
    }

    private function validStatus(?string $status): ?string
    {
        $status = trim((string) $status);

        return in_array($status, self::STATUSES, true) ? $status : null;
    }

    private function normalizePerPage(int $perPage): int
    {
        if ($perPage <= 0) {
            return 10;
        }

        return min($perPage, 50);
    }

    private function paginationPayload(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'last_page' => $paginator->lastPage(),
        ];
    }
}
