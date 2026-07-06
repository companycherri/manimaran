<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $orders = Order::query()
            ->with(['items', 'coupon'])
            ->when($request->string('status')->toString(), fn ($query, string $status) => $query->where('status', $status))
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where(function ($searchQuery) use ($search): void {
                    $searchQuery
                        ->where('order_number', 'like', "%{$search}%")
                        ->orWhere('customer_name', 'like', "%{$search}%")
                        ->orWhere('customer_phone', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($request->integer('per_page', 50));

        return OrderResource::collection($orders);
    }

    public function show(Order $order): OrderResource
    {
        return new OrderResource($order->load(['items', 'coupon', 'statusHistories']));
    }

    public function updateStatus(Request $request, Order $order): OrderResource
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'])],
            'tracking_id' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:5000'],
        ]);

        $oldStatus = $order->status;
        $order->update([
            'status' => $validated['status'],
            'tracking_id' => $validated['tracking_id'] ?? $order->tracking_id,
        ]);

        $order->statusHistories()->create([
            'old_status' => $oldStatus,
            'new_status' => $validated['status'],
            'changed_by_user_id' => $request->user()->id,
            'note' => $validated['note'] ?? null,
        ]);

        return new OrderResource($order->refresh()->load(['items', 'coupon']));
    }
}
