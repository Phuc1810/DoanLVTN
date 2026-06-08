<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChuongTrinhKhuyenMai extends Model
{
    protected $table = 'chuongtrinhkhuyenmai';

    protected $primaryKey = 'MaCTKM';

    public $timestamps = false;

    protected $fillable = [
        'TenKM',
        'NoiDung',
        'AnhDaiDien',
        'PhanTramGiam',
        'NgayBatDau',
        'NgayKetThuc',
        'TrangThai',
    ];

    public function donDatTours()
    {
        return $this->hasMany(DonDatTour::class, 'MaCTKM', 'MaCTKM');
    }

    public function tours()
    {
        return $this->belongsToMany(
            Tour::class,
            'tour_khuyenmai',
            'MaCTKM',
            'MaTour',
            'MaCTKM',
            'MaTour'
        )->withPivot('PhanTramGiamKM');
    }
}
