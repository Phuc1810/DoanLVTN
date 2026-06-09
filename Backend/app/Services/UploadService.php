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
}
