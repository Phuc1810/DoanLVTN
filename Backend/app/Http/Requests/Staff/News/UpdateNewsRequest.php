<?php

namespace App\Http\Requests\Staff\News;

class UpdateNewsRequest extends StoreNewsRequest
{
    public function rules(): array
    {
        $rules = parent::rules();
        $rules['AnhDaiDien'] = ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'];

        return $rules;
    }
}
