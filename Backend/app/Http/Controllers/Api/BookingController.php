<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Booking\StoreBookingRequest;
use App\Services\BookingService;
use Illuminate\Database\QueryException;

class BookingController extends Controller
{
    public function __construct(private BookingService $bookingService)
    {
    }

    public function store(StoreBookingRequest $request)
    {
        try {
            $booking = $this->bookingService->createPersonalBooking($request->user(), $request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Đặt tour thành công, vui lòng thanh toán',
                'data' => $booking,
            ], 201);
        } catch (QueryException $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' => 'Không thể lưu đơn đặt tour. Vui lòng thử lại.',
                'errors' => [
                    'booking' => ['Tạo đơn đặt tour thất bại.'],
                ],
            ], 500);
        }
    }
}
