<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=tourdulich', 'root', '');
$stmt = $pdo->query('SELECT TrangThai, LoaiTour, NgayKhoiHanh FROM tour WHERE MaTour = 31');
print_r($stmt->fetch(PDO::FETCH_ASSOC));
