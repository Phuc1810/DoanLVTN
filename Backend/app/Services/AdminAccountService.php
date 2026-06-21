<?php

namespace App\Services;

use App\Http\Resources\AdminAccountResource;
use App\Models\NhanVien;
use App\Models\TaiKhoan;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminAccountService
{
    private const ROLE_ADMIN = 'AD';
    private const ROLE_STAFF = 'NV';
    private const ROLE_CUSTOMER = 'KH';

    private const STATUS_ACTIVE = 'Hoạt động';
    private const STATUS_LOCKED = 'Khóa';

    private const ROLES = [
        self::ROLE_ADMIN,
        self::ROLE_STAFF,
        self::ROLE_CUSTOMER,
    ];

    private const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_LOCKED,
    ];

    public function list(array $filters, TaiKhoan $currentUser): array
    {
        $query = TaiKhoan::query()->with(['khachHang', 'nhanVien']);

        $keyword = trim((string) ($filters['q'] ?? ''));
        if ($keyword !== '') {
            $query->where(function (Builder $q) use ($keyword) {
                if (ctype_digit($keyword)) {
                    $q->where('MaTK', (int) $keyword);
                }

                $q->orWhere('TenDangNhap', 'like', '%'.$keyword.'%')
                    ->orWhereHas('khachHang', function (Builder $customerQuery) use ($keyword) {
                        $customerQuery->where('HoTen', 'like', '%'.$keyword.'%')
                            ->orWhere('Email', 'like', '%'.$keyword.'%')
                            ->orWhere('SoDienThoai', 'like', '%'.$keyword.'%');
                    })
                    ->orWhereHas('nhanVien', function (Builder $staffQuery) use ($keyword) {
                        $staffQuery->where('HoTen', 'like', '%'.$keyword.'%')
                            ->orWhere('Email', 'like', '%'.$keyword.'%')
                            ->orWhere('SDT', 'like', '%'.$keyword.'%');
                    });
            });
        }

        $role = $this->validRole($filters['role'] ?? $filters['VaiTro'] ?? null);
        if ($role !== null) {
            $query->where('VaiTro', $role);
        }

        $status = $this->validStatus($filters['st'] ?? $filters['status'] ?? $filters['TrangThai'] ?? null);
        if ($status !== null) {
            $query->where('TrangThai', $status);
        }

        $paginator = $query->orderByDesc('MaTK')
            ->paginate($this->normalizePerPage((int) ($filters['per_page'] ?? 10)));

        return [
            'items' => $paginator->getCollection()
                ->map(fn (TaiKhoan $account) => (new AdminAccountResource($account, $currentUser->MaTK))->resolve())
                ->values(),
            'pagination' => $this->paginationPayload($paginator),
        ];
    }

    public function createStaff(array $payload): array
    {
        return DB::transaction(function () use ($payload) {
            $account = TaiKhoan::create([
                'TenDangNhap' => $payload['username'],
                'MatKhau' => Hash::make($payload['password']),
                'VaiTro' => self::ROLE_STAFF,
                'TrangThai' => self::STATUS_ACTIVE,
                'Provider' => 'local',
            ]);

            NhanVien::create([
                'HoTen' => $payload['fullname'],
                'MaTK' => $account->MaTK,
            ]);

            $account->load('nhanVien');

            return array_merge((new AdminAccountResource($account))->resolve(), [
                'nhan_vien' => [
                    'MaNV' => $account->nhanVien?->MaNV,
                    'HoTen' => $account->nhanVien?->HoTen,
                ],
            ]);
        });
    }

    public function updateRole(int $id, string $role, TaiKhoan $currentUser): array
    {
        $this->ensureNotSelf($id, $currentUser);

        $account = $this->findAccount($id);
        $account->update(['VaiTro' => $role]);

        return [
            'MaTK' => $account->MaTK,
            'VaiTro' => $role,
        ];
    }

    public function toggleStatus(int $id, TaiKhoan $currentUser): array
    {
        $this->ensureNotSelf($id, $currentUser);

        $account = $this->findAccount($id);
        $newStatus = $account->TrangThai === self::STATUS_ACTIVE
            ? self::STATUS_LOCKED
            : self::STATUS_ACTIVE;

        $account->update(['TrangThai' => $newStatus]);

        return [
            'MaTK' => $account->MaTK,
            'TrangThai' => $newStatus,
        ];
    }

    public function resetPassword(int $id, string $newPassword, TaiKhoan $currentUser): array
    {
        $this->ensureNotSelf($id, $currentUser);

        $account = $this->findAccount($id);
        if ($account->VaiTro !== self::ROLE_STAFF) {
            $this->throwValidation('VaiTro', 'Chỉ được reset mật khẩu cho tài khoản nhân viên.');
        }

        $account->update(['MatKhau' => Hash::make($newPassword)]);

        return [
            'MaTK' => $account->MaTK,
            'TenDangNhap' => $account->TenDangNhap,
            'VaiTro' => $account->VaiTro,
        ];
    }

    private function findAccount(int $id): TaiKhoan
    {
        $account = TaiKhoan::where('MaTK', $id)->first();

        if (! $account) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Không tìm thấy tài khoản',
                'errors' => [
                    'id' => ['Tài khoản không tồn tại.'],
                ],
            ], 404));
        }

        return $account;
    }

    private function ensureNotSelf(int $id, TaiKhoan $currentUser): void
    {
        if ((int) $id === (int) $currentUser->MaTK) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Không thể thao tác trên chính tài khoản của bạn',
                'errors' => [
                    'id' => ['Không thể thao tác trên chính tài khoản của bạn.'],
                ],
            ], 422));
        }
    }

    private function validRole(?string $role): ?string
    {
        $role = strtoupper(trim((string) $role));

        return in_array($role, self::ROLES, true) ? $role : null;
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
