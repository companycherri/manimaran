<?php

namespace App\Services;

use App\Mail\AdminOrderNotificationMail;
use App\Mail\InvoiceMail;
use App\Mail\OrderConfirmationMail;
use App\Models\Order;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class OrderMailService
{
    public function sendOrderPlacedEmails(Order $order): void
    {
        $this->sendCustomerMail($order, new OrderConfirmationMail($order));
        $this->sendAdminMail($order, 'created');
    }

    public function sendPaymentCompletedEmails(Order $order): void
    {
        $this->sendCustomerMail($order, new InvoiceMail($order));
        $this->sendAdminMail($order, 'paid');
    }

    private function sendCustomerMail(Order $order, object $mailable): void
    {
        if (! $order->customer_email) {
            return;
        }

        try {
            Mail::to($order->customer_email)->send($mailable);
        } catch (Throwable $exception) {
            Log::warning('Customer order email failed.', [
                'order_id' => $order->id,
                'email' => $order->customer_email,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    private function sendAdminMail(Order $order, string $event): void
    {
        $adminEmail = config('services.orders.admin_email');

        if (! $adminEmail) {
            return;
        }

        try {
            Mail::to($adminEmail)->send(new AdminOrderNotificationMail($order, $event));
        } catch (Throwable $exception) {
            Log::warning('Admin order notification failed.', [
                'order_id' => $order->id,
                'email' => $adminEmail,
                'event' => $event,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
