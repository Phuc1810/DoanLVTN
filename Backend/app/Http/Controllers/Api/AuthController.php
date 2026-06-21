<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\GoogleLoginRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResendOtpRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Services\AuthService;
use App\Services\OtpService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private AuthService $authService,
        private OtpService $otpService
    ) {
    }

    public function register(RegisterRequest $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Đăng ký thành công.',
            'data' => $this->authService->registerCustomer($request->validated()),
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập thành công.',
            'data' => $this->authService->loginCustomer($request->validated()),
        ]);
    }

    public function staffLogin(LoginRequest $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập nhân viên/admin thành công.',
            'data' => $this->authService->loginStaff($request->validated()),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đăng xuất thành công.',
            'data' => null,
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy thông tin người dùng thành công.',
            'data' => $this->authService->me($request->user()),
        ]);
    }

    public function forgotPassword(ForgotPasswordRequest $request)
    {
        $result = $this->otpService->requestOtp($request->validated('contact'));

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'data' => $result['data'],
        ]);
    }

    public function verifyOtp(VerifyOtpRequest $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Xác thực OTP thành công.',
            'data' => $this->otpService->verifyOtp(
                (int) $request->validated('otp_id'),
                $request->validated('otp')
            ),
        ]);
    }

    public function resendOtp(ResendOtpRequest $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Đã gửi lại OTP.',
            'data' => $this->otpService->resendOtp((int) $request->validated('otp_id')),
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request)
    {
        $this->authService->resetPassword($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Đặt lại mật khẩu thành công.',
            'data' => null,
        ]);
    }

    public function changePassword(ChangePasswordRequest $request)
    {
        $this->authService->changePassword($request->user(), $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Đổi mật khẩu thành công.',
            'data' => null,
        ]);
    }

    public function google(GoogleLoginRequest $request)
    {
        $validated = $request->validated();

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập Google thành công.',
            'data' => $this->authService->googleLogin($validated['credential'] ?? $validated['id_token']),
        ]);
    }
}
