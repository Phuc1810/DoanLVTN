<?php

namespace App\Services;

use App\Http\Resources\AdminAccountResource;
use App\Models\KhachHang;
use App\Models\NhanVien;
use App\Models\TaiKhoan;
use App\Models\YeuCauDoanhNghiep;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\ValidationException;
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

    public function getAccountDetails(int $id): array
    {
        $account = TaiKhoan::with([
            'khachHang.donDatTours.tour:MaTour,TenTour,ThoiLuong',
            'khachHang.donDatTours.tour.anhChinh',
            'khachHang.danhGias.tour:MaTour,TenTour',
            'nhanVien.tours:MaTour,TenTour,ThoiLuong,TrangThai',
            'nhanVien.tinTucs:MaTin,TieuDe,NgayDang,TrangThai'
        ])->find($id);

        if (!$account) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Không tìm thấy tài khoản',
            ], 404));
        }

        $result = [
            'id' => $account->MaTK,
            'username' => $account->TenDangNhap,
            'role' => $account->VaiTro,
            'status' => $account->TrangThai,
            'profile' => null,
            'activities' => []
        ];

        if ($account->VaiTro === self::ROLE_CUSTOMER && $account->khachHang) {
            $kh = $account->khachHang;
            $result['profile'] = [
                'fullname' => $kh->HoTen,
                'email' => $kh->Email,
                'phone' => $kh->SoDienThoai,
                'address' => $kh->DiaChi,
                'dob' => $kh->NgaySinh,
                'gender' => $kh->GioiTinh,
            ];
            $result['activities'] = [
                'bookings' => $kh->donDatTours()->orderByDesc('NgayDat')->get()->map(function ($booking) {
                    return [
                        'id' => $booking->MaDon,
                        'booking_date' => $booking->NgayDat,
                        'total_price' => $booking->TongTienPhaiTra,
                        'status' => $booking->TrangThai,
                        'tour' => [
                            'id' => $booking->tour?->MaTour,
                            'name' => $booking->tour?->TenTour,
                            'image' => $booking->tour?->anhChinh?->DuongDan
                        ]
                    ];
                })->values(),
                'reviews' => $kh->danhGias()->orderByDesc('NgayDG')->get()->map(function ($review) {
                    return [
                        'id' => $review->MaDG,
                        'rating' => $review->SoSao,
                        'comment' => $review->NoiDung,
                        'date' => $review->NgayDG,
                        'tour' => [
                            'id' => $review->tour?->MaTour,
                            'name' => $review->tour?->TenTour
                        ]
                    ];
                })->values()
            ];
        } elseif (in_array($account->VaiTro, [self::ROLE_STAFF, self::ROLE_ADMIN]) && $account->nhanVien) {
            $nv = $account->nhanVien;
            $result['profile'] = [
                'fullname' => $nv->HoTen,
                'email' => $nv->Email,
                'phone' => $nv->SDT,
                'position' => $nv->ChucVu,
            ];
            $result['activities'] = [
                'managed_tours' => $nv->tours()->orderByDesc('MaTour')->get()->map(function ($tour) {
                    return [
                        'id' => $tour->MaTour,
                        'name' => $tour->TenTour,
                        'duration' => $tour->ThoiLuong,
                        'status' => $tour->TrangThai,
                        'image' => $tour->anhChinh?->DuongDan,
                    ];
                })->values(),
                'news' => $nv->tinTucs()->orderByDesc('NgayDang')->get()->map(function ($news) {
                    return [
                        'id' => $news->MaTin,
                        'title' => $news->TieuDe,
                        'date' => $news->NgayDang,
                        'status' => $news->TrangThai,
                        'image' => $news->AnhDaiDien,
                    ];
                })->values(),
                'business_requests' => $nv->yeuCauDoanhNghieps()->orderByDesc('NgayGui')->get()->map(function ($req) {
                    return [
                        'id' => $req->MaYC,
                        'company' => $req->TenCongTy,
                        'contact' => $req->NguoiLienHe,
                        'date' => $req->NgayGui,
                        'status' => $req->TrangThai,
                    ];
                })->values()
            ];
        }

        return $result;
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
                'Email' => $payload['email'] ?? null,
                'SDT' => $payload['sdt'] ?? null,
                'ChucVu' => $payload['chucvu'] ?? null,
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
        $oldRole = $account->VaiTro;

        DB::transaction(function () use ($account, $role, $oldRole) {
            $account->update(['VaiTro' => $role]);

            if (in_array($oldRole, [self::ROLE_STAFF, self::ROLE_ADMIN], true) && $role === self::ROLE_CUSTOMER) {
                $nhanVien = NhanVien::where('MaTK', $account->MaTK)->first();
                if ($nhanVien) {
                    $khachHang = KhachHang::where('MaTK', $account->MaTK)->first();
                    if (!$khachHang) {
                        KhachHang::create([
                            'MaTK' => $account->MaTK,
                            'HoTen' => $nhanVien->HoTen,
                            'Email' => $nhanVien->Email,
                            'SoDienThoai' => $nhanVien->SDT,
                        ]);
                    }
                }
            }

            if ($oldRole === self::ROLE_CUSTOMER && in_array($role, [self::ROLE_STAFF, self::ROLE_ADMIN], true)) {
                $khachHang = KhachHang::where('MaTK', $account->MaTK)->first();
                if ($khachHang) {
                    $nhanVien = NhanVien::where('MaTK', $account->MaTK)->first();
                    if (!$nhanVien) {
                        NhanVien::create([
                            'MaTK' => $account->MaTK,
                            'HoTen' => $khachHang->HoTen,
                            'Email' => $khachHang->Email,
                            'SDT' => $khachHang->SoDienThoai,
                        ]);
                    }
                }
            }
        });

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

        if ($newStatus === self::STATUS_LOCKED && $account->VaiTro === self::ROLE_STAFF) {
            $nhanVien = $account->nhanVien;
            if ($nhanVien) {
                $pendingRequests = YeuCauDoanhNghiep::where('MaNV', $nhanVien->MaNV)
                    ->whereIn('TrangThai', ['Chờ xử lý', 'Đang xử lý', 'Đã duyệt', 'Đã thanh toán', 'Đang diễn ra', 'Đã liên hệ'])
                    ->with('tour:MaTour,TenTour,NgayKhoiHanh,NgayKetThuc')
                    ->get();
                
                if ($pendingRequests->isNotEmpty()) {
                    throw new \Illuminate\Http\Exceptions\HttpResponseException(response()->json([
                        'message' => 'Dữ liệu không hợp lệ',
                        'errors' => [
                            'TrangThai' => ['Tài khoản này đang phụ trách ' . $pendingRequests->count() . ' yêu cầu doanh nghiệp. Vui lòng bàn giao trước khi khóa.'],
                            'pending_requests' => $pendingRequests->toArray()
                        ]
                    ], 422));
                }
            }
        }

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

    public function getEligibleStaff(?string $startDate, ?string $endDate): array
    {
        $allStaff = NhanVien::with('taiKhoan')
            ->whereHas('taiKhoan', function ($q) {
                $q->where('TrangThai', self::STATUS_ACTIVE);
            })
            ->get();

        if (!$startDate) {
            return $allStaff->map(fn($s) => ['MaNV' => $s->MaNV, 'HoTen' => $s->HoTen])->toArray();
        }

        $reqStartDate = \Carbon\Carbon::parse($startDate)->startOfDay();
        $reqEndDate = $endDate 
            ? \Carbon\Carbon::parse($endDate)->endOfDay()
            : $reqStartDate->copy()->endOfDay();

        $activeStatuses = ['Chờ xử lý', 'Đang xử lý', 'Đã duyệt', 'Đã thanh toán', 'Đang diễn ra', 'Đã liên hệ'];
        $ongoingRequests = YeuCauDoanhNghiep::whereIn('TrangThai', $activeStatuses)
            ->with('tour')
            ->get();

        $busyStaffIds = [];
        foreach ($ongoingRequests as $ongoing) {
            if (empty($ongoing->ThoiGianKhoiHanh) || empty($ongoing->MaNV)) {
                continue;
            }
            
            $start = \Carbon\Carbon::parse($ongoing->ThoiGianKhoiHanh)->startOfDay();
            if (!empty($ongoing->NgayKetThuc)) {
                $end = \Carbon\Carbon::parse($ongoing->NgayKetThuc)->endOfDay();
            } else {
                $days = 1;
                $thoiLuongStr = $ongoing->tour ? $ongoing->tour->ThoiLuong : $ongoing->DiaDiem;
                if (!empty($thoiLuongStr) && preg_match('/(\d+)\s*(n|ngày)/i', $thoiLuongStr, $matches)) {
                    $days = (int)$matches[1];
                }
                $end = $start->copy()->addDays($days - 1)->endOfDay();
            }
            
            if ($reqStartDate->lte($end) && $reqEndDate->gte($start)) {
                $busyStaffIds[] = $ongoing->MaNV;
            }
        }

        $busyStaffIds = array_unique($busyStaffIds);

        return $allStaff->filter(function($s) use ($busyStaffIds) {
            return !in_array($s->MaNV, $busyStaffIds);
        })->map(function($s) {
            return ['MaNV' => $s->MaNV, 'HoTen' => $s->HoTen];
        })->values()->toArray();
    }

    public function reassignAndLock(int $accountId, array $assignments, TaiKhoan $currentUser): array
    {
        $this->ensureNotSelf($accountId, $currentUser);

        $account = $this->findAccount($accountId);
        if ($account->VaiTro !== self::ROLE_STAFF) {
            $this->throwValidation('VaiTro', 'Chỉ áp dụng cho tài khoản nhân viên.');
        }

        DB::transaction(function () use ($account, $assignments) {
            if ($account->nhanVien) {
                // Cross-check for overlaps
                $assignmentsByNv = [];
                foreach ($assignments as $assignment) {
                    $req = YeuCauDoanhNghiep::with('tour')->find($assignment['ma_yc'] ?? null);
                    if ($req && $req->MaNV === $account->nhanVien->MaNV) {
                        $nv = $assignment['new_ma_nv'];
                        if (!isset($assignmentsByNv[$nv])) {
                            $assignmentsByNv[$nv] = [];
                        }
                        
                        if (empty($req->ThoiGianKhoiHanh)) {
                            continue; // Skip requests without start date
                        }
                        
                        $start = \Carbon\Carbon::parse($req->ThoiGianKhoiHanh)->startOfDay();
                        if (!empty($req->NgayKetThuc)) {
                            $end = \Carbon\Carbon::parse($req->NgayKetThuc)->endOfDay();
                        } else {
                            $days = 1;
                            $thoiLuongStr = $req->tour ? $req->tour->ThoiLuong : $req->DiaDiem;
                            if (!empty($thoiLuongStr) && preg_match('/(\d+)\s*(n|ngày)/i', $thoiLuongStr, $matches)) {
                                $days = (int)$matches[1];
                            }
                            $end = $start->copy()->addDays($days - 1)->endOfDay();
                        }
                        
                        $assignmentsByNv[$nv][] = [
                            'req' => $req,
                            'start' => $start,
                            'end' => $end
                        ];
                    }
                }
                
                foreach ($assignmentsByNv as $nv => $assignedReqs) {
                    if (count($assignedReqs) > 1) {
                        for ($i = 0; $i < count($assignedReqs); $i++) {
                            for ($j = $i + 1; $j < count($assignedReqs); $j++) {
                                if ($assignedReqs[$i]['start']->lte($assignedReqs[$j]['end']) && $assignedReqs[$i]['end']->gte($assignedReqs[$j]['start'])) {
                                    $nvName = NhanVien::find($nv)->HoTen ?? $nv;
                                    $this->throwValidation('PhanCong', "Lỗi: Bạn đang phân công nhân viên {$nvName} phụ trách nhiều yêu cầu bị trùng lịch nhau. Vui lòng chọn người khác.");
                                }
                            }
                        }
                    }
                }

                foreach ($assignments as $assignment) {
                    $request = YeuCauDoanhNghiep::find($assignment['ma_yc'] ?? null);
                    if ($request && $request->MaNV === $account->nhanVien->MaNV) {
                        $request->update(['MaNV' => $assignment['new_ma_nv']]);
                    }
                }
            }
            $account->update(['TrangThai' => self::STATUS_LOCKED]);
        });

        return [
            'MaTK' => $account->MaTK,
            'TrangThai' => self::STATUS_LOCKED,
        ];
    }

    public function stats(): array
    {
        $roleCounts = TaiKhoan::query()
            ->select('VaiTro', DB::raw('count(*) as total'))
            ->groupBy('VaiTro')
            ->pluck('total', 'VaiTro')
            ->toArray();

        $statusCounts = TaiKhoan::query()
            ->select('TrangThai', DB::raw('count(*) as total'))
            ->groupBy('TrangThai')
            ->pluck('total', 'TrangThai')
            ->toArray();

        return [
            'roles' => [
                ['name' => 'Admin', 'key' => 'AD', 'count' => $roleCounts['AD'] ?? 0],
                ['name' => 'Nhân viên', 'key' => 'NV', 'count' => $roleCounts['NV'] ?? 0],
                ['name' => 'Khách hàng', 'key' => 'KH', 'count' => $roleCounts['KH'] ?? 0],
            ],
            'statuses' => [
                ['name' => 'Hoạt động', 'count' => $statusCounts['Hoạt động'] ?? 0],
                ['name' => 'Khóa', 'count' => $statusCounts['Khóa'] ?? 0],
            ],
        ];
    }
}
