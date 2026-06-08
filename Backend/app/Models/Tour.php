<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tour extends Model
{
    protected $table = 'tour';

    protected $primaryKey = 'MaTour';

    public $timestamps = false;

    protected $fillable = [
        'TenTour',
        'DiaDiem',
        'GiaGoc',
        'GiaGiam',
        'ThoiLuong',
        'NgayKhoiHanh',
        'NgayKetThuc',
        'SoCho',
        'SoChoDaDat',
        'Mien',
        'LoaiTour',
        'PhanTramGiam',
        'TrangThai',
        'MaNV',
    ];

    public function nhanVien()
    {
        return $this->belongsTo(NhanVien::class, 'MaNV', 'MaNV');
    }

    public function hinhAnhs()
    {
        return $this->hasMany(HinhAnhTour::class, 'MaTour', 'MaTour');
    }

    public function anhChinh()
    {
        return $this->hasOne(HinhAnhTour::class, 'MaTour', 'MaTour')->where('LaAnhChinh', 1);
    }

    public function lichTrinhs()
    {
        return $this->hasMany(LichTrinhTour::class, 'MaTour', 'MaTour');
    }

    public function donDatTours()
    {
        return $this->hasMany(DonDatTour::class, 'MaTour', 'MaTour');
    }

    public function danhGias()
    {
        return $this->hasMany(DanhGia::class, 'MaTour', 'MaTour');
    }

    public function khuyenMais()
    {
        return $this->belongsToMany(
            ChuongTrinhKhuyenMai::class,
            'tour_khuyenmai',
            'MaTour',
            'MaCTKM',
            'MaTour',
            'MaCTKM'
        )->withPivot('PhanTramGiamKM');
    }

    public function yeuCauDoanhNghieps()
    {
        return $this->hasMany(YeuCauDoanhNghiep::class, 'MaTour', 'MaTour');
    }
}
