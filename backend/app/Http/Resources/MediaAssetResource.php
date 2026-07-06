<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MediaAssetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'disk' => $this->disk,
            'path' => $this->path,
            'url' => $this->url,
            'mime_type' => $this->mime_type,
            'size' => $this->size,
            'entity_type' => $this->entity_type,
            'entity_id' => $this->entity_id,
            'uploaded_by_user_id' => $this->uploaded_by_user_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
