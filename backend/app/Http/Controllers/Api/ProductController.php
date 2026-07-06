<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $products = Product::query()
            ->active()
            ->where('in_stock', true)
            ->with(['category', 'variants' => fn ($query) => $query->where('active', true)])
            ->when($request->string('category')->toString(), function ($query, string $category): void {
                $query->whereHas('category', fn ($categoryQuery) => $categoryQuery->where('slug', $category));
            })
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where(function ($searchQuery) use ($search): void {
                    $searchQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('keywords', 'like', "%{$search}%");
                });
            })
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate($request->integer('per_page', 24));

        return ProductResource::collection($products);
    }

    public function show(Product $product): ProductResource
    {
        abort_unless($product->status === 'active', 404);

        return new ProductResource($product->load([
            'category',
            'variants' => fn ($query) => $query->where('active', true),
            'mediaAssets',
        ]));
    }

    public function showById(Product $product): ProductResource
    {
        abort_unless($product->status === 'active', 404);

        return new ProductResource($product->load([
            'category',
            'variants' => fn ($query) => $query->where('active', true),
            'mediaAssets',
        ]));
    }
}
