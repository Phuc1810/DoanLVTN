<?php

namespace App\Http\Requests\Review;

use Illuminate\Foundation\Http\FormRequest;

class StoreReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'SoSao' => ['required', 'integer', 'min:1', 'max:5'],
            'NoiDung' => ['nullable', 'string', 'max:2000'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('NoiDung')) {
            $this->merge([
                'NoiDung' => trim((string) $this->input('NoiDung')),
            ]);
        }
    }

    public function messages(): array
    {
        return [
            'SoSao.required' => 'Số sao là bắt buộc.',
            'SoSao.integer' => 'Số sao phải là số nguyên.',
            'SoSao.min' => 'Số sao phải từ 1 đến 5.',
            'SoSao.max' => 'Số sao phải từ 1 đến 5.',
            'NoiDung.string' => 'Nội dung đánh giá không hợp lệ.',
            'NoiDung.max' => 'Nội dung tối đa 2000 ký tự.',
        ];
    }
}
