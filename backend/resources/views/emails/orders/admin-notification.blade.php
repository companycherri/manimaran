<div style="font-family: Arial, sans-serif; color: #333; max-width: 720px; margin: 0 auto;">
    <h1 style="color: #5c4033;">{{ $event === 'paid' ? 'Paid Order Notification' : 'New Order Notification' }}</h1>

    <div style="background: #fff8e7; border: 1px solid #eadfce; padding: 16px; margin: 18px 0;">
        <p><strong>Order Number:</strong> {{ $order->order_number }}</p>
        <p><strong>Customer:</strong> {{ $order->customer_name }}</p>
        <p><strong>Email:</strong> {{ $order->customer_email ?? 'N/A' }}</p>
        <p><strong>Phone:</strong> {{ $order->customer_phone }}</p>
        <p><strong>Status:</strong> {{ str_replace('_', ' ', ucfirst($order->status)) }}</p>
        <p><strong>Payment Status:</strong> {{ ucfirst($order->payment_status) }}</p>
        @if ($order->razorpay_payment_id)
            <p><strong>Razorpay Payment ID:</strong> {{ $order->razorpay_payment_id }}</p>
        @endif
    </div>

    @include('emails.orders.partials.items', ['order' => $order])

    <h3 style="margin-top: 24px;">Delivery Address</h3>
    <p style="white-space: pre-line;">{{ $order->delivery_address }}</p>
</div>
