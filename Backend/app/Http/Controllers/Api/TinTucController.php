<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BinhLuan;
use App\Models\TinTuc;
use Illuminate\Http\Request;

class TinTucController extends Controller
{
    public function index(Request $request)
    {
        $query = TinTuc::query();

        if ($request->filled('loai_tin')) {
            $query->where('LoaiTin', $request->query('loai_tin'));
        }

        if ($request->filled('trang_thai')) {
            $query->where('TrangThai', $request->query('trang_thai'));
        }

        if ($request->filled('keyword')) {
            $keyword = $request->query('keyword');
            $query->where(function ($q) use ($keyword) {
                $q->where('TieuDe', 'like', "%{$keyword}%")
                    ->orWhere('MoTa', 'like', "%{$keyword}%")
                    ->orWhere('NoiDung', 'like', "%{$keyword}%");
            });
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderByDesc('MaTin')->paginate(15),
        ]);
    }

    public function show($id)
    {
        $tinTuc = TinTuc::find($id);

        if (! $tinTuc) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy dữ liệu',
            ], 404);
        }

        // Tự động tăng lượt xem khi xem chi tiết
        $tinTuc->increment('LuotXem');

        return response()->json([
            'success' => true,
            'data' => $tinTuc,
        ]);
    }

    public function getComments($id)
    {
        $tinTuc = TinTuc::find($id);
        if (! $tinTuc) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy tin tức',
            ], 404);
        }

        $comments = BinhLuan::with('khachHang.taiKhoan')
            ->where('MaTin', $id)
            ->where('TrangThai', 'Hiển thị')
            ->orderByDesc('NgayBinhLuan')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $comments,
        ]);
    }

    public function postComment(Request $request, $id)
    {
        $request->validate([
            'NoiDung' => 'required|string|max:1000',
        ]);

        $tinTuc = TinTuc::find($id);
        if (! $tinTuc) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy tin tức',
            ], 404);
        }

        $user = $request->user();
        $khachHang = $user->khachHang;

        if (! $khachHang) {
            return response()->json([
                'success' => false,
                'message' => 'Chỉ khách hàng mới có thể bình luận',
            ], 403);
        }

        $comment = BinhLuan::create([
            'MaTin' => $id,
            'MaKH' => $khachHang->MaKH,
            'NoiDung' => $request->NoiDung,
            'NgayBinhLuan' => now(),
            'TrangThai' => 'Hiển thị',
        ]);

        // Load relations for immediate display
        $comment->load('khachHang.taiKhoan');

        return response()->json([
            'success' => true,
            'message' => 'Đã gửi bình luận thành công',
            'data' => $comment,
        ]);
    }
}
