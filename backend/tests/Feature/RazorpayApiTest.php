<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RazorpayApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_razorpay_order_for_own_order(): void
    {
        config([
            'services.razorpay.key_id' => 'rzp_test_key',
            'services.razorpay.key_secret' => 'rzp_secret',
        ]);

        Http::fake([
            'https://api.razorpay.com/v1/orders' => Http::response([
                'id' => 'order_razorpay_123',
                'amount' => 25000,
                'currency' => 'INR',
                'status' => 'created',
            ], 200),
        ]);

        [$user, $token] = $this->customer();
        $order = $this->orderFor($user, total: 250);

        $this->withToken($token)->postJson('/api/razorpay/orders', [
            'order_id' => $order->id,
        ])->assertCreated()
            ->assertJsonPath('razorpay_order.id', 'order_razorpay_123')
            ->assertJsonPath('razorpay_order.key_id', 'rzp_test_key')
            ->assertJsonPath('payment.status', 'created')
            ->assertJsonPath('order.payment_status', 'pending');

        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'provider' => 'razorpay',
            'provider_order_id' => 'order_razorpay_123',
            'status' => 'created',
        ]);
        $this->assertSame('order_razorpay_123', $order->fresh()->razorpay_order_id);
    }

    public function test_user_can_verify_razorpay_payment_and_update_order(): void
    {
        config([
            'services.razorpay.key_id' => 'rzp_test_key',
            'services.razorpay.key_secret' => 'rzp_secret',
        ]);

        [$user, $token] = $this->customer();
        $order = $this->orderFor($user, total: 500);
        $order->update(['razorpay_order_id' => 'order_razorpay_456']);
        $signature = hash_hmac('sha256', 'order_razorpay_456|pay_123', 'rzp_secret');

        $this->withToken($token)->postJson('/api/razorpay/verify', [
            'order_id' => $order->id,
            'razorpay_order_id' => 'order_razorpay_456',
            'razorpay_payment_id' => 'pay_123',
            'razorpay_signature' => $signature,
        ])->assertOk()
            ->assertJsonPath('payment.status', 'captured')
            ->assertJsonPath('order.payment_status', 'completed')
            ->assertJsonPath('order.status', 'confirmed');

        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'provider_order_id' => 'order_razorpay_456',
            'provider_payment_id' => 'pay_123',
            'status' => 'captured',
        ]);

        $freshOrder = $order->fresh();
        $this->assertSame('completed', $freshOrder->payment_status);
        $this->assertSame('confirmed', $freshOrder->status);
        $this->assertSame('pay_123', $freshOrder->razorpay_payment_id);
    }

    public function test_invalid_razorpay_signature_marks_order_failed(): void
    {
        config(['services.razorpay.key_secret' => 'rzp_secret']);

        [$user, $token] = $this->customer();
        $order = $this->orderFor($user, total: 500);
        $order->update(['razorpay_order_id' => 'order_razorpay_789']);

        $this->withToken($token)->postJson('/api/razorpay/verify', [
            'order_id' => $order->id,
            'razorpay_order_id' => 'order_razorpay_789',
            'razorpay_payment_id' => 'pay_bad',
            'razorpay_signature' => 'invalid',
        ])->assertUnprocessable();

        $this->assertSame('failed', $order->fresh()->payment_status);
    }

    public function test_user_cannot_create_razorpay_order_for_another_users_order(): void
    {
        config([
            'services.razorpay.key_id' => 'rzp_test_key',
            'services.razorpay.key_secret' => 'rzp_secret',
        ]);

        [$user, $token] = $this->customer();
        $other = User::factory()->create();
        $order = $this->orderFor($other);

        $this->withToken($token)->postJson('/api/razorpay/orders', [
            'order_id' => $order->id,
        ])->assertNotFound();
    }

    private function customer(): array
    {
        $user = User::factory()->create([
            'password' => Hash::make('password123'),
            'role' => 'customer',
        ]);

        return [$user, $user->createToken('customer-token', ['customer'])->plainTextToken];
    }

    private function orderFor(User $user, int $total = 100): Order
    {
        return Order::create([
            'user_id' => $user->id,
            'order_number' => 'ORD-'.uniqid(),
            'customer_name' => $user->name,
            'customer_email' => $user->email,
            'customer_phone' => '9876543210',
            'delivery_address' => 'Pondicherry',
            'subtotal' => $total,
            'total_amount' => $total,
            'status' => 'pending',
            'payment_status' => 'pending',
            'order_date' => now(),
        ]);
    }
}
