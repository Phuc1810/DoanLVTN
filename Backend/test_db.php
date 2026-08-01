<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$notifications = \Illuminate\Support\Facades\DB::table('notifications')->get();
echo json_encode($notifications, JSON_PRETTY_PRINT);
