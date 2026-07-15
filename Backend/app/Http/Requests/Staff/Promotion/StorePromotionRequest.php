<?php

namespace App\Http\Requests\Staff\Promotion;

use Illuminate\Foundation\Http\FormRequest;

class StorePromotionRequest extends FormRequest
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
            'TenKM' => ['required', 'string', 'max:255'],
            'NoiDung' => ['nullable', 'string'],
            'PhanTramGiam' => ['required', 'numeric', 'min:0', 'max:100'],
            'NgayBatDau' => ['required', 'date', 'after_or_equal:today'],
            'NgayKetThuc' => ['required', 'date', 'after_or_equal:NgayBatDau'],
            'AnhDaiDien' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'tours' => ['nullable', 'array'],
            'tours.*.MaTour' => ['required_with:tours', 'integer', 'exists:tour,MaTour'],
            'tours.*.PhanTramGiamKM' => ['required_with:tours', 'numeric', 'min:0', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'TenKM.required' => 'Vui lòng nhập tên chương trình khuyến mãi.',
            'PhanTramGiam.required' => 'Vui lòng nhập phần trăm giảm.',
            'PhanTramGiam.min' => '% giảm phải từ 0-100.',
            'PhanTramGiam.max' => '% giảm phải từ 0-100.',
            'NgayBatDau.required' => 'Vui lòng chọn ngày bắt đầu.',
            'NgayBatDau.after_or_equal' => 'Ngày bắt đầu không được chọn ngày trong quá khứ.',
            'NgayKetThuc.required' => 'Vui lòng chọn ngày kết thúc.',
            'NgayKetThuc.after_or_equal' => 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.',
            'AnhDaiDien.mimes' => 'Ảnh chỉ hỗ trợ: jpg, jpeg, png, webp.',
            'AnhDaiDien.max' => 'Ảnh quá lớn (tối đa 5MB).',
            'tours.*.MaTour.exists' => 'Tour không tồn tại.',
            'tours.*.PhanTramGiamKM.min' => '% giảm riêng phải từ 0-100.',
            'tours.*.PhanTramGiamKM.max' => '% giảm riêng phải từ 0-100.',
        ];
    }

    private function normalizedInput(): array
    {
        $data = [];

        foreach (['TenKM', 'NoiDung'] as $field) {
            if ($this->has($field)) {
                $data[$field] = trim((string) $this->input($field));
            }
        }

        $data['tours'] = $this->normalizeTours();

        return $data;
    }

    protected function normalizeTours(): array
    {
        $defaultPercent = $this->input('PhanTramGiam', 0);
        $input = $this->input('tours');

        if (is_string($input)) {
            $decoded = json_decode($input, true);
            $input = is_array($decoded) ? $decoded : [];
        }

        if (is_array($input) && $input !== [] && is_array(reset($input))) {
            return array_values(array_map(fn ($row) => [
                'MaTour' => $row['MaTour'] ?? $row['tour_id'] ?? null,
                'PhanTramGiamKM' => $row['PhanTramGiamKM'] ?? $row['percent'] ?? $defaultPercent,
            ], $input));
        }

        $selected = $this->input('selectedTours', $input ?? []);
        $selected = is_array($selected) ? $selected : [];
        $percentMap = $this->input('ptkm', $this->input('percent_by_tour', []));
        $percentMap = is_array($percentMap) ? $percentMap : [];

        $rows = [];
        foreach ($selected as $tourId) {
            $tourId = (int) $tourId;
            if ($tourId <= 0) {
                continue;
            }

            $rows[] = [
                'MaTour' => $tourId,
                'PhanTramGiamKM' => ($percentMap[$tourId] ?? '') !== '' ? $percentMap[$tourId] : $defaultPercent,
            ];
        }

        return $rows;
    }
}
