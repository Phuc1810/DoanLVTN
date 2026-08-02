<?php

namespace Database\Seeders;

use App\Models\LichSuXemTin;
use App\Models\TinTuc;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LichSuXemTinSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $tintucs = TinTuc::where('LuotXem', '>', 0)->get();
        $recordsToInsert = [];

        foreach ($tintucs as $tinTuc) {
            $luotXem = $tinTuc->LuotXem;
            
            // Generate dummy dates between NgayDang (or 6 months ago if NgayDang is too old) and now
            $startDate = Carbon::parse($tinTuc->NgayDang);
            if ($startDate->copy()->addMonths(6)->isPast()) {
                $startDate = now()->subMonths(5)->startOfMonth();
            }

            for ($i = 0; $i < $luotXem; $i++) {
                // Generate a random timestamp between $startDate and now
                $randomTimestamp = mt_rand($startDate->timestamp, now()->timestamp);
                
                $recordsToInsert[] = [
                    'MaTin' => $tinTuc->MaTin,
                    'IP' => '127.0.0.' . mt_rand(1, 255),
                    'NgayXem' => Carbon::createFromTimestamp($randomTimestamp)->toDateTimeString(),
                ];
                
                // Batch insert to avoid memory issues
                if (count($recordsToInsert) >= 1000) {
                    LichSuXemTin::insert($recordsToInsert);
                    $recordsToInsert = [];
                }
            }
        }

        if (count($recordsToInsert) > 0) {
            LichSuXemTin::insert($recordsToInsert);
        }

        $this->command->info('Đã tạo thành công dữ liệu giả lập cho lịch sử xem tin!');
    }
}
