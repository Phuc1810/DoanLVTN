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
            'login_key' => ['required_without:username', 'string'],
            'username' => ['required_without:login_key', 'string'],
            'password' => ['required', 'string'],
        ];
    }
}
