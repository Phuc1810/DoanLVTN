<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DonDatTour extends Model
{
    protected $table = 'dondattour';

    protected $primaryKey = 'MaDon';

    public $timestamps = false;

    protected $fillable = [
        'NgayDat',
        'SoLuongNguoiLon',
        'SoLuongTreEm',
        'SoLuongTreNho',
        'GiaNguoiLonApDung',
        'GiaTreEmApDung',
        'TongTienGoc',
        'TongTienPhaiTra',
        'TrangThai',
        'MaKH',
        'MaTour',
        'MaCTKM',
    ];

    public function khachHang()
    {
        return $this->belongsTo(KhachHang::class, 'MaKH', 'MaKH');
    }

    public function tour()
    {
        return $this->belongsTo(Tour::class, 'MaTour', 'MaTour');
    }

    public function chuongTrinhKhuyenMai()
    {
        return $this->belongsTo(ChuongTrinhKhuyenMai::class, 'MaCTKM', 'MaCTKM');
    }

    public function thanhToans()
    {
        return $this->hasMany(ThanhToan::class, 'MaDon', 'MaDon');
    }

    public function hoanTiens()
    {
        return $this->hasMany(HoanTien::class, 'MaDon', 'MaDon');
    }
}
