<?php

namespace Tests\Feature;

use App\Models\HoanTien;
use App\Models\KhachHang;
use App\Models\NhanVien;
use App\Models\TaiKhoan;
use App\Models\ThanhToan;
use App\Models\Tour;
use App\Models\DonDatTour;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StaffOrderApiTest extends TestCase
{
    use DatabaseTransactions;

    private static int $phoneSequence = 1000;

    public function test_guest_cannot_access_staff_orders(): void
    {
        $this->getJson('/api/staff/orders')
            ->assertUnauthorized();
    }

    public function test_customer_cannot_access_staff_orders(): void
    {
        Sanctum::actingAs($this->customerAccount());

        $this->getJson('/api/staff/orders')
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_staff_can_list_orders(): void
    {
        $order = $this->order();
        ThanhToan::create([
            'NgayTT' => now()->toDateString(),
            'SoTien' => $order->TongTienPhaiTra,
            'PhuongThuc' => 'Chuyển khoản',
            'TrangThaiTT' => 'Thành công',
            'MaDon' => $order->MaDon,
        ]);

        Sanctum::actingAs($this->staffAccount());

        $this->getJson('/api/staff/orders?status=Chờ thanh toán')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'items',
                    'pagination',
                ],
            ]);
    }

    public function test_staff_can_search_orders_by_id_customer_and_tour(): void
    {
        $order = $this->order();

        Sanctum::actingAs($this->staffAccount());

        $this->getJson('/api/staff/orders?q='.$order->MaDon)
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->getJson('/api/staff/orders?q=Khach Hang Order Test')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->getJson('/api/staff/orders?q=Tour Order Seed')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_staff_can_view_order_detail_with_customer_tour_payment_and_refund(): void
    {
        $order = $this->order(['TrangThai' => 'Đã hoàn tiền']);
        ThanhToan::create([
            'NgayTT' => now()->toDateString(),
            'SoTien' => $order->TongTienPhaiTra,
            'PhuongThuc' => 'Chuyển khoản',
            'TrangThaiTT' => 'Thành công',
            'MaDon' => $order->MaDon,
        ]);
        HoanTien::create([
            'SoTienHoan' => 500000,
            'NgayHoan' => now()->toDateString(),
            'LyDo' => 'Test refund',
            'MaDon' => $order->MaDon,
        ]);

        Sanctum::actingAs($this->staffAccount());

        $this->getJson("/api/staff/orders/{$order->MaDon}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'MaDon',
                    'khach_hang',
                    'tour',
                    'payments',
                    'refunds',
                ],
            ]);
    }

    public function test_order_detail_returns_404_when_not_found(): void
    {
        Sanctum::actingAs($this->staffAccount());

        $this->getJson('/api/staff/orders/999999999')
            ->assertNotFound()
            ->assertJsonPath('success', false);
    }

    public function test_sync_order_status_by_date_uses_legacy_rules(): void
    {
        $runningOrder = $this->order([
            'TrangThai' => 'Đã thanh toán',
        ], [
            'NgayKhoiHanh' => now()->subDay()->toDateString(),
            'NgayKetThuc' => now()->addDay()->toDateString(),
        ]);
        $doneOrder = $this->order([
            'TrangThai' => 'Đang diễn ra',
        ], [
            'NgayKhoiHanh' => now()->subDays(5)->toDateString(),
            'NgayKetThuc' => now()->subDay()->toDateString(),
        ]);

        Sanctum::actingAs($this->staffAccount());

        $this->getJson('/api/staff/orders')
            ->assertOk();

        $this->assertDatabaseHas('dondattour', [
            'MaDon' => $runningOrder->MaDon,
            'TrangThai' => 'Đang diễn ra',
        ]);
        $this->assertDatabaseHas('dondattour', [
            'MaDon' => $doneOrder->MaDon,
            'TrangThai' => 'Đã hoàn tất',
        ]);
    }

    private function order(array $orderOverrides = [], array $tourOverrides = []): DonDatTour
    {
        $customer = $this->customerAccount()->khachHang;
        $tour = $this->tour($tourOverrides);

        return DonDatTour::create(array_merge([
            'NgayDat' => now()->toDateString(),
            'SoLuongNguoiLon' => 2,
            'SoLuongTreEm' => 1,
            'SoLuongTreNho' => 0,
            'GiaNguoiLonApDung' => 1000000,
            'GiaTreEmApDung' => 700000,
            'TongTienGoc' => 2700000,
            'TongTienPhaiTra' => 2500000,
            'TrangThai' => 'Chờ thanh toán',
            'MaKH' => $customer->MaKH,
            'MaTour' => $tour->MaTour,
            'MaCTKM' => null,
        ], $orderOverrides));
    }

    private function tour(array $overrides = []): Tour
    {
        $nhanVien = NhanVien::first() ?? NhanVien::create([
            'HoTen' => 'Nhan Vien Order Test',
            'Email' => 'staff_order_seed_'.uniqid().'@example.com',
            'SDT' => '0987654321',
            'ChucVu' => 'Test',
            'MaTK' => TaiKhoan::create([
                'TenDangNhap' => 'staff_order_seed_'.uniqid(),
                'MatKhau' => 'unused',
                'VaiTro' => 'NV',
                'TrangThai' => 'Hoạt động',
                'Provider' => 'local',
            ])->MaTK,
        ]);

        return Tour::create(array_merge([
            'TenTour' => 'Tour Order Seed '.uniqid(),
            'DiaDiem' => 'Ha Noi',
            'GiaGoc' => 1000000,
            'GiaGiam' => 900000,
            'ThoiLuong' => '3N2D',
            'NgayKhoiHanh' => now()->addMonth()->toDateString(),
            'NgayKetThuc' => now()->addMonth()->addDays(2)->toDateString(),
            'SoCho' => 30,
            'SoChoDaDat' => 0,
            'Mien' => 'Bắc',
            'LoaiTour' => 'Cá nhân',
            'PhanTramGiam' => 10,
            'TrangThai' => 'Hoạt động',
            'MaNV' => $nhanVien->MaNV,
        ], $overrides));
    }

    private function staffAccount(): TaiKhoan
    {
        $user = TaiKhoan::create([
            'TenDangNhap' => 'staff_order_nv_'.uniqid(),
            'MatKhau' => 'unused',
            'VaiTro' => 'NV',
            'TrangThai' => 'Hoạt động',
            'Provider' => 'local',
        ]);

        NhanVien::create([
            'HoTen' => 'Nhan Vien Staff Order Test',
            'Email' => 'staff_order_nv_'.uniqid().'@example.com',
            'SDT' => '0987654321',
            'ChucVu' => 'Test',
            'MaTK' => $user->MaTK,
        ]);

        return $user;
    }

    private function customerAccount(): TaiKhoan
    {
        $user = TaiKhoan::create([
            'TenDangNhap' => 'staff_order_kh_'.uniqid(),
            'MatKhau' => 'unused',
            'VaiTro' => 'KH',
            'TrangThai' => 'Hoạt động',
            'Provider' => 'local',
        ]);

        KhachHang::create([
            'HoTen' => 'Khach Hang Order Test',
            'Email' => 'staff_order_kh_'.uniqid().'@example.com',
            'SoDienThoai' => $this->uniquePhone(),
            'DiaChi' => 'Test',
            'NgaySinh' => '1999-01-01',
            'GioiTinh' => 'Nam',
            'MaTK' => $user->MaTK,
        ]);

        return $user;
    }

    private function uniquePhone(): string
    {
        return '09'.str_pad((string) self::$phoneSequence++, 8, '0', STR_PAD_LEFT);
    }
}
