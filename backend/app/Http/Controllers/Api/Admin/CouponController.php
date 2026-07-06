<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\CouponResource;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class CouponController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $coupons = Coupon::query()
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where('code', 'like', '%'.strtoupper($search).'%');
            })
            ->latest()
            ->paginate($request->integer('per_page', 50));

        return CouponResource::collection($coupons);
    }

    public function store(Request $request): CouponResource
    {
        $payload = $this->validated($request);
        $payload['code'] = strtoupper(trim($payload['code']));

        return new CouponResource(Coupon::create($payload));
    }

    public function show(Coupon $coupon): CouponResource
    {
        return new CouponResource($coupon);
    }

    public function update(Request $request, Coupon $coupon): CouponResource
    {
        $payload = $this->validated($request, $coupon);
        $payload['code'] = strtoupper(trim($payload['code']));
        $coupon->update($payload);

        return new CouponResource($coupon->refresh());
    }

    public function destroy(Coupon $coupon): JsonResponse
    {
        $coupon->delete();

        return response()->json([
            'message' => 'Coupon deleted successfully.',
        ]);
    }

    private function validated(Request $request, ?Coupon $coupon = null): array
    {
        return $request->validate([
            'code' => ['required', 'string', 'max:255', Rule::unique('coupons', 'code')->ignore($coupon)],
            'description' => ['nullable', 'string'],
            'discount_type' => ['required', Rule::in(['percentage', 'fixed'])],
            'discount_value' => ['required', 'numeric', 'min:0'],
            'min_order_value' => ['nullable', 'numeric', 'min:0'],
            'max_discount' => ['nullable', 'numeric', 'min:0'],
            'valid_from' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date', 'after_or_equal:valid_from'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'used_count' => ['nullable', 'integer', 'min:0'],
            'active' => ['nullable', 'boolean'],
        ]);
    }
}
