<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 30)->default('customer')->after('password');
            $table->string('phone', 30)->nullable()->after('role');
            $table->text('address')->nullable()->after('phone');
            $table->string('city', 120)->nullable()->after('address');
            $table->string('pincode', 20)->nullable()->after('city');
            $table->timestamp('last_login_at')->nullable()->after('remember_token');

            $table->index('role');
            $table->index('phone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropIndex(['phone']);
            $table->dropColumn([
                'role',
                'phone',
                'address',
                'city',
                'pincode',
                'last_login_at',
            ]);
        });
    }
};
