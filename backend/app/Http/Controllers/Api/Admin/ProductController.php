<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $products = Product::query()
            ->with(['category', 'variants'])
            ->when($request->string('status')->toString(), fn ($query, string $status) => $query->where('status', $status))
            ->when($request->integer('category_id'), fn ($query, int $categoryId) => $query->where('category_id', $categoryId))
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
            ->paginate($request->integer('per_page', 50));

        return ProductResource::collection($products);
    }

    public function store(Request $request): ProductResource
    {
        $payload = $this->validated($request);

        $product = DB::transaction(function () use ($payload): Product {
            $variants = $payload['variants'] ?? [];
            unset($payload['variants']);

            $product = Product::create($payload);
            $this->syncVariants($product, $variants);

            return $product;
        });

        return new ProductResource($product->load(['category', 'variants', 'mediaAssets']));
    }

    public function show(Product $product): ProductResource
    {
        return new ProductResource($product->load(['category', 'variants', 'mediaAssets']));
    }

    public function update(Request $request, Product $product): ProductResource
    {
        $payload = $this->validated($request, $product);

        DB::transaction(function () use ($payload, $product): void {
            $variants = $payload['variants'] ?? null;
            unset($payload['variants']);

            $product->update($payload);

            if (is_array($variants)) {
                $this->syncVariants($product, $variants);
            }
        });

        return new ProductResource($product->refresh()->load(['category', 'variants', 'mediaAssets']));
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json([
            'message' => 'Product deleted successfully.',
        ]);
    }

    private function validated(Request $request, ?Product $product = null): array
    {
        return $request->validate([
            'category_id' => ['nullable', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('products', 'slug')->ignore($product),
            ],
            'description' => ['nullable', 'string'],
            'image_url' => ['nullable', 'string', 'max:2048'],
            'promo_video_url' => ['nullable', 'string', 'max:2048'],
            'unit' => ['required', Rule::in(['kg', 'ml', 'piece', 'box'])],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'in_stock' => ['nullable', 'boolean'],
            'featured' => ['nullable', 'boolean'],
            'featured_in_footer' => ['nullable', 'boolean'],
            'show_category_badge' => ['nullable', 'boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'signature_display_order' => ['nullable', 'integer', 'min:0'],
            'ingredients' => ['nullable', 'string'],
            'keywords' => ['nullable', 'string'],
            'variants' => ['nullable', 'array'],
            'variants.*.id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'variants.*.label' => ['required_with:variants', 'string', 'max:80'],
            'variants.*.unit' => ['required_with:variants', Rule::in(['kg', 'g', 'ml', 'l', 'piece', 'box'])],
            'variants.*.quantity_value' => ['required_with:variants', 'numeric', 'min:0'],
            'variants.*.quantity_unit' => ['required_with:variants', Rule::in(['g', 'kg', 'ml', 'l', 'piece', 'box'])],
            'variants.*.price' => ['required_with:variants', 'numeric', 'min:0'],
            'variants.*.compare_at_price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.sku' => ['nullable', 'string', 'max:255'],
            'variants.*.stock_quantity' => ['nullable', 'integer', 'min:0'],
            'variants.*.active' => ['nullable', 'boolean'],
            'variants.*.sort_order' => ['nullable', 'integer', 'min:0'],
        ]);
    }

    private function syncVariants(Product $product, array $variants): void
    {
        $seen = [];

        foreach ($variants as $variant) {
            $variantId = $variant['id'] ?? null;
            unset($variant['id']);

            $record = $variantId
                ? $product->variants()->whereKey($variantId)->firstOrFail()
                : $product->variants()->make();

            $record->fill($variant);
            $record->save();
            $seen[] = $record->id;
        }

        if ($seen !== []) {
            $product->variants()->whereNotIn('id', $seen)->delete();
        }
    }
}
