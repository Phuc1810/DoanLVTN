<?php

namespace App\Http\Requests\Auth;

class LoginRequest extends BaseAuthRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'login_key' => ['required_without:username', 'string'],//dùng cho khách hàng đăng nhập
            'username' => ['required_without:login_key', 'string'],//dùng cho nhân viên/admin đăng nhập
            'password' => ['required', 'string'],
        ];
    }
}
