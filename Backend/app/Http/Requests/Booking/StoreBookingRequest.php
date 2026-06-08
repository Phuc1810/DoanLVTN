<?php

namespace App\Http\Requests\Booking;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreBookingRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'MaTour' => $this->input('MaTour', $this->input('tour_id')),
            'MaCTKM' => $this->input('MaCTKM', $this->input('ctkm')),
            'SoLuongNguoiLon' => $this->input('SoLuongNguoiLon', $this->input('nguoi_lon', 1)),
            'SoLuongTreEm' => $this->input('SoLuongTreEm', $this->input('tre_em', 0)),
            'SoLuongTreNho' => $this->input('SoLuongTreNho', $this->input('tre_nho', 0)),
        ]);
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'MaTour' => ['required', 'integer', 'min:1'],
            'MaCTKM' => ['nullable', 'integer', 'min:0'],
            'SoLuongNguoiLon' => ['required', 'integer', 'min:1'],
            'SoLuongTreEm' => ['required', 'integer', 'min:0'],
            'SoLuongTreNho' => ['required', 'integer', 'min:0'],
            'HoTen' => ['required', 'string'],
            'Email' => ['required', 'email'],
            'SoDienThoai' => ['required', 'regex:/^0\d{9}$/'],
            'DiaChi' => ['required', 'string'],
            'NgaySinh' => ['required', 'date_format:Y-m-d', 'before:today'],
            'GioiTinh' => ['required', 'in:Nam,Nữ,Khác'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $nguoiLon = (int) $this->input('SoLuongNguoiLon', 1);
            $treNho = (int) $this->input('SoLuongTreNho', 0);
            $maxTreNho = $nguoiLon * 2;

            if ($treNho > $maxTreNho) {
                $validator->errors()->add(
                    'SoLuongTreNho',
                    "Trẻ nhỏ tối đa là {$maxTreNho} (mỗi 1 người lớn tối đa 2 trẻ nhỏ)."
                );
            }
        });
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Dữ liệu không hợp lệ.',
            'errors' => $validator->errors(),
        ], 422));
    }
}
