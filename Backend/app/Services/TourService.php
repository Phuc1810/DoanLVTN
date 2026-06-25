<?php

namespace App\Services;

use App\Http\Resources\TourDetailResource;
use App\Http\Resources\TourResource;
use App\Models\LichTrinhTour;
use App\Models\Tour;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TourService
{
    private const ACTIVE_STATUS = 'Hoạt động';

    public function __construct(private PromotionService $promotionService)
    {
    }

    public function listActive(array $filters): array
    {
        $query = $this->baseActiveQuery();
        $this->applyCommonFilters($query, $filters);

        return $this->paginatedResponse(
            $query->orderBy('NgayKhoiHanh')->orderBy('GiaGiam'),
            (int) ($filters['per_page'] ?? 12)
        );
    }

    public function locations(): array
    {
        return Tour::query()
            ->whereNotNull('DiaDiem')
            ->where('DiaDiem', '<>', '')
            ->distinct()
            ->orderBy('DiaDiem')
            ->pluck('DiaDiem')
            ->values()
            ->all();
    }

    public function featured(array $filters = []): array
    {
        $limit = (int) ($filters['per_page'] ?? 8);
        if ($limit <= 0) {
            $limit = 8;
        }

        $limit = min($limit, 50);

        $items = DB::table('tour as t')
            ->join('hinhanhtour as h', 't.MaTour', '=', 'h.MaTour')
            ->where('h.LoaiAnh', 'noibat')
            ->orderByDesc('t.MaTour')
            ->limit($limit)
            ->get([
                't.MaTour',
                't.TenTour',
                't.GiaGiam',
                'h.DuongDan as AnhChinh',
            ])
            ->map(function ($item) {
                $path = $item->AnhChinh;

                return [
                    'MaTour' => $item->MaTour,
                    'TenTour' => $item->TenTour,
                    'GiaGiam' => $item->GiaGiam,
                    'AnhChinh' => $path,
                    'image_url' => app(\App\Services\UploadService::class)->publicUrl($path),
                ];
            })
            ->values()
            ->all();

        return [
            'items' => $items,
            'pagination' => [
                'current_page' => 1,
                'per_page' => $limit,
                'total' => count($items),
                'last_page' => 1,
            ],
        ];
    }

    public function detail(int $id): TourDetailResource
    {
        $tour = $this->baseActiveQuery()
            ->with([
                'hinhAnhs' => fn ($query) => $query->orderByDesc('LaAnhChinh')->orderBy('MaAnh'),
                'lichTrinhs' => fn ($query) => $query->orderBy('NgayThu'),
                'danhGias' => fn ($query) => $query->with('khachHang')->orderByDesc('NgayDG')->orderByDesc('MaDG'),
            ])
            ->withAvg('danhGias', 'SoSao')
            ->withCount('danhGias')
            ->where('MaTour', $id)
            ->first();

        if (! $tour) {
            $this->throwNotFound();
        }

        $this->promotionService->activePromotionsForTour($tour);

        return new TourDetailResource($tour);
    }

    public function search(array $filters): array
    {
        $query = $this->baseActiveQuery();
        $this->applyCommonFilters($query, $filters);

        return $this->paginatedResponse(
            $query->orderBy('NgayKhoiHanh'),
            (int) ($filters['per_page'] ?? 12)
        );
    }

    public function byRegion(string $region, array $filters): array
    {
        $mien = $this->normalizeRegion($region);
        $query = $this->baseActiveQuery()->where('Mien', $mien);

        return $this->paginatedResponse(
            $query->orderBy('NgayKhoiHanh')->orderBy('GiaGiam'),
            (int) ($filters['per_page'] ?? 12)
        );
    }

    public function promotions(array $filters): array
    {
        $today = now()->toDateString();
        $query = $this->promotionService->withActivePromotions($this->baseActiveQuery())
            ->select('tour.*')
            ->selectSub(function ($subQuery) use ($today) {
                $subQuery->from('tour_khuyenmai')
                    ->join('chuongtrinhkhuyenmai', 'chuongtrinhkhuyenmai.MaCTKM', '=', 'tour_khuyenmai.MaCTKM')
                    ->whereColumn('tour_khuyenmai.MaTour', 'tour.MaTour')
                    ->where('chuongtrinhkhuyenmai.TrangThai', 'Hoạt động')
                    ->whereDate('chuongtrinhkhuyenmai.NgayBatDau', '<=', $today)
                    ->whereDate('chuongtrinhkhuyenmai.NgayKetThuc', '>=', $today)
                    ->selectRaw('MAX(COALESCE(tour_khuyenmai.PhanTramGiamKM, chuongtrinhkhuyenmai.PhanTramGiam, 0))');
            }, 'promotion_discount_percent');

        return $this->paginatedResponse(
            $query->orderByDesc(DB::raw('COALESCE(promotion_discount_percent, 0)'))
                ->orderBy('NgayKhoiHanh')
                ->orderBy('GiaGiam'),
            (int) ($filters['per_page'] ?? 12)
        );
    }

    public function schedules(int $tourId): array
    {
        $this->ensureActiveTourExists($tourId);

        return LichTrinhTour::where('MaTour', $tourId)
            ->orderBy('NgayThu')
            ->get(['NgayThu', 'TieuDe', 'NoiDung'])
            ->all();
    }

    public function normalizeRegion(string $region): string
    {
        $region = mb_strtolower(trim($region), 'UTF-8');
        $map = [
            'bac' => 'Bắc',
            'bắc' => 'Bắc',
            'trung' => 'Trung',
            'nam' => 'Nam',
        ];

        if (! isset($map[$region])) {
            throw ValidationException::withMessages([
                'mien' => ['Miền chỉ nhận Bắc, Trung, Nam hoặc bac, trung, nam.'],
            ]);
        }

        return $map[$region];
    }

    public function validateSearchFilters(array $filters): void
    {
        if (! empty($filters['ngay_khoi_hanh']) && ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $filters['ngay_khoi_hanh'])) {
            throw ValidationException::withMessages([
                'ngay_khoi_hanh' => ['Ngày khởi hành phải đúng định dạng YYYY-MM-DD.'],
            ]);
        }

        if (! empty($filters['gia']) && ! in_array((string) $filters['gia'], ['1', '2', '3', '4'], true)) {
            throw ValidationException::withMessages([
                'gia' => ['Khoảng giá không hợp lệ.'],
            ]);
        }

        if (! empty($filters['mien'])) {
            $this->normalizeRegion((string) $filters['mien']);
        }
    }

    private function baseActiveQuery(): Builder
    {
        return Tour::query()
            ->with('anhChinh')
            ->where('TrangThai', self::ACTIVE_STATUS);
    }

    private function applyCommonFilters(Builder $query, array $filters): void
    {
        $keyword = trim((string) ($filters['keyword'] ?? $filters['q'] ?? ''));
        if ($keyword !== '') {
            $query->where(function (Builder $q) use ($keyword) {
                $this->whereLikeAccentInsensitive($q, 'TenTour', $keyword, 'or');
                $this->whereLikeAccentInsensitive($q, 'DiaDiem', $keyword, 'or');
            });
        }

        if (! empty($filters['dia_diem'])) {
            $this->whereLikeAccentInsensitive($query, 'DiaDiem', (string) $filters['dia_diem']);
        }

        if (! empty($filters['ngay_khoi_hanh'])) {
            $query->whereDate('NgayKhoiHanh', $filters['ngay_khoi_hanh']);
        }

        if (! empty($filters['thoi_luong'])) {
            $query->where('ThoiLuong', $filters['thoi_luong']);
        }

        if (! empty($filters['loai_tour'])) {
            $query->where('LoaiTour', $filters['loai_tour']);
        }

        if (! empty($filters['mien'])) {
            $query->where('Mien', $this->normalizeRegion((string) $filters['mien']));
        }

        if (! empty($filters['gia'])) {
            $this->applyPriceRange($query, (string) $filters['gia']);
        }
    }

    private function applyPriceRange(Builder $query, string $range): void
    {
        // Map giữ nguyên từ timkiemnangcao.php: 1 <1tr, 2 1-2tr, 3 2-3tr, 4 >=3tr.
        match ($range) {
            '1' => $query->where('GiaGiam', '<', 1000000),
            '2' => $query->where('GiaGiam', '>=', 1000000)->where('GiaGiam', '<', 2000000),
            '3' => $query->where('GiaGiam', '>=', 2000000)->where('GiaGiam', '<', 3000000),
            '4' => $query->where('GiaGiam', '>=', 3000000),
            default => null,
        };
    }

    private function whereLikeAccentInsensitive(Builder $query, string $column, string $value, string $boolean = 'and'): void
    {
        $method = $boolean === 'or' ? 'orWhereRaw' : 'whereRaw';
        $query->{$method}("CONVERT(LOWER({$column}) USING utf8mb4) COLLATE utf8mb4_0900_ai_ci LIKE ?", ['%'.mb_strtolower($value, 'UTF-8').'%']);
    }

    private function paginatedResponse(Builder $query, int $perPage): array
    {
        $paginator = $query->paginate($this->normalizePerPage($perPage));

        return [
            'items' => TourResource::collection($paginator->getCollection())->resolve(),
            'pagination' => $this->paginationPayload($paginator),
        ];
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

    private function normalizePerPage(int $perPage): int
    {
        if ($perPage <= 0) {
            return 12;
        }

        return min($perPage, 50);
    }

    private function ensureActiveTourExists(int $tourId): void
    {
        if (! Tour::where('MaTour', $tourId)->where('TrangThai', self::ACTIVE_STATUS)->exists()) {
            $this->throwNotFound();
        }
    }

    private function throwNotFound(): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Không tìm thấy dữ liệu',
            'errors' => [
                'id' => ['Tour không tồn tại hoặc không còn hoạt động.'],
            ],
        ], 404));
    }
}
