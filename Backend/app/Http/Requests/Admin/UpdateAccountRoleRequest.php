<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAccountRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $role = $this->input('role', $this->input('VaiTro'));

        $this->merge([
            'role' => strtoupper(trim((string) $role)),
        ]);
    }

    public function rules(): array
    {
        return [
            'role' => ['required', Rule::in(['AD', 'NV', 'KH'])],
        ];
    }
}
