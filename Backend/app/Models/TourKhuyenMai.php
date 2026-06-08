<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TourKhuyenMai extends Model
{
    protected $table = 'tour_khuyenmai';

    protected $primaryKey = 'MaTour';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'MaTour',
        'MaCTKM',
        'PhanTramGiamKM',
    ];

    public function tour()
    {
        return $this->belongsTo(Tour::class, 'MaTour', 'MaTour');
    }

    public function chuongTrinhKhuyenMai()
    {
        return $this->belongsTo(ChuongTrinhKhuyenMai::class, 'MaCTKM', 'MaCTKM');
    }
}
