<?php

namespace App\Http\Requests\Staff\Tour;

use Illuminate\Validation\Rule;

class UpdateTourRequest extends StoreTourRequest
{
    public function rules(): array
    {
        return [
            'TenTour' => ['required', 'string', 'max:255'],
            'DiaDiem' => ['required', 'string', 'max:255'],
            'ThoiLuong' => ['required', 'string', 'max:100'],
            'GiaGoc' => ['required', 'numeric', 'min:0'],
            'GiaGiam' => ['required', 'numeric', 'min:0'],
            'PhanTramGiam' => ['required', 'numeric', 'min:0', 'max:100'],
            'SoCho' => ['required', 'integer', 'min:1'],
            'Mien' => ['required', Rule::in(['Bắc', 'Trung', 'Nam'])],
            'LoaiTour' => ['required', Rule::in(['Cá nhân', 'Doanh nghiệp'])],
            'TrangThai' => ['required', Rule::in(['Hoạt động', 'Ngừng hoạt động', 'Hết chỗ'])],
            'NgayKhoiHanh' => ['required', 'date', 'after_or_equal:today'],
            'NgayKetThuc' => ['required', 'date', 'after_or_equal:NgayKhoiHanh'],
            'LoaiAnh' => ['nullable', Rule::in(['', 'banner', 'noibat'])],
            'AnhChinh' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'lich_trinh' => ['required', 'array', 'min:1'],
            'lich_trinh.*.NgayThu' => ['required', 'integer', 'min:1'],
            'lich_trinh.*.TieuDe' => ['required', 'string', 'max:255'],
            'lich_trinh.*.NoiDung' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return array_merge(parent::messages(), [
            'NgayKhoiHanh.after_or_equal' => 'Ngày khởi hành phải từ hôm nay trở đi.',
        ]);
    }
}
