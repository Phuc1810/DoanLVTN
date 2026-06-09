<?php

namespace Tests\Feature;

use App\Models\DanhGia;
use App\Models\DonDatTour;
use App\Models\KhachHang;
use App\Models\NhanVien;
use App\Models\TaiKhoan;
use App\Models\Tour;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReviewApiTest extends TestCase
{
    use DatabaseTransactions;

    public function test_can_get_tour_reviews(): void
    {
        $user = $this->customerAccount();
        $tour = $this->tour();
        $customer = KhachHang::where('MaTK', $user->MaTK)->firstOrFail();

        DanhGia::create([
            'SoSao' => 5,
            'NoiDung' => 'Tour rat tot',
            'NgayDG' => now()->toDateString(),
            'MaKH' => $customer->MaKH,
            'MaTour' => $tour->MaTour,
        ]);

        $this->getJson("/api/tours/{$tour->MaTour}/reviews")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'items' => [
                        [
                            'MaDG',
                            'SoSao',
                            'NoiDung',
                            'NgayDG',
                            'MaKH',
                            'MaTour',
                            'HoTen',
                        ],
                    ],
                    'summary' => [
                        'average_rating',
                        'total_reviews',
                        'rating_counts',
                    ],
                ],
            ]);
    }

    public function test_guest_cannot_review_order(): void
    {
        $order = $this->completedOrder($this->customerAccount());

        $this->postJson("/api/orders/{$order->MaDon}/review", $this->payload())
            ->assertUnauthorized();
    }

    public function test_non_customer_cannot_review_order(): void
    {
        $staff = TaiKhoan::create([
            'TenDangNhap' => 'review_nv_'.uniqid(),
            'MatKhau' => 'unused',
            'VaiTro' => 'NV',
            'TrangThai' => 'Hoạt động',
            'Provider' => 'local',
        ]);
        $order = $this->completedOrder($this->customerAccount());

        Sanctum::actingAs($staff);

        $this->postJson("/api/orders/{$order->MaDon}/review", $this->payload())
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_customer_cannot_review_other_customer_order(): void
    {
        $owner = $this->customerAccount();
        $other = $this->customerAccount();
        $order = $this->completedOrder($owner);

        Sanctum::actingAs($other);

        $this->postJson("/api/orders/{$order->MaDon}/review", $this->payload())
            ->assertNotFound()
            ->assertJsonPath('success', false);
    }

    public function test_customer_cannot_review_unfinished_order(): void
    {
        $user = $this->customerAccount();
        $order = $this->order($user, ['TrangThai' => 'Đã thanh toán']);

        Sanctum::actingAs($user);

        $this->postJson("/api/orders/{$order->MaDon}/review", $this->payload())
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_review_validates_star_range(): void
    {
        $user = $this->customerAccount();
        $order = $this->completedOrder($user);

        Sanctum::actingAs($user);

        $this->postJson("/api/orders/{$order->MaDon}/review", $this->payload(['SoSao' => 6]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['SoSao']);
    }

    public function test_customer_can_create_review_for_completed_order(): void
    {
        $user = $this->customerAccount();
        $order = $this->completedOrder($user);

        Sanctum::actingAs($user);

        $this->postJson("/api/orders/{$order->MaDon}/review", $this->payload([
            'SoSao' => 5,
            'NoiDung' => ' Trai nghiem tot ',
        ]))
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.action', 'created')
            ->assertJsonPath('data.NoiDung', 'Trai nghiem tot');

        $this->assertDatabaseHas('danhgia', [
            'MaKH' => $order->MaKH,
            'MaTour' => $order->MaTour,
            'SoSao' => 5,
            'NoiDung' => 'Trai nghiem tot',
        ]);
    }

    public function test_second_review_for_same_customer_and_tour_updates_existing_review(): void
    {
        $user = $this->customerAccount();
        $order = $this->completedOrder($user);

        Sanctum::actingAs($user);

        $this->postJson("/api/orders/{$order->MaDon}/review", $this->payload([
            'SoSao' => 5,
            'NoiDung' => 'Lan dau',
        ]))->assertOk();

        $this->postJson("/api/orders/{$order->MaDon}/review", $this->payload([
            'SoSao' => 4,
            'NoiDung' => 'Cap nhat',
        ]))
            ->assertOk()
            ->assertJsonPath('data.action', 'updated')
            ->assertJsonPath('data.SoSao', 4);

        $this->assertSame(1, DanhGia::where('MaKH', $order->MaKH)->where('MaTour', $order->MaTour)->count());
        $this->assertDatabaseHas('danhgia', [
            'MaKH' => $order->MaKH,
            'MaTour' => $order->MaTour,
            'SoSao' => 4,
            'NoiDung' => 'Cap nhat',
        ]);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'SoSao' => 5,
            'NoiDung' => 'Danh gia test',
        ], $overrides);
    }

    private function customerAccount(): TaiKhoan
    {
        $user = TaiKhoan::create([
            'TenDangNhap' => 'review_kh_'.uniqid(),
            'MatKhau' => 'unused',
            'VaiTro' => 'KH',
            'TrangThai' => 'Hoạt động',
            'Provider' => 'local',
        ]);

        KhachHang::create([
            'HoTen' => 'Khach Hang Review Test',
            'Email' => 'review_kh_'.uniqid().'@example.com',
            'SoDienThoai' => '0900000000',
            'DiaChi' => 'Test',
            'NgaySinh' => '1999-01-01',
            'GioiTinh' => 'Nam',
            'MaTK' => $user->MaTK,
        ]);

        return $user;
    }

    private function completedOrder(TaiKhoan $user): DonDatTour
    {
        return $this->order($user, ['TrangThai' => 'Đã hoàn tất']);
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
            'TrangThai' => 'Đã hoàn tất',
            'MaKH' => $customer->MaKH,
            'MaTour' => $tour->MaTour,
            'MaCTKM' => null,
        ], $overrides));
    }

    private function tour(array $overrides = []): Tour
    {
        $nhanVien = NhanVien::first() ?? NhanVien::create([
            'HoTen' => 'Nhan Vien Review Test',
            'Email' => 'review_nv_'.uniqid().'@example.com',
            'SDT' => '0987654321',
            'ChucVu' => 'Test',
            'MaTK' => TaiKhoan::create([
                'TenDangNhap' => 'review_nv_tour_'.uniqid(),
                'MatKhau' => 'unused',
                'VaiTro' => 'NV',
                'TrangThai' => 'Hoạt động',
                'Provider' => 'local',
            ])->MaTK,
        ]);

        return Tour::create(array_merge([
            'TenTour' => 'Tour Review Test '.uniqid(),
            'DiaDiem' => 'Ha Noi',
            'GiaGoc' => 1000000,
            'GiaGiam' => 900000,
            'ThoiLuong' => '1N',
            'NgayKhoiHanh' => now()->subMonth()->toDateString(),
            'NgayKetThuc' => now()->subDay()->toDateString(),
            'SoCho' => 10,
            'SoChoDaDat' => 1,
            'Mien' => 'Bắc',
            'LoaiTour' => 'Cá nhân',
            'PhanTramGiam' => 10,
            'TrangThai' => 'Hoạt động',
            'MaNV' => $nhanVien->MaNV,
        ], $overrides));
    }
}
