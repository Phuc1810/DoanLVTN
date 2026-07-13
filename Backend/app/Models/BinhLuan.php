<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BinhLuan extends Model
{
    protected $table = 'binhluan';

    protected $primaryKey = 'MaBL';

    public $timestamps = false;

    protected $fillable = [
        'MaTin',
        'MaKH',
        'NoiDung',
        'NgayBinhLuan',
        'TrangThai',
    ];

    public function tinTuc()
    {
        return $this->belongsTo(TinTuc::class, 'MaTin', 'MaTin');
    }

    public function khachHang()
    {
        return $this->belongsTo(KhachHang::class, 'MaKH', 'MaKH');
    }
}
