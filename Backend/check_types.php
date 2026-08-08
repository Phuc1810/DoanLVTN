<?php 
require 'vendor/autoload.php'; 
$app = require_once 'bootstrap/app.php'; 
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap(); 
$types = App\Models\Tour::select('LoaiTour', 'TinhChatTour')->distinct()->get()->toArray(); 
echo json_encode($types, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
