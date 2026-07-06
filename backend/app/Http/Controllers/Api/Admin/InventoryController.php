<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductVariantResource;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InventoryController extends Controller
{
    public function update(Request $request, ProductVariant $variant): ProductVariantResource
    {
        $validated = $request->validate([
            'stock_quantity' => ['nullable', 'integer', 'min:0'],
            'active' => ['nullable', 'boolean'],
            'sku' => ['nullable', 'string', 'max:255', Rule::unique('product_variants', 'sku')->ignore($variant)],
            'price' => ['nullable', 'numeric', 'min:0'],
            'compare_at_price' => ['nullable', 'numeric', 'min:0'],
        ]);

        $variant->update($validated);

        $product = $variant->product()->with('variants')->firstOrFail();
        $hasAvailableVariant = $product->variants
            ->where('active', true)
            ->contains(fn (ProductVariant $item) => $item->stock_quantity === null || $item->stock_quantity > 0);

        $product->update(['in_stock' => $hasAvailableVariant]);

        return new ProductVariantResource($variant->refresh());
    }
}
