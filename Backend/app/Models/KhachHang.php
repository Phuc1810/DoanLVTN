<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KhachHang extends Model
{
    protected $table = 'khachhang';

    protected $primaryKey = 'MaKH';

    public $timestamps = false;

    protected $fillable = [
        'HoTen',
        'Email',
        'SoDienThoai',
        'DiaChi',
        'NgaySinh',
        'GioiTinh',
        'MaTK',
    ];

    public function taiKhoan()
    {
        return $this->belongsTo(TaiKhoan::class, 'MaTK', 'MaTK');
    }

    public function donDatTours()
    {
        return $this->hasMany(DonDatTour::class, 'MaKH', 'MaKH');
    }

    public function danhGias()
    {
        return $this->hasMany(DanhGia::class, 'MaKH', 'MaKH');
    }

    public function yeuCauDoanhNghieps()
    {
        return $this->hasMany(YeuCauDoanhNghiep::class, 'MaKH', 'MaKH');
    }
}
