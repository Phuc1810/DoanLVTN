<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LichSuXemTin extends Model
{
    protected $table = 'lichsuxemtin';

    public $timestamps = false;

    protected $fillable = [
        'MaTin',
        'IP',
        'NgayXem',
    ];

    protected $casts = [
        'NgayXem' => 'datetime',
    ];

    public function tinTuc()
    {
        return $this->belongsTo(TinTuc::class, 'MaTin', 'MaTin');
    }
}
