<?php

namespace Tests\Feature;

use App\Models\KhachHang;
use App\Models\NhanVien;
use App\Models\TaiKhoan;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminAccountApiTest extends TestCase
{
    use DatabaseTransactions;

    private static int $phoneSequence = 2000;

    public function test_guest_cannot_access_admin_accounts(): void
    {
        $this->getJson('/api/admin/accounts')
            ->assertUnauthorized();
    }

    public function test_staff_and_customer_cannot_access_admin_accounts(): void
    {
        Sanctum::actingAs($this->staffAccount());
        $this->getJson('/api/admin/accounts')
            ->assertForbidden()
            ->assertJsonPath('success', false);

        Sanctum::actingAs($this->customerAccount());
        $this->getJson('/api/admin/accounts')
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_admin_can_list_accounts(): void
    {
        $admin = $this->adminAccount();
        $this->staffAccount();
        $this->customerAccount();

        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/accounts')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'items',
                    'pagination',
                ],
            ]);
    }

    public function test_admin_can_filter_by_role_and_status(): void
    {
        $admin = $this->adminAccount();
        $staff = $this->staffAccount(['TrangThai' => 'Khóa']);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/admin/accounts?role=NV&st=Khóa')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertTrue(collect($response->json('data.items'))->contains('MaTK', $staff->MaTK));
    }

    public function test_admin_can_search_username_email_and_phone(): void
    {
        $admin = $this->adminAccount();
        $customer = $this->customerAccount();

        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/accounts?q='.$customer->TenDangNhap)
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->getJson('/api/admin/accounts?q='.$customer->khachHang->Email)
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->getJson('/api/admin/accounts?q='.$customer->khachHang->SoDienThoai)
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_admin_can_create_staff_account(): void
    {
        Sanctum::actingAs($this->adminAccount());

        $username = 'new_staff_'.uniqid();
        $this->postJson('/api/admin/accounts/staff', [
            'username' => $username,
            'password' => 'Password@123',
            'fullname' => 'Nhan Vien Moi',
        ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.TenDangNhap', $username)
            ->assertJsonPath('data.VaiTro', 'NV')
            ->assertJsonPath('data.nhan_vien.HoTen', 'Nhan Vien Moi');

        $this->assertDatabaseHas('taikhoan', [
            'TenDangNhap' => $username,
            'VaiTro' => 'NV',
            'TrangThai' => 'Hoạt động',
        ]);
        $this->assertDatabaseHas('nhanvien', ['HoTen' => 'Nhan Vien Moi']);
    }

    public function test_admin_cannot_create_duplicate_username(): void
    {
        $staff = $this->staffAccount();
        Sanctum::actingAs($this->adminAccount());

        $this->postJson('/api/admin/accounts/staff', [
            'username' => $staff->TenDangNhap,
            'password' => 'Password@123',
            'fullname' => 'Duplicate Staff',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['username']);
    }

    public function test_admin_can_reset_staff_password(): void
    {
        $staff = $this->staffAccount();
        Sanctum::actingAs($this->adminAccount());

        $this->patchJson("/api/admin/accounts/{$staff->MaTK}/reset-password", [
            'new_password' => 'NewPass123',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.MaTK', $staff->MaTK);

        $staff->refresh();
        $this->assertTrue(Hash::check('NewPass123', $staff->MatKhau));
    }

    public function test_admin_cannot_self_toggle_status_or_role(): void
    {
        $admin = $this->adminAccount();
        Sanctum::actingAs($admin);

        $this->patchJson("/api/admin/accounts/{$admin->MaTK}/status")
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->patchJson("/api/admin/accounts/{$admin->MaTK}/role", ['role' => 'NV'])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_admin_can_toggle_status(): void
    {
        $staff = $this->staffAccount(['TrangThai' => 'Hoạt động']);
        Sanctum::actingAs($this->adminAccount());

        $this->patchJson("/api/admin/accounts/{$staff->MaTK}/status")
            ->assertOk()
            ->assertJsonPath('data.TrangThai', 'Khóa');

        $this->patchJson("/api/admin/accounts/{$staff->MaTK}/status")
            ->assertOk()
            ->assertJsonPath('data.TrangThai', 'Hoạt động');
    }

    public function test_admin_can_update_role(): void
    {
        $staff = $this->staffAccount();
        Sanctum::actingAs($this->adminAccount());

        $this->patchJson("/api/admin/accounts/{$staff->MaTK}/role", ['role' => 'KH'])
            ->assertOk()
            ->assertJsonPath('data.VaiTro', 'KH');

        $this->assertDatabaseHas('taikhoan', [
            'MaTK' => $staff->MaTK,
            'VaiTro' => 'KH',
        ]);
    }

    private function adminAccount(array $overrides = []): TaiKhoan
    {
        return TaiKhoan::create(array_merge([
            'TenDangNhap' => 'admin_account_'.uniqid(),
            'MatKhau' => Hash::make('secret'),
            'VaiTro' => 'AD',
            'TrangThai' => 'Hoạt động',
            'Provider' => 'local',
        ], $overrides));
    }

    private function staffAccount(array $overrides = []): TaiKhoan
    {
        $user = TaiKhoan::create(array_merge([
            'TenDangNhap' => 'admin_staff_'.uniqid(),
            'MatKhau' => Hash::make('secret'),
            'VaiTro' => 'NV',
            'TrangThai' => 'Hoạt động',
            'Provider' => 'local',
        ], $overrides));

        NhanVien::create([
            'HoTen' => 'Nhan Vien Admin Account Test',
            'Email' => 'admin_staff_'.uniqid().'@example.com',
            'SDT' => $this->uniquePhone(),
            'ChucVu' => 'Test',
            'MaTK' => $user->MaTK,
        ]);

        return $user->load('nhanVien');
    }

    private function customerAccount(array $overrides = []): TaiKhoan
    {
        $user = TaiKhoan::create(array_merge([
            'TenDangNhap' => 'admin_customer_'.uniqid(),
            'MatKhau' => Hash::make('secret'),
            'VaiTro' => 'KH',
            'TrangThai' => 'Hoạt động',
            'Provider' => 'local',
        ], $overrides));

        KhachHang::create([
            'HoTen' => 'Khach Hang Admin Account Test',
            'Email' => 'admin_customer_'.uniqid().'@example.com',
            'SoDienThoai' => $this->uniquePhone(),
            'DiaChi' => 'Test',
            'NgaySinh' => '1999-01-01',
            'GioiTinh' => 'Nam',
            'MaTK' => $user->MaTK,
        ]);

        return $user->load('khachHang');
    }

    private function uniquePhone(): string
    {
        return '09'.str_pad((string) self::$phoneSequence++, 8, '0', STR_PAD_LEFT);
    }
}
