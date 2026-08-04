<?php

namespace App\Console\Commands;

use App\Models\Tour;
use App\Services\StaffTourService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ClonePeriodicTours extends Command
{
    protected $signature = 'tour:generate-clones';
    protected $description = 'Tự động đúc các tour bản sao cho các tour gốc định kỳ trong 4 tuần tiếp theo';

    public function handle(StaffTourService $tourService)
    {
        $this->info('Đang chạy tác vụ tự động đúc tour định kỳ...');
        
        $masterTours = Tour::where('TinhChatTour', 'Định kỳ')
            ->where('TrangThai', 'Hoạt động')
            ->get();

        if ($masterTours->isEmpty()) {
            $this->info('Không tìm thấy tour định kỳ nào đang hoạt động.');
            return;
        }

        $now = Carbon::now();
        $daysToGenerate = 28; // 4 tuần
        $clonedCount = 0;

        foreach ($masterTours as $master) {
            if (empty($master->LichTrinhTuan)) {
                continue;
            }

            // Chuỗi ví dụ: "6,0" (Thứ 7, CN)
            $allowedDays = array_map('intval', explode(',', $master->LichTrinhTuan));
            
            for ($i = 1; $i <= $daysToGenerate; $i++) {
                $targetDate = $now->copy()->addDays($i);
                $dayOfWeek = $targetDate->dayOfWeek; // 0 (CN) đến 6 (T7)

                if (in_array($dayOfWeek, $allowedDays)) {
                    // Cần clone cho ngày này. Kiểm tra xem đã clone chưa?
                    $targetDateStr = $targetDate->format('Y-m-d');
                    
                    $exists = Tour::where('IDTourGoc', $master->MaTour)
                        ->whereDate('NgayKhoiHanh', $targetDateStr)
                        ->exists();
                        
                    if (!$exists) {
                        try {
                            $payload = [
                                'NgayKhoiHanh' => $targetDateStr,
                                'NgayKetThuc' => null, // Hoặc tính ngày kết thúc từ ThoiLuong
                            ];
                            
                            $tourService->cloneTour($master->MaTour, $payload);
                            $clonedCount++;
                            $this->info("Đã clone thành công từ tour #" . $master->MaTour . " cho ngày " . $targetDateStr);
                        } catch (\Exception $e) {
                            Log::error("Lỗi khi clone tour định kỳ #" . $master->MaTour . ": " . $e->getMessage());
                            $this->error("Lỗi clone tour #" . $master->MaTour);
                        }
                    }
                }
            }
        }

        $this->info("Hoàn tất! Đã đúc thêm {$clonedCount} chuyến đi mới.");
    }
}
