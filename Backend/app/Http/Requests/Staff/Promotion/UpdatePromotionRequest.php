<?php

namespace App\Http\Requests\Staff\Promotion;

class UpdatePromotionRequest extends StorePromotionRequest
{
    public function rules(): array
    {
        $rules = parent::rules();
        
        // Bỏ ràng buộc "không được ở trong quá khứ" khi cập nhật, 
        // vì khuyến mãi đang chạy thì ngày bắt đầu mặc định đã là quá khứ.
        $rules['NgayBatDau'] = ['required', 'date'];
        
        return $rules;
    }
}
