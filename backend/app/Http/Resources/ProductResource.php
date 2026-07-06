<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'image_url' => $this->image_url,
            'promo_video_url' => $this->promo_video_url,
            'unit' => $this->unit,
            'status' => $this->status,
            'in_stock' => $this->in_stock,
            'featured' => $this->featured,
            'featured_in_footer' => $this->featured_in_footer,
            'show_category_badge' => $this->show_category_badge,
            'display_order' => $this->display_order,
            'signature_display_order' => $this->signature_display_order,
            'ingredients' => $this->ingredients,
            'keywords' => $this->keywords,
            'variants' => ProductVariantResource::collection($this->whenLoaded('variants')),
            'media_assets' => MediaAssetResource::collection($this->whenLoaded('mediaAssets')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
