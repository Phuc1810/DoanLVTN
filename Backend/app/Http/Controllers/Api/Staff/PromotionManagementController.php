<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Http\Requests\Staff\Promotion\AttachPromotionToursRequest;
use App\Http\Requests\Staff\Promotion\StorePromotionRequest;
use App\Http\Requests\Staff\Promotion\UpdatePromotionRequest;
use App\Services\StaffPromotionService;
use Illuminate\Http\Request;

class PromotionManagementController extends Controller
{
    public function __construct(private StaffPromotionService $staffPromotionService)
    {
    }

    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách khuyến mãi thành công',
            'data' => $this->staffPromotionService->list($request->only(['q', 'tt', 'status', 'page', 'per_page'])),
        ]);
    }

    public function store(StorePromotionRequest $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Tạo khuyến mãi thành công',
            'data' => $this->staffPromotionService->create($request->validated(), $request->file('AnhDaiDien')),
        ], 201);
    }

    public function show(int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết khuyến mãi thành công',
            'data' => $this->staffPromotionService->detail($id),
        ]);
    }

    public function update(UpdatePromotionRequest $request, int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Cập nhật khuyến mãi thành công',
            'data' => $this->staffPromotionService->update($id, $request->validated(), $request->file('AnhDaiDien')),
        ]);
    }

    public function toggle(int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái khuyến mãi thành công',
            'data' => $this->staffPromotionService->toggle($id),
        ]);
    }

    public function attachTours(AttachPromotionToursRequest $request, int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Gán tour vào khuyến mãi thành công',
            'data' => $this->staffPromotionService->attachTours($id, $request->validated('tours')),
        ]);
    }

    public function detachTour(int $id, int $tourId)
    {
        return response()->json([
            'success' => true,
            'message' => 'Gỡ tour khỏi khuyến mãi thành công',
            'data' => $this->staffPromotionService->detachTour($id, $tourId),
        ]);
    }
}
