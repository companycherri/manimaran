<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\CartItem;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\Payment;
use App\Services\OrderMailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $orders = Order::query()
            ->where('user_id', $request->user()->id)
            ->with('items')
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return OrderResource::collection($orders);
    }

    public function store(Request $request, OrderMailService $orderMailService): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:30'],
            'delivery_address' => ['required', 'string', 'max:5000'],
            'coupon_code' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $order = DB::transaction(function () use ($request, $validated): Order {
            $items = CartItem::query()
                ->where('user_id', $request->user()->id)
                ->with(['product', 'variant'])
                ->lockForUpdate()
                ->get();

            abort_if($items->isEmpty(), 422, 'Cart is empty.');

            $subtotal = 0;
            foreach ($items as $item) {
                abort_unless($item->product && $item->product->status === 'active' && $item->product->in_stock, 422, 'Cart contains unavailable products.');
                $this->ensureInventory($item);
                $subtotal += (float) $item->unit_price_snapshot * $item->quantity;
            }

            [$coupon, $discountTotal] = $this->resolveCoupon($validated['coupon_code'] ?? null, $subtotal);
            $total = max($subtotal - $discountTotal, 0);

            $order = Order::create([
                'user_id' => $request->user()->id,
                'coupon_id' => $coupon?->id,
                'order_number' => $this->orderNumber(),
                'customer_name' => $validated['customer_name'],
                'customer_email' => $validated['customer_email'] ?? $request->user()->email,
                'customer_phone' => $validated['customer_phone'],
                'delivery_address' => $validated['delivery_address'],
                'subtotal' => $subtotal,
                'discount_total' => $discountTotal,
                'shipping_total' => 0,
                'tax_total' => 0,
                'total_amount' => $total,
                'coupon_code' => $coupon?->code,
                'status' => 'pending',
                'payment_status' => 'pending',
                'order_date' => now(),
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($items as $item) {
                $order->items()->create([
                    'product_id' => $item->product_id,
                    'product_variant_id' => $item->product_variant_id,
                    'product_name' => $item->product_name_snapshot,
                    'product_image' => $item->product_image_snapshot,
                    'variant_label' => $item->variant_label_snapshot,
                    'unit' => $item->variant?->unit,
                    'weight' => $item->variant?->label,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price_snapshot,
                    'line_total' => (float) $item->unit_price_snapshot * $item->quantity,
                ]);

                if ($item->variant && $item->variant->stock_quantity !== null) {
                    $item->variant->decrement('stock_quantity', $item->quantity);
                }
            }

            if ($coupon) {
                $coupon->increment('used_count');
                $coupon->redemptions()->create([
                    'user_id' => $request->user()->id,
                    'order_id' => $order->id,
                    'discount_amount' => $discountTotal,
                ]);
            }

            CartItem::where('user_id', $request->user()->id)->delete();

            return $order;
        });

        $orderMailService->sendOrderPlacedEmails($order->load(['items', 'coupon']));

        return response()->json([
            'message' => 'Order placed successfully.',
            'data' => new OrderResource($order->load(['items', 'coupon'])),
        ], 201);
    }

    public function show(Request $request, Order $order): OrderResource
    {
        abort_unless($order->user_id === $request->user()->id, 403);

        return new OrderResource($order->load(['items', 'coupon']));
    }

    public function track(string $orderNumber): OrderResource
    {
        $order = Order::query()
            ->where('order_number', $orderNumber)
            ->with(['items', 'coupon'])
            ->firstOrFail();

        return new OrderResource($order);
    }

    public function storeFromBase44(Request $request, OrderMailService $orderMailService): JsonResponse
    {
        $validated = $request->validate([
            'order_number' => ['nullable', 'string', 'max:255', 'unique:orders,order_number'],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:30'],
            'delivery_address' => ['required', 'string', 'max:5000'],
            'subtotal' => ['nullable', 'numeric', 'min:0'],
            'total_amount' => ['required', 'numeric', 'min:0'],
            'status' => ['nullable', 'string', 'max:30'],
            'payment_status' => ['nullable', 'string', 'max:30'],
            'razorpay_order_id' => ['nullable', 'string', 'max:255'],
            'razorpay_payment_id' => ['nullable', 'string', 'max:255'],
            'payment_id' => ['nullable', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['nullable', 'integer', 'exists:products,id'],
            'items.*.product_variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'items.*.product_name' => ['required', 'string', 'max:255'],
            'items.*.product_image' => ['nullable', 'string', 'max:2048'],
            'items.*.variant_label' => ['nullable', 'string', 'max:80'],
            'items.*.weight' => ['nullable', 'string', 'max:80'],
            'items.*.unit' => ['nullable', 'string', 'max:20'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $order = DB::transaction(function () use ($request, $validated): Order {
            $subtotal = collect($validated['items'])
                ->sum(fn (array $item): float => (float) $item['unit_price'] * (int) $item['quantity']);

            $order = Order::create([
                'user_id' => $request->user()->id,
                'order_number' => $validated['order_number'] ?? $this->orderNumber(),
                'customer_name' => $validated['customer_name'],
                'customer_email' => $validated['customer_email'] ?? $request->user()->email,
                'customer_phone' => $validated['customer_phone'],
                'delivery_address' => $validated['delivery_address'],
                'subtotal' => $validated['subtotal'] ?? $subtotal,
                'discount_total' => 0,
                'shipping_total' => 0,
                'tax_total' => 0,
                'total_amount' => $validated['total_amount'],
                'status' => $validated['status'] ?? 'confirmed',
                'payment_status' => $validated['payment_status'] ?? (($validated['razorpay_payment_id'] ?? $validated['payment_id'] ?? null) ? 'completed' : 'pending'),
                'order_date' => now(),
                'razorpay_order_id' => $validated['razorpay_order_id'] ?? null,
                'razorpay_payment_id' => $validated['razorpay_payment_id'] ?? $validated['payment_id'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $order->items()->create([
                    'product_id' => $item['product_id'] ?? null,
                    'product_variant_id' => $item['product_variant_id'] ?? null,
                    'product_name' => $item['product_name'],
                    'product_image' => $item['product_image'] ?? null,
                    'variant_label' => $item['variant_label'] ?? $item['weight'] ?? null,
                    'unit' => $item['unit'] ?? null,
                    'weight' => $item['weight'] ?? $item['variant_label'] ?? null,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'line_total' => (float) $item['unit_price'] * (int) $item['quantity'],
                ]);
            }

            if (! empty($validated['razorpay_order_id'])) {
                Payment::updateOrCreate(
                    [
                        'provider' => 'razorpay',
                        'provider_order_id' => $validated['razorpay_order_id'],
                    ],
                    [
                        'order_id' => $order->id,
                        'provider_payment_id' => $validated['razorpay_payment_id'] ?? $validated['payment_id'] ?? null,
                        'amount' => $validated['total_amount'],
                        'currency' => 'INR',
                        'status' => empty($validated['razorpay_payment_id'] ?? $validated['payment_id'] ?? null) ? 'created' : 'captured',
                        'raw_payload' => $validated,
                        'verified_at' => empty($validated['razorpay_payment_id'] ?? $validated['payment_id'] ?? null) ? null : now(),
                    ]
                );
            }

            CartItem::where('user_id', $request->user()->id)->delete();

            return $order;
        });

        $orderMailService->sendOrderPlacedEmails($order->load(['items', 'coupon', 'payments']));

        return response()->json([
            'message' => 'Order placed successfully.',
            'data' => new OrderResource($order),
        ], 201);
    }

    private function ensureInventory(CartItem $item): void
    {
        if (! $item->variant) {
            return;
        }

        abort_unless($item->variant->active, 422, 'Cart contains unavailable variants.');

        if ($item->variant->stock_quantity !== null && $item->variant->stock_quantity < $item->quantity) {
            abort(422, 'Cart quantity exceeds available inventory.');
        }
    }

    private function resolveCoupon(?string $code, float $subtotal): array
    {
        if (! $code) {
            return [null, 0.0];
        }

        $coupon = Coupon::where('code', strtoupper(trim($code)))->lockForUpdate()->first();
        abort_unless($coupon && $coupon->isUsableFor($subtotal), 422, 'Coupon is not valid for this cart.');

        return [$coupon, $coupon->discountFor($subtotal)];
    }

    private function orderNumber(): string
    {
        do {
            $number = 'ORD-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
        } while (Order::where('order_number', $number)->exists());

        return $number;
    }
}
