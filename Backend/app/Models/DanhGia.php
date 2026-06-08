<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DanhGia extends Model
{
    protected $table = 'danhgia';

    protected $primaryKey = 'MaDG';

    public $timestamps = false;

    protected $fillable = [
        'SoSao',
        'NoiDung',
        'NgayDG',
        'MaKH',
        'MaTour',
    ];

    public function khachHang()
    {
        return $this->belongsTo(KhachHang::class, 'MaKH', 'MaKH');
    }

    public function tour()
    {
        return $this->belongsTo(Tour::class, 'MaTour', 'MaTour');
    }
}
