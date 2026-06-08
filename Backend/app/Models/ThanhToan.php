<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ThanhToan extends Model
{
    protected $table = 'thanhtoan';

    protected $primaryKey = 'MaTT';

    public $timestamps = false;

    protected $fillable = [
        'NgayTT',
        'SoTien',
        'PhuongThuc',
        'TrangThaiTT',
        'MaDon',
    ];

    public function donDatTour()
    {
        return $this->belongsTo(DonDatTour::class, 'MaDon', 'MaDon');
    }
}
