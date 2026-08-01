<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Services\CalendarService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CalendarController extends Controller
{
    public function __construct(private CalendarService $calendarService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $start = $request->query('start');
        $end = $request->query('end');

        if (!$start || !$end) {
            $start = Carbon::now()->startOfMonth()->format('Y-m-d');
            $end = Carbon::now()->endOfMonth()->format('Y-m-d');
        }

        try {
            // Validate basic date format to avoid Carbon parse errors
            Carbon::parse($start);
            Carbon::parse($end);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid date format for start or end parameters.',
            ], 400);
        }

        $events = $this->calendarService->getEvents($start, $end);

        return response()->json([
            'success' => true,
            'data' => $events,
        ]);
    }
}
