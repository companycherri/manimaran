<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthenticatedUserController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:5000'],
            'city' => ['nullable', 'string', 'max:120'],
            'pincode' => ['nullable', 'string', 'max:20'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => 'customer',
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'city' => $validated['city'] ?? null,
            'pincode' => $validated['pincode'] ?? null,
        ]);

        $customerRole = Role::firstOrCreate(
            ['name' => 'customer'],
            ['display_name' => 'Customer']
        );

        $user->roles()->syncWithoutDetaching([$customerRole->id]);

        event(new Registered($user));

        return response()->json([
            'message' => 'Registration successful. Please verify your email address.',
            'token' => $this->createToken($user, 'customer-token'),
            'user' => $this->userPayload($user),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user->forceFill(['last_login_at' => now()])->save();

        return response()->json([
            'message' => 'Login successful.',
            'token' => $this->createToken($user, $validated['device_name'] ?? 'customer-token'),
            'user' => $this->userPayload($user),
        ]);
    }

    public function adminLogin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (! $user->hasRole('admin')) {
            throw ValidationException::withMessages([
                'email' => ['This account is not authorized for admin access.'],
            ]);
        }

        $user->forceFill(['last_login_at' => now()])->save();

        return response()->json([
            'message' => 'Admin login successful.',
            'token' => $this->createToken($user, $validated['device_name'] ?? 'admin-token'),
            'user' => $this->userPayload($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->userPayload($request->user()),
        ]);
    }

    public function updateMe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'full_name' => ['nullable', 'string', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:5000'],
            'city' => ['nullable', 'string', 'max:120'],
            'pincode' => ['nullable', 'string', 'max:20'],
        ]);

        $request->user()->update([
            'name' => $validated['full_name'] ?? $validated['name'] ?? $request->user()->name,
            'phone' => $validated['phone'] ?? $request->user()->phone,
            'address' => $validated['address'] ?? $request->user()->address,
            'city' => $validated['city'] ?? $request->user()->city,
            'pincode' => $validated['pincode'] ?? $request->user()->pincode,
        ]);

        return response()->json([
            'user' => $this->userPayload($request->user()->refresh()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()->currentAccessToken();

        if ($token) {
            $token->delete();
        }

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    private function createToken(User $user, string $name): string
    {
        $abilities = $user->hasRole('admin')
            ? ['admin', '*']
            : ['customer'];

        return $user->createToken($name, $abilities)->plainTextToken;
    }

    private function userPayload(User $user): array
    {
        $user->loadMissing('roles.permissions');

        return [
            'id' => $user->id,
            'name' => $user->name,
            'full_name' => $user->name,
            'email' => $user->email,
            'email_verified_at' => $user->email_verified_at,
            'role' => $user->role,
            'roles' => $user->roles->pluck('name')->values(),
            'permissions' => $user->roles
                ->flatMap(fn (Role $role) => $role->permissions->pluck('name'))
                ->unique()
                ->values(),
            'phone' => $user->phone,
            'address' => $user->address,
            'city' => $user->city,
            'pincode' => $user->pincode,
        ];
    }
}
