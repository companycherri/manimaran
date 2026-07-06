<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Http\Resources\PaymentResource;
use App\Models\Order;
use App\Models\Payment;
use App\Services\OrderMailService;
use App\Services\RazorpayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class RazorpayController extends Controller
{
    public function createOrder(Request $request, RazorpayService $razorpay): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => ['required', 'exists:orders,id'],
        ]);

        $order = Order::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($validated['order_id']);

        abort_if($order->payment_status === 'completed', 422, 'Order has already been paid.');
        abort_if((float) $order->total_amount <= 0, 422, 'Order total must be greater than zero.');

        try {
            $razorpayOrder = $razorpay->createOrder($order);
        } catch (Throwable $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 502);
        }

        $payment = Payment::updateOrCreate(
            [
                'provider' => 'razorpay',
                'provider_order_id' => $razorpayOrder['id'],
            ],
            [
                'order_id' => $order->id,
                'amount' => ((int) $razorpayOrder['amount']) / 100,
                'currency' => $razorpayOrder['currency'] ?? 'INR',
                'status' => $razorpayOrder['status'] ?? 'created',
                'raw_payload' => $razorpayOrder,
            ]
        );

        $order->update([
            'razorpay_order_id' => $razorpayOrder['id'],
            'payment_status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Razorpay order created.',
            'razorpay_order' => [
                'id' => $razorpayOrder['id'],
                'amount' => $razorpayOrder['amount'],
                'currency' => $razorpayOrder['currency'] ?? 'INR',
                'key_id' => config('services.razorpay.key_id'),
            ],
            'payment' => new PaymentResource($payment),
            'order' => new OrderResource($order->refresh()->load(['items', 'coupon', 'payments'])),
        ], 201);
    }

    public function createStandaloneOrder(Request $request, RazorpayService $razorpay): JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:1'],
            'receipt' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $razorpayOrder = $razorpay->createOrderForAmount(
                (float) $validated['amount'],
                $validated['receipt'] ?? 'cart-'.now()->format('YmdHis'),
                [
                    'user_id' => (string) $request->user()->id,
                    'source' => 'base44_frontend_adapter',
                ]
            );
        } catch (Throwable $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 502);
        }

        return response()->json([
            'message' => 'Razorpay order created.',
            'data' => [
                'orderId' => $razorpayOrder['id'],
                'amount' => $razorpayOrder['amount'],
                'currency' => $razorpayOrder['currency'] ?? 'INR',
                'keyId' => config('services.razorpay.key_id'),
            ],
        ], 201);
    }

    public function verifyStandalonePayment(Request $request, RazorpayService $razorpay): JsonResponse
    {
        $validated = $request->validate([
            'razorpay_order_id' => ['required', 'string'],
            'razorpay_payment_id' => ['required', 'string'],
            'razorpay_signature' => ['required', 'string'],
        ]);

        try {
            $verified = $razorpay->verifySignature(
                $validated['razorpay_order_id'],
                $validated['razorpay_payment_id'],
                $validated['razorpay_signature']
            );
        } catch (Throwable $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 502);
        }

        abort_unless($verified, 422, 'Payment verification failed.');

        return response()->json([
            'message' => 'Payment verified successfully.',
            'data' => [
                'success' => true,
                'verified' => true,
            ],
        ]);
    }

    public function verifyPayment(Request $request, RazorpayService $razorpay, OrderMailService $orderMailService): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => ['required', 'exists:orders,id'],
            'razorpay_order_id' => ['required', 'string'],
            'razorpay_payment_id' => ['required', 'string'],
            'razorpay_signature' => ['required', 'string'],
        ]);

        $order = Order::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($validated['order_id']);

        abort_unless($order->razorpay_order_id === $validated['razorpay_order_id'], 422, 'Razorpay order does not match this order.');

        try {
            $verified = $razorpay->verifySignature(
                $validated['razorpay_order_id'],
                $validated['razorpay_payment_id'],
                $validated['razorpay_signature']
            );
        } catch (Throwable $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 502);
        }

        if (! $verified) {
            Payment::where('provider', 'razorpay')
                ->where('provider_order_id', $validated['razorpay_order_id'])
                ->update([
                    'provider_payment_id' => $validated['razorpay_payment_id'],
                    'provider_signature' => $validated['razorpay_signature'],
                    'status' => 'failed',
                    'raw_payload' => $validated,
                ]);

            $order->update(['payment_status' => 'failed']);

            return response()->json([
                'message' => 'Payment verification failed.',
            ], 422);
        }

        $payment = DB::transaction(function () use ($order, $validated): Payment {
            $payment = Payment::updateOrCreate(
                [
                    'provider' => 'razorpay',
                    'provider_order_id' => $validated['razorpay_order_id'],
                ],
                [
                    'order_id' => $order->id,
                    'provider_payment_id' => $validated['razorpay_payment_id'],
                    'provider_signature' => $validated['razorpay_signature'],
                    'amount' => $order->total_amount,
                    'currency' => 'INR',
                    'status' => 'captured',
                    'raw_payload' => $validated,
                    'verified_at' => now(),
                ]
            );

            $order->update([
                'payment_status' => 'completed',
                'status' => $order->status === 'pending' ? 'confirmed' : $order->status,
                'razorpay_payment_id' => $validated['razorpay_payment_id'],
            ]);

            return $payment;
        });

        $orderMailService->sendPaymentCompletedEmails($order->refresh()->load(['items', 'coupon', 'payments']));

        return response()->json([
            'message' => 'Payment verified successfully.',
            'payment' => new PaymentResource($payment),
            'order' => new OrderResource($order->refresh()->load(['items', 'coupon', 'payments'])),
        ]);
    }
}
