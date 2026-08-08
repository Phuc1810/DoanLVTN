<?php

namespace App\Services;

use App\Http\Resources\StaffTourResource;
use App\Models\HinhAnhTour;
use App\Models\LichTrinhTour;
use App\Models\Tour;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class StaffTourService
{
    private const STATUS_ACTIVE = 'Hoạt động';
    private const STATUS_INACTIVE = 'Ngừng hoạt động';

    public function __construct(private UploadService $uploadService)
    {
    }

    private function tienDoSql(): string
    {
        return "CASE 
            WHEN TinhChatTour = 'Định kỳ' THEN NULL
            WHEN TrangThai NOT IN ('Hoạt động', 'Hết chỗ') AND (NgayKetThuc IS NULL OR CURRENT_DATE <= DATE(NgayKetThuc)) THEN NULL
            WHEN NgayKhoiHanh IS NULL THEN 'Sắp khởi hành'
            WHEN NgayKetThuc IS NOT NULL THEN
                CASE 
                    WHEN CURRENT_DATE > DATE(NgayKetThuc) THEN 'Đã hoàn tất'
                    WHEN CURRENT_DATE >= DATE(NgayKhoiHanh) AND CURRENT_DATE <= DATE(NgayKetThuc) THEN 'Đang diễn ra'
                    ELSE 'Sắp khởi hành'
                END
            ELSE
                CASE 
                    WHEN CURRENT_DATE > DATE(NgayKhoiHanh) THEN 'Đã hoàn tất'
                    WHEN CURRENT_DATE = DATE(NgayKhoiHanh) THEN 'Đang diễn ra'
                    ELSE 'Sắp khởi hành'
                END
        END";
    }

    public function list(array $filters): array
    {
        $this->syncTourStatuses();
        
        $query = Tour::query()->with('anhChinh');

        $keyword = trim((string) ($filters['q'] ?? ''));
        if ($keyword !== '') {
            if (str_starts_with($keyword, '#') && ctype_digit(trim(substr($keyword, 1)))) {
                $id = (int) trim(substr($keyword, 1));
                $query->where(function (Builder $q) use ($id) {
                    $q->where('MaTour', $id)
                      ->orWhere('IDTourGoc', $id);
                });
            } else {
                $query->where(function (Builder $q) use ($keyword) {
                    $q->where('TenTour', 'like', '%'.$keyword.'%')
                        ->orWhere('DiaDiem', 'like', '%'.$keyword.'%');

                    if (ctype_digit($keyword)) {
                        $q->orWhere('MaTour', (int) $keyword);
                    }
                });
            }
        }
        //Lọc động theo loại, trạng thái, miền
        if (! empty($filters['loai'])) {
            $query->where('LoaiTour', $filters['loai']);
        }

        $status = $filters['tt'] ?? $filters['status'] ?? null;
        if (! empty($status)) {
            if ($status === 'Cần gia hạn') {
                $query->whereIn('TrangThai', ['Hoạt động', 'Hết chỗ'])
                      ->whereNotNull('NgayKhoiHanh')
                      ->where(function ($q) {
                          $q->whereNull('LoaiTour')
                            ->orWhere('LoaiTour', '!=', 'Doanh nghiệp');
                      })
                      ->where(function (Builder $q) {
                          $q->whereNotNull('NgayKetThuc')
                            ->whereDate('NgayKetThuc', '<', \Carbon\Carbon::today())
                            ->orWhere(function (Builder $q2) {
                                $q2->whereNull('NgayKetThuc')
                                   ->whereDate('NgayKhoiHanh', '<', \Carbon\Carbon::today());
                            });
                      });
            } elseif ($status === 'Hết chỗ') {
                $query->where('TrangThai', 'Hết chỗ')
                      ->where(function ($q) {
                          $q->whereNull('LoaiTour')
                            ->orWhere('LoaiTour', '!=', 'Doanh nghiệp');
                      });
            } elseif ($status === 'Hoạt động') {
                $query->where(function ($q) {
                    $q->where('TrangThai', 'Hoạt động')
                      ->orWhere(function ($q2) {
                          $q2->where('TrangThai', 'Hết chỗ')->where('LoaiTour', 'Doanh nghiệp');
                      });
                });
            } else {
                $query->where('TrangThai', $status);
            }
        }

        if (! empty($filters['mien'])) {
            $query->where('Mien', $filters['mien']);
        }

        if (! empty($filters['tiendo'])) {
            $query->whereRaw('(' . $this->tienDoSql() . ') = ?', [$filters['tiendo']]);
        }

        if (! empty($filters['parent_id'])) {
            $query->where('IDTourGoc', $filters['parent_id']);
        } elseif (! empty($filters['tinhchat'])) {
            if ($filters['tinhchat'] === 'Khuôn đúc') {
                $query->where('TinhChatTour', 'Định kỳ');
            } elseif ($filters['tinhchat'] === 'Bản sao') {
                $query->whereNotNull('IDTourGoc');
            } elseif ($filters['tinhchat'] === 'Độc lập') {
                $query->whereNull('IDTourGoc')->where(function($q) {
                    $q->where('TinhChatTour', '!=', 'Định kỳ')
                      ->orWhereNull('TinhChatTour');
                });
            }
        } else {
            $query->whereNull('IDTourGoc');
        }

        //Phân trang
        $paginator = $query->orderByDesc('MaTour')
            ->paginate($this->normalizePerPage((int) ($filters['per_page'] ?? 10)));

        return [
            'items' => StaffTourResource::collection($paginator->getCollection())->resolve(),
            'pagination' => $this->paginationPayload($paginator),
        ];
    }

    public function selection(): array
    {
        return Tour::select(['MaTour', 'TenTour', 'DiaDiem', 'LoaiTour', 'TrangThai'])
            ->orderByDesc('MaTour')
            ->get()
            ->toArray();
    }

    public function metadata(): array
    {
        $loaiList = Tour::whereNotNull('LoaiTour')
            ->where('LoaiTour', '!=', '')
            ->distinct()
            ->orderBy('LoaiTour')
            ->pluck('LoaiTour')
            ->toArray();

        return [
            'loaiList' => $loaiList,
            'ttList' => [self::STATUS_ACTIVE, 'Hết chỗ', self::STATUS_INACTIVE],
            'tienDoList' => ['Sắp khởi hành', 'Đang diễn ra', 'Đã hoàn tất'],
        ];
    }

    public function statsForStaff(): array
    {
        $departureTrend = [];
        for ($i = 0; $i <= 6; $i++) {
            $date = now()->addDays($i)->toDateString();
            $label = now()->addDays($i)->format('d/m');
            $count = Tour::whereDate('NgayKhoiHanh', $date)->count();
            $departureTrend[] = [
                'date' => $label,
                'tours' => $count,
            ];
        }

        $statusRatioRaw = Tour::select('TrangThai', DB::raw('count(*) as count'))
            ->groupBy('TrangThai')
            ->get();

        $statusRatio = [];
        foreach ($statusRatioRaw as $item) {
            $statusRatio[] = [
                'name' => $item->TrangThai,
                'value' => $item->count,
            ];
        }

        $tienDoSql = $this->tienDoSql();
        $tienDoRatioRaw = Tour::select(DB::raw("($tienDoSql) as TienDo"), DB::raw('count(*) as count'))
            ->groupBy(DB::raw("($tienDoSql)"))
            ->get();

        $tienDoRatio = [];
        foreach ($tienDoRatioRaw as $item) {
            if ($item->TienDo) {
                $tienDoRatio[] = [
                    'name' => $item->TienDo,
                    'value' => $item->count,
                ];
            }
        }

        return [
            'departure_trend' => $departureTrend,
            'status_ratio'    => $statusRatio,
            'tien_do_ratio'   => $tienDoRatio,
        ];
    }

    private function syncTourStatuses(): void
    {
        // Auto-disable tours that have ended
        Tour::whereNotNull('NgayKetThuc')
            ->where('NgayKetThuc', '<', now()->startOfDay())
            ->where('TrangThai', self::STATUS_ACTIVE)
            ->update(['TrangThai' => self::STATUS_INACTIVE]);
    }

    public function detail(int $id): array
    {
        return $this->resource($this->findTour($id)->load([
            'anhChinh',
            'lichTrinhs' => fn ($query) => $query->orderBy('NgayThu')->orderBy('MaLT'),
        ]));
    }
    //Tạo tour mới, upload ảnh chính và lưu lịch trình
    public function create(array $payload, UploadedFile $image): array
    {
        //DB transaction để đảm bảo tính toàn vẹn dữ liệu
        $result = DB::transaction(function () use ($payload, $image) {
            $ngayKetThuc = $payload['NgayKetThuc'] ?? null;
            if (!$ngayKetThuc && isset($payload['NgayKhoiHanh']) && isset($payload['ThoiLuong'])) {
                $ngayKetThuc = $this->calculateEndDate($payload['NgayKhoiHanh'], $payload['ThoiLuong']);
            }

            $tour = Tour::create([
                'TenTour' => $payload['TenTour'],
                'DiaDiem' => $payload['DiaDiem'],
                'GiaGoc' => $payload['GiaGoc'],
                'GiaGiam' => $payload['GiaGiam'],
                'ThoiLuong' => $payload['ThoiLuong'],
                'NgayKhoiHanh' => $payload['NgayKhoiHanh'] ?? null,
                'NgayKetThuc' => $ngayKetThuc,
                'SoCho' => (int) $payload['SoCho'],
                'SoChoDaDat' => 0,
                'Mien' => $payload['Mien'],
                'LoaiTour' => $payload['LoaiTour'],
                'PhanTramGiam' => $payload['PhanTramGiam'],
                'TrangThai' => $payload['TrangThai'],
                'TinhChatTour' => $payload['TinhChatTour'] ?? 'Theo đợt',
                'LichTrinhTuan' => isset($payload['LichTrinhTuan']) && is_array($payload['LichTrinhTuan']) ? implode(',', $payload['LichTrinhTuan']) : null,
            ]);

            $path = $this->uploadService->storeTourImage($image, $tour->MaTour);

            HinhAnhTour::create([
                'DuongDan' => $path,
                'LaAnhChinh' => 1,
                'LoaiAnh' => empty($payload['LoaiAnh']) ? null : $payload['LoaiAnh'],
                'MaTour' => $tour->MaTour,
            ]);

            $this->replaceSchedules($tour->MaTour, $payload['lich_trinh']);

            return $this->detail($tour->MaTour);
        });

        if (($payload['TinhChatTour'] ?? 'Theo đợt') === 'Định kỳ') {
            \Illuminate\Support\Facades\Artisan::call('tour:generate-clones');
        }

        return $result;
    }

    public function cloneTour(int $id, array $payload): array
    {
        return DB::transaction(function () use ($id, $payload) {
            $oldTour = $this->findTour($id);

            $newTour = Tour::create([
                'TenTour' => $oldTour->TenTour,
                'DiaDiem' => $oldTour->DiaDiem,
                'GiaGoc' => $oldTour->GiaGoc,
                'GiaGiam' => $oldTour->GiaGiam,
                'ThoiLuong' => $oldTour->ThoiLuong,
                'NgayKhoiHanh' => $payload['NgayKhoiHanh'],
                'NgayKetThuc' => $payload['NgayKetThuc'] ?? null,
                'SoCho' => $oldTour->SoCho,
                'SoChoDaDat' => 0,
                'Mien' => $oldTour->Mien,
                'LoaiTour' => $oldTour->LoaiTour,
                'PhanTramGiam' => $oldTour->PhanTramGiam,
                'TrangThai' => 'Hoạt động',
                'TinhChatTour' => 'Theo đợt',
                'IDTourGoc' => $oldTour->MaTour,
            ]);

            // Copy images
            $oldImages = HinhAnhTour::where('MaTour', $oldTour->MaTour)->get();
            foreach ($oldImages as $img) {
                $newPath = $this->uploadService->copyTourImage($img->DuongDan, $newTour->MaTour);
                if ($newPath) {
                    HinhAnhTour::create([
                        'DuongDan' => $newPath,
                        'LaAnhChinh' => $img->LaAnhChinh,
                        'LoaiAnh' => $img->LoaiAnh,
                        'MaTour' => $newTour->MaTour,
                    ]);
                }
            }

            // Copy schedules
            $oldSchedules = LichTrinhTour::where('MaTour', $oldTour->MaTour)->orderBy('NgayThu')->get();
            foreach ($oldSchedules as $schedule) {
                LichTrinhTour::create([
                    'NgayThu' => $schedule->NgayThu,
                    'TieuDe' => $schedule->TieuDe,
                    'NoiDung' => $schedule->NoiDung,
                    'MaTour' => $newTour->MaTour,
                ]);
            }

            return $this->detail($newTour->MaTour);
        });
    }

    public function update(int $id, array $payload, ?UploadedFile $image = null): array
    {
        $result = DB::transaction(function () use ($id, $payload, $image) {
            $tour = $this->findTour($id);

            if ((int) $payload['SoCho'] < (int) $tour->SoChoDaDat) {
                $this->throwValidation('SoCho', 'Số chỗ mới không được nhỏ hơn số chỗ đã đặt.');
            }

            $ngayKetThuc = $payload['NgayKetThuc'] ?? null;
            if (!$ngayKetThuc && isset($payload['NgayKhoiHanh']) && isset($payload['ThoiLuong'])) {
                $ngayKetThuc = $this->calculateEndDate($payload['NgayKhoiHanh'], $payload['ThoiLuong']);
            }

            $tour->update([
                'TenTour' => $payload['TenTour'],
                'DiaDiem' => $payload['DiaDiem'],
                'GiaGoc' => $payload['GiaGoc'],
                'GiaGiam' => $payload['GiaGiam'],
                'ThoiLuong' => $payload['ThoiLuong'],
                'NgayKhoiHanh' => $payload['NgayKhoiHanh'] ?? null,
                'NgayKetThuc' => $ngayKetThuc,
                'SoCho' => (int) $payload['SoCho'],
                'Mien' => $payload['Mien'],
                'LoaiTour' => $payload['LoaiTour'],
                'PhanTramGiam' => $payload['PhanTramGiam'],
                'TrangThai' => $payload['TrangThai'],
                'TinhChatTour' => $payload['TinhChatTour'] ?? 'Theo đợt',
                'LichTrinhTuan' => isset($payload['LichTrinhTuan']) && is_array($payload['LichTrinhTuan']) ? implode(',', $payload['LichTrinhTuan']) : null,
            ]);

            $mainImage = HinhAnhTour::where('MaTour', $tour->MaTour)
                ->where('LaAnhChinh', 1)
                ->first();

            if ($image) {
                $path = $this->uploadService->storeTourImage($image, $tour->MaTour);

                if ($mainImage) {
                    $mainImage->update([
                        'DuongDan' => $path,
                        'LoaiAnh' => empty($payload['LoaiAnh']) ? null : $payload['LoaiAnh'],
                    ]);
                } else {
                    HinhAnhTour::create([
                        'DuongDan' => $path,
                        'LaAnhChinh' => 1,
                        'LoaiAnh' => empty($payload['LoaiAnh']) ? null : $payload['LoaiAnh'],
                        'MaTour' => $tour->MaTour,
                    ]);
                }
            } elseif ($mainImage) {
                $mainImage->update([
                    'LoaiAnh' => empty($payload['LoaiAnh']) ? null : $payload['LoaiAnh'],
                ]);
            }

            $this->replaceSchedules($tour->MaTour, $payload['lich_trinh']);

            return $this->detail($tour->MaTour);
        });

        if (($payload['TinhChatTour'] ?? 'Theo đợt') === 'Định kỳ') {
            \Illuminate\Support\Facades\Artisan::call('tour:generate-clones');
        }

        return $result;
    }

    public function toggle(int $id): array
    {
        $tour = $this->findTour($id);
        
        $isExpired = false;
        if ($tour->NgayKetThuc && \Carbon\Carbon::parse($tour->NgayKetThuc)->startOfDay()->isPast()) {
            $isExpired = true;
        } elseif (!$tour->NgayKetThuc && $tour->NgayKhoiHanh && \Carbon\Carbon::parse($tour->NgayKhoiHanh)->startOfDay()->isPast()) {
            $isExpired = true;
        }

        if ($tour->TrangThai === self::STATUS_INACTIVE && $isExpired) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'TrangThai' => 'Không thể kích hoạt lại tour đã kết thúc.'
            ]);
        }

        $newStatus = $tour->TrangThai === self::STATUS_INACTIVE
            ? self::STATUS_ACTIVE
            : self::STATUS_INACTIVE;

        $tour->update(['TrangThai' => $newStatus]);

        return [
            'MaTour' => $tour->MaTour,
            'TrangThai' => $newStatus,
        ];
    }

    private function replaceSchedules(int $tourId, array $schedules): void
    {
        LichTrinhTour::where('MaTour', $tourId)->delete();

        foreach ($schedules as $schedule) {
            LichTrinhTour::create([
                'NgayThu' => (int) $schedule['NgayThu'],
                'TieuDe' => $schedule['TieuDe'],
                'NoiDung' => $schedule['NoiDung'],
                'MaTour' => $tourId,
            ]);
        }
    }

    private function findTour(int $id): Tour
    {
        $tour = Tour::where('MaTour', $id)->first();

        if (! $tour) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Không tìm thấy dữ liệu',
                'errors' => [
                    'id' => ['Tour không tồn tại.'],
                ],
            ], 404));
        }

        return $tour;
    }

    private function resource(Tour $tour): array
    {
        return (new StaffTourResource($tour))->resolve();
    }

    private function calculateEndDate(?string $ngayKhoiHanh, ?string $thoiLuong): ?string
    {
        if (!$ngayKhoiHanh || !$thoiLuong) {
            return null;
        }

        preg_match('/\d+/', $thoiLuong, $matches);
        if (!empty($matches[0])) {
            $days = (int) $matches[0];
            if ($days > 0) {
                return \Carbon\Carbon::parse($ngayKhoiHanh)->addDays($days - 1)->format('Y-m-d');
            }
        }
        
        return null;
    }

    private function normalizePerPage(int $perPage): int
    {
        return $perPage > 0 ? min($perPage, 100) : 10;
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
