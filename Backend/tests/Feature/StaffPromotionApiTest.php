<?php

namespace Tests\Feature;

use App\Models\ChuongTrinhKhuyenMai;
use App\Models\KhachHang;
use App\Models\NhanVien;
use App\Models\TaiKhoan;
use App\Models\Tour;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StaffPromotionApiTest extends TestCase
{
    use DatabaseTransactions;

    public function test_guest_cannot_access_staff_promotions(): void
    {
        $this->getJson('/api/staff/promotions')
            ->assertUnauthorized();
    }

    public function test_customer_cannot_access_staff_promotions(): void
    {
        Sanctum::actingAs($this->customerAccount());

        $this->getJson('/api/staff/promotions')
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_staff_can_list_promotions(): void
    {
        $promotion = $this->promotion();

        Sanctum::actingAs($this->staffAccount());

        $this->getJson('/api/staff/promotions?q='.$promotion->MaCTKM)
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'items',
                    'pagination',
                ],
            ]);
    }

    public function test_store_promotion_validates_required_fields(): void
    {
        Sanctum::actingAs($this->staffAccount());

        $this->postJson('/api/staff/promotions', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['TenKM', 'PhanTramGiam', 'NgayBatDau', 'NgayKetThuc']);
    }

    public function test_staff_can_create_promotion_with_image_and_tours(): void
    {
        Storage::fake('public');
        $tour = $this->tour();

        Sanctum::actingAs($this->staffAccount());

        $response = $this->withHeader('Accept', 'application/json')->post('/api/staff/promotions', array_merge($this->payload(), [
            'AnhDaiDien' => UploadedFile::fake()->image('promotion.jpg', 800, 600),
            'tours' => [
                ['MaTour' => $tour->MaTour, 'PhanTramGiamKM' => 15],
            ],
        ]));

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.TenKM', 'Promotion Staff Test');

        $promotionId = $response->json('data.MaCTKM');
        $this->assertDatabaseHas('chuongtrinhkhuyenmai', ['MaCTKM' => $promotionId, 'TenKM' => 'Promotion Staff Test']);
        $this->assertDatabaseHas('tour_khuyenmai', [
            'MaCTKM' => $promotionId,
            'MaTour' => $tour->MaTour,
            'PhanTramGiamKM' => 15,
        ]);
    }

    public function test_update_promotion_keeps_old_image_and_replaces_tours(): void
    {
        $oldTour = $this->tour();
        $newTour = $this->tour();
        $promotion = $this->promotion(['AnhDaiDien' => 'storage/promotions/old.jpg']);
        DB::table('tour_khuyenmai')->insert([
            'MaCTKM' => $promotion->MaCTKM,
            'MaTour' => $oldTour->MaTour,
            'PhanTramGiamKM' => 5,
        ]);

        Sanctum::actingAs($this->staffAccount());

        $this->putJson("/api/staff/promotions/{$promotion->MaCTKM}", $this->payload([
            'TenKM' => 'Promotion Updated',
            'tours' => [
                ['MaTour' => $newTour->MaTour, 'PhanTramGiamKM' => 20],
            ],
        ]))
            ->assertOk()
            ->assertJsonPath('data.TenKM', 'Promotion Updated')
            ->assertJsonPath('data.AnhDaiDien', 'storage/promotions/old.jpg');

        $this->assertDatabaseMissing('tour_khuyenmai', ['MaCTKM' => $promotion->MaCTKM, 'MaTour' => $oldTour->MaTour]);
        $this->assertDatabaseHas('tour_khuyenmai', [
            'MaCTKM' => $promotion->MaCTKM,
            'MaTour' => $newTour->MaTour,
            'PhanTramGiamKM' => 20,
        ]);
    }

    public function test_staff_can_attach_and_detach_tour_from_promotion(): void
    {
        $tour = $this->tour();
        $promotion = $this->promotion();

        Sanctum::actingAs($this->staffAccount());

        $this->postJson("/api/staff/promotions/{$promotion->MaCTKM}/tours", [
            'tours' => [
                ['MaTour' => $tour->MaTour, 'PhanTramGiamKM' => 25],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('tour_khuyenmai', [
            'MaCTKM' => $promotion->MaCTKM,
            'MaTour' => $tour->MaTour,
            'PhanTramGiamKM' => 25,
        ]);

        $this->deleteJson("/api/staff/promotions/{$promotion->MaCTKM}/tours/{$tour->MaTour}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('tour_khuyenmai', ['MaCTKM' => $promotion->MaCTKM, 'MaTour' => $tour->MaTour]);
    }

    public function test_toggle_promotion_status_uses_legacy_logic(): void
    {
        $promotion = $this->promotion(['TrangThai' => 'Hoạt động']);

        Sanctum::actingAs($this->staffAccount());

        $this->patchJson("/api/staff/promotions/{$promotion->MaCTKM}/toggle")
            ->assertOk()
            ->assertJsonPath('data.TrangThai', 'Ngừng hoạt động');

        $this->patchJson("/api/staff/promotions/{$promotion->MaCTKM}/toggle")
            ->assertOk()
            ->assertJsonPath('data.TrangThai', 'Hoạt động');
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'TenKM' => 'Promotion Staff Test',
            'NoiDung' => 'Noi dung khuyen mai test',
            'PhanTramGiam' => 10,
            'NgayBatDau' => now()->subDay()->toDateString(),
            'NgayKetThuc' => now()->addMonth()->toDateString(),
        ], $overrides);
    }

    private function promotion(array $overrides = []): ChuongTrinhKhuyenMai
    {
        return ChuongTrinhKhuyenMai::create(array_merge([
            'TenKM' => 'Promotion Seed '.uniqid(),
            'NoiDung' => 'Noi dung test',
            'AnhDaiDien' => '',
            'PhanTramGiam' => 10,
            'NgayBatDau' => now()->subDay()->toDateString(),
            'NgayKetThuc' => now()->addMonth()->toDateString(),
            'TrangThai' => 'Hoạt động',
        ], $overrides));
    }

    private function tour(array $overrides = []): Tour
    {
        $nhanVien = NhanVien::first() ?? NhanVien::create([
            'HoTen' => 'Nhan Vien Promotion Test',
            'Email' => 'staff_promotion_seed_'.uniqid().'@example.com',
            'SDT' => '0987654321',
            'ChucVu' => 'Test',
            'MaTK' => TaiKhoan::create([
                'TenDangNhap' => 'staff_promotion_seed_'.uniqid(),
                'MatKhau' => 'unused',
                'VaiTro' => 'NV',
                'TrangThai' => 'Hoạt động',
                'Provider' => 'local',
            ])->MaTK,
        ]);

        return Tour::create(array_merge([
            'TenTour' => 'Tour Promotion Seed '.uniqid(),
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
            'TenDangNhap' => 'staff_promotion_nv_'.uniqid(),
            'MatKhau' => 'unused',
            'VaiTro' => 'NV',
            'TrangThai' => 'Hoạt động',
            'Provider' => 'local',
        ]);

        NhanVien::create([
            'HoTen' => 'Nhan Vien Staff Promotion Test',
            'Email' => 'staff_promotion_nv_'.uniqid().'@example.com',
            'SDT' => '0987654321',
            'ChucVu' => 'Test',
            'MaTK' => $user->MaTK,
        ]);

        return $user;
    }

    private function customerAccount(): TaiKhoan
    {
        $user = TaiKhoan::create([
            'TenDangNhap' => 'staff_promotion_kh_'.uniqid(),
            'MatKhau' => 'unused',
            'VaiTro' => 'KH',
            'TrangThai' => 'Hoạt động',
            'Provider' => 'local',
        ]);

        KhachHang::create([
            'HoTen' => 'Khach Hang Staff Promotion Test',
            'Email' => 'staff_promotion_kh_'.uniqid().'@example.com',
            'SoDienThoai' => '0900000000',
            'DiaChi' => 'Test',
            'NgaySinh' => '1999-01-01',
            'GioiTinh' => 'Nam',
            'MaTK' => $user->MaTK,
        ]);

        return $user;
    }
}
