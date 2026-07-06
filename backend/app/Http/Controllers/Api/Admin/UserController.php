<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::query()
            ->with('roles:id,name')
            ->latest()
            ->paginate($request->integer('per_page', 100));

        return response()->json([
            'data' => $users->through(fn (User $user): array => [
                'id' => $user->id,
                'full_name' => $user->name,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'roles' => $user->roles->pluck('name')->values(),
                'phone' => $user->phone,
                'address' => $user->address,
                'city' => $user->city,
                'pincode' => $user->pincode,
                'created_date' => optional($user->created_at)->toISOString(),
            ])->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'total' => $users->total(),
            ],
        ]);
    }
}
