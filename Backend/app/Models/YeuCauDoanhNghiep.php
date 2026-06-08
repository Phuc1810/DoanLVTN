<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class YeuCauDoanhNghiep extends Model
{
    protected $table = 'yeucaudoanhnghiep';

    protected $primaryKey = 'MaYC';

    public $timestamps = false;

    protected $fillable = [
        'TenCongTy',
        'NguoiLienHe',
        'SDT',
        'SoNguoi',
        'DiaDiem',
        'ThoiGianKhoiHanh',
        'NgayKetThuc',
        'GiaTriHopDong',
        'NgayThanhToan',
        'TrangThai',
        'MaKH',
        'MaNV',
        'MaTour',
    ];

    public function khachHang()
    {
        return $this->belongsTo(KhachHang::class, 'MaKH', 'MaKH');
    }

    public function nhanVien()
    {
        return $this->belongsTo(NhanVien::class, 'MaNV', 'MaNV');
    }

    public function tour()
    {
        return $this->belongsTo(Tour::class, 'MaTour', 'MaTour');
    }
}
