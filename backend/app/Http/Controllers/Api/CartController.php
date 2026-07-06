<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CartItemResource;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = CartItem::query()
            ->where('user_id', $request->user()->id)
            ->with(['product.category', 'variant'])
            ->latest()
            ->get();

        return response()->json([
            'data' => CartItemResource::collection($items),
            'summary' => $this->summary($items),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'product_variant_id' => ['nullable', 'exists:product_variants,id'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $product = Product::query()->active()->findOrFail($validated['product_id']);
        abort_unless($product->in_stock, 422, 'Product is currently out of stock.');

        $variant = $this->resolveVariant($product, $validated['product_variant_id'] ?? null);
        $this->ensureStock($variant, $validated['quantity']);

        $item = CartItem::query()
            ->firstOrNew([
                'user_id' => $request->user()->id,
                'product_id' => $product->id,
                'product_variant_id' => $variant?->id,
            ]);

        $newQuantity = ($item->exists ? $item->quantity : 0) + $validated['quantity'];
        $this->ensureStock($variant, $newQuantity);

        $item->fill([
            'quantity' => $newQuantity,
            'unit_price_snapshot' => $variant?->price ?? 0,
            'product_name_snapshot' => $product->name,
            'product_image_snapshot' => $product->image_url,
            'variant_label_snapshot' => $variant?->label,
        ])->save();

        return response()->json([
            'message' => 'Item added to cart.',
            'data' => new CartItemResource($item->load(['product.category', 'variant'])),
        ], $item->wasRecentlyCreated ? 201 : 200);
    }

    public function update(Request $request, CartItem $cartItem): CartItemResource
    {
        $this->authorizeCartItem($request, $cartItem);

        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $cartItem->load('variant');
        $this->ensureStock($cartItem->variant, $validated['quantity']);

        $cartItem->update(['quantity' => $validated['quantity']]);

        return new CartItemResource($cartItem->refresh()->load(['product.category', 'variant']));
    }

    public function destroy(Request $request, CartItem $cartItem): JsonResponse
    {
        $this->authorizeCartItem($request, $cartItem);
        $cartItem->delete();

        return response()->json([
            'message' => 'Item removed from cart.',
        ]);
    }

    public function clear(Request $request): JsonResponse
    {
        CartItem::where('user_id', $request->user()->id)->delete();

        return response()->json([
            'message' => 'Cart cleared.',
        ]);
    }

    private function resolveVariant(Product $product, ?int $variantId): ?ProductVariant
    {
        if ($variantId) {
            return $product->variants()->where('active', true)->whereKey($variantId)->firstOrFail();
        }

        return $product->variants()->where('active', true)->first();
    }

    private function ensureStock(?ProductVariant $variant, int $quantity): void
    {
        if ($variant && $variant->stock_quantity !== null && $variant->stock_quantity < $quantity) {
            abort(422, 'Requested quantity is not available.');
        }
    }

    private function authorizeCartItem(Request $request, CartItem $cartItem): void
    {
        abort_unless($cartItem->user_id === $request->user()->id, 403);
    }

    private function summary($items): array
    {
        $subtotal = $items->sum(fn (CartItem $item) => (float) $item->unit_price_snapshot * $item->quantity);

        return [
            'items_count' => $items->count(),
            'quantity' => $items->sum('quantity'),
            'subtotal' => number_format($subtotal, 2, '.', ''),
        ];
    }
}
