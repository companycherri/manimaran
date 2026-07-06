<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class MediaAsset extends Model
{
    protected $fillable = [
        'disk',
        'path',
        'url',
        'mime_type',
        'size',
        'uploaded_by_user_id',
        'entity_type',
        'entity_id',
    ];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
        ];
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }

    public function entity(): MorphTo
    {
        return $this->morphTo();
    }
}
