<?php

namespace Tests\Feature;

use App\Models\CartItem;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CommerceApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_add_update_and_clear_cart_items(): void
    {
        [$user, $token] = $this->customer();
        [$product, $variant] = $this->productWithVariant(stock: 5, price: 120);

        $this->withToken($token)->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'quantity' => 2,
        ])->assertCreated()->assertJsonPath('data.quantity', 2);

        $this->withToken($token)->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'quantity' => 1,
        ])->assertOk()->assertJsonPath('data.quantity', 3);

        $item = CartItem::where('user_id', $user->id)->firstOrFail();

        $this->withToken($token)->patchJson("/api/cart/items/{$item->id}", [
            'quantity' => 4,
        ])->assertOk()->assertJsonPath('data.quantity', 4);

        $this->withToken($token)->getJson('/api/cart')
            ->assertOk()
            ->assertJsonPath('summary.quantity', 4)
            ->assertJsonPath('summary.subtotal', '480.00');

        $this->withToken($token)->deleteJson('/api/cart')->assertOk();
        $this->assertDatabaseCount('cart_items', 0);
    }

    public function test_cart_rejects_quantity_above_inventory(): void
    {
        [, $token] = $this->customer();
        [$product, $variant] = $this->productWithVariant(stock: 1);

        $this->withToken($token)->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'quantity' => 2,
        ])->assertUnprocessable();
    }

    public function test_user_can_manage_wishlist(): void
    {
        [, $token] = $this->customer();
        [$product] = $this->productWithVariant();

        $id = $this->withToken($token)->postJson('/api/wishlist/items', [
            'product_id' => $product->id,
        ])->assertCreated()->json('data.id');

        $this->withToken($token)->getJson('/api/wishlist')
            ->assertOk()
            ->assertJsonPath('data.0.product.id', $product->id);

        $this->withToken($token)->deleteJson("/api/wishlist/items/{$id}")->assertOk();
        $this->assertDatabaseCount('wishlist_items', 0);
    }

    public function test_coupon_can_be_validated_against_cart(): void
    {
        [, $token] = $this->customer();
        [$product, $variant] = $this->productWithVariant(price: 200);

        $this->withToken($token)->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'quantity' => 2,
        ])->assertCreated();

        Coupon::create([
            'code' => 'SAVE10',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'min_order_value' => 100,
            'active' => true,
        ]);

        $this->withToken($token)->postJson('/api/coupons/validate', [
            'code' => 'save10',
        ])->assertOk()
            ->assertJsonPath('discount_total', '40.00')
            ->assertJsonPath('total_amount', '360.00');
    }

    public function test_user_can_place_order_from_cart_without_payment(): void
    {
        [, $token] = $this->customer();
        [$product, $variant] = $this->productWithVariant(stock: 5, price: 150);

        $this->withToken($token)->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'quantity' => 2,
        ])->assertCreated();

        Coupon::create([
            'code' => 'FLAT50',
            'discount_type' => 'fixed',
            'discount_value' => 50,
            'active' => true,
        ]);

        $response = $this->withToken($token)->postJson('/api/orders', [
            'customer_name' => 'Customer',
            'customer_phone' => '9876543210',
            'delivery_address' => 'Pondicherry',
            'coupon_code' => 'FLAT50',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.subtotal', '300.00')
            ->assertJsonPath('data.discount_total', '50.00')
            ->assertJsonPath('data.total_amount', '250.00')
            ->assertJsonCount(1, 'data.items');

        $this->assertDatabaseCount('cart_items', 0);
        $this->assertDatabaseHas('order_items', ['quantity' => 2, 'line_total' => 300]);
        $this->assertSame(3, $variant->fresh()->stock_quantity);
        $this->assertSame(1, Coupon::where('code', 'FLAT50')->first()->used_count);
    }

    public function test_admin_can_manage_coupons_and_order_status(): void
    {
        [, $adminToken] = $this->admin();
        $order = Order::create([
            'order_number' => 'ORD-TEST',
            'customer_name' => 'Customer',
            'customer_phone' => '9876543210',
            'delivery_address' => 'Address',
            'subtotal' => 100,
            'total_amount' => 100,
            'status' => 'pending',
            'order_date' => now(),
        ]);

        $this->withToken($adminToken)->postJson('/api/admin/coupons', [
            'code' => 'ADMIN10',
            'discount_type' => 'fixed',
            'discount_value' => 10,
            'active' => true,
        ])->assertCreated()->assertJsonPath('data.code', 'ADMIN10');

        $this->withToken($adminToken)->patchJson("/api/admin/orders/{$order->id}/status", [
            'status' => 'confirmed',
            'tracking_id' => 'TRK123',
            'note' => 'Confirmed manually',
        ])->assertOk()->assertJsonPath('data.status', 'confirmed');

        $this->assertDatabaseHas('order_status_histories', [
            'order_id' => $order->id,
            'old_status' => 'pending',
            'new_status' => 'confirmed',
        ]);
    }

    private function customer(): array
    {
        $user = User::factory()->create([
            'password' => Hash::make('password123'),
            'role' => 'customer',
        ]);

        return [$user, $user->createToken('customer-token', ['customer'])->plainTextToken];
    }

    private function admin(): array
    {
        $role = Role::firstOrCreate(['name' => 'admin']);
        $user = User::factory()->create([
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);
        $user->roles()->attach($role);

        return [$user, $user->createToken('admin-token', ['admin', '*'])->plainTextToken];
    }

    private function productWithVariant(?int $stock = 10, int $price = 100): array
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
            'price' => $price,
            'stock_quantity' => $stock,
            'active' => true,
        ]);

        return [$product, $variant];
    }
}
