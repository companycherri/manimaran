<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderMailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FunctionController extends Controller
{
    public function sendContactEmail(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'subject' => ['nullable', 'string', 'max:255'],
            'message' => ['nullable', 'string', 'max:5000'],
        ]);

        Log::info('Contact form submitted.', $payload);

        return response()->json([
            'message' => 'Contact request received.',
        ]);
    }

    public function sendNewsletterSubscriptionEmail(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        Log::info('Newsletter subscription submitted.', $payload);

        return response()->json([
            'message' => 'Newsletter subscription received.',
        ]);
    }

    public function sendOrderConfirmation(Request $request, OrderMailService $orderMailService): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => ['required', 'exists:orders,id'],
        ]);

        $order = Order::with(['items', 'coupon', 'payments'])->findOrFail($validated['order_id']);
        abort_unless($order->user_id === $request->user()->id || $request->user()->hasRole('admin'), 403);

        $orderMailService->sendOrderPlacedEmails($order);

        return response()->json([
            'message' => 'Order confirmation sent.',
        ]);
    }
}
