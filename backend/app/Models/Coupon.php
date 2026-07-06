<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Coupon extends Model
{
    protected $fillable = [
        'code',
        'description',
        'discount_type',
        'discount_value',
        'min_order_value',
        'max_discount',
        'valid_from',
        'valid_until',
        'usage_limit',
        'used_count',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'discount_value' => 'decimal:2',
            'min_order_value' => 'decimal:2',
            'max_discount' => 'decimal:2',
            'valid_from' => 'date',
            'valid_until' => 'date',
            'usage_limit' => 'integer',
            'used_count' => 'integer',
            'active' => 'boolean',
        ];
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(CouponRedemption::class);
    }

    public function normalizedCode(): string
    {
        return strtoupper(trim($this->code));
    }

    public function isUsableFor(float $subtotal): bool
    {
        if (! $this->active) {
            return false;
        }

        if ($this->valid_from && $this->valid_from->isFuture()) {
            return false;
        }

        if ($this->valid_until && $this->valid_until->endOfDay()->isPast()) {
            return false;
        }

        if ($this->usage_limit !== null && $this->used_count >= $this->usage_limit) {
            return false;
        }

        return $subtotal >= (float) $this->min_order_value;
    }

    public function discountFor(float $subtotal): float
    {
        if ($this->discount_type === 'percentage') {
            $discount = $subtotal * ((float) $this->discount_value / 100);

            if ($this->max_discount !== null) {
                $discount = min($discount, (float) $this->max_discount);
            }

            return round($discount, 2);
        }

        return round(min((float) $this->discount_value, $subtotal), 2);
    }
}
