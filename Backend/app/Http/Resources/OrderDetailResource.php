<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class OrderDetailResource extends OrderResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'GiaNguoiLonApDung' => $this->GiaNguoiLonApDung,
            'GiaTreEmApDung' => $this->GiaTreEmApDung,
            'khach_hang' => $this->customerPayload(),
            'tour' => $this->tourDetailPayload(),
            'payments' => $this->relationLoaded('thanhToans')
                ? $this->thanhToans->map(fn ($payment) => $this->paymentPayload($payment))->values()
                : [],
            'refunds' => $this->relationLoaded('hoanTiens')
                ? $this->hoanTiens->map(fn ($refund) => $this->refundPayload($refund))->values()
                : [],
            'promotion' => $this->promotionPayload(),
        ]);
    }

    private function tourDetailPayload(): ?array
    {
        $tour = $this->tourPayload();

        if ($tour === null) {
            return null;
        }

        $tour['lich_trinh'] = $this->schedulePayload();

        return $tour;
    }

    private function schedulePayload(): array
    {
        if (! $this->relationLoaded('tour') || ! $this->tour?->relationLoaded('lichTrinhs')) {
            return [];
        }

        return $this->tour->lichTrinhs->map(fn ($schedule) => [
            'MaLT' => $schedule->MaLT,
            'NgayThu' => $schedule->NgayThu,
            'TieuDe' => $schedule->TieuDe,
            'NoiDung' => $schedule->NoiDung,
            'MaTour' => $schedule->MaTour,
        ])->values()->all();
    }

    private function promotionPayload(): ?array
    {
        if (! $this->relationLoaded('chuongTrinhKhuyenMai') || ! $this->chuongTrinhKhuyenMai) {
            return null;
        }

        return [
            'MaCTKM' => $this->chuongTrinhKhuyenMai->MaCTKM,
            'TenKM' => $this->chuongTrinhKhuyenMai->TenKM,
            'NoiDung' => $this->chuongTrinhKhuyenMai->NoiDung,
            'AnhDaiDien' => $this->chuongTrinhKhuyenMai->AnhDaiDien,
            'PhanTramGiam' => $this->chuongTrinhKhuyenMai->PhanTramGiam,
            'NgayBatDau' => $this->chuongTrinhKhuyenMai->NgayBatDau,
            'NgayKetThuc' => $this->chuongTrinhKhuyenMai->NgayKetThuc,
            'TrangThai' => $this->chuongTrinhKhuyenMai->TrangThai,
        ];
    }
}
