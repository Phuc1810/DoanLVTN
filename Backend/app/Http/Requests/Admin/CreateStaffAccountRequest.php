<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateStaffAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'username' => trim((string) $this->input('username')),
            'fullname' => trim((string) $this->input('fullname')),
        ]);
    }

    public function rules(): array
    {
        return [
            'username' => ['required', 'string', 'max:255', Rule::unique('taikhoan', 'TenDangNhap')],
            'password' => ['required', 'string', 'min:6'],
            'fullname' => ['required', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'username.required' => 'Vui lòng nhập tên đăng nhập.',
            'username.unique' => 'Tên đăng nhập đã tồn tại.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
            'password.min' => 'Mật khẩu phải từ 6 ký tự.',
            'fullname.required' => 'Vui lòng nhập họ tên nhân viên.',
        ];
    }
}
