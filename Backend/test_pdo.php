<?php
$host = '127.0.0.1';
$db   = 'tourdulich'; // Assuming this is the DB name
$user = 'root'; // Assuming root
$pass = ''; // Assuming empty

$dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];
try {
     $pdo = new PDO($dsn, $user, $pass, $options);
     $stmt = $pdo->query("SELECT MaTK, TenDangNhap, VaiTro FROM taikhoan WHERE VaiTro IN ('NV', 'AD')");
     $rows = $stmt->fetchAll();
     echo json_encode($rows, JSON_PRETTY_PRINT);
} catch (\PDOException $e) {
     echo "Connection failed: " . $e->getMessage();
}
