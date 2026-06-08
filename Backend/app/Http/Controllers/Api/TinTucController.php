<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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

        return response()->json([
            'success' => true,
            'data' => $tinTuc,
        ]);
    }
}
