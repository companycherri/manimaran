<?php

namespace Tests\Feature;

use App\Mail\AdminOrderNotificationMail;
use App\Mail\InvoiceMail;
use App\Mail\OrderConfirmationMail;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class OrderMailTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_placement_sends_customer_confirmation_and_admin_notification(): void
    {
        Mail::fake();
        config(['services.orders.admin_email' => 'admin@example.com']);

        [$user, $token] = $this->customer();
        [$product, $variant] = $this->productWithVariant();

        CartItem::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'quantity' => 1,
            'unit_price_snapshot' => $variant->price,
            'product_name_snapshot' => $product->name,
            'product_image_snapshot' => $product->image_url,
            'variant_label_snapshot' => $variant->label,
        ]);

        $this->withToken($token)->postJson('/api/orders', [
            'customer_name' => 'Customer',
            'customer_email' => 'customer@example.com',
            'customer_phone' => '9876543210',
            'delivery_address' => 'Pondicherry',
        ])->assertCreated();

        Mail::assertSent(OrderConfirmationMail::class, function (OrderConfirmationMail $mail): bool {
            return $mail->hasTo('customer@example.com');
        });

        Mail::assertSent(AdminOrderNotificationMail::class, function (AdminOrderNotificationMail $mail): bool {
            return $mail->hasTo('admin@example.com') && $mail->event === 'created';
        });
    }

    public function test_successful_payment_sends_invoice_and_paid_admin_notification(): void
    {
        Mail::fake();
        config([
            'services.orders.admin_email' => 'admin@example.com',
            'services.razorpay.key_secret' => 'rzp_secret',
        ]);

        [$user, $token] = $this->customer();
        $order = Order::create([
            'user_id' => $user->id,
            'order_number' => 'ORD-MAIL-PAID',
            'customer_name' => 'Customer',
            'customer_email' => 'customer@example.com',
            'customer_phone' => '9876543210',
            'delivery_address' => 'Pondicherry',
            'subtotal' => 200,
            'total_amount' => 200,
            'status' => 'pending',
            'payment_status' => 'pending',
            'razorpay_order_id' => 'order_mail_123',
            'order_date' => now(),
        ]);
        $order->items()->create([
            'product_name' => 'Palkova',
            'variant_label' => '250g',
            'quantity' => 1,
            'unit_price' => 200,
            'line_total' => 200,
        ]);

        $signature = hash_hmac('sha256', 'order_mail_123|pay_mail_123', 'rzp_secret');

        $this->withToken($token)->postJson('/api/razorpay/verify', [
            'order_id' => $order->id,
            'razorpay_order_id' => 'order_mail_123',
            'razorpay_payment_id' => 'pay_mail_123',
            'razorpay_signature' => $signature,
        ])->assertOk();

        Mail::assertSent(InvoiceMail::class, function (InvoiceMail $mail): bool {
            return $mail->hasTo('customer@example.com');
        });

        Mail::assertSent(AdminOrderNotificationMail::class, function (AdminOrderNotificationMail $mail): bool {
            return $mail->hasTo('admin@example.com') && $mail->event === 'paid';
        });
    }

    private function customer(): array
    {
        $user = User::factory()->create([
            'email' => 'customer@example.com',
            'password' => Hash::make('password123'),
            'role' => 'customer',
        ]);

        return [$user, $user->createToken('customer-token', ['customer'])->plainTextToken];
    }

    private function productWithVariant(): array
    {
        $category = Category::create(['name' => 'Sweets']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Palkova',
            'unit' => 'kg',
            'status' => 'active',
            'in_stock' => true,
        ]);
        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'label' => '250g',
            'unit' => 'g',
            'quantity_value' => 250,
            'quantity_unit' => 'g',
            'price' => 200,
            'stock_quantity' => 10,
            'active' => true,
        ]);

        return [$product, $variant];
    }
}
