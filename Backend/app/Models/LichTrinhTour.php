<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LichTrinhTour extends Model
{
    protected $table = 'lichtrinhtour';

    protected $primaryKey = 'MaLT';

    public $timestamps = false;

    protected $fillable = [
        'NgayThu',
        'TieuDe',
        'NoiDung',
        'MaTour',
    ];

    public function tour()
    {
        return $this->belongsTo(Tour::class, 'MaTour', 'MaTour');
    }
}
