<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Http\Requests\Staff\Tour\StoreTourRequest;
use App\Http\Requests\Staff\Tour\UpdateTourRequest;
use App\Services\StaffTourService;
use Illuminate\Http\Request;

class TourManagementController extends Controller
{
    public function __construct(private StaffTourService $staffTourService)
    {
    }

    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách tour thành công',
            'data' => $this->staffTourService->list($request->only([
                'q',
                'loai',
                'tt',
                'status',
                'mien',
                'page',
                'per_page',
            ])),
        ]);
    }

    public function store(StoreTourRequest $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Tạo tour thành công',
            'data' => $this->staffTourService->create($request->validated(), $request->file('AnhChinh')),
        ], 201);
    }

    public function show(int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết tour thành công',
            'data' => $this->staffTourService->detail($id),
        ]);
    }

    public function update(UpdateTourRequest $request, int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Cập nhật tour thành công',
            'data' => $this->staffTourService->update($id, $request->validated(), $request->file('AnhChinh')),
        ]);
    }

    public function toggle(int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái tour thành công',
            'data' => $this->staffTourService->toggle($id),
        ]);
    }
}
