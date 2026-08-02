<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminNewsCommentService;
use Illuminate\Http\Request;

class NewsCommentController extends Controller
{
    protected $newsCommentService;

    public function __construct(AdminNewsCommentService $newsCommentService)
    {
        $this->newsCommentService = $newsCommentService;
    }

    /**
     * Get list of news comments
     */
    public function index(Request $request)
    {
        $filters = $request->only(['q', 'trangthai']);
        $perPage = (int) $request->input('per_page', 10);

        $comments = $this->newsCommentService->getComments($filters, $perPage);

        return response()->json($comments);
    }

    /**
     * Toggle the visibility status of a comment
     */
    public function toggleStatus($id)
    {
        $comment = $this->newsCommentService->toggleStatus($id);

        return response()->json([
            'success' => true,
            'message' => 'Trạng thái bình luận đã được cập nhật.',
            'data' => $comment,
        ]);
    }

    /**
     * Reply to a comment
     */
    public function reply(Request $request, $id)
    {
        $request->validate([
            'PhanHoi' => 'required|string',
        ]);

        $comment = $this->newsCommentService->replyToComment($id, $request->input('PhanHoi'));

        return response()->json([
            'success' => true,
            'message' => 'Đã gửi phản hồi thành công.',
            'data' => $comment,
        ]);
    }
}
