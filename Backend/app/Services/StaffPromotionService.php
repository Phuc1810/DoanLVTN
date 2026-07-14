<?php

namespace App\Services;

use App\Http\Resources\PromotionDetailResource;
use App\Http\Resources\PromotionResource;
use App\Models\ChuongTrinhKhuyenMai;
use App\Models\Tour;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class StaffPromotionService
{
    public function __construct(
        private PromotionService $promotionService,
        private UploadService $uploadService
    ) {
    }

    public function list(array $filters): array
    {
        $this->promotionService->syncPromotionStatuses();

        $query = ChuongTrinhKhuyenMai::query()->withCount('tours');

        $keyword = trim((string) ($filters['q'] ?? ''));
        if ($keyword !== '') {
            $query->where(function ($q) use ($keyword) {
                if (ctype_digit($keyword)) {
                    $q->where('MaCTKM', (int) $keyword);
                }

                $q->orWhere('TenKM', 'like', '%'.$keyword.'%');
            });
        }

        $status = $filters['tt'] ?? $filters['status'] ?? null;
        if (! empty($status)) {
            $query->where('TrangThai', $status);
        }

        $paginator = $query->orderByRaw("FIELD(TrangThai, 'Hoạt động', 'Sắp diễn ra', 'Hết hạn', 'Ngừng hoạt động')")
            ->orderByDesc('NgayBatDau')
            ->paginate($this->normalizePerPage((int) ($filters['per_page'] ?? 10)));

        return [
            'items' => PromotionResource::collection($paginator->getCollection())->resolve(),
            'pagination' => $this->paginationPayload($paginator),
        ];
    }

    public function stats(): array
    {
        $this->promotionService->syncPromotionStatuses();

        $total = ChuongTrinhKhuyenMai::count();
        $active = ChuongTrinhKhuyenMai::where('TrangThai', 'Hoạt động')->count();
        $upcoming = ChuongTrinhKhuyenMai::where('TrangThai', 'Sắp diễn ra')->count();

        $today = now()->toDateString();
        $nextWeek = now()->addDays(7)->toDateString();
        
        $ending_soon = ChuongTrinhKhuyenMai::where('TrangThai', 'Hoạt động')
            ->whereBetween('NgayKetThuc', [$today, $nextWeek])
            ->count();

        return [
            'total' => $total,
            'active' => $active,
            'upcoming' => $upcoming,
            'ending_soon' => $ending_soon,
        ];
    }

    public function chartData(int $year): array
    {
        $data = ChuongTrinhKhuyenMai::select(
            DB::raw('MONTH(NgayBatDau) as month'),
            DB::raw('COUNT(*) as count')
        )
            ->whereYear('NgayBatDau', $year)
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('count', 'month')
            ->toArray();
            
        $result = [];
        for ($i = 1; $i <= 12; $i++) {
            $result[] = [
                'month' => 'T' . $i,
                'count' => $data[$i] ?? 0
            ];
        }
        
        return $result;
    }

    public function detail(int $id): array
    {
        $this->promotionService->syncPromotionStatuses();

        return $this->resource($this->findPromotion($id)->load([
            'tours' => fn ($query) => $query->with('anhChinh')->orderByDesc('tour.MaTour'),
        ]));
    }

    public function create(array $payload, ?UploadedFile $image = null): array
    {
        return DB::transaction(function () use ($payload, $image) {
            $promotion = ChuongTrinhKhuyenMai::create([
                'TenKM' => $payload['TenKM'],
                'NoiDung' => $payload['NoiDung'] ?? '',
                'AnhDaiDien' => '',
                'PhanTramGiam' => $payload['PhanTramGiam'],
                'NgayBatDau' => $payload['NgayBatDau'],
                'NgayKetThuc' => $payload['NgayKetThuc'],
                'TrangThai' => $this->promotionService->statusForDates($payload['NgayBatDau'], $payload['NgayKetThuc']),
            ]);

            if ($image) {
                $promotion->update([
                    'AnhDaiDien' => $this->uploadService->storePromotionImage($image, $promotion->MaCTKM),
                ]);
            }

            $this->replaceTours($promotion->MaCTKM, $payload['tours'] ?? [], (float) $payload['PhanTramGiam']);

            return $this->detail($promotion->MaCTKM);
        });
    }

    public function update(int $id, array $payload, ?UploadedFile $image = null): array
    {
        return DB::transaction(function () use ($id, $payload, $image) {
            $promotion = $this->findPromotion($id);
            $updates = [
                'TenKM' => $payload['TenKM'],
                'NoiDung' => $payload['NoiDung'] ?? '',
                'PhanTramGiam' => $payload['PhanTramGiam'],
                'NgayBatDau' => $payload['NgayBatDau'],
                'NgayKetThuc' => $payload['NgayKetThuc'],
                'TrangThai' => $this->promotionService->statusForDates($payload['NgayBatDau'], $payload['NgayKetThuc']),
            ];

            if ($image) {
                $updates['AnhDaiDien'] = $this->uploadService->storePromotionImage($image, $promotion->MaCTKM);
            }

            $promotion->update($updates);
            $this->replaceTours($promotion->MaCTKM, $payload['tours'] ?? [], (float) $payload['PhanTramGiam']);

            return $this->detail($promotion->MaCTKM);
        });
    }

    public function toggle(int $id): array
    {
        $promotion = $this->findPromotion($id);

        if (in_array($promotion->TrangThai, ['Hoạt động', 'Sắp diễn ra'])) {
            $newStatus = 'Ngừng hoạt động';
        } elseif ((string) $promotion->NgayKetThuc < now()->toDateString()) {
            $this->throwValidation('NgayKetThuc', 'Khuyến mãi đã hết hạn, cần cập nhật ngày kết thúc trước khi bật lại.');
        } else {
            $newStatus = $this->promotionService->statusForDates($promotion->NgayBatDau, $promotion->NgayKetThuc);
        }

        $promotion->update(['TrangThai' => $newStatus]);

        return [
            'MaCTKM' => $promotion->MaCTKM,
            'TrangThai' => $newStatus,
        ];
    }

    public function attachTours(int $id, array $tours): array
    {
        return DB::transaction(function () use ($id, $tours) {
            $promotion = $this->findPromotion($id);

            foreach ($tours as $row) {
                Tour::where('MaTour', $row['MaTour'])->first() ?: $this->throwNotFound('MaTour', 'Tour không tồn tại.');

                DB::table('tour_khuyenmai')->updateOrInsert(
                    [
                        'MaTour' => (int) $row['MaTour'],
                        'MaCTKM' => $promotion->MaCTKM,
                    ],
                    [
                        'PhanTramGiamKM' => (float) $row['PhanTramGiamKM'],
                    ]
                );
            }

            return $this->detail($promotion->MaCTKM);
        });
    }

    public function detachTour(int $id, int $tourId): array
    {
        return DB::transaction(function () use ($id, $tourId) {
            $promotion = $this->findPromotion($id);

            $deleted = DB::table('tour_khuyenmai')
                ->where('MaCTKM', $promotion->MaCTKM)
                ->where('MaTour', $tourId)
                ->delete();

            if ($deleted === 0) {
                $this->throwNotFound('MaTour', 'Tour chưa được gán vào chương trình này.');
            }

            return $this->detail($promotion->MaCTKM);
        });
    }

    private function replaceTours(int $promotionId, array $tours, float $defaultPercent): void
    {
        DB::table('tour_khuyenmai')->where('MaCTKM', $promotionId)->delete();

        $rows = [];

        foreach ($tours as $row) {
            $tourId = (int) $row['MaTour'];
            if ($tourId <= 0) {
                continue;
            }

            $rows[] = [
                'MaTour' => $tourId,
                'MaCTKM' => $promotionId,
                'PhanTramGiamKM' => $row['PhanTramGiamKM'] ?? $defaultPercent,
            ];
        }

        if ($rows !== []) {
            DB::table('tour_khuyenmai')->insert($rows);
        }
    }

    private function findPromotion(int $id): ChuongTrinhKhuyenMai
    {
        $promotion = ChuongTrinhKhuyenMai::where('MaCTKM', $id)->first();

        if (! $promotion) {
            $this->throwNotFound('id', 'Khuyến mãi không tồn tại.');
        }

        return $promotion;
    }

    private function resource(ChuongTrinhKhuyenMai $promotion): array
    {
        return (new PromotionDetailResource($promotion))->resolve();
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
            'errors' => [$key => [$message]],
        ], 404));
    }

    private function throwValidation(string $key, string $message): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Dữ liệu không hợp lệ',
            'errors' => [$key => [$message]],
        ], 422));
    }
}
