<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'SoSao' => $this->SoSao,
            'NoiDung' => $this->NoiDung,
            'NgayDG' => $this->NgayDG,
            'HoTen' => $this->khachHang?->HoTen,
        ];
    }
}
