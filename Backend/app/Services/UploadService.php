<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class UploadService
{
    public function uploadTourImage(UploadedFile $file, ?int $tourId = null): string
    {
        return $this->storeImage($file, 'tours', 'tour', $tourId);
    }

    public function uploadNewsImage(UploadedFile $file, ?int $newsId = null): string
    {
        return $this->storeImage($file, 'news', 'news', $newsId);
    }

    public function uploadPromotionImage(UploadedFile $file, ?int $promotionId = null): string
    {
        return $this->storeImage($file, 'promotions', 'promotion', $promotionId);
    }

    public function storeTourImage(UploadedFile $file, int $tourId): string
    {
        return $this->uploadTourImage($file, $tourId);
    }

    public function storeNewsImage(UploadedFile $file, int $newsId): string
    {
        return $this->uploadNewsImage($file, $newsId);
    }

    public function storePromotionImage(UploadedFile $file, int $promotionId): string
    {
        return $this->uploadPromotionImage($file, $promotionId);
    }

    /**
     * Upload ảnh từ trình soạn thảo (CKEditor / TinyMCE).
     * Ảnh được lưu vào thư mục riêng "editor" trên disk public.
     */
    public function uploadEditorImage(UploadedFile $file): string
    {
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension());
        $fileName = 'editor_' . date('Ymd_His') . '_' . Str::random(8) . '.' . $extension;

        $stored = Storage::disk('public')->putFileAs('editor', $file, $fileName);

        if (! $stored) {
            throw new RuntimeException('Không lưu được ảnh editor upload.');
        }

        return $stored;
    }

    public function publicUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (preg_match('/^https?:\/\//i', $path)) {
            return $path;
        }

        $path = ltrim($path, '/');

        if (str_starts_with($path, 'storage/')) {
            return url($path);
        }

        if (str_starts_with($path, 'tours/') || str_starts_with($path, 'news/') || str_starts_with($path, 'promotions/') || str_starts_with($path, 'editor/')) {
            return url(Storage::url($path));
        }

        return url('assets/'.$path);
    }

    public function deletePublicFile(?string $path): bool
    {
        if (! $path) {
            return false;
        }

        $path = ltrim($path, '/');
        if (str_starts_with($path, 'storage/')) {
            $path = substr($path, strlen('storage/'));
        }

        if (! (str_starts_with($path, 'tours/') || str_starts_with($path, 'news/') || str_starts_with($path, 'promotions/'))) {
            return false;
        }

        return Storage::disk('public')->delete($path);
    }

    public function validateImageRule(bool $required = false): array
    {
        return array_filter([
            $required ? 'required' : 'nullable',
            'image',
            'mimes:jpg,jpeg,png,webp',
            'max:5120',
        ]);
    }

    private function storeImage(UploadedFile $file, string $directory, string $prefix, ?int $id): string
    {
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension());
        $suffix = $id ? (string) $id : (string) Str::uuid();
        $fileName = $prefix.'_'.$suffix.'_'.time().'.'.$extension;

        $stored = Storage::disk('public')->putFileAs($directory, $file, $fileName);

        if (! $stored) {
            throw new RuntimeException('Không lưu được ảnh upload.');
        }

        return $stored;
    }
}
