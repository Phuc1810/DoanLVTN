<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HinhAnhTour extends Model
{
    protected $table = 'hinhanhtour';

    protected $primaryKey = 'MaAnh';

    public $timestamps = false;

    protected $fillable = [
        'DuongDan',
        'LaAnhChinh',
        'LoaiAnh',
        'MaTour',
    ];

    public function tour()
    {
        return $this->belongsTo(Tour::class, 'MaTour', 'MaTour');
    }
}
