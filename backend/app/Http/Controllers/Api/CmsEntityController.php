<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CmsEntity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CmsEntityController extends Controller
{
    public function index(Request $request, string $entity): JsonResponse
    {
        $records = CmsEntity::query()
            ->where('entity', $this->entityName($entity))
            ->get()
            ->map(fn (CmsEntity $record): array => $this->payload($record))
            ->filter(fn (array $record): bool => $this->matchesFilters($record, $request->query('filter', [])))
            ->values();

        return response()->json([
            'data' => $records,
        ]);
    }

    public function store(Request $request, string $entity): JsonResponse
    {
        $validated = $request->validate([
            'data' => ['required', 'array'],
        ]);

        $record = CmsEntity::create([
            'entity' => $this->entityName($entity),
            'data' => $validated['data'],
            'created_by_user_id' => $request->user()?->id,
            'updated_by_user_id' => $request->user()?->id,
        ]);

        return response()->json([
            'data' => $this->payload($record),
        ], 201);
    }

    public function update(Request $request, string $entity, CmsEntity $cmsEntity): JsonResponse
    {
        abort_unless($cmsEntity->entity === $this->entityName($entity), 404);

        $validated = $request->validate([
            'data' => ['required', 'array'],
        ]);

        $cmsEntity->update([
            'data' => array_replace($cmsEntity->data ?? [], $validated['data']),
            'updated_by_user_id' => $request->user()?->id,
        ]);

        return response()->json([
            'data' => $this->payload($cmsEntity->refresh()),
        ]);
    }

    public function destroy(string $entity, CmsEntity $cmsEntity): JsonResponse
    {
        abort_unless($cmsEntity->entity === $this->entityName($entity), 404);

        $cmsEntity->delete();

        return response()->json([
            'message' => 'Record deleted successfully.',
        ]);
    }

    private function entityName(string $entity): string
    {
        abort_unless(preg_match('/^[A-Za-z][A-Za-z0-9_]*$/', $entity), 404);

        return Str::studly($entity);
    }

    private function payload(CmsEntity $record): array
    {
        return [
            'id' => $record->id,
            ...($record->data ?? []),
            'created_date' => optional($record->created_at)->toISOString(),
            'updated_date' => optional($record->updated_at)->toISOString(),
            'created_at' => $record->created_at,
            'updated_at' => $record->updated_at,
        ];
    }

    private function matchesFilters(array $record, mixed $filters): bool
    {
        if (! is_array($filters)) {
            return true;
        }

        foreach ($filters as $key => $value) {
            if ($value === null || $value === '') {
                continue;
            }

            if (($record[$key] ?? null) != $value) {
                return false;
            }
        }

        return true;
    }
}
