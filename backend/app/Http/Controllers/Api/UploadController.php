<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'max:10240'],
        ]);

        $path = $validated['file']->store('uploads', 'public');

        return response()->json([
            'file_url' => Storage::disk('public')->url($path),
            'path' => $path,
        ], 201);
    }
}
