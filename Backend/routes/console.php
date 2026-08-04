<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Mỗi phút, quét và huỷ các đơn hàng "Chờ thanh toán" đã quá 15 phút
Schedule::command('orders:cancel-unpaid')->everyMinute();

// Quét và tự động đúc các tour định kỳ cho 4 tuần tới
Schedule::command('tour:generate-clones')->dailyAt('00:00');
