<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaiKhoan extends Model
{
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
