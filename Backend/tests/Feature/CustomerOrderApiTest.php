<?php

namespace Tests\Feature;

use App\Models\ChuongTrinhKhuyenMai;
use App\Models\DonDatTour;
use App\Models\HoanTien;
use App\Models\KhachHang;
use App\Models\LichTrinhTour;
use App\Models\NhanVien;
use App\Models\TaiKhoan;
use App\Models\ThanhToan;
use App\Models\Tour;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerOrderApiTest extends TestCase
{
    use DatabaseTransactions;

    private static int $phoneSequence = 3000;

    public function test_guest_cannot_access_customer_orders(): void
    {
        $this->getJson('/api/orders')
            ->assertUnauthorized();
    }

    public function test_non_customer_cannot_access_customer_orders(): void
    {
        Sanctum::actingAs($this->staffAccount());

        $this->getJson('/api/orders')
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_customer_can_list_only_own_orders(): void
    {
        $owner = $this->customerAccount();
        $other = $this->customerAccount();
        $ownOrder = $this->order($owner);
        $otherOrder = $this->order($other);

        Sanctum::actingAs($owner);

        $response = $this->getJson('/api/orders')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'items',
                    'pagination',
                ],
            ]);

        $ids = collect($response->json('data.items'))->pluck('MaDon');

        $this->assertTrue($ids->contains($ownOrder->MaDon));
        $this->assertFalse($ids->contains($otherOrder->MaDon));
    }

    public function test_customer_can_filter_orders_by_status(): void
    {
        $user = $this->customerAccount();
        $paidOrder = $this->order($user, ['TrangThai' => 'Đã thanh toán']);
        $this->order($user, ['TrangThai' => 'Chờ thanh toán']);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/orders?status='.urlencode('Đã thanh toán'))
            ->assertOk()
            ->assertJsonPath('success', true);

        $ids = collect($response->json('data.items'))->pluck('MaDon');

        $this->assertTrue($ids->contains($paidOrder->MaDon));
    }

    public function test_customer_cannot_view_other_customer_order(): void
    {
        $owner = $this->customerAccount();
        $other = $this->customerAccount();
        $order = $this->order($owner);

        Sanctum::actingAs($other);

        $this->getJson("/api/orders/{$order->MaDon}")
            ->assertNotFound()
            ->assertJsonPath('success', false);
    }

    public function test_customer_can_view_order_detail_with_related_data(): void
    {
        $user = $this->customerAccount();
        $promotion = $this->promotion();
        $tour = $this->tour();
        LichTrinhTour::create([
            'NgayThu' => 1,
            'TieuDe' => 'Ngày 1',
            'NoiDung' => 'Lịch trình test',
            'MaTour' => $tour->MaTour,
        ]);
        $order = $this->order($user, [
            'MaTour' => $tour->MaTour,
            'MaCTKM' => $promotion->MaCTKM,
            'TrangThai' => 'Đã hoàn tiền',
        ]);
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

        Sanctum::actingAs($user);

        $this->getJson("/api/orders/{$order->MaDon}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.MaDon', $order->MaDon)
            ->assertJsonStructure([
                'data' => [
                    'khach_hang',
                    'tour' => [
                        'lich_trinh',
                    ],
                    'payments',
                    'refunds',
                    'promotion',
                ],
            ]);
    }

    public function test_order_detail_returns_404_when_not_found(): void
    {
        Sanctum::actingAs($this->customerAccount());

        $this->getJson('/api/orders/999999999')
            ->assertNotFound()
            ->assertJsonPath('success', false);
    }

    public function test_customer_order_status_sync_uses_legacy_date_rules_for_current_customer_only(): void
    {
        $owner = $this->customerAccount();
        $other = $this->customerAccount();
        $runningOrder = $this->order($owner, [
            'TrangThai' => 'Đã thanh toán',
        ], [
            'NgayKhoiHanh' => now()->subDay()->toDateString(),
            'NgayKetThuc' => now()->addDay()->toDateString(),
        ]);
        $doneOrder = $this->order($owner, [
            'TrangThai' => 'Đang diễn ra',
        ], [
            'NgayKhoiHanh' => now()->subDays(5)->toDateString(),
            'NgayKetThuc' => now()->subDay()->toDateString(),
        ]);
        $otherOrder = $this->order($other, [
            'TrangThai' => 'Đã thanh toán',
        ], [
            'NgayKhoiHanh' => now()->subDay()->toDateString(),
            'NgayKetThuc' => now()->addDay()->toDateString(),
        ]);

        Sanctum::actingAs($owner);

        $this->getJson('/api/orders')
            ->assertOk();

        $this->assertDatabaseHas('dondattour', [
            'MaDon' => $runningOrder->MaDon,
            'TrangThai' => 'Đang diễn ra',
        ]);
        $this->assertDatabaseHas('dondattour', [
            'MaDon' => $doneOrder->MaDon,
            'TrangThai' => 'Đã hoàn tất',
        ]);
        $this->assertDatabaseHas('dondattour', [
            'MaDon' => $otherOrder->MaDon,
            'TrangThai' => 'Đã thanh toán',
        ]);
    }

    private function order(TaiKhoan $user, array $orderOverrides = [], array $tourOverrides = []): DonDatTour
    {
        $customer = KhachHang::where('MaTK', $user->MaTK)->firstOrFail();
        $tour = isset($orderOverrides['MaTour']) ? Tour::findOrFail($orderOverrides['MaTour']) : $this->tour($tourOverrides);

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
            'HoTen' => 'Nhan Vien Customer Order Test',
            'Email' => 'customer_order_nv_'.uniqid().'@example.com',
            'SDT' => '0987654321',
            'ChucVu' => 'Test',
            'MaTK' => TaiKhoan::create([
                'TenDangNhap' => 'customer_order_nv_'.uniqid(),
                'MatKhau' => 'unused',
                'VaiTro' => 'NV',
                'TrangThai' => 'Hoạt động',
                'Provider' => 'local',
            ])->MaTK,
        ]);

        return Tour::create(array_merge([
            'TenTour' => 'Tour Customer Order Test '.uniqid(),
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

    private function promotion(array $overrides = []): ChuongTrinhKhuyenMai
    {
        return ChuongTrinhKhuyenMai::create(array_merge([
            'TenKM' => 'Khuyen mai Customer Order Test '.uniqid(),
            'NoiDung' => 'Test',
            'AnhDaiDien' => null,
            'PhanTramGiam' => 20,
            'NgayBatDau' => now()->subDay()->toDateString(),
            'NgayKetThuc' => now()->addDay()->toDateString(),
            'TrangThai' => 'Hoạt động',
        ], $overrides));
    }

    private function staffAccount(): TaiKhoan
    {
        $user = TaiKhoan::create([
            'TenDangNhap' => 'customer_order_nv_'.uniqid(),
            'MatKhau' => 'unused',
            'VaiTro' => 'NV',
            'TrangThai' => 'Hoạt động',
            'Provider' => 'local',
        ]);

        NhanVien::create([
            'HoTen' => 'Nhan Vien Customer Order Test',
            'Email' => 'customer_order_nv_'.uniqid().'@example.com',
            'SDT' => '0987654321',
            'ChucVu' => 'Test',
            'MaTK' => $user->MaTK,
        ]);

        return $user;
    }

    private function customerAccount(): TaiKhoan
    {
        $user = TaiKhoan::create([
            'TenDangNhap' => 'customer_order_kh_'.uniqid(),
            'MatKhau' => 'unused',
            'VaiTro' => 'KH',
            'TrangThai' => 'Hoạt động',
            'Provider' => 'local',
        ]);

        KhachHang::create([
            'HoTen' => 'Khach Hang Customer Order Test',
            'Email' => 'customer_order_kh_'.uniqid().'@example.com',
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
