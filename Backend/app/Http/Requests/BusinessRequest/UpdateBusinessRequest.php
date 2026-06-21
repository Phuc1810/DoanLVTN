<?php

namespace App\Http\Requests\BusinessRequest;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBusinessRequest extends FormRequest
{
    public const STATUSES = [
        'Chờ xử lý',
        'Đã liên hệ',
        'Hủy tour',
        'Hoàn thành',
    ];

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $data = [];

        if ($this->input('action') === 'update') {
            $data['action'] = 'update_status';
        }

        if ($this->has('status') && ! $this->has('TrangThai')) {
            $data['TrangThai'] = $this->input('status');
        }

        foreach (['action', 'TrangThai'] as $field) {
            if ($this->has($field)) {
                $data[$field] = trim((string) $this->input($field));
            }
        }

        if ($this->has('GiaTriHopDong')) {
            $data['GiaTriHopDong'] = str_replace([',', ' '], '', (string) $this->input('GiaTriHopDong'));
        }

        if ($this->has('NgayThanhToan')) {
            $data['NgayThanhToan'] = trim((string) $this->input('NgayThanhToan'));
        }

        if ($data !== []) {
            $this->merge($data);
        }
    }

    public function rules(): array
    {
        return [
            'action' => ['required', Rule::in(['claim', 'update_status'])],
            'TrangThai' => ['required_if:action,update_status', Rule::in(self::STATUSES)],
            'GiaTriHopDong' => [
                'nullable',
                'numeric',
                'min:0',
                Rule::requiredIf(fn () => $this->input('action') === 'update_status' && $this->input('TrangThai') === 'Hoàn thành'),
            ],
            'NgayThanhToan' => [
                'nullable',
                'date',
                'before_or_equal:today',
                Rule::requiredIf(fn () => $this->input('action') === 'update_status' && $this->input('TrangThai') === 'Hoàn thành'),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'action.required' => 'Vui lòng chọn thao tác.',
            'action.in' => 'Thao tác không hợp lệ.',
            'TrangThai.required_if' => 'Vui lòng chọn trạng thái.',
            'TrangThai.in' => 'Trạng thái không hợp lệ.',
            'GiaTriHopDong.required' => 'Khi chọn Hoàn thành phải nhập Giá trị hợp đồng.',
            'GiaTriHopDong.numeric' => 'Giá trị hợp đồng không hợp lệ.',
            'GiaTriHopDong.min' => 'Giá trị hợp đồng không hợp lệ.',
            'NgayThanhToan.required' => 'Khi chọn Hoàn thành phải chọn Ngày thanh toán.',
            'NgayThanhToan.date' => 'Ngày thanh toán không hợp lệ.',
            'NgayThanhToan.before_or_equal' => 'Ngày thanh toán không được lớn hơn ngày hiện tại.',
        ];
    }
}
