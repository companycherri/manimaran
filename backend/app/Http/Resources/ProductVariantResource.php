<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'label' => $this->label,
            'unit' => $this->unit,
            'quantity_value' => $this->quantity_value,
            'quantity_unit' => $this->quantity_unit,
            'price' => $this->price,
            'compare_at_price' => $this->compare_at_price,
            'sku' => $this->sku,
            'stock_quantity' => $this->stock_quantity,
            'active' => $this->active,
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
