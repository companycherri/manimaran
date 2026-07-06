<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CouponResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'description' => $this->description,
            'discount_type' => $this->discount_type,
            'discount_value' => $this->discount_value,
            'min_order_value' => $this->min_order_value,
            'max_discount' => $this->max_discount,
            'valid_from' => $this->valid_from,
            'valid_until' => $this->valid_until,
            'usage_limit' => $this->usage_limit,
            'used_count' => $this->used_count,
            'active' => $this->active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
