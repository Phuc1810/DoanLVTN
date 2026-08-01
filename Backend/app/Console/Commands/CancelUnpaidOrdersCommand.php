<?php

namespace App\Console\Commands;

use App\Models\DonDatTour;
use App\Models\Tour;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CancelUnpaidOrdersCommand extends Command
{
    protected $signature = 'orders:cancel-unpaid';

    protected $description = 'Tự động huỷ các đơn hàng "Chờ thanh toán" quá 15 phút và hoàn trả chỗ cho Tour';

    /**
     * Thời gian tối đa cho phép thanh toán (phút).
     */
    private const PAYMENT_TIMEOUT_MINUTES = 15;

    public function handle(): int
    {
        $cutoff = Carbon::now()->subMinutes(self::PAYMENT_TIMEOUT_MINUTES);

        $expiredOrders = DonDatTour::where('TrangThai', 'Chờ thanh toán')
            ->where('NgayDat', '<=', $cutoff)
            ->get();

        if ($expiredOrders->isEmpty()) {
            $this->info('Không có đơn hàng quá hạn cần huỷ.');

            return self::SUCCESS;
        }

        $cancelled = 0;

        foreach ($expiredOrders as $order) {
            try {
                DB::transaction(function () use ($order) {
                    // Đổi trạng thái đơn sang "Đã huỷ"
                    $order->update(['TrangThai' => 'Đã huỷ']);

                    // Hoàn trả chỗ cho Tour
                    $tour = Tour::where('MaTour', $order->MaTour)->lockForUpdate()->first();
                    if ($tour) {
                        $seats = (int) $order->SoLuongNguoiLon + (int) $order->SoLuongTreEm + (int) $order->SoLuongTreNho;
                        $tour->SoChoDaDat = max(0, (int) $tour->SoChoDaDat - $seats);
                        if ($tour->TrangThai === 'Hết chỗ' && (int) $tour->SoChoDaDat < (int) $tour->SoCho) {
                            $tour->TrangThai = 'Hoạt động';
                        }
                        $tour->save();
                    }
                });

                $cancelled++;
                $this->line("  ✓ Đã huỷ đơn #{$order->MaDon}");
            } catch (\Throwable $e) {
                Log::error("Lỗi khi huỷ đơn #{$order->MaDon}: ".$e->getMessage());
                $this->error("  ✗ Lỗi đơn #{$order->MaDon}: {$e->getMessage()}");
            }
        }

        $this->info("Hoàn tất: Đã huỷ {$cancelled}/{$expiredOrders->count()} đơn hàng quá hạn.");

        return self::SUCCESS;
    }
}
