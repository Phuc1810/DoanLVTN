<?php

namespace App\Http\Requests\Auth;

class ResendOtpRequest extends BaseAuthRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'otp_id' => ['required', 'integer'],
        ];
    }
}
