<?php
require __DIR__."/../vendor/autoload.php";
$app = require_once __DIR__."/../bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(Illuminate\Http\Request::capture());
$result = Illuminate\Support\Facades\DB::select("SHOW COLUMNS FROM hinhanhtour LIKE 'LoaiAnh'");
echo json_encode($result);
