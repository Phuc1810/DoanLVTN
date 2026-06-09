<?php

namespace App\Services;

use App\Http\Resources\NewsDetailResource;
use App\Http\Resources\NewsResource;
use App\Models\TinTuc;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Exceptions\HttpResponseException;

class NewsService
{
    private const STATUS_VISIBLE = 'Hiển thị';

    public function list(array $filters): array
    {
        $query = TinTuc::query()
            ->where('TrangThai', self::STATUS_VISIBLE);

        $type = $this->normalizeType($filters['loai'] ?? $filters['type'] ?? 'tintuc');
        $query->where('LoaiTin', $type);

        $keyword = trim((string) ($filters['q'] ?? ''));
        if ($keyword !== '') {
            $query->where(function (Builder $q) use ($keyword) {
                $q->where('TieuDe', 'like', '%'.$keyword.'%')
                    ->orWhere('MoTa', 'like', '%'.$keyword.'%');
            });
        }

        $paginator = $query->orderByDesc('NgayDang')
            ->orderByDesc('MaTin')
            ->paginate($this->normalizePerPage((int) ($filters['per_page'] ?? 10)));

        return [
            'items' => NewsResource::collection($paginator->getCollection())->resolve(),
            'pagination' => $this->paginationPayload($paginator),
        ];
    }

    public function detail(int $id): array
    {
        $news = TinTuc::query()
            ->with('nhanVien')
            ->where('MaTin', $id)
            ->where('TrangThai', self::STATUS_VISIBLE)
            ->first();

        if (! $news) {
            $this->throwNotFound();
        }

        return (new NewsDetailResource($news))->resolve();
    }

    private function normalizeType(?string $type): string
    {
        $type = strtolower(trim((string) $type));

        return in_array($type, ['tintuc', 'kinhnghiem'], true) ? $type : 'tintuc';
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

    private function throwNotFound(): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Không tìm thấy tin tức',
            'errors' => [
                'id' => ['Tin tức không tồn tại hoặc chưa được hiển thị.'],
            ],
        ], 404));
    }
}
