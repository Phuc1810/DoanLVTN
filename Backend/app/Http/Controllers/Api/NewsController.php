<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NewsService;
use Illuminate\Http\Request;

class NewsController extends Controller
{
    public function __construct(private NewsService $newsService)
    {
    }

    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách tin tức thành công',
            'data' => $this->newsService->list($request->only(['loai', 'type', 'q', 'page', 'per_page'])),
        ]);
    }

    public function show(int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết tin tức thành công',
            'data' => $this->newsService->detail($id),
        ]);
    }
}
