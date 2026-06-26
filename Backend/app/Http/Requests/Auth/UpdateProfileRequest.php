<?php

namespace App\Http\Requests\Auth;

class UpdateProfileRequest extends BaseAuthRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'HoTen' => ['nullable', 'string'],
            'Email' => ['nullable', 'string'],
            'SoDienThoai' => ['nullable', 'string'],
            'DiaChi' => ['nullable', 'string'],
            'NgaySinh' => ['nullable', 'string'],
            'GioiTinh' => ['nullable', 'string'],
        ];
    }
}
