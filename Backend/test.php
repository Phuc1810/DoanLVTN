<?php require 'vendor/autoload.php'; require_once 'bootstrap/app.php'; echo json_encode(\App\Models\HinhAnhTour::whereIn('MaTour', [2, 44, 45, 46])->get()); ?>
