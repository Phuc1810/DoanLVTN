<?php

namespace App\Http\Requests\Auth;

class ChangePasswordRequest extends BaseAuthRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string'],
            'password_confirmation' => ['required', 'same:password'],
        ];
    }
}
