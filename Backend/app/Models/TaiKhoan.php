<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class TaiKhoan extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'taikhoan';

    protected $primaryKey = 'MaTK';

    public $timestamps = false;

    protected $fillable = [
        'TenDangNhap',
        'MatKhau',
        'VaiTro',
        'TrangThai',
        'Provider',
        'GoogleSub',
    ];

    protected $hidden = [
        'MatKhau',
    ];

    public function getAuthPassword()
    {
        return $this->MatKhau;
    }

    public function khachHang()
    {
        return $this->hasOne(KhachHang::class, 'MaTK', 'MaTK');
    }

    public function nhanVien()
    {
        return $this->hasOne(NhanVien::class, 'MaTK', 'MaTK');
    }

    public function admin()
    {
        return $this->hasOne(Admin::class, 'MaTK', 'MaTK');
    }

    public function passwordResetOtps()
    {
        return $this->hasMany(PasswordResetOtp::class, 'MaTK', 'MaTK');
    }
}
