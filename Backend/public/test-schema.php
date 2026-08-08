<?php
require __DIR__."/../vendor/autoload.php";
$app = require_once __DIR__."/../bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(Illuminate\Http\Request::capture());
$columns = Illuminate\Support\Facades\Schema::getColumnListing("hinhanhtour");
$details = [];
foreach ($columns as $col) {
    $details[$col] = Illuminate\Support\Facades\Schema::getColumnType("hinhanhtour", $col);
}
echo json_encode($details);

