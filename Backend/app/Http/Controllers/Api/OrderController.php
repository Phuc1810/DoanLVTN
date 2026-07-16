<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OrderService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(private OrderService $orderService)
    {
    }

    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách đơn hàng thành công',
            'data' => $this->orderService->list($request->user(), $request->only([
                'status',
                'TrangThai',
                'st',
                'page',
                'per_page',
            ])),
        ]);
    }

    public function show(Request $request, int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết đơn hàng thành công',
            'data' => $this->orderService->detail($request->user(), $id),
        ]);
    }

    public function cancel(Request $request, int $id)
    {
        $request->validate([
            'ly_do' => ['nullable', 'string', 'max:500'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Yêu cầu huỷ đơn hàng thành công',
            'data' => $this->orderService->cancel($request->user(), $id, $request->input('ly_do', '')),
        ]);
    }
}
