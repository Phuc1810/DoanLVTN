<?php

namespace App\Services;

use App\Http\Resources\StaffOrderDetailResource;
use App\Http\Resources\StaffOrderResource;
use App\Models\DonDatTour;
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
