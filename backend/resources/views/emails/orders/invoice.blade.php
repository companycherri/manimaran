<div style="font-family: Arial, sans-serif; color: #4d352a; max-width: 680px; margin: 0 auto;">
    <h1 style="color: #5c4033;">Invoice</h1>

    <p>Hello {{ $order->customer_name }},</p>
    <p>Your payment has been verified. Please find your invoice details below.</p>

    <div style="background: #fff8e7; border: 1px solid #eadfce; padding: 16px; margin: 18px 0;">
        <p><strong>Invoice For:</strong> Order #{{ $order->order_number }}</p>
        <p><strong>Order Date:</strong> {{ optional($order->order_date)->format('d M Y, h:i A') }}</p>
        <p><strong>Payment Status:</strong> {{ ucfirst($order->payment_status) }}</p>
        @if ($order->razorpay_payment_id)
            <p><strong>Razorpay Payment ID:</strong> {{ $order->razorpay_payment_id }}</p>
        @endif
    </div>

    @include('emails.orders.partials.items', ['order' => $order])

    <h3 style="margin-top: 24px;">Billing / Delivery Details</h3>
    <p><strong>Name:</strong> {{ $order->customer_name }}</p>
    <p><strong>Email:</strong> {{ $order->customer_email }}</p>
    <p><strong>Phone:</strong> {{ $order->customer_phone }}</p>
    <p style="white-space: pre-line;"><strong>Address:</strong><br>{{ $order->delivery_address }}</p>

    <p style="margin-top: 24px;">Thank you for shopping with {{ config('app.name') }}.</p>
</div>
