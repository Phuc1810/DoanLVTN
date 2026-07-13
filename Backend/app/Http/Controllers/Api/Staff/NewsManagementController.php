<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Http\Requests\Staff\News\StoreNewsRequest;
use App\Http\Requests\Staff\News\UpdateNewsRequest;
use App\Services\StaffNewsService;
use Illuminate\Http\Request;

class NewsManagementController extends Controller
{
    public function __construct(private StaffNewsService $staffNewsService)
    {
    }

    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách tin tức thành công',
            'data' => $this->staffNewsService->list($request->only(['q', 'loai', 'type', 'tt', 'status', 'page', 'per_page'])),
        ]);
    }

    public function stats()
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy thống kê tin tức thành công',
            'data' => $this->staffNewsService->stats(),
        ]);
    }

    public function store(StoreNewsRequest $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Tạo tin tức thành công',
            'data' => $this->staffNewsService->create($request->validated(), $request->file('AnhDaiDien'), $request->user()),
        ], 201);
    }

    public function update(UpdateNewsRequest $request, int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Cập nhật tin tức thành công',
            'data' => $this->staffNewsService->update($id, $request->validated(), $request->file('AnhDaiDien'), $request->user()),
        ]);
    }

    public function show(int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết tin tức thành công',
            'data' => $this->staffNewsService->detail($id),
        ]);
    }

    public function toggle(int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái tin tức thành công',
            'data' => $this->staffNewsService->toggle($id),
        ]);
    }

    /**
     * Upload ảnh từ trình soạn thảo nội dung (CKEditor / TinyMCE).
     * Response theo chuẩn CKEditor SimpleUploadAdapter.
     */
    public function uploadEditorImage(Request $request)
    {
        $request->validate([
            'upload' => ['required', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
        ], [
            'upload.required' => 'Vui lòng chọn ảnh để tải lên.',
            'upload.image' => 'File tải lên phải là hình ảnh.',
            'upload.mimes' => 'Ảnh chỉ hỗ trợ: jpg, jpeg, png, webp, gif.',
            'upload.max' => 'Ảnh quá lớn (tối đa 5MB).',
        ]);

        try {
            $uploadService = app(\App\Services\UploadService::class);
            $storedPath = $uploadService->uploadEditorImage($request->file('upload'));
            $publicUrl = $uploadService->publicUrl($storedPath);

            return response()->json([
                'uploaded' => 1,
                'fileName' => basename($storedPath),
                'url' => $publicUrl,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'uploaded' => 0,
                'error' => [
                    'message' => 'Upload ảnh thất bại: ' . $e->getMessage(),
                ],
            ], 422);
        }
    }
}
