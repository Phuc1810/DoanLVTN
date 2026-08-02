<?php

namespace App\Services;

use App\Models\BinhLuan;

class AdminNewsCommentService
{
    /**
     * Get a paginated list of news comments with optional filters
     */
    public function getComments(array $filters = [], int $perPage = 10)
    {
        $query = BinhLuan::with(['khachHang:MaKH,HoTen', 'tinTuc:MaTin,TieuDe'])
            ->orderBy('NgayBinhLuan', 'desc');

        if (!empty($filters['q'])) {
            $keyword = '%' . $filters['q'] . '%';
            $query->where(function ($q) use ($keyword) {
                $q->where('NoiDung', 'LIKE', $keyword)
                  ->orWhereHas('khachHang', function ($kh) use ($keyword) {
                      $kh->where('HoTen', 'LIKE', $keyword);
                  })
                  ->orWhereHas('tinTuc', function ($t) use ($keyword) {
                      $t->where('TieuDe', 'LIKE', $keyword);
                  });
            });
        }

        if (!empty($filters['trangthai'])) {
            $query->where('TrangThai', $filters['trangthai']);
        }

        return $query->paginate($perPage);
    }

    /**
     * Toggle the visibility status of a comment
     */
    public function toggleStatus(int $id): BinhLuan
    {
        $comment = BinhLuan::findOrFail($id);
        
        if ($comment->TrangThai === 'Đã ẩn') {
            $comment->TrangThai = 'Hiển thị';
        } else {
            $comment->TrangThai = 'Đã ẩn';
        }
        
        $comment->save();

        return $comment;
    }

    /**
     * Reply to a comment
     */
    public function replyToComment(int $id, string $replyContent): BinhLuan
    {
        $comment = BinhLuan::findOrFail($id);
        
        $comment->PhanHoi = $replyContent;
        $comment->save();

        return $comment;
    }
}
