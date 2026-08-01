<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
use Illuminate\Support\Facades\DB;

$type = DB::getSchemaBuilder()->getColumnType('dondattour', 'NgayDat');
echo "TYPE: " . $type . "\n";

if (strpos(strtolower($type), 'date') !== false && strpos(strtolower($type), 'datetime') === false) {
    echo "Changing to DATETIME...\n";
    DB::statement('ALTER TABLE dondattour MODIFY NgayDat DATETIME');
    echo "Changed.\n";
}
