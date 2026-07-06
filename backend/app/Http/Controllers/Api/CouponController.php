<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CouponResource;
use App\Models\CartItem;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function validateCoupon(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string'],
        ]);

        $items = CartItem::where('user_id', $request->user()->id)->get();
        $subtotal = $items->sum(fn (CartItem $item) => (float) $item->unit_price_snapshot * $item->quantity);
        $coupon = Coupon::where('code', strtoupper(trim($validated['code'])))->first();

        if (! $coupon || ! $coupon->isUsableFor($subtotal)) {
            return response()->json([
                'message' => 'Coupon is not valid for this cart.',
            ], 422);
        }

        $discount = $coupon->discountFor($subtotal);

        return response()->json([
            'message' => 'Coupon is valid.',
            'coupon' => new CouponResource($coupon),
            'discount_total' => number_format($discount, 2, '.', ''),
            'total_amount' => number_format(max($subtotal - $discount, 0), 2, '.', ''),
        ]);
    }
}
