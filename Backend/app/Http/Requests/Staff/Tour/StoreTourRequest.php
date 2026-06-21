<?php

namespace App\Http\Requests\Staff\Tour;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTourRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge($this->normalizedInput());
    }

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
            'NgayKhoiHanh' => ['required', 'date', 'after:today'],
            'NgayKetThuc' => ['required', 'date', 'after:today', 'after_or_equal:NgayKhoiHanh'],
            'LoaiAnh' => ['nullable', Rule::in(['', 'banner', 'noibat'])],
            'AnhChinh' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'lich_trinh' => ['required', 'array', 'min:1'],
            'lich_trinh.*.NgayThu' => ['required', 'integer', 'min:1'],
            'lich_trinh.*.TieuDe' => ['required', 'string', 'max:255'],
            'lich_trinh.*.NoiDung' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'AnhChinh.required' => 'Vui lòng chọn 1 ảnh chính cho tour.',
            'AnhChinh.mimes' => 'Ảnh chỉ hỗ trợ: jpg, jpeg, png, webp.',
            'AnhChinh.max' => 'Ảnh quá lớn (tối đa 5MB).',
            'NgayKhoiHanh.after' => 'Ngày khởi hành phải lớn hơn ngày hiện tại.',
            'NgayKetThuc.after' => 'Ngày kết thúc phải lớn hơn ngày hiện tại.',
            'NgayKetThuc.after_or_equal' => 'Ngày kết thúc phải lớn hơn hoặc bằng ngày khởi hành.',
            'lich_trinh.required' => 'Vui lòng nhập ít nhất 1 dòng lịch trình tour.',
            'lich_trinh.min' => 'Vui lòng nhập ít nhất 1 dòng lịch trình tour.',
        ];
    }

    private function normalizedInput(): array
    {
        $data = [];

        foreach (['TenTour', 'DiaDiem', 'ThoiLuong', 'Mien', 'LoaiTour', 'TrangThai', 'LoaiAnh'] as $field) {
            if ($this->has($field)) {
                $data[$field] = trim((string) $this->input($field));
            }
        }

        $data['lich_trinh'] = $this->normalizeSchedules();

        return $data;
    }

    private function normalizeSchedules(): array
    {
        $input = $this->input('lich_trinh');
        if (is_string($input)) {
            $decoded = json_decode($input, true);
            $input = is_array($decoded) ? $decoded : [];
        }

        if (is_array($input) && $input !== []) {
            return array_values(array_filter(array_map(fn ($row) => [
                'NgayThu' => $row['NgayThu'] ?? $row['ngay_thu'] ?? null,
                'TieuDe' => trim((string) ($row['TieuDe'] ?? $row['tieu_de'] ?? '')),
                'NoiDung' => trim((string) ($row['NoiDung'] ?? $row['noi_dung'] ?? '')),
            ], $input), fn ($row) => $row['NgayThu'] !== null || $row['TieuDe'] !== '' || $row['NoiDung'] !== ''));
        }

        $days = $this->input('lt_ngay', []);
        $titles = $this->input('lt_tieude', []);
        $contents = $this->input('lt_noidung', []);
        $max = max(count($days), count($titles), count($contents));
        $rows = [];

        for ($i = 0; $i < $max; $i++) {
            $row = [
                'NgayThu' => $days[$i] ?? null,
                'TieuDe' => trim((string) ($titles[$i] ?? '')),
                'NoiDung' => trim((string) ($contents[$i] ?? '')),
            ];

            if ($row['NgayThu'] !== null || $row['TieuDe'] !== '' || $row['NoiDung'] !== '') {
                $rows[] = $row;
            }
        }

        return $rows;
    }
}
