<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\MediaAssetResource;
use App\Http\Resources\ProductResource;
use App\Models\MediaAsset;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductImageController extends Controller
{
    public function store(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'image' => ['required', 'image', 'max:5120'],
            'set_primary' => ['nullable', 'boolean'],
        ]);

        $path = $validated['image']->store('products', 'public');
        $url = Storage::disk('public')->url($path);

        $media = MediaAsset::create([
            'disk' => 'public',
            'path' => $path,
            'url' => $url,
            'mime_type' => $validated['image']->getMimeType(),
            'size' => $validated['image']->getSize(),
            'uploaded_by_user_id' => $request->user()?->id,
            'entity_type' => Product::class,
            'entity_id' => $product->id,
        ]);

        if ($request->boolean('set_primary', true)) {
            $product->update(['image_url' => $url]);
        }

        return response()->json([
            'message' => 'Image uploaded successfully.',
            'media' => new MediaAssetResource($media),
            'product' => new ProductResource($product->refresh()->load(['category', 'variants', 'mediaAssets'])),
        ], 201);
    }

    public function destroy(Product $product, MediaAsset $mediaAsset): JsonResponse
    {
        abort_unless($mediaAsset->entity_type === Product::class && $mediaAsset->entity_id === $product->id, 404);

        Storage::disk($mediaAsset->disk)->delete($mediaAsset->path);
        $mediaAsset->delete();

        if ($product->image_url === $mediaAsset->url) {
            $product->update([
                'image_url' => $product->mediaAssets()->whereKeyNot($mediaAsset->id)->latest()->value('url'),
            ]);
        }

        return response()->json([
            'message' => 'Image deleted successfully.',
        ]);
    }
}
