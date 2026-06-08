<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChiNhanh extends Model
{
    protected $table = 'chinhanh';

    protected $primaryKey = 'MaCN';

    public $timestamps = false;

    protected $fillable = [
        'TenChiNhanh',
        'DiaChi',
        'SDT',
        'MaCTY',
    ];

    public function congTy()
    {
        return $this->belongsTo(CongTy::class, 'MaCTY', 'MaCTY');
    }
}
