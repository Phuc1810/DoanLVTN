<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Services\StaffOrderService;
use Illuminate\Http\Request;

class OrderManagementController extends Controller
{
    public function __construct(private StaffOrderService $staffOrderService)
    {
    }

    public function stats()
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy thống kê đơn hàng thành công',
            'data' => $this->staffOrderService->stats(),
        ]);
    }

    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách đơn hàng thành công',
            'data' => $this->staffOrderService->list($request->only([
                'q',
                'status',
                'TrangThai',
                'payment_status',
                'date_from',
                'date_to',
                'page',
                'per_page',
            ])),
        ]);
    }

    public function show(int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết đơn hàng thành công',
            'data' => $this->staffOrderService->detail($id),
        ]);
    }
}
