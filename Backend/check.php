<?php 
require 'vendor/autoload.php'; 
$app = require_once 'bootstrap/app.php'; 
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap(); 
$tk = App\Models\TaiKhoan::where('TenDangNhap', 'nhanvien02')->first(); 
if (!$tk) {
    echo "No account nhanvien02 found\n";
    exit;
}
$nv = $tk->nhanVien; 
if (!$nv) {
    echo "No nhanVien profile for nhanvien02\n";
    exit;
}
$reqs = App\Models\YeuCauDoanhNghiep::where('MaNV', $nv->MaNV)->get(); 
echo json_encode($reqs->toArray(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
