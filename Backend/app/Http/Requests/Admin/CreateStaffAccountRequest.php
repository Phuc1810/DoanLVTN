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
            'email' => $this->input('email') ? trim((string) $this->input('email')) : null,
            'sdt' => $this->input('sdt') ? trim((string) $this->input('sdt')) : null,
            'chucvu' => $this->input('chucvu') ? trim((string) $this->input('chucvu')) : null,
        ]);
    }

    public function rules(): array
    {
        return [
            'username' => ['required', 'string', 'min:6', 'max:255', Rule::unique('taikhoan', 'TenDangNhap')],
            'password' => ['required', 'string', 'min:6'],
            'fullname' => ['required', 'string', 'max:255'],
            'email' => ['required', 'regex:/^[a-zA-Z0-9]+@gmail\.com$/', 'max:255'],
            'sdt' => ['required', 'string', 'max:20'],
            'chucvu' => ['required', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'username.required' => 'Vui lòng nhập tên đăng nhập.',
            'username.min' => 'Tên đăng nhập phải chứa ít nhất 6 ký tự.',
            'username.unique' => 'Tên đăng nhập đã tồn tại.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
            'password.min' => 'Mật khẩu phải từ 6 ký tự.',
            'fullname.required' => 'Vui lòng nhập họ tên nhân viên.',
            'email.required' => 'Vui lòng nhập email.',
            'email.regex' => 'Email chỉ chứa chữ cái không dấu, số và phải có đuôi @gmail.com',
            'sdt.required' => 'Vui lòng nhập số điện thoại.',
            'chucvu.required' => 'Vui lòng nhập chức vụ.',
        ];
    }
}
