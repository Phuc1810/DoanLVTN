<?php

namespace App\Services;

use App\Models\DonDatTour;
use App\Models\KhachHang;
use App\Models\TaiKhoan;
use App\Models\Tour;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingService
{
    private const ACTIVE_STATUS = 'Hoạt động';
    private const PENDING_PAYMENT_STATUS = 'Chờ thanh toán';
    private const CHILD_RATE = 0.7;

    public function createPersonalBooking(TaiKhoan $taiKhoan, array $data): array
    {
        $tour = Tour::where('MaTour', (int) $data['MaTour'])->first();

        if (! $tour) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Không tìm thấy dữ liệu',
                'errors' => [
                    'MaTour' => ['Tour không tồn tại.'],
                ],
            ], 404));
        }

        if ($tour->TrangThai !== self::ACTIVE_STATUS) {
            throw ValidationException::withMessages([
                'MaTour' => ['Tour không hoạt động.'],
            ]);
        }

        if ((int) $tour->SoChoDaDat >= (int) $tour->SoCho) {
            throw ValidationException::withMessages([
                'MaTour' => ['Tour đã hết chỗ.'],
            ]);
        }

        $soLuongNguoiLon = (int) $data['SoLuongNguoiLon'];
        $soLuongTreEm = (int) $data['SoLuongTreEm'];
        $soLuongTreNho = (int) $data['SoLuongTreNho'];

        $giaNguoiLonApDung = (float) $tour->GiaGoc;
        $giaTreEmApDung = round($giaNguoiLonApDung * self::CHILD_RATE);
        $tongTienGoc = ($soLuongNguoiLon * $giaNguoiLonApDung)
            + ($soLuongTreEm * $giaTreEmApDung);

        $maCtkm = isset($data['MaCTKM']) && (int) $data['MaCTKM'] > 0
            ? (int) $data['MaCTKM']
            : null;

        return DB::transaction(function () use (
            $taiKhoan,
            $data,
            $tour,
            $soLuongNguoiLon,
            $soLuongTreEm,
            $soLuongTreNho,
            $giaNguoiLonApDung,
            $giaTreEmApDung,
            $tongTienGoc,
            $maCtkm
        ) {
            $khachHang = $this->ensureCustomer($taiKhoan);

            $khachHang->update([
                'HoTen' => $data['HoTen'],
                'Email' => $data['Email'],
                'SoDienThoai' => $data['SoDienThoai'],
                'DiaChi' => $data['DiaChi'],
                'NgaySinh' => $data['NgaySinh'],
                'GioiTinh' => $data['GioiTinh'],
            ]);

            $donDatTour = DonDatTour::create([
                'NgayDat' => now()->toDateString(),
                'SoLuongNguoiLon' => $soLuongNguoiLon,
                'SoLuongTreEm' => $soLuongTreEm,
                'SoLuongTreNho' => $soLuongTreNho,
                'GiaNguoiLonApDung' => $giaNguoiLonApDung,
                'GiaTreEmApDung' => $giaTreEmApDung,
                'TongTienGoc' => $tongTienGoc,
                'TongTienPhaiTra' => $tongTienGoc,
                'TrangThai' => self::PENDING_PAYMENT_STATUS,
                'MaKH' => $khachHang->MaKH,
                'MaTour' => $tour->MaTour,
                'MaCTKM' => $maCtkm,
            ]);

            return [
                'MaDon' => $donDatTour->MaDon,
                'MaTour' => $donDatTour->MaTour,
                'MaKH' => $donDatTour->MaKH,
                'TrangThai' => $donDatTour->TrangThai,
                'TongTienGoc' => $donDatTour->TongTienGoc,
                'TongTienPhaiTra' => $donDatTour->TongTienPhaiTra,
                'payment_url' => '/api/payments/'.$donDatTour->MaDon,
            ];
        });
    }

    private function ensureCustomer(TaiKhoan $taiKhoan): KhachHang
    {
        $khachHang = KhachHang::where('MaTK', $taiKhoan->MaTK)->first();

        if ($khachHang) {
            return $khachHang;
        }

        return KhachHang::create([
            'HoTen' => $taiKhoan->khachHang?->HoTen ?? '',
            'Email' => $taiKhoan->khachHang?->Email ?? '',
            'SoDienThoai' => $taiKhoan->khachHang?->SoDienThoai ?? '',
            'DiaChi' => '',
            'MaTK' => $taiKhoan->MaTK,
        ]);
    }
}
