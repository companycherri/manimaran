<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'description',
        'image_url',
        'promo_video_url',
        'unit',
        'status',
        'in_stock',
        'featured',
        'featured_in_footer',
        'show_category_badge',
        'display_order',
        'signature_display_order',
        'ingredients',
        'keywords',
    ];

    protected function casts(): array
    {
        return [
            'in_stock' => 'boolean',
            'featured' => 'boolean',
            'featured_in_footer' => 'boolean',
            'show_category_badge' => 'boolean',
            'display_order' => 'integer',
            'signature_display_order' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Product $product): void {
            if (! $product->slug) {
                $product->slug = static::uniqueSlug($product->name, $product->id);
            }
        });
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->orderBy('sort_order')->orderBy('id');
    }

    public function mediaAssets(): MorphMany
    {
        return $this->morphMany(MediaAsset::class, 'entity');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    private static function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 2;

        while (static::query()
            ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
            ->where('slug', $slug)
            ->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
