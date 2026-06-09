<?php

namespace App\Services;

use App\Models\DonDatTour;
use App\Models\TaiKhoan;
use App\Models\ThanhToan;
use App\Models\Tour;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentService
{
    private const STATUS_PENDING = 'Chờ thanh toán';
    private const STATUS_PAID = 'Đã thanh toán';
    private const STATUS_SOLD_OUT = 'Hết chỗ';
    private const PAYMENT_METHOD = 'Chuyển khoản';
    private const PAYMENT_SUCCESS = 'Thành công';
    private const PAYMENT_SOLD_OUT = 'Nhận tiền - Hết chỗ';

    public function __construct(
        private PromotionService $promotionService,
        private NotificationService $notificationService,
        private UploadService $uploadService
    ) {
    }

    public function paymentInfo(TaiKhoan $user, int $orderId): array
    {
        $order = DB::transaction(function () use ($user, $orderId) {
            $order = $this->ownedOrderQuery($user, $orderId)
                ->with(['tour.anhChinh', 'khachHang'])
                ->lockForUpdate()
                ->first();

            if (! $order) {
                $this->throwNotFound();
            }

            $discount = $this->recalculateDiscount($order);
            $order->refresh()->load(['tour.anhChinh', 'khachHang']);

            return [$order, $discount];
        });

        [$order, $discount] = $order;

        return [
            'order' => $this->orderPayload($order),
            'tour' => $this->tourPayload($order->tour),
            'discount' => [
                'type' => $discount['type'],
                'name' => $discount['name'],
                'percent' => $discount['percent'],
                'discount_amount' => $discount['discount_amount'],
            ],
            'payment' => $this->vietQrPayload($order),
            'payment_status' => $this->statusCode($order->TrangThai),
        ];
    }

    public function checkStatus(TaiKhoan $user, int $orderId): array
    {
        $order = $this->ownedOrderQuery($user, $orderId)->first();

        if (! $order) {
            $this->throwNotFound();
        }

        return [
            'status' => $this->statusCode($order->TrangThai),
            'raw_status' => $order->TrangThai,
        ];
    }

    public function handleSepayWebhook(Request $request): array
    {
        if (! $this->validWebhookToken($request)) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Unauthorized',
                'errors' => [
                    'token' => ['Webhook token không hợp lệ.'],
                ],
            ], 401));
        }

        $payload = json_decode($request->getContent(), true);
        if (! is_array($payload)) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Invalid JSON',
                'errors' => [
                    'payload' => ['JSON body không hợp lệ.'],
                ],
            ], 400));
        }

        $transferType = strtolower((string) $this->pickValue($payload, ['transferType', 'type']));
        if ($transferType !== '' && $transferType !== 'in') {
            return $this->ignored('not_incoming');
        }

        $content = trim((string) $this->pickValue($payload, ['content', 'description', 'transactionContent', 'transferContent']));
        $amountRaw = $this->pickValue($payload, ['transferAmount', 'amount', 'money', 'value']);
        $amount = is_numeric($amountRaw) ? (int) round((float) $amountRaw) : 0;

        if ($content === '' || ! preg_match('/\bDH\s*([0-9]+)\b/i', $content, $matches)) {
            return $this->ignored('no_DH_code');
        }

        $orderId = (int) $matches[1];
        if ($amount <= 0) {
            return $this->ignored('no_amount', ['MaDon' => $orderId]);
        }

        $notify = null;
        $result = DB::transaction(function () use ($orderId, $amount, &$notify) {
            $order = DonDatTour::where('MaDon', $orderId)->lockForUpdate()->first();

            if (! $order) {
                return $this->ignored('order_not_found', ['MaDon' => $orderId]);
            }

            if (in_array($order->TrangThai, [self::STATUS_PAID, self::STATUS_SOLD_OUT], true)) {
                return [
                    'success' => true,
                    'message' => 'Already processed',
                    'data' => [
                        'status' => $this->statusCode($order->TrangThai),
                        'MaDon' => $order->MaDon,
                        'amount' => $amount,
                    ],
                ];
            }

            $expected = (int) round((float) $order->TongTienPhaiTra);
            if ($amount < $expected) {
                return $this->ignored('amount_less_than_expected', [
                    'MaDon' => $order->MaDon,
                    'expected' => $expected,
                    'amount' => $amount,
                ]);
            }

            $tour = Tour::where('MaTour', $order->MaTour)->lockForUpdate()->first();
            if (! $tour) {
                return $this->ignored('tour_not_found', ['MaDon' => $order->MaDon]);
            }

            $needSeats = (int) $order->SoLuongNguoiLon + (int) $order->SoLuongTreEm + (int) $order->SoLuongTreNho;

            if ((int) $tour->SoChoDaDat + $needSeats > (int) $tour->SoCho) {
                $order->update(['TrangThai' => self::STATUS_SOLD_OUT]);
                $this->recordPayment($order->MaDon, $amount, self::PAYMENT_SOLD_OUT);
                $notify = ['type' => 'soldout', 'info' => $this->notificationPayload($order->MaDon, $amount)];

                return [
                    'success' => true,
                    'message' => 'Payment received but tour sold out',
                    'data' => [
                        'status' => 'soldout',
                        'MaDon' => $order->MaDon,
                        'amount' => $amount,
                    ],
                ];
            }

            $newBookedSeats = (int) $tour->SoChoDaDat + $needSeats;
            $tourUpdates = ['SoChoDaDat' => $newBookedSeats];
            if ($newBookedSeats >= (int) $tour->SoCho) {
                $tourUpdates['TrangThai'] = self::STATUS_SOLD_OUT;
            }
            $tour->update($tourUpdates);

            $order->update(['TrangThai' => self::STATUS_PAID]);
            $this->recordPayment($order->MaDon, $amount, self::PAYMENT_SUCCESS);
            $notify = ['type' => 'paid', 'info' => $this->notificationPayload($order->MaDon, $amount)];

            return [
                'success' => true,
                'message' => 'Payment processed',
                'data' => [
                    'status' => 'paid',
                    'MaDon' => $order->MaDon,
                    'amount' => $amount,
                ],
            ];
        });

        $this->sendPaymentNotification($notify);

        return $result;
    }

    private function recalculateDiscount(DonDatTour $order): array
    {
        $discount = $this->promotionService->bestDiscountForTour($order->tour, (float) $order->TongTienGoc);
        $newAmount = (float) $discount['amount_after_discount'];
        $newPromotionId = $discount['type'] === 'CTKM' ? $discount['MaCTKM'] : null;

        if ((float) $order->TongTienPhaiTra !== $newAmount || (int) ($order->MaCTKM ?? 0) !== (int) ($newPromotionId ?? 0)) {
            $order->update([
                'TongTienPhaiTra' => $newAmount,
                'MaCTKM' => $newPromotionId,
            ]);
        }

        return $discount;
    }

    private function ownedOrderQuery(TaiKhoan $user, int $orderId)
    {
        return DonDatTour::query()
            ->where('MaDon', $orderId)
            ->whereHas('khachHang', fn ($query) => $query->where('MaTK', $user->MaTK));
    }

    private function orderPayload(DonDatTour $order): array
    {
        return [
            'MaDon' => $order->MaDon,
            'NgayDat' => $order->NgayDat,
            'SoLuongNguoiLon' => $order->SoLuongNguoiLon,
            'SoLuongTreEm' => $order->SoLuongTreEm,
            'SoLuongTreNho' => $order->SoLuongTreNho,
            'GiaNguoiLonApDung' => $order->GiaNguoiLonApDung,
            'GiaTreEmApDung' => $order->GiaTreEmApDung,
            'TongTienGoc' => $order->TongTienGoc,
            'TongTienPhaiTra' => $order->TongTienPhaiTra,
            'TrangThai' => $order->TrangThai,
            'MaTour' => $order->MaTour,
            'MaCTKM' => $order->MaCTKM,
        ];
    }

    private function tourPayload(?Tour $tour): ?array
    {
        if (! $tour) {
            return null;
        }

        return [
            'MaTour' => $tour->MaTour,
            'TenTour' => $tour->TenTour,
            'DiaDiem' => $tour->DiaDiem,
            'NgayKhoiHanh' => $tour->NgayKhoiHanh,
            'GiaGoc' => $tour->GiaGoc,
            'GiaGiam' => $tour->GiaGiam,
            'PhanTramGiam' => $tour->PhanTramGiam,
            'SoCho' => $tour->SoCho,
            'SoChoDaDat' => $tour->SoChoDaDat,
            'AnhChinh' => $tour->anhChinh?->DuongDan,
            'image_url' => $this->imageUrl($tour->anhChinh?->DuongDan),
        ];
    }

    private function vietQrPayload(DonDatTour $order): array
    {
        $amount = (int) round((float) $order->TongTienPhaiTra);
        $addInfo = 'DH'.$order->MaDon;
        $bankId = config('payment.vietqr.bank_id');
        $accountNo = config('payment.vietqr.account_no');
        $template = config('payment.vietqr.template', 'compact');
        $accountName = config('payment.vietqr.account_name');

        return [
            'amount' => $amount,
            'add_info' => $addInfo,
            'qr_url' => 'https://img.vietqr.io/image/'.urlencode((string) $bankId).'-'.urlencode((string) $accountNo).'-'.urlencode((string) $template).'.png?amount='.$amount.'&addInfo='.urlencode($addInfo).'&accountName='.urlencode((string) $accountName),
            'bank_id' => $bankId,
            'account_no' => $accountNo,
            'account_name' => $accountName,
        ];
    }

    private function statusCode(?string $status): string
    {
        return match ($status) {
            self::STATUS_PAID => 'paid',
            self::STATUS_SOLD_OUT => 'soldout',
            'Đã hủy' => 'cancelled',
            'Đã hoàn tiền' => 'refunded',
            default => 'pending',
        };
    }

    private function validWebhookToken(Request $request): bool
    {
        $expected = trim((string) config('payment.sepay.webhook_token', ''));
        if ($expected === '') {
            return true;
        }

        $authorization = trim((string) $request->header('Authorization', ''));
        $apiKey = trim((string) ($request->header('X-Api-Key') ?: $request->header('X-API-Key')));

        return $authorization === 'Bearer '.$expected
            || $authorization === $expected
            || $apiKey === $expected;
    }

    private function pickValue(array $payload, array $keys): mixed
    {
        foreach ($keys as $key) {
            if (array_key_exists($key, $payload) && $payload[$key] !== null && $payload[$key] !== '') {
                return $payload[$key];
            }
        }

        foreach ($payload as $value) {
            if (is_array($value)) {
                $found = $this->pickValue($value, $keys);
                if ($found !== null && $found !== '') {
                    return $found;
                }
            }
        }

        return null;
    }

    private function recordPayment(int $orderId, int $amount, string $status): void
    {
        ThanhToan::create([
            'NgayTT' => now()->toDateString(),
            'SoTien' => $amount,
            'PhuongThuc' => self::PAYMENT_METHOD,
            'TrangThaiTT' => $status,
            'MaDon' => $orderId,
        ]);
    }

    private function notificationPayload(int $orderId, int $amount): array
    {
        $order = DonDatTour::with(['khachHang.taiKhoan', 'tour'])->find($orderId);

        return [
            'MaDon' => $orderId,
            'amount' => $amount,
            'HoTen' => $order?->khachHang?->HoTen,
            'TenTour' => $order?->tour?->TenTour,
            'DiaDiem' => $order?->tour?->DiaDiem,
            'NgayKhoiHanh' => $order?->tour?->NgayKhoiHanh,
            'SoLuongNguoiLon' => $order?->SoLuongNguoiLon,
            'SoLuongTreEm' => $order?->SoLuongTreEm,
            'SoLuongTreNho' => $order?->SoLuongTreNho,
            'TongTienPhaiTra' => $order?->TongTienPhaiTra,
            'Email' => $order?->khachHang?->Email,
            'SoDienThoai' => $order?->khachHang?->SoDienThoai,
            'TenDangNhap' => $order?->khachHang?->taiKhoan?->TenDangNhap,
        ];
    }

    private function sendPaymentNotification(?array $notify): void
    {
        if (! $notify) {
            return;
        }

        try {
            if ($notify['type'] === 'paid') {
                $this->notificationService->sendPaymentPaid($notify['info']);
            } elseif ($notify['type'] === 'soldout') {
                $this->notificationService->sendPaymentSoldOut($notify['info']);
            }
        } catch (\Throwable) {
            // Notification failure must not break a committed payment webhook.
        }
    }

    private function imageUrl(?string $path): ?string
    {
        return $this->uploadService->publicUrl($path);
    }

    private function ignored(string $reason, array $extra = []): array
    {
        return [
            'success' => true,
            'message' => 'Ignored',
            'data' => array_merge(['reason' => $reason], $extra),
        ];
    }

    private function throwNotFound(): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Không tìm thấy dữ liệu',
            'errors' => [
                'order' => ['Đơn không tồn tại hoặc không thuộc người dùng hiện tại.'],
            ],
        ], 404));
    }
}
