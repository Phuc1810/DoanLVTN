<?php

namespace Tests\Feature;

use App\Models\HinhAnhTour;
use App\Models\KhachHang;
use App\Models\LichTrinhTour;
use App\Models\NhanVien;
use App\Models\TaiKhoan;
use App\Models\Tour;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StaffTourApiTest extends TestCase
{
    use DatabaseTransactions;

    public function test_guest_cannot_access_staff_tours(): void
    {
        $this->getJson('/api/staff/tours')
            ->assertUnauthorized();
    }

    public function test_customer_cannot_access_staff_tours(): void
    {
        Sanctum::actingAs($this->customerAccount());

        $this->getJson('/api/staff/tours')
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_staff_can_list_tours(): void
    {
        $tour = $this->tour();

        Sanctum::actingAs($this->staffAccount());

        $this->getJson('/api/staff/tours?q=#'.$tour->MaTour)
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'items',
                    'pagination',
                ],
            ]);
    }

    public function test_store_tour_validates_required_fields(): void
    {
        Sanctum::actingAs($this->staffAccount());

        $this->postJson('/api/staff/tours', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['TenTour', 'GiaGoc', 'SoCho', 'NgayKhoiHanh', 'AnhChinh', 'lich_trinh']);
    }

    public function test_staff_can_create_tour_with_main_image_and_schedules(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($this->staffAccount());

        $response = $this->withHeader('Accept', 'application/json')->post('/api/staff/tours', array_merge($this->payload(), [
            'AnhChinh' => UploadedFile::fake()->image('tour.jpg', 800, 600),
        ]));

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.SoChoDaDat', 0);

        $tourId = $response->json('data.MaTour');
        $this->assertDatabaseHas('tour', ['MaTour' => $tourId, 'TenTour' => 'Tour Staff Test']);
        $this->assertDatabaseHas('hinhanhtour', ['MaTour' => $tourId, 'LaAnhChinh' => 1]);
        $this->assertDatabaseHas('lichtrinhtour', ['MaTour' => $tourId, 'NgayThu' => 1]);
    }

    public function test_update_tour_keeps_old_image_when_no_new_upload(): void
    {
        $tour = $this->tour();
        $image = HinhAnhTour::create([
            'DuongDan' => 'img/old.jpg',
            'LaAnhChinh' => 1,
            'LoaiAnh' => 'banner',
            'MaTour' => $tour->MaTour,
        ]);

        Sanctum::actingAs($this->staffAccount());

        $this->putJson("/api/staff/tours/{$tour->MaTour}", $this->payload([
            'TenTour' => 'Tour Updated',
            'LoaiAnh' => 'noibat',
        ]))
            ->assertOk()
            ->assertJsonPath('data.TenTour', 'Tour Updated');

        $image->refresh();

        $this->assertSame('img/old.jpg', $image->DuongDan);
        $this->assertSame('noibat', $image->LoaiAnh);
    }

    public function test_update_tour_replaces_schedules(): void
    {
        $tour = $this->tour();
        LichTrinhTour::create([
            'NgayThu' => 9,
            'TieuDe' => 'Old',
            'NoiDung' => 'Old content',
            'MaTour' => $tour->MaTour,
        ]);

        Sanctum::actingAs($this->staffAccount());

        $this->putJson("/api/staff/tours/{$tour->MaTour}", $this->payload([
            'lich_trinh' => [
                ['NgayThu' => 1, 'TieuDe' => 'New day', 'NoiDung' => 'New content'],
            ],
        ]))
            ->assertOk();

        $this->assertDatabaseMissing('lichtrinhtour', ['MaTour' => $tour->MaTour, 'TieuDe' => 'Old']);
        $this->assertDatabaseHas('lichtrinhtour', ['MaTour' => $tour->MaTour, 'TieuDe' => 'New day']);
    }

    public function test_toggle_tour_status_uses_legacy_logic(): void
    {
        $tour = $this->tour(['TrangThai' => 'Hết chỗ']);

        Sanctum::actingAs($this->staffAccount());

        $this->patchJson("/api/staff/tours/{$tour->MaTour}/toggle")
            ->assertOk()
            ->assertJsonPath('data.TrangThai', 'Ngừng hoạt động');

        $this->patchJson("/api/staff/tours/{$tour->MaTour}/toggle")
            ->assertOk()
            ->assertJsonPath('data.TrangThai', 'Hoạt động');
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'TenTour' => 'Tour Staff Test',
            'DiaDiem' => 'Ha Noi',
            'ThoiLuong' => '3N2D',
            'GiaGoc' => 1000000,
            'GiaGiam' => 900000,
            'PhanTramGiam' => 10,
            'SoCho' => 30,
            'Mien' => 'Bắc',
            'LoaiTour' => 'Cá nhân',
            'TrangThai' => 'Hoạt động',
            'NgayKhoiHanh' => now()->addMonth()->toDateString(),
            'NgayKetThuc' => now()->addMonth()->addDays(2)->toDateString(),
            'LoaiAnh' => 'banner',
            'lich_trinh' => [
                ['NgayThu' => 1, 'TieuDe' => 'Ngay 1', 'NoiDung' => 'Noi dung ngay 1'],
            ],
        ], $overrides);
    }

    private function staffAccount(): TaiKhoan
    {
        $user = TaiKhoan::create([
            'TenDangNhap' => 'staff_tour_nv_'.uniqid(),
            'MatKhau' => 'unused',
            'VaiTro' => 'NV',
            'TrangThai' => 'Hoạt động',
            'Provider' => 'local',
        ]);

        NhanVien::create([
            'HoTen' => 'Nhan Vien Staff Tour Test',
            'Email' => 'staff_tour_nv_'.uniqid().'@example.com',
            'SDT' => '0987654321',
            'ChucVu' => 'Test',
            'MaTK' => $user->MaTK,
        ]);

        return $user;
    }

    private function customerAccount(): TaiKhoan
    {
        $user = TaiKhoan::create([
            'TenDangNhap' => 'staff_tour_kh_'.uniqid(),
            'MatKhau' => 'unused',
            'VaiTro' => 'KH',
            'TrangThai' => 'Hoạt động',
            'Provider' => 'local',
        ]);

        KhachHang::create([
            'HoTen' => 'Khach Hang Staff Tour Test',
            'Email' => 'staff_tour_kh_'.uniqid().'@example.com',
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
            'HoTen' => 'Nhan Vien Tour Test',
            'Email' => 'staff_tour_seed_'.uniqid().'@example.com',
            'SDT' => '0987654321',
            'ChucVu' => 'Test',
            'MaTK' => TaiKhoan::create([
                'TenDangNhap' => 'staff_tour_seed_'.uniqid(),
                'MatKhau' => 'unused',
                'VaiTro' => 'NV',
                'TrangThai' => 'Hoạt động',
                'Provider' => 'local',
            ])->MaTK,
        ]);

        return Tour::create(array_merge([
            'TenTour' => 'Tour Seed Staff '.uniqid(),
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
}
