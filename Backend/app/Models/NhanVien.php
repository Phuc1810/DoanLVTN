<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NhanVien extends Model
{
    protected $table = 'nhanvien';

    protected $primaryKey = 'MaNV';

    public $timestamps = false;

    protected $fillable = [
        'HoTen',
        'Email',
        'SDT',
        'ChucVu',
        'MaTK',
    ];

    public function taiKhoan()
    {
        return $this->belongsTo(TaiKhoan::class, 'MaTK', 'MaTK');
    }

    public function tours()
    {
        return $this->hasMany(Tour::class, 'MaNV', 'MaNV');
    }

    public function tinTucs()
    {
        return $this->hasMany(TinTuc::class, 'MaNV', 'MaNV');
    }

    public function yeuCauDoanhNghieps()
    {
        return $this->hasMany(YeuCauDoanhNghiep::class, 'MaNV', 'MaNV');
    }
}
