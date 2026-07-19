<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateStaffAccountRequest;
use App\Http\Requests\Admin\ResetAccountPasswordRequest;
use App\Http\Requests\Admin\UpdateAccountRoleRequest;
use App\Services\AdminAccountService;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function __construct(private AdminAccountService $adminAccountService)
    {
    }

    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách tài khoản thành công',
            'data' => $this->adminAccountService->list($request->only([
                'q',
                'role',
                'VaiTro',
                'st',
                'status',
                'TrangThai',
                'page',
                'per_page',
            ]), $request->user()),
        ]);
    }

    public function stats()
    {
        return response()->json([
            'success' => true,
            'data' => $this->adminAccountService->stats(),
        ]);
    }

    public function show(int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy thông tin tài khoản thành công',
            'data' => $this->adminAccountService->getAccountDetails($id),
        ]);
    }

    public function storeStaff(CreateStaffAccountRequest $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Tạo tài khoản nhân viên thành công',
            'data' => $this->adminAccountService->createStaff($request->validated()),
        ], 201);
    }

    public function updateRole(UpdateAccountRoleRequest $request, int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Cập nhật vai trò tài khoản thành công',
            'data' => $this->adminAccountService->updateRole($id, $request->validated('role'), $request->user()),
        ]);
    }

    public function toggleStatus(Request $request, int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái tài khoản thành công',
            'data' => $this->adminAccountService->toggleStatus($id, $request->user()),
        ]);
    }

    public function resetPassword(ResetAccountPasswordRequest $request, int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Cấp lại mật khẩu tài khoản thành công',
            'data' => $this->adminAccountService->resetPassword($id, $request->validated('new_password'), $request->user()),
        ]);
    }
}
