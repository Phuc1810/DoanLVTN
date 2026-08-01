<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class BusinessRequestNotification extends Notification
{
    use Queueable;

    protected $businessRequest;

    public function __construct($businessRequest)
    {
        $this->businessRequest = $businessRequest;
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'title' => 'Yêu cầu doanh nghiệp mới',
            'message' => 'Có đơn yêu cầu doanh nghiệp mới từ công ty ' . $this->businessRequest->TenCongTy,
            'link' => '/staff/business-requests/' . $this->businessRequest->MaYC,
            'type' => 'business_request',
        ];
    }
}
