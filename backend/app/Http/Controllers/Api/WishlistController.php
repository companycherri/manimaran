<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\WishlistItemResource;
use App\Models\Product;
use App\Models\WishlistItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WishlistController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $items = WishlistItem::query()
            ->where('user_id', $request->user()->id)
            ->with(['product.category', 'product.variants'])
            ->latest()
            ->get();

        return WishlistItemResource::collection($items);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
        ]);

        $product = Product::query()->active()->findOrFail($validated['product_id']);

        $item = WishlistItem::firstOrCreate([
            'user_id' => $request->user()->id,
            'product_id' => $product->id,
        ]);

        return response()->json([
            'message' => 'Product added to wishlist.',
            'data' => new WishlistItemResource($item->load(['product.category', 'product.variants'])),
        ], $item->wasRecentlyCreated ? 201 : 200);
    }

    public function destroy(Request $request, WishlistItem $wishlistItem): JsonResponse
    {
        abort_unless($wishlistItem->user_id === $request->user()->id, 403);

        $wishlistItem->delete();

        return response()->json([
            'message' => 'Product removed from wishlist.',
        ]);
    }
}
