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

    public function list(array $filters): array
    {
        $query = Tour::query()->with('anhChinh');

        $keyword = trim((string) ($filters['q'] ?? ''));
        if ($keyword !== '') {
            if (str_starts_with($keyword, '#') && ctype_digit(trim(substr($keyword, 1)))) {
                $query->where('MaTour', (int) trim(substr($keyword, 1)));
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

        if (! empty($filters['loai'])) {
            $query->where('LoaiTour', $filters['loai']);
        }

        $status = $filters['tt'] ?? $filters['status'] ?? null;
        if (! empty($status)) {
            $query->where('TrangThai', $status);
        }

        if (! empty($filters['mien'])) {
            $query->where('Mien', $filters['mien']);
        }

        $paginator = $query->orderByDesc('MaTour')
            ->paginate($this->normalizePerPage((int) ($filters['per_page'] ?? 10)));

        return [
            'items' => StaffTourResource::collection($paginator->getCollection())->resolve(),
            'pagination' => $this->paginationPayload($paginator),
        ];
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
        ];
    }

    public function detail(int $id): array
    {
        return $this->resource($this->findTour($id)->load([
            'anhChinh',
            'lichTrinhs' => fn ($query) => $query->orderBy('NgayThu')->orderBy('MaLT'),
        ]));
    }

    public function create(array $payload, UploadedFile $image): array
    {
        return DB::transaction(function () use ($payload, $image) {
            $tour = Tour::create([
                'TenTour' => $payload['TenTour'],
                'DiaDiem' => $payload['DiaDiem'],
                'GiaGoc' => $payload['GiaGoc'],
                'GiaGiam' => $payload['GiaGiam'],
                'ThoiLuong' => $payload['ThoiLuong'],
                'NgayKhoiHanh' => $payload['NgayKhoiHanh'],
                'NgayKetThuc' => $payload['NgayKetThuc'],
                'SoCho' => (int) $payload['SoCho'],
                'SoChoDaDat' => 0,
                'Mien' => $payload['Mien'],
                'LoaiTour' => $payload['LoaiTour'],
                'PhanTramGiam' => $payload['PhanTramGiam'],
                'TrangThai' => $payload['TrangThai'],
            ]);

            $path = $this->uploadService->storeTourImage($image, $tour->MaTour);

            HinhAnhTour::create([
                'DuongDan' => $path,
                'LaAnhChinh' => 1,
                'LoaiAnh' => $payload['LoaiAnh'] ?? '',
                'MaTour' => $tour->MaTour,
            ]);

            $this->replaceSchedules($tour->MaTour, $payload['lich_trinh']);

            return $this->detail($tour->MaTour);
        });
    }

    public function update(int $id, array $payload, ?UploadedFile $image = null): array
    {
        return DB::transaction(function () use ($id, $payload, $image) {
            $tour = $this->findTour($id);

            if ((int) $payload['SoCho'] < (int) $tour->SoChoDaDat) {
                $this->throwValidation('SoCho', 'Số chỗ mới không được nhỏ hơn số chỗ đã đặt.');
            }

            $tour->update([
                'TenTour' => $payload['TenTour'],
                'DiaDiem' => $payload['DiaDiem'],
                'GiaGoc' => $payload['GiaGoc'],
                'GiaGiam' => $payload['GiaGiam'],
                'ThoiLuong' => $payload['ThoiLuong'],
                'NgayKhoiHanh' => $payload['NgayKhoiHanh'],
                'NgayKetThuc' => $payload['NgayKetThuc'],
                'SoCho' => (int) $payload['SoCho'],
                'Mien' => $payload['Mien'],
                'LoaiTour' => $payload['LoaiTour'],
                'PhanTramGiam' => $payload['PhanTramGiam'],
                'TrangThai' => $payload['TrangThai'],
            ]);

            $mainImage = HinhAnhTour::where('MaTour', $tour->MaTour)
                ->where('LaAnhChinh', 1)
                ->first();

            if ($image) {
                $path = $this->uploadService->storeTourImage($image, $tour->MaTour);

                if ($mainImage) {
                    $mainImage->update([
                        'DuongDan' => $path,
                        'LoaiAnh' => $payload['LoaiAnh'] ?? '',
                    ]);
                } else {
                    HinhAnhTour::create([
                        'DuongDan' => $path,
                        'LaAnhChinh' => 1,
                        'LoaiAnh' => $payload['LoaiAnh'] ?? '',
                        'MaTour' => $tour->MaTour,
                    ]);
                }
            } elseif ($mainImage) {
                $mainImage->update([
                    'LoaiAnh' => $payload['LoaiAnh'] ?? '',
                ]);
            }

            $this->replaceSchedules($tour->MaTour, $payload['lich_trinh']);

            return $this->detail($tour->MaTour);
        });
    }

    public function toggle(int $id): array
    {
        $tour = $this->findTour($id);
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
