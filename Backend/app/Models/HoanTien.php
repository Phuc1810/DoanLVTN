<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HoanTien extends Model
{
    protected $table = 'hoantien';

    protected $primaryKey = 'MaHT';

    public $timestamps = false;

    protected $fillable = [
        'SoTienHoan',
        'PhanTramHoan',
        'NgayHoan',
        'LyDo',
        'MaDon',
        'NganHang',
        'SoTaiKhoan',
        'TenTaiKhoan',
    ];

    public function donDatTour()
    {
        return $this->belongsTo(DonDatTour::class, 'MaDon', 'MaDon');
    }
}
