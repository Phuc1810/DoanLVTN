<?php

namespace Tests\Feature;

use App\Models\KhachHang;
use App\Models\NhanVien;
use App\Models\TaiKhoan;
use App\Models\Tour;
use App\Models\YeuCauDoanhNghiep;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BusinessRequestApiTest extends TestCase
{
    use DatabaseTransactions;

    public function test_customer_can_create_business_request(): void
    {
        $user = $this->customerAccount();
        $tour = $this->businessTour(['SoCho' => 50, 'SoChoDaDat' => 5]);

        Sanctum::actingAs($user);

        $this->postJson('/api/business-requests', $this->payload(['MaTour' => $tour->MaTour, 'SoNguoi' => 20]))
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.TrangThai', 'Chờ xử lý')
            ->assertJsonPath('data.MaTour', $tour->MaTour);

        $this->assertSame(25, (int) $tour->refresh()->SoChoDaDat);
    }

    public function test_guest_cannot_create_business_request(): void
    {
        $this->postJson('/api/business-requests', $this->payload())
            ->assertUnauthorized();
    }

    public function test_non_customer_cannot_create_business_request(): void
    {
        Sanctum::actingAs($this->staffAccount());

        $this->postJson('/api/business-requests', $this->payload())
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_business_request_validation_requires_core_fields(): void
    {
        Sanctum::actingAs($this->customerAccount());

        $this->postJson('/api/business-requests', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['TenCongTy', 'NguoiLienHe', 'SDT', 'SoNguoi', 'ThoiGianKhoiHanh']);
    }

    public function test_not_enough_tour_seats_does_not_create_request(): void
    {
        $user = $this->customerAccount();
        $tour = $this->businessTour(['SoCho' => 25, 'SoChoDaDat' => 10]);

        Sanctum::actingAs($user);

        $this->postJson('/api/business-requests', $this->payload(['MaTour' => $tour->MaTour, 'SoNguoi' => 20]))
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertSame(10, (int) $tour->refresh()->SoChoDaDat);
    }

    public function test_staff_can_list_business_requests(): void
    {
        $request = $this->businessRequest();

        Sanctum::actingAs($this->staffAccount());

        $this->getJson('/api/staff/business-requests?q='.$request->MaYC)
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'items',
                    'pagination',
                ],
            ]);
    }

    public function test_staff_can_claim_unassigned_business_request(): void
    {
        $staff = $this->staffAccount();
        $request = $this->businessRequest(['MaNV' => null]);

        Sanctum::actingAs($staff);

        $this->patchJson("/api/staff/business-requests/{$request->MaYC}", ['action' => 'claim'])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.TrangThai', 'Đã liên hệ');

        $this->assertSame(
            NhanVien::where('MaTK', $staff->MaTK)->firstOrFail()->MaNV,
            $request->refresh()->MaNV
        );
    }

    public function test_staff_can_update_owned_business_request_status(): void
    {
        $staff = $this->staffAccount();
        $nhanVien = NhanVien::where('MaTK', $staff->MaTK)->firstOrFail();
        $request = $this->businessRequest(['MaNV' => $nhanVien->MaNV, 'TrangThai' => 'Đã liên hệ']);

        Sanctum::actingAs($staff);

        $this->patchJson("/api/staff/business-requests/{$request->MaYC}", [
            'action' => 'update_status',
            'TrangThai' => 'Hoàn thành',
            'GiaTriHopDong' => 10000000,
            'NgayThanhToan' => now()->toDateString(),
        ])
            ->assertOk()
            ->assertJsonPath('data.TrangThai', 'Hoàn thành')
            ->assertJsonPath('data.GiaTriHopDong', '10000000.00');
    }

    public function test_invalid_business_request_status_is_rejected(): void
    {
        $staff = $this->staffAccount();
        $nhanVien = NhanVien::where('MaTK', $staff->MaTK)->firstOrFail();
        $request = $this->businessRequest(['MaNV' => $nhanVien->MaNV]);

        Sanctum::actingAs($staff);

        $this->patchJson("/api/staff/business-requests/{$request->MaYC}", [
            'action' => 'update_status',
            'TrangThai' => 'Sai trạng thái',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['TrangThai']);
    }

    private function payload(array $overrides = []): array
    {
        $tour = $this->businessTour();

        return array_merge([
            'MaTour' => $tour->MaTour,
            'TenCongTy' => 'ABC Company',
            'NguoiLienHe' => 'Nguyen Van A',
            'SDT' => '0900000000',
            'SoNguoi' => 20,
            'ThoiGianKhoiHanh' => now()->addMonth()->toDateString(),
            'GhiChu' => 'Yeu cau rieng',
        ], $overrides);
    }

    private function customerAccount(): TaiKhoan
    {
        $user = TaiKhoan::create([
            'TenDangNhap' => 'business_kh_'.uniqid().'@example.com',
            'MatKhau' => 'unused',
            'VaiTro' => 'KH',
            'TrangThai' => 'Hoạt động',
            'Provider' => 'local',
        ]);

        KhachHang::create([
            'HoTen' => 'Khach Hang Business Test',
            'Email' => 'business_kh_'.uniqid().'@example.com',
            'SoDienThoai' => '0900000000',
            'DiaChi' => 'Test',
            'NgaySinh' => '1999-01-01',
            'GioiTinh' => 'Nam',
            'MaTK' => $user->MaTK,
        ]);

        return $user;
    }

    private function staffAccount(): TaiKhoan
    {
        $user = TaiKhoan::create([
            'TenDangNhap' => 'business_nv_'.uniqid(),
            'MatKhau' => 'unused',
            'VaiTro' => 'NV',
            'TrangThai' => 'Hoạt động',
            'Provider' => 'local',
        ]);

        NhanVien::create([
            'HoTen' => 'Nhan Vien Business Test',
            'Email' => 'business_nv_'.uniqid().'@example.com',
            'SDT' => '0987654321',
            'ChucVu' => 'Test',
            'MaTK' => $user->MaTK,
        ]);

        return $user;
    }

    private function businessRequest(array $overrides = []): YeuCauDoanhNghiep
    {
        $customer = KhachHang::where('MaTK', $this->customerAccount()->MaTK)->firstOrFail();

        return YeuCauDoanhNghiep::create(array_merge([
            'TenCongTy' => 'ABC Company',
            'NguoiLienHe' => 'Nguyen Van A',
            'SDT' => '0900000000',
            'SoNguoi' => 20,
            'ThoiGianKhoiHanh' => now()->addMonth()->toDateString(),
            'TrangThai' => 'Chờ xử lý',
            'MaKH' => $customer->MaKH,
            'MaNV' => null,
            'MaTour' => $this->businessTour()->MaTour,
        ], $overrides));
    }

    private function businessTour(array $overrides = []): Tour
    {
        $nhanVien = NhanVien::first() ?? NhanVien::create([
            'HoTen' => 'Nhan Vien Tour Business Test',
            'Email' => 'business_tour_nv_'.uniqid().'@example.com',
            'SDT' => '0987654321',
            'ChucVu' => 'Test',
            'MaTK' => TaiKhoan::create([
                'TenDangNhap' => 'business_tour_nv_'.uniqid(),
                'MatKhau' => 'unused',
                'VaiTro' => 'NV',
                'TrangThai' => 'Hoạt động',
                'Provider' => 'local',
            ])->MaTK,
        ]);

        return Tour::create(array_merge([
            'TenTour' => 'Tour Business Test '.uniqid(),
            'DiaDiem' => 'Ha Noi',
            'GiaGoc' => 1000000,
            'GiaGiam' => 900000,
            'ThoiLuong' => '1N',
            'NgayKhoiHanh' => now()->addMonth()->toDateString(),
            'NgayKetThuc' => now()->addMonth()->addDay()->toDateString(),
            'SoCho' => 50,
            'SoChoDaDat' => 0,
            'Mien' => 'Bắc',
            'LoaiTour' => 'Doanh nghiệp',
            'PhanTramGiam' => 10,
            'TrangThai' => 'Hoạt động',
            'MaNV' => $nhanVien->MaNV,
        ], $overrides));
    }
}
