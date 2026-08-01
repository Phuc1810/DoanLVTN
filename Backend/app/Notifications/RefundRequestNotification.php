<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class RefundRequestNotification extends Notification
{
    use Queueable;

    protected $order;

    public function __construct($order)
    {
        $this->order = $order;
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'title' => 'Yêu cầu hoàn tiền',
            'message' => 'Khách hàng vừa yêu cầu huỷ và hoàn tiền cho đơn đặt tour #' . $this->order->MaDon,
            'link' => '/staff/orders/' . $this->order->MaDon,
            'type' => 'refund_request',
        ];
    }
}
