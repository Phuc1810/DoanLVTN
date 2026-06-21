<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Http\Requests\BusinessRequest\UpdateBusinessRequest;
use App\Services\BusinessRequestService;
use Illuminate\Http\Request;

class BusinessRequestManagementController extends Controller
{
    public function __construct(private BusinessRequestService $businessRequestService)
    {
    }

    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách yêu cầu doanh nghiệp thành công',
            'data' => $this->businessRequestService->listForStaff($request->only([
                'q',
                'status',
                'TrangThai',
                'page',
                'per_page',
            ])),
        ]);
    }

    public function show(int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết yêu cầu doanh nghiệp thành công',
            'data' => $this->businessRequestService->detailForStaff($id),
        ]);
    }

    public function update(UpdateBusinessRequest $request, int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Cập nhật yêu cầu doanh nghiệp thành công',
            'data' => $this->businessRequestService->updateForStaff($request->user(), $id, $request->validated()),
        ]);
    }
}
