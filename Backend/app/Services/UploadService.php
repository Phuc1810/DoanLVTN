<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class UploadService
{
    public function storeTourImage(UploadedFile $file, int $tourId): string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $fileName = 'tour_'.$tourId.'_'.time().'.'.$extension;

        $stored = Storage::disk('public')->putFileAs('tours', $file, $fileName);

        if (! $stored) {
            throw new RuntimeException('Không lưu được ảnh upload.');
        }

        return 'storage/'.$stored;
    }

    public function storePromotionImage(UploadedFile $file, int $promotionId): string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $fileName = 'km_'.$promotionId.'_'.time().'.'.$extension;

        $stored = Storage::disk('public')->putFileAs('promotions', $file, $fileName);

        if (! $stored) {
            throw new RuntimeException('Không lưu được ảnh upload.');
        }

        return 'storage/'.$stored;
    }

    public function storeNewsImage(UploadedFile $file, int $newsId): string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $fileName = 'tin_'.$newsId.'_'.time().'.'.$extension;

        $stored = Storage::disk('public')->putFileAs('news', $file, $fileName);

        if (! $stored) {
            throw new RuntimeException('Không lưu được ảnh upload.');
        }

        return 'storage/'.$stored;
    }
}
