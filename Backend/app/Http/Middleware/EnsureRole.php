<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để sử dụng chức năng này.',
                'errors' => [
                    'auth' => ['Unauthenticated.'],
                ],
            ], 401);
        }

        if (! in_array($user->VaiTro, $roles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền truy cập chức năng này',
                'errors' => [
                    'role' => ['Vai trò không hợp lệ.'],
                ],
            ], 403);
        }

        return $next($request);
    }
}
