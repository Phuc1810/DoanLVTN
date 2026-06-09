<?php

namespace App\Http\Requests\Staff\News;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreNewsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $data = [];

        foreach (['TieuDe', 'MoTa', 'NoiDung', 'LoaiTin', 'TrangThai'] as $field) {
            if ($this->has($field)) {
                $data[$field] = trim((string) $this->input($field));
            }
        }

        if (! isset($data['LoaiTin']) || $data['LoaiTin'] === '') {
            $data['LoaiTin'] = 'tintuc';
        }

        if (! isset($data['TrangThai']) || $data['TrangThai'] === '') {
            $data['TrangThai'] = 'Hiển thị';
        }

        $this->merge($data);
    }

    public function rules(): array
    {
        return [
            'TieuDe' => ['required', 'string', 'max:255'],
            'MoTa' => ['required', 'string'],
            'NoiDung' => ['required', 'string'],
            'LoaiTin' => ['required', Rule::in(['tintuc', 'kinhnghiem'])],
            'TrangThai' => ['required', Rule::in(['Hiển thị', 'Ẩn'])],
            'AnhDaiDien' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'TieuDe.required' => 'Vui lòng nhập Tiêu đề.',
            'MoTa.required' => 'Vui lòng nhập Mô tả.',
            'NoiDung.required' => 'Vui lòng nhập Nội dung.',
            'LoaiTin.in' => 'Loại tin không hợp lệ.',
            'TrangThai.in' => 'Trạng thái không hợp lệ.',
            'AnhDaiDien.required' => 'Vui lòng chọn ảnh đại diện.',
            'AnhDaiDien.mimes' => 'Ảnh chỉ hỗ trợ: jpg, jpeg, png, webp.',
            'AnhDaiDien.max' => 'Ảnh quá lớn (tối đa 5MB).',
        ];
    }
}
