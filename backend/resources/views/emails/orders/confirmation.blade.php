<div style="font-family: Arial, sans-serif; color: #4d352a; max-width: 680px; margin: 0 auto;">
    <h1 style="color: #5c4033;">Order Confirmed</h1>

    <p>Hello {{ $order->customer_name }},</p>
    <p>Thank you for your order. We have received your order and will keep you updated as it progresses.</p>

    <div style="background: #fff8e7; border: 1px solid #eadfce; padding: 16px; margin: 18px 0;">
        <p><strong>Order Number:</strong> {{ $order->order_number }}</p>
        <p><strong>Order Date:</strong> {{ optional($order->order_date)->format('d M Y, h:i A') }}</p>
        <p><strong>Status:</strong> {{ str_replace('_', ' ', ucfirst($order->status)) }}</p>
        <p><strong>Payment Status:</strong> {{ ucfirst($order->payment_status) }}</p>
    </div>

    @include('emails.orders.partials.items', ['order' => $order])

    <h3 style="margin-top: 24px;">Delivery Address</h3>
    <p style="white-space: pre-line;">{{ $order->delivery_address }}</p>

    <p style="margin-top: 24px;">Warmly,<br>{{ config('app.name') }}</p>
</div>
