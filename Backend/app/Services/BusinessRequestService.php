<?php

namespace App\Services;

use App\Http\Resources\BusinessRequestResource;
use App\Models\KhachHang;
use App\Models\NhanVien;
use App\Models\TaiKhoan;
use App\Models\Tour;
use App\Models\YeuCauDoanhNghiep;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;

class BusinessRequestService
{
    private const STATUS_PENDING = 'Chờ xử lý';
    private const STATUS_CONTACTED = 'Đã liên hệ';
    private const STATUS_CANCELLED = 'Hủy tour';
    private const STATUS_COMPLETED = 'Hoàn thành';
    private const TOUR_FULL = 'Hết chỗ';
    private const BUSINESS_TOUR = 'Doanh nghiệp';
    private const CUSTOMER_STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_CONTACTED,
        self::STATUS_CANCELLED,
        self::STATUS_COMPLETED,
    ];

    public function store(TaiKhoan $user, array $payload): array
    {
        return DB::transaction(function () use ($user, $payload) {
            $customer = $this->customerForUser($user, $payload);
            $tour = null;

            if (! empty($payload['MaTour'])) {
                $tour = Tour::where('MaTour', (int) $payload['MaTour'])
                    ->lockForUpdate()
                    ->first();

                if (! $tour) {
                    $this->throwNotFound('MaTour', 'Tour không tồn tại.');
                }

                if ($tour->LoaiTour !== self::BUSINESS_TOUR) {
                    $this->throwValidation('MaTour', 'Tour không thuộc loại doanh nghiệp.');
                }

                $soNguoi = (int) $payload['SoNguoi'];
                $soCho = (int) $tour->SoCho;
                $soChoDaDat = (int) $tour->SoChoDaDat;

                if ($soCho > 0 && ($soChoDaDat + $soNguoi) > $soCho) {
                    $this->throwValidation('SoNguoi', 'Tour không đủ chỗ. Vui lòng chọn tour khác hoặc giảm số người.');
                }
            }

            $request = YeuCauDoanhNghiep::create([
                'TenCongTy' => $payload['TenCongTy'],
                'NguoiLienHe' => $payload['NguoiLienHe'],
                'SDT' => $payload['SDT'],
                'SoNguoi' => (int) $payload['SoNguoi'],
                'ThoiGianKhoiHanh' => $payload['ThoiGianKhoiHanh'],
                'TrangThai' => self::STATUS_PENDING,
                'MaKH' => $customer->MaKH,
                'MaTour' => $tour?->MaTour,
                'MaNV' => null,
            ]);

            if ($tour) {
                $newBookedSeats = (int) $tour->SoChoDaDat + (int) $payload['SoNguoi'];
                $updates = ['SoChoDaDat' => $newBookedSeats];

                if ((int) $tour->SoCho > 0 && $newBookedSeats >= (int) $tour->SoCho) {
                    $updates['TrangThai'] = self::TOUR_FULL;
                }

                $tour->update($updates);
            }

            return $this->resource($request->load(['tour.anhChinh', 'khachHang', 'nhanVien']));
        });
    }

    public function listForCustomer(TaiKhoan $user, array $filters): array
    {
        $customer = $this->customerForUser($user, [
            'NguoiLienHe' => $user->HoTen ?? '',
            'SDT' => $user->SoDienThoai ?? '',
        ]);

        $query = YeuCauDoanhNghiep::query()
            ->where('MaKH', $customer->MaKH)
            ->with(['tour.anhChinh', 'khachHang', 'nhanVien']);

        $status = trim((string) ($filters['st'] ?? $filters['status'] ?? $filters['TrangThai'] ?? ''));
        if (! in_array($status, self::CUSTOMER_STATUSES, true)) {
            $status = '';
        }

        if ($status !== '') {
            $query->where('TrangThai', $status);
        }

        $paginator = $query->orderByDesc('MaYC')
            ->paginate($this->normalizePerPage((int) ($filters['per_page'] ?? 8)));

        return [
            'items' => BusinessRequestResource::collection($paginator->getCollection())->resolve(),
            'pagination' => $this->paginationPayload($paginator),
        ];
    }

    public function detailForCustomer(TaiKhoan $user, int $id): array
    {
        $customer = $this->customerForUser($user, [
            'NguoiLienHe' => $user->HoTen ?? '',
            'SDT' => $user->SoDienThoai ?? '',
        ]);

        $request = YeuCauDoanhNghiep::with(['tour.anhChinh', 'khachHang', 'nhanVien'])
            ->where('MaYC', $id)
            ->where('MaKH', $customer->MaKH)
            ->first();

        if (! $request) {
            $this->throwNotFound('id', 'Yêu cầu không tồn tại hoặc không thuộc tài khoản hiện tại.');
        }

        return $this->resource($request);
    }

    public function listForStaff(array $filters): array
    {
        $query = YeuCauDoanhNghiep::query()
            ->with(['tour.anhChinh', 'khachHang', 'nhanVien']);

        $keyword = trim((string) ($filters['q'] ?? ''));
        if ($keyword !== '') {
            $query->where(function (Builder $q) use ($keyword) {
                $q->where('TenCongTy', 'like', '%'.$keyword.'%')
                    ->orWhere('NguoiLienHe', 'like', '%'.$keyword.'%')
                    ->orWhere('SDT', 'like', '%'.$keyword.'%');

                if (ctype_digit($keyword)) {
                    $q->orWhere('MaYC', (int) $keyword);
                }

                $q->orWhereHas('tour', fn (Builder $tourQuery) => $tourQuery->where('TenTour', 'like', '%'.$keyword.'%'));
            });
        }

        $status = trim((string) ($filters['status'] ?? $filters['TrangThai'] ?? ''));
        if ($status !== '') {
            $query->where('TrangThai', $status);
        }

        $paginator = $query->orderByDesc('MaYC')
            ->paginate($this->normalizePerPage((int) ($filters['per_page'] ?? 10)));

        return [
            'items' => BusinessRequestResource::collection($paginator->getCollection())->resolve(),
            'pagination' => $this->paginationPayload($paginator),
        ];
    }

    public function detailForStaff(int $id): array
    {
        $request = YeuCauDoanhNghiep::with(['tour.anhChinh', 'khachHang', 'nhanVien'])->find($id);

        if (! $request) {
            $this->throwNotFound('id', 'Yêu cầu không tồn tại.');
        }

        return $this->resource($request);
    }

    public function updateForStaff(TaiKhoan $user, int $id, array $payload): array
    {
        return DB::transaction(function () use ($user, $id, $payload) {
            $request = YeuCauDoanhNghiep::lockForUpdate()->find($id);

            if (! $request) {
                $this->throwNotFound('id', 'Yêu cầu không tồn tại.');
            }

            if ($payload['action'] === 'claim') {
                return $this->claim($user, $request);
            }

            return $this->updateStatus($user, $request, $payload);
        });
    }

    private function claim(TaiKhoan $user, YeuCauDoanhNghiep $request): array
    {
        $staff = $this->staffForUser($user);

        if (! $staff) {
            $this->throwValidation('MaNV', 'Chỉ nhân viên có hồ sơ MaNV mới được nhận xử lý yêu cầu.');
        }

        if (! empty($request->MaNV)) {
            $this->throwValidation('MaNV', 'Yêu cầu đã có nhân viên xử lý.');
        }

        $request->update([
            'MaNV' => $staff->MaNV,
            'TrangThai' => self::STATUS_CONTACTED,
        ]);

        return $this->resource($request->refresh()->load(['tour.anhChinh', 'khachHang', 'nhanVien']));
    }

    private function updateStatus(TaiKhoan $user, YeuCauDoanhNghiep $request, array $payload): array
    {
        $staff = $this->staffForUser($user);
        $isAdmin = $user->VaiTro === 'AD';

        if (! $isAdmin) {
            if (! $staff) {
                $this->throwValidation('MaNV', 'Không tìm thấy hồ sơ nhân viên.');
            }

            if ((int) $request->MaNV !== (int) $staff->MaNV) {
                $this->throwValidation('MaNV', 'Bạn không có quyền cập nhật yêu cầu của nhân viên khác.');
            }
        }

        $updates = [
            'TrangThai' => $payload['TrangThai'],
        ];

        if (array_key_exists('GiaTriHopDong', $payload)) {
            $updates['GiaTriHopDong'] = ($payload['GiaTriHopDong'] === '' || $payload['GiaTriHopDong'] === null)
                ? null
                : $payload['GiaTriHopDong'];
        }

        if (array_key_exists('NgayThanhToan', $payload)) {
            $updates['NgayThanhToan'] = $payload['NgayThanhToan'] === '' ? null : $payload['NgayThanhToan'];
        }

        $request->update($updates);

        return $this->resource($request->refresh()->load(['tour.anhChinh', 'khachHang', 'nhanVien']));
    }

    private function customerForUser(TaiKhoan $user, array $payload): KhachHang
    {
        $customer = $user->khachHang()->first();

        if ($customer) {
            return $customer;
        }

        $email = filter_var($user->TenDangNhap, FILTER_VALIDATE_EMAIL) ? $user->TenDangNhap : '';

        return KhachHang::create([
            'HoTen' => trim((string) ($payload['NguoiLienHe'] ?? $user->HoTen ?? '')),
            'Email' => $email,
            'SoDienThoai' => trim((string) ($payload['SDT'] ?? $user->SoDienThoai ?? '')),
            'DiaChi' => '',
            'MaTK' => $user->MaTK,
        ]);
    }

    private function staffForUser(TaiKhoan $user): ?NhanVien
    {
        return $user->nhanVien()->first();
    }

    private function resource(YeuCauDoanhNghiep $request): array
    {
        return (new BusinessRequestResource($request))->resolve();
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

    private function throwNotFound(string $key, string $message): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Không tìm thấy dữ liệu',
            'errors' => [
                $key => [$message],
            ],
        ], 404));
    }

    private function throwValidation(string $key, string $message): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Dữ liệu không hợp lệ',
            'errors' => [
                $key => [$message],
            ],
        ], 422));
    }
}
