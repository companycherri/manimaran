<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CatalogApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_can_list_active_categories_and_products(): void
    {
        $category = Category::create([
            'name' => 'Milk Sweets',
            'active' => true,
        ]);

        $inactiveCategory = Category::create([
            'name' => 'Hidden',
            'active' => false,
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Palkova',
            'unit' => 'kg',
            'status' => 'active',
            'in_stock' => true,
        ]);

        $product->variants()->create([
            'label' => '250g',
            'unit' => 'g',
            'quantity_value' => 250,
            'quantity_unit' => 'g',
            'price' => 120,
            'stock_quantity' => 10,
            'active' => true,
        ]);

        Product::create([
            'category_id' => $inactiveCategory->id,
            'name' => 'Hidden Sweet',
            'unit' => 'kg',
            'status' => 'inactive',
        ]);

        $this->getJson('/api/categories')
            ->assertOk()
            ->assertJsonPath('data.0.slug', 'milk-sweets')
            ->assertJsonMissing(['slug' => 'hidden']);

        $this->getJson('/api/products')
            ->assertOk()
            ->assertJsonPath('data.0.slug', 'palkova')
            ->assertJsonMissing(['name' => 'Hidden Sweet']);
    }

    public function test_admin_can_create_category_and_product_with_variants(): void
    {
        $token = $this->adminToken();

        $categoryId = $this->withToken($token)->postJson('/api/admin/categories', [
            'name' => 'Ghee Sweets',
            'description' => 'Traditional sweets',
            'active' => true,
        ])->assertCreated()->json('data.id');

        $response = $this->withToken($token)->postJson('/api/admin/products', [
            'category_id' => $categoryId,
            'name' => 'Mysurpa',
            'description' => 'Rich ghee sweet',
            'unit' => 'kg',
            'status' => 'active',
            'in_stock' => true,
            'variants' => [
                [
                    'label' => '250g',
                    'unit' => 'g',
                    'quantity_value' => 250,
                    'quantity_unit' => 'g',
                    'price' => 150,
                    'stock_quantity' => 8,
                    'active' => true,
                ],
                [
                    'label' => '500g',
                    'unit' => 'g',
                    'quantity_value' => 500,
                    'quantity_unit' => 'g',
                    'price' => 280,
                    'stock_quantity' => 4,
                    'active' => true,
                ],
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.slug', 'mysurpa')
            ->assertJsonCount(2, 'data.variants');

        $this->assertDatabaseHas('products', ['name' => 'Mysurpa']);
        $this->assertDatabaseHas('product_variants', ['label' => '500g', 'stock_quantity' => 4]);
    }

    public function test_admin_can_upload_product_image_and_set_primary(): void
    {
        Storage::fake('public');

        $token = $this->adminToken();
        $product = Product::create([
            'name' => 'Ghee',
            'unit' => 'ml',
            'status' => 'active',
        ]);

        $response = $this->withToken($token)->postJson("/api/admin/products/{$product->id}/images", [
            'image' => UploadedFile::fake()->image('ghee.jpg'),
            'set_primary' => true,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Image uploaded successfully.');

        $path = $response->json('media.path');
        Storage::disk('public')->assertExists($path);
        $this->assertNotNull($product->fresh()->image_url);
    }

    public function test_admin_can_update_inventory_for_variant(): void
    {
        $token = $this->adminToken();
        $product = Product::create([
            'name' => 'Pure Ghee',
            'unit' => 'ml',
            'status' => 'active',
            'in_stock' => true,
        ]);
        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'label' => '200ml',
            'unit' => 'ml',
            'quantity_value' => 200,
            'quantity_unit' => 'ml',
            'price' => 220,
            'stock_quantity' => 5,
            'active' => true,
        ]);

        $this->withToken($token)->patchJson("/api/admin/inventory/variants/{$variant->id}", [
            'stock_quantity' => 0,
            'active' => true,
        ])->assertOk()->assertJsonPath('data.stock_quantity', 0);

        $this->assertFalse($product->fresh()->in_stock);
    }

    public function test_customer_cannot_access_admin_catalog_endpoints(): void
    {
        $customer = User::factory()->create([
            'password' => Hash::make('password123'),
            'role' => 'customer',
        ]);

        $token = $customer->createToken('customer-token', ['customer'])->plainTextToken;

        $this->withToken($token)->postJson('/api/admin/categories', [
            'name' => 'Blocked',
        ])->assertForbidden();
    }

    private function adminToken(): string
    {
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $admin = User::factory()->create([
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);
        $admin->roles()->attach($adminRole);

        return $admin->createToken('admin-token', ['admin', '*'])->plainTextToken;
    }
}
