<?php

namespace Tests\Feature;

use App\Models\Tour;
use Tests\TestCase;

class TourCustomerApiTest extends TestCase
{
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

    public function test_can_get_promotion_tours(): void
    {
        $this->getJson('/api/tours/promotions')
            ->assertOk()
            ->assertJsonPath('success', true);
    }
}
