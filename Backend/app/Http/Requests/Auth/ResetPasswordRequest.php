<?php

namespace App\Http\Requests\Auth;

class ResetPasswordRequest extends BaseAuthRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reset_token' => ['required', 'string'],
            'password' => ['required', 'string'],
            'password_confirmation' => ['required', 'same:password'],
        ];
    }
}
