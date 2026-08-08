<?php 
require 'vendor/autoload.php'; 
$app = require_once 'bootstrap/app.php'; 
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class); 
$kernel->bootstrap(); 
$service = app(\App\Services\StaffTourService::class); 
echo json_encode($service->statsForStaff(), JSON_PRETTY_PRINT);
