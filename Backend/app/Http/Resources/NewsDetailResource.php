<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class NewsDetailResource extends NewsResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'NoiDung' => $this->NoiDung,
        ]);
    }
}
