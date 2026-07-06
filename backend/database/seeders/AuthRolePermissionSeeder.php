<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AuthRolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = collect([
            ['name' => 'admin.access', 'display_name' => 'Access admin area'],
            ['name' => 'users.view', 'display_name' => 'View users'],
            ['name' => 'users.manage', 'display_name' => 'Manage users'],
            ['name' => 'roles.manage', 'display_name' => 'Manage roles and permissions'],
            ['name' => 'categories.manage', 'display_name' => 'Manage categories'],
            ['name' => 'products.manage', 'display_name' => 'Manage products'],
            ['name' => 'images.manage', 'display_name' => 'Manage product images'],
            ['name' => 'inventory.manage', 'display_name' => 'Manage inventory'],
            ['name' => 'coupons.manage', 'display_name' => 'Manage coupons'],
            ['name' => 'orders.view', 'display_name' => 'View orders'],
            ['name' => 'orders.manage', 'display_name' => 'Manage orders'],
        ])->mapWithKeys(function (array $attributes): array {
            return [
                $attributes['name'] => Permission::firstOrCreate(
                    ['name' => $attributes['name']],
                    ['display_name' => $attributes['display_name']]
                ),
            ];
        });

        $customer = Role::firstOrCreate(
            ['name' => 'customer'],
            ['display_name' => 'Customer']
        );

        $admin = Role::firstOrCreate(
            ['name' => 'admin'],
            ['display_name' => 'Administrator']
        );

        $admin->permissions()->sync($permissions->pluck('id')->all());
        $customer->permissions()->sync([]);

        $adminEmail = env('ADMIN_EMAIL', 'admin@example.com');
        $adminPassword = env('ADMIN_PASSWORD', 'password');

        $adminUser = User::firstOrCreate(
            ['email' => $adminEmail],
            [
                'name' => env('ADMIN_NAME', 'Administrator'),
                'password' => Hash::make($adminPassword),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        $adminUser->forceFill([
            'role' => 'admin',
            'email_verified_at' => $adminUser->email_verified_at ?? now(),
        ])->save();

        $adminUser->roles()->syncWithoutDetaching([$admin->id]);
    }
}
