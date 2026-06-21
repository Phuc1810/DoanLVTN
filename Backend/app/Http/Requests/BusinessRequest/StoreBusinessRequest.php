<?php

namespace App\Http\Requests\BusinessRequest;

use Illuminate\Foundation\Http\FormRequest;

class StoreBusinessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $aliases = [
            'tour_id' => 'MaTour',
            'ten_cong_ty' => 'TenCongTy',
            'nguoi_lien_he' => 'NguoiLienHe',
            'so_dien_thoai' => 'SDT',
            'so_nguoi' => 'SoNguoi',
            'thoi_gian_khoi_hanh' => 'ThoiGianKhoiHanh',
            'ghi_chu' => 'GhiChu',
        ];

        $data = [];
        foreach ($aliases as $alias => $field) {
            if ($this->has($alias) && ! $this->has($field)) {
                $data[$field] = $this->input($alias);
            }
        }

        foreach (['TenCongTy', 'NguoiLienHe', 'SDT', 'GhiChu'] as $field) {
            if ($this->has($field)) {
                $data[$field] = trim((string) $this->input($field));
            }
        }

        if ($data !== []) {
            $this->merge($data);
        }
    }

    public function rules(): array
    {
        return [
            'MaTour' => ['nullable', 'integer'],
            'TenCongTy' => ['required', 'string', 'max:255'],
            'NguoiLienHe' => ['required', 'string', 'max:255'],
            'SDT' => ['required', 'regex:/^\d{10}$/'],
            'SoNguoi' => ['required', 'integer', 'min:20'],
            'ThoiGianKhoiHanh' => ['required', 'date', 'after_or_equal:today'],
            'GhiChu' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'TenCongTy.required' => 'Vui lòng nhập Tên công ty.',
            'NguoiLienHe.required' => 'Vui lòng nhập Người liên hệ.',
            'SDT.required' => 'Vui lòng nhập SĐT.',
            'SDT.regex' => 'SĐT phải đủ 10 số (vd: 0xxxxxxxxx).',
            'SoNguoi.required' => 'Vui lòng nhập Số người.',
            'SoNguoi.integer' => 'Số người phải là số nguyên.',
            'SoNguoi.min' => 'Tour doanh nghiệp yêu cầu tối thiểu 20 người.',
            'ThoiGianKhoiHanh.required' => 'Vui lòng chọn Thời gian khởi hành.',
            'ThoiGianKhoiHanh.date' => 'Thời gian khởi hành không hợp lệ.',
            'ThoiGianKhoiHanh.after_or_equal' => 'Thời gian khởi hành không được nhỏ hơn ngày hiện tại.',
            'GhiChu.max' => 'Ghi chú tối đa 2000 ký tự.',
        ];
    }
}
