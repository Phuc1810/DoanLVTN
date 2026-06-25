<?php

namespace Tests\Feature;

use App\Models\ChuongTrinhKhuyenMai;
use App\Models\HinhAnhTour;
use App\Models\NhanVien;
use App\Models\TaiKhoan;
use App\Models\Tour;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TourCustomerApiTest extends TestCase
{
    use DatabaseTransactions;

    public function test_can_get_active_tours(): void
    {
        $this->getJson('/api/tours')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'items',
                    'pagination',
                ],
            ]);
    }

    public function test_can_get_tour_detail(): void
    {
        $tour = Tour::where('TrangThai', 'Hoạt động')->orderBy('MaTour')->first();

        if (! $tour) {
            $this->markTestSkipped('Không có tour hoạt động trong database test.');
        }

        $this->getJson('/api/tours/'.$tour->MaTour)
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'MaTour',
                    'AnhChinh',
                    'image_url',
                    'SoChoConLai',
                    'lichTrinhs',
                    'danhGias',
                    'review_stats',
                ],
            ]);
    }

    public function test_can_search_tours(): void
    {
        $this->getJson('/api/tours/search?keyword=ha')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_can_filter_tours_by_region(): void
    {
        $this->getJson('/api/tours/region/bac')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_can_get_featured_tours_from_noibat_images_sorted_by_tour_id_desc(): void
    {
        $staff = $this->staff();
        $olderTour = $this->tour($staff, ['TenTour' => 'Featured Old '.uniqid()]);
        $newerTour = $this->tour($staff, ['TenTour' => 'Featured New '.uniqid()]);
        $ignoredTour = $this->tour($staff, ['TenTour' => 'Featured Ignore '.uniqid()]);

        HinhAnhTour::create([
            'DuongDan' => 'featured-old.jpg',
            'LaAnhChinh' => 1,
            'LoaiAnh' => 'noibat',
            'MaTour' => $olderTour->MaTour,
        ]);

        HinhAnhTour::create([
            'DuongDan' => 'featured-new.jpg',
            'LaAnhChinh' => 1,
            'LoaiAnh' => 'noibat',
            'MaTour' => $newerTour->MaTour,
        ]);

        HinhAnhTour::create([
            'DuongDan' => 'banner-ignore.jpg',
            'LaAnhChinh' => 1,
            'LoaiAnh' => 'banner',
            'MaTour' => $ignoredTour->MaTour,
        ]);

        $items = $this->getJson('/api/tours/featured?per_page=8')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->json('data.items');

        $matching = array_values(array_filter($items, fn ($item) => in_array($item['MaTour'], [$olderTour->MaTour, $newerTour->MaTour], true)));
        $tourIds = array_column($matching, 'MaTour');

        $this->assertSame([$newerTour->MaTour, $olderTour->MaTour], $tourIds);
        $this->assertNotContains($ignoredTour->MaTour, array_column($items, 'MaTour'));
    }

    public function test_can_get_promotion_tours(): void
    {
        $this->getJson('/api/tours/promotions')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_promotion_tours_are_sorted_by_highest_active_discount(): void
    {
        $staff = $this->staff();
        $highTour = $this->tour($staff, ['TenTour' => 'Promo High '.uniqid(), 'PhanTramGiam' => 0, 'GiaGiam' => 5000000]);
        $midTour = $this->tour($staff, ['TenTour' => 'Promo Mid '.uniqid(), 'PhanTramGiam' => 0, 'GiaGiam' => 5000000]);
        $lowTour = $this->tour($staff, ['TenTour' => 'Promo Low '.uniqid(), 'PhanTramGiam' => 0, 'GiaGiam' => 5000000]);

        $this->attachPromotion($highTour, 99);
        $this->attachPromotion($midTour, 98);
        $this->attachPromotion($lowTour, 97);

        $items = $this->getJson('/api/tours/promotions?per_page=3')
            ->assertOk()
            ->json('data.items');

        $this->assertSame($highTour->MaTour, $items[0]['MaTour']);
        $this->assertSame(99, (int) $items[0]['discount_percent']);
        $this->assertSame($midTour->MaTour, $items[1]['MaTour']);
        $this->assertSame($lowTour->MaTour, $items[2]['MaTour']);
    }

    private function attachPromotion(Tour $tour, int $percent): void
    {
        $promotion = ChuongTrinhKhuyenMai::create([
            'TenKM' => 'CTKM '.uniqid(),
            'NoiDung' => 'Test khuyen mai',
            'AnhDaiDien' => null,
            'PhanTramGiam' => $percent,
            'NgayBatDau' => now()->subDay()->toDateString(),
            'NgayKetThuc' => now()->addDay()->toDateString(),
            'TrangThai' => 'Hoạt động',
        ]);

        DB::table('tour_khuyenmai')->insert([
            'MaTour' => $tour->MaTour,
            'MaCTKM' => $promotion->MaCTKM,
            'PhanTramGiamKM' => $percent,
        ]);
    }

    private function staff(): NhanVien
    {
        return NhanVien::first() ?? NhanVien::create([
            'HoTen' => 'Nhan Vien Tour API',
            'Email' => 'tour-api-'.uniqid().'@example.com',
            'SDT' => '0987654321',
            'ChucVu' => 'Test',
            'MaTK' => TaiKhoan::create([
                'TenDangNhap' => 'tour_api_nv_'.uniqid(),
                'MatKhau' => 'unused',
                'VaiTro' => 'NV',
                'TrangThai' => 'Hoạt động',
                'Provider' => 'local',
            ])->MaTK,
        ]);
    }

    private function tour(NhanVien $staff, array $overrides = []): Tour
    {
        return Tour::create(array_merge([
            'TenTour' => 'Tour Promo '.uniqid(),
            'DiaDiem' => 'Ha Noi',
            'GiaGoc' => 10000000,
            'GiaGiam' => 9000000,
            'ThoiLuong' => '3N2D',
            'NgayKhoiHanh' => now()->addMonth()->toDateString(),
            'NgayKetThuc' => now()->addMonths(2)->toDateString(),
            'SoCho' => 20,
            'SoChoDaDat' => 0,
            'Mien' => 'Bắc',
            'LoaiTour' => 'Cá nhân',
            'PhanTramGiam' => 0,
            'TrangThai' => 'Hoạt động',
            'MaNV' => $staff->MaNV,
        ], $overrides));
    }
}
