<?php

namespace App\Http\Requests\Auth;

class GoogleLoginRequest extends BaseAuthRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'credential' => ['required_without:id_token', 'string'],
            'id_token' => ['required_without:credential', 'string'],
        ];
    }
}
