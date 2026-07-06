<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdminOrderNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order, public string $event = 'created')
    {
        $this->order->loadMissing('items', 'coupon', 'payments');
    }

    public function envelope(): Envelope
    {
        $label = $this->event === 'paid' ? 'Paid Order' : 'New Order';

        return new Envelope(
            subject: "{$label} - #{$this->order->order_number}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.orders.admin-notification',
            with: [
                'order' => $this->order,
                'event' => $this->event,
            ],
        );
    }
}
