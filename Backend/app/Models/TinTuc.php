<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TinTuc extends Model
{
    protected $table = 'tintuc';

    protected $primaryKey = 'MaTin';

    public $timestamps = false;

    protected $fillable = [
        'TieuDe',
        'MoTa',
        'NoiDung',
        'LoaiTin',
        'AnhDaiDien',
        'NgayDang',
        'TrangThai',
        'MaNV',
        'LuotXem',
    ];

    public function nhanVien()
    {
        return $this->belongsTo(NhanVien::class, 'MaNV', 'MaNV');
    }

    public function binhLuans()
    {
        return $this->hasMany(BinhLuan::class, 'MaTin', 'MaTin');
    }
}
