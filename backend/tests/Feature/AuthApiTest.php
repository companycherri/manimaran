<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Notifications\ApiResetPassword;
use App\Notifications\ApiVerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_receives_verification_email(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Customer One',
            'email' => 'customer@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '9876543210',
        ]);

        $response
            ->assertCreated()
            ->assertJsonStructure(['message', 'token', 'user' => ['id', 'email', 'role', 'roles']]);

        $user = User::where('email', 'customer@example.com')->firstOrFail();

        $this->assertTrue($user->hasRole('customer'));
        Notification::assertSentTo($user, ApiVerifyEmail::class);
    }

    public function test_user_can_login_and_logout_with_sanctum_token(): void
    {
        Role::create(['name' => 'customer']);

        $user = User::factory()->create([
            'email' => 'login@example.com',
            'password' => Hash::make('password123'),
            'role' => 'customer',
        ]);
        $user->roles()->attach(Role::where('name', 'customer')->first());

        $login = $this->postJson('/api/auth/login', [
            'email' => 'login@example.com',
            'password' => 'password123',
        ]);

        $token = $login->assertOk()->json('token');

        $this->withToken($token)->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.email', 'login@example.com');

        $this->withToken($token)->postJson('/api/auth/logout')->assertOk();
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_admin_login_requires_admin_role(): void
    {
        $customerRole = Role::create(['name' => 'customer']);
        $adminRole = Role::create(['name' => 'admin']);

        $customer = User::factory()->create([
            'email' => 'not-admin@example.com',
            'password' => Hash::make('password123'),
            'role' => 'customer',
        ]);
        $customer->roles()->attach($customerRole);

        $admin = User::factory()->create([
            'email' => 'admin@example.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);
        $admin->roles()->attach($adminRole);

        $this->postJson('/api/auth/admin/login', [
            'email' => 'not-admin@example.com',
            'password' => 'password123',
        ])->assertUnprocessable();

        $this->postJson('/api/auth/admin/login', [
            'email' => 'admin@example.com',
            'password' => 'password123',
        ])->assertOk()->assertJsonPath('user.role', 'admin');
    }

    public function test_forgot_password_sends_reset_notification(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'reset@example.com']);

        $this->postJson('/api/auth/forgot-password', [
            'email' => 'reset@example.com',
        ])->assertOk();

        Notification::assertSentTo($user, ApiResetPassword::class);
    }

    public function test_password_can_be_reset(): void
    {
        $user = User::factory()->create([
            'email' => 'reset-now@example.com',
            'password' => Hash::make('old-password'),
        ]);
        $token = Password::broker()->createToken($user);

        $this->postJson('/api/auth/reset-password', [
            'token' => $token,
            'email' => 'reset-now@example.com',
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
        ])->assertOk();

        $this->assertTrue(Hash::check('new-password123', $user->fresh()->password));
    }

    public function test_email_can_be_verified_from_signed_api_link(): void
    {
        $user = User::factory()->unverified()->create();

        $url = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)]
        );

        $this->getJson($url)->assertOk();

        $this->assertTrue($user->fresh()->hasVerifiedEmail());
    }
}
