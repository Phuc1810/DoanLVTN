<?php 
require 'vendor/autoload.php'; 
$app = require_once 'bootstrap/app.php'; 
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap(); 

$svc = app(App\Services\AdminAccountService::class);
$reqs = [
    ['start' => '2026-08-27', 'end' => '2026-08-29'],
    ['start' => '2026-08-20', 'end' => '2026-08-22']
];

foreach ($reqs as $req) {
    echo "Eligible staff for " . $req['start'] . " to " . $req['end'] . ":\n";
    $staff = $svc->getEligibleStaff($req['start'], $req['end']);
    echo json_encode($staff, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";
}
