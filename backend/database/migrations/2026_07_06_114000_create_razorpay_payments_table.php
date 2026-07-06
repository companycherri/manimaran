<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('payment_status', 30)->default('pending')->after('status');
            $table->string('razorpay_order_id')->nullable()->after('tracking_id');
            $table->string('razorpay_payment_id')->nullable()->after('razorpay_order_id');

            $table->index(['payment_status', 'created_at']);
            $table->index('razorpay_order_id');
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 30)->default('razorpay');
            $table->string('provider_order_id');
            $table->string('provider_payment_id')->nullable();
            $table->string('provider_signature')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 10)->default('INR');
            $table->string('status', 30)->default('created');
            $table->json('raw_payload')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index('order_id');
            $table->index(['provider', 'status']);
            $table->unique(['provider', 'provider_order_id'], 'payments_provider_order_unique');
            $table->unique(['provider', 'provider_payment_id'], 'payments_provider_payment_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['payment_status', 'created_at']);
            $table->dropIndex(['razorpay_order_id']);
            $table->dropColumn([
                'payment_status',
                'razorpay_order_id',
                'razorpay_payment_id',
            ]);
        });
    }
};
