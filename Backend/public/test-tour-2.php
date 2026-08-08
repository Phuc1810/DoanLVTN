<?php
require __DIR__."/../vendor/autoload.php";
$app = require_once __DIR__."/../bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(Illuminate\Http\Request::capture());
$tour = \App\Models\Tour::find(2);
echo json_encode(["TienDo" => $tour->TienDo, "TrangThai" => $tour->TrangThai, "NgayKhoiHanh" => $tour->NgayKhoiHanh, "NgayKetThuc" => $tour->NgayKetThuc, "TinhChatTour" => $tour->TinhChatTour]);

