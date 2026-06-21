<?php

namespace App\Http\Requests\Auth;

class VerifyOtpRequest extends BaseAuthRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'otp_id' => ['required', 'integer'],
            'otp' => ['required', 'digits:6'],
        ];
    }
}
