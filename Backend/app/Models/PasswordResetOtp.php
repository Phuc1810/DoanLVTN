<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PasswordResetOtp extends Model
{
    protected $table = 'password_reset_otp';

    protected $primaryKey = 'id';

    public $timestamps = false;

    protected $fillable = [
        'MaTK',
        'channel',
        'destination',
        'otp_hash',
        'expires_at',
        'attempts',
        'created_at',
        'used_at',
    ];

    protected $hidden = [
        'otp_hash',
    ];

    public function taiKhoan()
    {
        return $this->belongsTo(TaiKhoan::class, 'MaTK', 'MaTK');
    }
}
