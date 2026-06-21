<?php

namespace App\Http\Requests\Auth;

class RegisterRequest extends BaseAuthRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'hoten' => ['required', 'string'],
            'contact' => ['required', 'string'],
            'diachi' => ['required', 'string'],
            'ngaysinh' => ['required', 'date', 'before:today'],
            'gioitinh' => ['required', 'in:Nam,Nữ'],
            'password' => ['required', 'string'],
        ];
    }
}
