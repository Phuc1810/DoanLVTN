<?php

namespace Tests\Feature;

use App\Models\DonDatTour;
use App\Models\KhachHang;
use App\Models\NhanVien;
use App\Models\TaiKhoan;
use App\Models\Tour;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BookingApiTest extends TestCase
{
    use DatabaseTransactions;

    public function test_guest_cannot_create_booking(): void
    {
        $this->postJson('/api/bookings', $this->validPayload())
            ->assertUnauthorized()
            ->assertJsonPath('success', false);
    }

    public function test_non_customer_cannot_create_booking(): void
    {
        $user = TaiKhoan::create([
            'TenDangNhap' => 'booking_nv_'.uniqid(),
            'MatKhau' => 'unused',
            'VaiTro' => 'NV',
            'TrangThai' => 'Hoạt động',
            'Provider' => 'local',
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/bookings', $this->validPayload())
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_inactive_tour_cannot_be_booked(): void
    {
        Sanctum::actingAs($this->customerAccount());

        $tour = $this->tour(['TrangThai' => 'Tạm ngưng']);

        $this->postJson('/api/bookings', $this->validPayload(['MaTour' => $tour->MaTour]))
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_missing_tour_returns_not_found(): void
    {
        Sanctum::actingAs($this->customerAccount());

        $this->postJson('/api/bookings', $this->validPayload(['MaTour' => 2147483647]))
            ->assertNotFound()
            ->assertJsonPath('success', false);
    }

    public function test_invalid_customer_and_quantity_data_returns_validation_errors(): void
    {
        Sanctum::actingAs($this->customerAccount());

        $this->postJson('/api/bookings', $this->validPayload([
            'SoLuongNguoiLon' => 0,
            'Email' => 'email-sai',
            'SoDienThoai' => '123',
            'NgaySinh' => now()->addDay()->toDateString(),
        ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'SoLuongNguoiLon',
                'Email',
                'SoDienThoai',
                'NgaySinh',
            ]);
    }

    public function test_infant_quantity_cannot_exceed_two_per_adult(): void
    {
        Sanctum::actingAs($this->customerAccount());

        $this->postJson('/api/bookings', $this->validPayload([
            'SoLuongNguoiLon' => 1,
            'SoLuongTreNho' => 3,
        ]))
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['SoLuongTreNho']);
    }

    public function test_customer_can_create_pending_payment_booking(): void
    {
        $user = $this->customerAccount();
        Sanctum::actingAs($user);

        $tour = Tour::where('TrangThai', 'Hoạt động')
            ->whereColumn('SoChoDaDat', '<', 'SoCho')
            ->orderBy('MaTour')
            ->first();

        if (! $tour) {
            $this->markTestSkipped('Không có tour hoạt động còn chỗ trong database test.');
        }

        $bookedSeatsBefore = (int) $tour->SoChoDaDat;
        $expectedAdultPrice = (float) $tour->GiaGoc;
        $expectedChildPrice = round($expectedAdultPrice * 0.7);
        $expectedTotal = (2 * $expectedAdultPrice) + $expectedChildPrice;

        $response = $this->postJson('/api/bookings', $this->validPayload([
            'MaTour' => $tour->MaTour,
            'SoLuongNguoiLon' => 2,
            'SoLuongTreEm' => 1,
            'SoLuongTreNho' => 1,
            'GiaNguoiLonApDung' => 1,
            'GiaTreEmApDung' => 1,
            'TongTienGoc' => 1,
            'TongTienPhaiTra' => 1,
        ]));

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.TrangThai', 'Chờ thanh toán');

        $this->assertDatabaseHas('dondattour', [
            'MaDon' => $response->json('data.MaDon'),
            'TrangThai' => 'Chờ thanh toán',
            'MaTour' => $tour->MaTour,
        ]);

        $this->assertSame(
            'Chờ thanh toán',
            DonDatTour::find($response->json('data.MaDon'))->TrangThai
        );

        $booking = DonDatTour::findOrFail($response->json('data.MaDon'));
        $this->assertSame($expectedAdultPrice, (float) $booking->GiaNguoiLonApDung);
        $this->assertSame((float) $expectedChildPrice, (float) $booking->GiaTreEmApDung);
        $this->assertSame((float) $expectedTotal, (float) $booking->TongTienGoc);
        $this->assertSame((float) $expectedTotal, (float) $booking->TongTienPhaiTra);
        $this->assertNull($booking->MaCTKM);
        $this->assertSame($bookedSeatsBefore, (int) $tour->refresh()->SoChoDaDat);
    }

    public function test_booking_creates_customer_for_customer_account_without_profile(): void
    {
        $user = TaiKhoan::create([
            'TenDangNhap' => 'booking_without_profile_'.uniqid(),
            'MatKhau' => 'unused',
            'VaiTro' => 'KH',
            'TrangThai' => 'Hoạt động',
            'Provider' => 'local',
        ]);
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/bookings', $this->validPayload());

        $response->assertCreated();
        $customer = KhachHang::where('MaTK', $user->MaTK)->firstOrFail();
        $this->assertSame('Nguyen Van Test', $customer->HoTen);
        $this->assertSame($customer->MaKH, $response->json('data.MaKH'));
    }

    private function validPayload(array $overrides = []): array
    {
        $tour = Tour::where('TrangThai', 'Hoạt động')->orderBy('MaTour')->first();

        return array_merge([
            'MaTour' => $tour?->MaTour ?? 1,
            'SoLuongNguoiLon' => 1,
            'SoLuongTreEm' => 0,
            'SoLuongTreNho' => 0,
            'HoTen' => 'Nguyen Van Test',
            'Email' => 'booking-test@example.com',
            'SoDienThoai' => '0912345678',
            'DiaChi' => '123 Test Street',
            'NgaySinh' => '2000-01-01',
            'GioiTinh' => 'Nam',
        ], $overrides);
    }

    private function customerAccount(): TaiKhoan
    {
        $user = TaiKhoan::create([
            'TenDangNhap' => 'booking_kh_'.uniqid(),
            'MatKhau' => 'unused',
            'VaiTro' => 'KH',
            'TrangThai' => 'Hoạt động',
            'Provider' => 'local',
        ]);

        KhachHang::create([
            'HoTen' => 'Khach Hang Test',
            'Email' => 'kh_'.uniqid().'@example.com',
            'SoDienThoai' => '0900000000',
            'DiaChi' => 'Test',
            'NgaySinh' => '1999-01-01',
            'GioiTinh' => 'Nam',
            'MaTK' => $user->MaTK,
        ]);

        return $user;
    }

    private function tour(array $overrides = []): Tour
    {
        $nhanVien = NhanVien::first() ?? NhanVien::create([
            'HoTen' => 'Nhan Vien Test',
            'Email' => 'nv_'.uniqid().'@example.com',
            'SDT' => '0987654321',
            'ChucVu' => 'Test',
            'MaTK' => TaiKhoan::create([
                'TenDangNhap' => 'booking_nv_tour_'.uniqid(),
                'MatKhau' => 'unused',
                'VaiTro' => 'NV',
                'TrangThai' => 'Hoạt động',
                'Provider' => 'local',
            ])->MaTK,
        ]);

        return Tour::create(array_merge([
            'TenTour' => 'Tour Test '.uniqid(),
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
            'MaNV' => $nhanVien?->MaNV,
        ], $overrides));
    }
}
