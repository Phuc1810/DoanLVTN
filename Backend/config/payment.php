<?php

return [
    'vietqr' => [
        'bank_id' => env('VIETQR_BANK_ID'),
        'account_no' => env('VIETQR_ACCOUNT_NO'),
        'template' => env('VIETQR_TEMPLATE', 'compact'),
        'account_name' => env('VIETQR_ACCOUNT_NAME'),
    ],

    'sepay' => [
        'webhook_token' => env('SEPAY_WEBHOOK_TOKEN', ''),
        'webhook_token_out' => env('SEPAY_WEBHOOK_TOKEN_OUT', ''),
    ],
];
