<?php

namespace App\Services;

use App\Http\Resources\OrderDetailResource;
use App\Http\Resources\OrderResource;
use App\Models\DonDatTour;
use App\Models\KhachHang;
use App\Models\TaiKhoan;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;

class OrderService
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

    public function list(TaiKhoan $user, array $filters): array
    {
        $customer = $this->currentCustomer($user);

        $this->syncCustomerOrderStatuses((int) $customer->MaKH);

        $query = DonDatTour::query()
            ->where('MaKH', $customer->MaKH)
            ->with([
                'tour.anhChinh',
                'thanhToans' => fn ($q) => $q->orderByDesc('MaTT'),
                'hoanTiens' => fn ($q) => $q->orderByDesc('MaHT'),
            ]);

        $status = $this->validStatus($filters['status'] ?? $filters['TrangThai'] ?? null);
        if ($status !== null) {
            $query->where('TrangThai', $status);
        }

        $paginator = $query->orderByDesc('MaDon')
            ->paginate($this->normalizePerPage((int) ($filters['per_page'] ?? 10)));

        return [
            'items' => OrderResource::collection($paginator->getCollection())->resolve(),
            'pagination' => $this->paginationPayload($paginator),
        ];
    }

    public function detail(TaiKhoan $user, int $id): array
    {
        $customer = $this->currentCustomer($user);

        $this->syncCustomerOrderStatuses((int) $customer->MaKH);

        $order = DonDatTour::query()
            ->where('MaDon', $id)
            ->where('MaKH', $customer->MaKH)
            ->with([
                'khachHang',
                'tour.anhChinh',
                'tour.lichTrinhs' => fn ($q) => $q->orderBy('NgayThu')->orderBy('MaLT'),
                'thanhToans' => fn ($q) => $q->orderByDesc('MaTT'),
                'hoanTiens' => fn ($q) => $q->orderByDesc('MaHT'),
                'chuongTrinhKhuyenMai',
            ])
            ->first();

        if (! $order) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Không tìm thấy đơn hàng',
                'errors' => [
                    'id' => ['Đơn hàng không tồn tại hoặc không thuộc khách hàng hiện tại.'],
                ],
            ], 404));
        }

        return (new OrderDetailResource($order))->resolve();
    }

    public function syncCustomerOrderStatuses(int $maKh): void
    {
        $today = now()->toDateString();

        DB::table('dondattour as d')
            ->join('tour as t', 't.MaTour', '=', 'd.MaTour')
            ->where('d.MaKH', $maKh)
            ->where('d.TrangThai', self::STATUS_PAID)
            ->whereNotNull('t.NgayKhoiHanh')
            ->whereNotNull('t.NgayKetThuc')
            ->whereDate('t.NgayKhoiHanh', '<=', $today)
            ->whereDate('t.NgayKetThuc', '>=', $today)
            ->update(['d.TrangThai' => self::STATUS_RUNNING]);

        DB::table('dondattour as d')
            ->join('tour as t', 't.MaTour', '=', 'd.MaTour')
            ->where('d.MaKH', $maKh)
            ->whereIn('d.TrangThai', [self::STATUS_PAID, self::STATUS_RUNNING])
            ->whereNotNull('t.NgayKetThuc')
            ->whereDate('t.NgayKetThuc', '<', $today)
            ->update(['d.TrangThai' => self::STATUS_DONE]);
    }

    private function currentCustomer(TaiKhoan $user): KhachHang
    {
        $customer = KhachHang::query()
            ->where('MaTK', $user->MaTK)
            ->first();

        if (! $customer) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Không tìm thấy thông tin khách hàng của tài khoản hiện tại',
                'errors' => [
                    'MaTK' => ['Tài khoản chưa có hồ sơ khách hàng.'],
                ],
            ], 404));
        }

        return $customer;
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
