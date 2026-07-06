<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Http\Client\Factory as HttpFactory;
use RuntimeException;

class RazorpayService
{
    public function __construct(private readonly HttpFactory $http) {}

    public function createOrder(Order $order): array
    {
        return $this->createOrderForAmount(
            (float) $order->total_amount,
            $order->order_number,
            [
                'order_id' => (string) $order->id,
                'order_number' => $order->order_number,
                'customer_email' => (string) $order->customer_email,
            ]
        );
    }

    public function createOrderForAmount(float $amount, string $receipt, array $notes = []): array
    {
        $keyId = config('services.razorpay.key_id');
        $keySecret = config('services.razorpay.key_secret');

        if (! $keyId || ! $keySecret) {
            throw new RuntimeException('Razorpay credentials are not configured.');
        }

        $response = $this->http
            ->withBasicAuth($keyId, $keySecret)
            ->acceptJson()
            ->post('https://api.razorpay.com/v1/orders', [
                'amount' => (int) round($amount * 100),
                'currency' => 'INR',
                'receipt' => $receipt,
                'notes' => $notes,
            ]);

        if ($response->failed()) {
            throw new RuntimeException('Unable to create Razorpay order.');
        }

        return $response->json();
    }

    public function verifySignature(string $razorpayOrderId, string $razorpayPaymentId, string $signature): bool
    {
        $secret = config('services.razorpay.key_secret');

        if (! $secret) {
            throw new RuntimeException('Razorpay secret is not configured.');
        }

        $expected = hash_hmac('sha256', "{$razorpayOrderId}|{$razorpayPaymentId}", $secret);

        return hash_equals($expected, $signature);
    }
}
