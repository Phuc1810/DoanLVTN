<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tables = DB::select('SHOW TABLES');
$dbName = 'Tables_in_' . DB::connection()->getDatabaseName();

foreach ($tables as $table) {
    $tableName = $table->$dbName;
    echo "TABLE: $tableName\n";
    $columns = DB::select('SHOW COLUMNS FROM ' . $tableName);
    foreach ($columns as $col) {
        echo $col->Field . '|' . $col->Type . '|' . $col->Key . '|' . $col->Null . "\n";
    }
    echo "-----\n";
}
