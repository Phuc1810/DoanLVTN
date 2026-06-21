<?php

namespace App\Http\Requests\Staff\Promotion;

use Illuminate\Foundation\Http\FormRequest;

class AttachPromotionToursRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $input = $this->input('tours', []);
        if (is_string($input)) {
            $decoded = json_decode($input, true);
            $input = is_array($decoded) ? $decoded : [];
        }

        $this->merge(['tours' => $input]);
    }

    public function rules(): array
    {
        return [
            'tours' => ['required', 'array', 'min:1'],
            'tours.*.MaTour' => ['required', 'integer', 'exists:tour,MaTour'],
            'tours.*.PhanTramGiamKM' => ['required', 'numeric', 'min:0', 'max:100'],
        ];
    }
}
