<?php

namespace App\Services;

use App\Http\Resources\NewsDetailResource;
use App\Http\Resources\NewsResource;
use App\Models\BinhLuan;
use App\Models\TaiKhoan;
use App\Models\TinTuc;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class StaffNewsService
{
    private const STATUS_VISIBLE = 'Hiển thị';
    private const STATUS_HIDDEN = 'Ẩn';

    public function __construct(private UploadService $uploadService)
    {
    }

    public function list(array $filters): array
    {
        $query = TinTuc::query()->with('nhanVien');

        $keyword = trim((string) ($filters['q'] ?? ''));
        if ($keyword !== '') {
            $query->where(function (Builder $q) use ($keyword) {
                if (ctype_digit($keyword)) {
                    $q->where('MaTin', (int) $keyword);
                }

                $q->orWhere('TieuDe', 'like', '%'.$keyword.'%')
                    ->orWhere('MoTa', 'like', '%'.$keyword.'%');
            });
        }

        $type = $this->validType($filters['loai'] ?? $filters['type'] ?? null);
        if ($type !== null) {
            $query->where('LoaiTin', $type);
        }

        $status = $this->validStatus($filters['tt'] ?? $filters['status'] ?? null);
        if ($status !== null) {
            $query->where('TrangThai', $status);
        }

        $paginator = $query->orderByDesc('MaTin')
            ->paginate($this->normalizePerPage((int) ($filters['per_page'] ?? 10)));

        return [
            'items' => NewsResource::collection($paginator->getCollection())->resolve(),
            'pagination' => $this->paginationPayload($paginator),
        ];
    }

    public function create(array $payload, UploadedFile $image, TaiKhoan $user): array
    {
        return DB::transaction(function () use ($payload, $image, $user) {
            $news = TinTuc::create([
                'TieuDe' => $payload['TieuDe'],
                'MoTa' => $payload['MoTa'],
                'NoiDung' => $payload['NoiDung'],
                'LoaiTin' => $payload['LoaiTin'],
                'AnhDaiDien' => '',
                'NgayDang' => now()->toDateString(),
                'TrangThai' => $payload['TrangThai'],
                'MaNV' => $this->staffId($user),
            ]);

            $news->update([
                'AnhDaiDien' => $this->uploadService->storeNewsImage($image, $news->MaTin),
            ]);

            return $this->detail($news->MaTin);
        });
    }

    public function update(int $id, array $payload, ?UploadedFile $image, TaiKhoan $user): array
    {
        return DB::transaction(function () use ($id, $payload, $image, $user) {
            $news = $this->findNews($id);
            $updates = [
                'TieuDe' => $payload['TieuDe'],
                'MoTa' => $payload['MoTa'],
                'NoiDung' => $payload['NoiDung'],
                'LoaiTin' => $payload['LoaiTin'],
                'TrangThai' => $payload['TrangThai'],
                'MaNV' => $this->staffId($user),
            ];

            if ($image) {
                $updates['AnhDaiDien'] = $this->uploadService->storeNewsImage($image, $news->MaTin);
            }

            $news->update($updates);

            return $this->detail($news->MaTin);
        });
    }

    public function toggle(int $id): array
    {
        $news = $this->findNews($id);
        $newStatus = $news->TrangThai === self::STATUS_VISIBLE
            ? self::STATUS_HIDDEN
            : self::STATUS_VISIBLE;

        $news->update(['TrangThai' => $newStatus]);

        return [
            'MaTin' => $news->MaTin,
            'TrangThai' => $newStatus,
        ];
    }

    public function detail(int $id): array
    {
        return (new NewsDetailResource($this->findNews($id)->load('nhanVien')))->resolve();
    }

    public function stats(): array
    {
        $totalPosts = TinTuc::count();
        $visiblePosts = TinTuc::where('TrangThai', self::STATUS_VISIBLE)->count();

        // Lượt xem tháng hiện tại
        $startOfMonth = Carbon::now()->startOfMonth()->toDateString();
        $endOfMonth = Carbon::now()->endOfMonth()->toDateString();

        $monthlyViews = (int) TinTuc::whereBetween('NgayDang', [$startOfMonth, $endOfMonth])
            ->sum('LuotXem');

        // Nếu không có bài nào đăng trong tháng, lấy tổng lượt xem toàn bộ
        $totalViews = (int) TinTuc::sum('LuotXem');
        if ($monthlyViews === 0) {
            $monthlyViews = $totalViews;
        }

        // Tổng bình luận
        $totalComments = BinhLuan::count();

        // Tỉ lệ tương tác = (Tổng bình luận / Tổng lượt xem) * 100
        $engagementRate = $totalViews > 0
            ? round(($totalComments / $totalViews) * 100, 1)
            : 0;

        return [
            'totalPosts' => $totalPosts,
            'visiblePosts' => $visiblePosts,
            'monthlyViews' => $monthlyViews,
            'totalViews' => $totalViews,
            'totalComments' => $totalComments,
            'engagementRate' => $engagementRate,
        ];
    }

    private function findNews(int $id): TinTuc
    {
        $news = TinTuc::where('MaTin', $id)->first();

        if (! $news) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Không tìm thấy tin tức',
                'errors' => [
                    'id' => ['Tin tức không tồn tại.'],
                ],
            ], 404));
        }

        return $news;
    }

    private function staffId(TaiKhoan $user): ?int
    {
        return $user->nhanVien?->MaNV;
    }

    private function validType(?string $type): ?string
    {
        $type = strtolower(trim((string) $type));

        return in_array($type, ['tintuc', 'kinhnghiem'], true) ? $type : null;
    }

    private function validStatus(?string $status): ?string
    {
        $status = trim((string) $status);

        return in_array($status, [self::STATUS_VISIBLE, self::STATUS_HIDDEN], true) ? $status : null;
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
