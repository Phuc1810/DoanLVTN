<?php

namespace App\Http\Requests\Auth;

class ForgotPasswordRequest extends BaseAuthRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'contact' => ['required', 'string'],
        ];
    }
}
