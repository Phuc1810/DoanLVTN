<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PaymentService;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(private PaymentService $paymentService)
    {
    }

    public function show(Request $request, int $orderId)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy thông tin thanh toán thành công',
            'data' => $this->paymentService->paymentInfo($request->user(), $orderId),
        ]);
    }

    public function check(Request $request, int $orderId)
    {
        return response()->json([
            'success' => true,
            'message' => 'Kiểm tra trạng thái thanh toán thành công',
            'data' => $this->paymentService->checkStatus($request->user(), $orderId),
        ]);
    }

    public function sepayWebhook(Request $request)
    {
        $result = $this->paymentService->handleSepayWebhook($request);

        return response()->json($result);
    }

    public function sepayRefundWebhook(Request $request)
    {
        $result = $this->paymentService->handleSepayRefundWebhook($request);

        return response()->json($result);
    }
}
