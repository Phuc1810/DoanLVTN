<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BusinessRequest\StoreBusinessRequest;
use App\Services\BusinessRequestService;

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
}
