<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'MaDG' => $this->MaDG,
            'SoSao' => $this->SoSao,
            'NoiDung' => $this->NoiDung,
            'NgayDG' => $this->NgayDG,
            'MaKH' => $this->MaKH,
            'MaTour' => $this->MaTour,
            'HoTen' => $this->khachHang?->HoTen,
        ];
    }
}
