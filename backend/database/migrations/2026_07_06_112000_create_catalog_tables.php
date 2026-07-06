<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('image_url')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['active', 'sort_order']);
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->longText('description')->nullable();
            $table->string('image_url')->nullable();
            $table->string('promo_video_url')->nullable();
            $table->string('unit', 20)->default('kg');
            $table->string('status', 20)->default('active');
            $table->boolean('in_stock')->default(true);
            $table->boolean('featured')->default(false);
            $table->boolean('featured_in_footer')->default(false);
            $table->boolean('show_category_badge')->default(true);
            $table->unsignedInteger('display_order')->default(0);
            $table->unsignedInteger('signature_display_order')->default(0);
            $table->text('ingredients')->nullable();
            $table->text('keywords')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'display_order']);
            $table->index(['featured', 'signature_display_order']);
            $table->index('featured_in_footer');
            $table->index(['category_id', 'status']);
        });

        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('label', 80);
            $table->string('unit', 20);
            $table->decimal('quantity_value', 10, 3);
            $table->string('quantity_unit', 20);
            $table->decimal('price', 12, 2);
            $table->decimal('compare_at_price', 12, 2)->nullable();
            $table->string('sku')->nullable()->unique();
            $table->unsignedInteger('stock_quantity')->nullable();
            $table->boolean('active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['product_id', 'label']);
            $table->index(['product_id', 'active', 'sort_order']);
            $table->index('stock_quantity');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
    }
};
