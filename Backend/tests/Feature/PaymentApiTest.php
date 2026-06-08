<?php

namespace Tests\Feature;

use App\Models\ChuongTrinhKhuyenMai;
use App\Models\DonDatTour;
use App\Models\KhachHang;
use App\Models\NhanVien;
use App\Models\TaiKhoan;
use App\Models\ThanhToan;
use App\Models\Tour;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PaymentApiTest extends TestCase
{
    use DatabaseTransactions;

    public function test_customer_cannot_view_other_customer_payment(): void
    {
        $owner = $this->customerAccount();
        $other = $this->customerAccount();
        $order = $this->order($owner);

        Sanctum::actingAs($other);

        $this->getJson("/api/payments/{$order->MaDon}")
            ->assertNotFound()
            ->assertJsonPath('success', false);
    }

    public function test_payment_info_recalculates_best_discount_without_changing_schema(): void
    {
        $user = $this->customerAccount();
        $tour = $this->tour([
            'GiaGoc' => 1000000,
            'GiaGiam' => 900000,
            'PhanTramGiam' => 10,
        ]);
        $promotion = $this->promotion(['PhanTramGiam' => 30]);

        DB::table('tour_khuyenmai')->insert([
            'MaTour' => $tour->MaTour,
            'MaCTKM' => $promotion->MaCTKM,
            'PhanTramGiamKM' => 30,
        ]);

        $order = $this->order($user, [
            'MaTour' => $tour->MaTour,
            'TongTienGoc' => 1000000,
            'TongTienPhaiTra' => 1000000,
            'MaCTKM' => null,
        ]);

        Sanctum::actingAs($user);

        $this->getJson("/api/payments/{$order->MaDon}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.discount.type', 'CTKM')
            ->assertJsonPath('data.payment.amount', 700000);

        $order->refresh();

        $this->assertSame($promotion->MaCTKM, $order->MaCTKM);
        $this->assertSame(700000.0, (float) $order->TongTienPhaiTra);
    }

    public function test_check_payment_returns_pending_paid_and_soldout_statuses(): void
    {
        $user = $this->customerAccount();
        Sanctum::actingAs($user);

        $pending = $this->order($user, ['TrangThai' => 'Chờ thanh toán']);
        $paid = $this->order($user, ['TrangThai' => 'Đã thanh toán']);
        $soldOut = $this->order($user, ['TrangThai' => 'Hết chỗ']);

        $this->getJson("/api/payments/{$pending->MaDon}/check")
            ->assertOk()
            ->assertJsonPath('data.status', 'pending');

        $this->getJson("/api/payments/{$paid->MaDon}/check")
            ->assertOk()
            ->assertJsonPath('data.status', 'paid');

        $this->getJson("/api/payments/{$soldOut->MaDon}/check")
            ->assertOk()
            ->assertJsonPath('data.status', 'soldout');
    }

    public function test_sepay_webhook_ignores_payload_without_order_code(): void
    {
        $this->postJson('/api/webhooks/sepay', [
            'transferType' => 'in',
            'content' => 'Thanh toan khong co ma don',
            'transferAmount' => 1000000,
        ])
            ->assertOk()
            ->assertJsonPath('data.reason', 'no_DH_code');
    }

    public function test_sepay_webhook_ignores_amount_less_than_expected(): void
    {
        $user = $this->customerAccount();
        $order = $this->order($user, [
            'TongTienPhaiTra' => 900000,
            'TrangThai' => 'Chờ thanh toán',
        ]);

        $this->postJson('/api/webhooks/sepay', [
            'transferType' => 'in',
            'content' => 'Thanh toan DH'.$order->MaDon,
            'transferAmount' => 899999,
        ])
            ->assertOk()
            ->assertJsonPath('data.reason', 'amount_less_than_expected');

        $this->assertSame('Chờ thanh toán', $order->refresh()->TrangThai);
        $this->assertSame(0, ThanhToan::where('MaDon', $order->MaDon)->count());
    }

    public function test_sepay_webhook_paid_updates_order_tour_and_payment_record(): void
    {
        $user = $this->customerAccount();
        $tour = $this->tour([
            'SoCho' => 10,
            'SoChoDaDat' => 1,
            'TrangThai' => 'Hoạt động',
        ]);
        $order = $this->order($user, [
            'MaTour' => $tour->MaTour,
            'SoLuongNguoiLon' => 2,
            'SoLuongTreEm' => 1,
            'SoLuongTreNho' => 1,
            'TongTienPhaiTra' => 900000,
            'TrangThai' => 'Chờ thanh toán',
        ]);

        $this->postJson('/api/webhooks/sepay', [
            'transferType' => 'in',
            'content' => 'Thanh toan DH'.$order->MaDon,
            'transferAmount' => 900000,
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'paid');

        $this->assertSame('Đã thanh toán', $order->refresh()->TrangThai);
        $this->assertSame(5, (int) $tour->refresh()->SoChoDaDat);
        $this->assertDatabaseHas('thanhtoan', [
            'MaDon' => $order->MaDon,
            'SoTien' => 900000,
            'TrangThaiTT' => 'Thành công',
        ]);
    }

    public function test_sepay_webhook_soldout_does_not_increase_seats(): void
    {
        $user = $this->customerAccount();
        $tour = $this->tour([
            'SoCho' => 2,
            'SoChoDaDat' => 1,
            'TrangThai' => 'Hoạt động',
        ]);
        $order = $this->order($user, [
            'MaTour' => $tour->MaTour,
            'SoLuongNguoiLon' => 2,
            'SoLuongTreEm' => 0,
            'SoLuongTreNho' => 0,
            'TongTienPhaiTra' => 900000,
            'TrangThai' => 'Chờ thanh toán',
        ]);

        $this->postJson('/api/webhooks/sepay', [
            'transferType' => 'in',
            'content' => 'Thanh toan DH'.$order->MaDon,
            'transferAmount' => 900000,
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'soldout');

        $this->assertSame('Hết chỗ', $order->refresh()->TrangThai);
        $this->assertSame(1, (int) $tour->refresh()->SoChoDaDat);
        $this->assertDatabaseHas('thanhtoan', [
            'MaDon' => $order->MaDon,
            'SoTien' => 900000,
            'TrangThaiTT' => 'Nhận tiền - Hết chỗ',
        ]);
    }

    private function customerAccount(): TaiKhoan
    {
        $user = TaiKhoan::create([
            'TenDangNhap' => 'payment_'.uniqid().'@example.com',
            'MatKhau' => 'unused',
            'VaiTro' => 'KH',
            'TrangThai' => 'Hoạt động',
            'Provider' => 'local',
        ]);

        KhachHang::create([
            'HoTen' => 'Khach Hang Payment Test',
            'Email' => 'payment_kh_'.uniqid().'@example.com',
            'SoDienThoai' => '0900000000',
            'DiaChi' => 'Test',
            'NgaySinh' => '1999-01-01',
            'GioiTinh' => 'Nam',
            'MaTK' => $user->MaTK,
        ]);

        return $user;
    }

    private function order(TaiKhoan $user, array $overrides = []): DonDatTour
    {
        $customer = KhachHang::where('MaTK', $user->MaTK)->firstOrFail();
        $tour = isset($overrides['MaTour']) ? Tour::find($overrides['MaTour']) : $this->tour();

        return DonDatTour::create(array_merge([
            'NgayDat' => now()->toDateString(),
            'SoLuongNguoiLon' => 1,
            'SoLuongTreEm' => 0,
            'SoLuongTreNho' => 0,
            'GiaNguoiLonApDung' => 1000000,
            'GiaTreEmApDung' => 700000,
            'TongTienGoc' => 1000000,
            'TongTienPhaiTra' => 900000,
            'TrangThai' => 'Chờ thanh toán',
            'MaKH' => $customer->MaKH,
            'MaTour' => $tour->MaTour,
            'MaCTKM' => null,
        ], $overrides));
    }

    private function tour(array $overrides = []): Tour
    {
        $nhanVien = NhanVien::first() ?? NhanVien::create([
            'HoTen' => 'Nhan Vien Payment Test',
            'Email' => 'payment_nv_'.uniqid().'@example.com',
            'SDT' => '0987654321',
            'ChucVu' => 'Test',
            'MaTK' => TaiKhoan::create([
                'TenDangNhap' => 'payment_nv_'.uniqid().'@example.com',
                'MatKhau' => 'unused',
                'VaiTro' => 'NV',
                'TrangThai' => 'Hoạt động',
                'Provider' => 'local',
            ])->MaTK,
        ]);

        return Tour::create(array_merge([
            'TenTour' => 'Tour Payment Test '.uniqid(),
            'DiaDiem' => 'Ha Noi',
            'GiaGoc' => 1000000,
            'GiaGiam' => 900000,
            'ThoiLuong' => '1N',
            'NgayKhoiHanh' => now()->addMonth()->toDateString(),
            'NgayKetThuc' => now()->addMonth()->toDateString(),
            'SoCho' => 10,
            'SoChoDaDat' => 0,
            'Mien' => 'Bắc',
            'LoaiTour' => 'Cá nhân',
            'PhanTramGiam' => 10,
            'TrangThai' => 'Hoạt động',
            'MaNV' => $nhanVien->MaNV,
        ], $overrides));
    }

    private function promotion(array $overrides = []): ChuongTrinhKhuyenMai
    {
        return ChuongTrinhKhuyenMai::create(array_merge([
            'TenKM' => 'Khuyen mai Payment Test '.uniqid(),
            'NoiDung' => 'Test',
            'AnhDaiDien' => null,
            'PhanTramGiam' => 30,
            'NgayBatDau' => now()->subDay()->toDateString(),
            'NgayKetThuc' => now()->addDay()->toDateString(),
            'TrangThai' => 'Hoạt động',
        ], $overrides));
    }
}
