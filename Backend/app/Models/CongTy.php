<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CongTy extends Model
{
    protected $table = 'congty';

    protected $primaryKey = 'MaCTY';

    public $timestamps = false;

    protected $fillable = [
        'TenCongTy',
        'DiaChi',
        'Email',
        'SoDienThoai',
        'Logo_1',
        'Logo_2',
    ];

    public function chiNhanhs()
    {
        return $this->hasMany(ChiNhanh::class, 'MaCTY', 'MaCTY');
    }
}
