<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BusinessRequest\StoreBusinessRequest;
use App\Services\BusinessRequestService;
use Illuminate\Http\Request;

class BusinessRequestController extends Controller
{
    public function __construct(private BusinessRequestService $businessRequestService)
    {
    }

    public function store(StoreBusinessRequest $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Gửi yêu cầu doanh nghiệp thành công',
            'data' => $this->businessRequestService->store($request->user(), $request->validated()),
        ], 201);
    }

    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách yêu cầu doanh nghiệp thành công',
            'data' => $this->businessRequestService->listForCustomer($request->user(), $request->only([
                'page',
                'per_page',
                'st',
                'status',
                'TrangThai',
            ])),
        ]);
    }

    public function show(Request $request, int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết yêu cầu doanh nghiệp thành công',
            'data' => $this->businessRequestService->detailForCustomer($request->user(), $id),
        ]);
    }
}
