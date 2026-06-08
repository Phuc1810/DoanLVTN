<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Booking\StoreBookingRequest;
use App\Services\BookingService;

class BookingController extends Controller
{
    public function __construct(private BookingService $bookingService)
    {
    }

    public function store(StoreBookingRequest $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Đặt tour thành công, vui lòng thanh toán',
            'data' => $this->bookingService->createPersonalBooking($request->user(), $request->validated()),
        ], 201);
    }
}
