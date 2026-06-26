<?php

namespace Tests\Feature;

use App\Models\ChuongTrinhKhuyenMai;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class PromotionCustomerApiTest extends TestCase
{
    use DatabaseTransactions;

    public function test_public_promotions_follow_legacy_status_filters_and_order(): void
    {
        $activeOlder = ChuongTrinhKhuyenMai::create([
            'TenKM' => 'Active Older '.uniqid(),
            'NoiDung' => 'Test',
            'AnhDaiDien' => 'promotions/active-older.jpg',
            'PhanTramGiam' => 10,
            'NgayBatDau' => now()->subDays(10)->toDateString(),
            'NgayKetThuc' => now()->addDays(5)->toDateString(),
            'TrangThai' => 'Hoạt động',
        ]);

        $activeNewer = ChuongTrinhKhuyenMai::create([
            'TenKM' => 'Active Newer '.uniqid(),
            'NoiDung' => 'Test',
            'AnhDaiDien' => 'promotions/active-newer.jpg',
            'PhanTramGiam' => 15,
            'NgayBatDau' => now()->subDays(2)->toDateString(),
            'NgayKetThuc' => now()->addDays(7)->toDateString(),
            'TrangThai' => 'Hoạt động',
        ]);

        $upcoming = ChuongTrinhKhuyenMai::create([
            'TenKM' => 'Upcoming '.uniqid(),
            'NoiDung' => 'Test',
            'AnhDaiDien' => 'promotions/upcoming.jpg',
            'PhanTramGiam' => 20,
            'NgayBatDau' => now()->addDays(3)->toDateString(),
            'NgayKetThuc' => now()->addDays(10)->toDateString(),
            'TrangThai' => 'Hoạt động',
        ]);

        $expired = ChuongTrinhKhuyenMai::create([
            'TenKM' => 'Expired '.uniqid(),
            'NoiDung' => 'Test',
            'AnhDaiDien' => 'promotions/expired.jpg',
            'PhanTramGiam' => 5,
            'NgayBatDau' => now()->subDays(10)->toDateString(),
            'NgayKetThuc' => now()->subDay()->toDateString(),
            'TrangThai' => 'Hoạt động',
        ]);

        $items = $this->getJson('/api/khuyen-mai')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->json('data');

        $ids = array_column($items, 'MaCTKM');

        $this->assertContains($activeOlder->MaCTKM, $ids);
        $this->assertContains($activeNewer->MaCTKM, $ids);
        $this->assertContains($upcoming->MaCTKM, $ids);
        $this->assertNotContains($expired->MaCTKM, $ids);

        $activeOlderIndex = array_search($activeOlder->MaCTKM, $ids, true);
        $activeNewerIndex = array_search($activeNewer->MaCTKM, $ids, true);
        $upcomingIndex = array_search($upcoming->MaCTKM, $ids, true);

        $this->assertIsInt($activeOlderIndex);
        $this->assertIsInt($activeNewerIndex);
        $this->assertIsInt($upcomingIndex);
        $this->assertLessThan($upcomingIndex, $activeOlderIndex);
        $this->assertLessThan($upcomingIndex, $activeNewerIndex);
        $this->assertLessThan($activeOlderIndex, $activeNewerIndex);

        $newerItem = collect($items)->firstWhere('MaCTKM', $activeNewer->MaCTKM);
        $this->assertSame('Hoạt động', $newerItem['TrangThai']);
        $this->assertArrayHasKey('image_url', $newerItem);
    }
}
