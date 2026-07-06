<table style="width:100%; border-collapse: collapse; margin-top: 16px;">
    <thead>
        <tr style="background: #f7f2e8;">
            <th style="text-align:left; padding: 10px; border: 1px solid #eadfce;">Product</th>
            <th style="text-align:center; padding: 10px; border: 1px solid #eadfce;">Qty</th>
            <th style="text-align:right; padding: 10px; border: 1px solid #eadfce;">Unit Price</th>
            <th style="text-align:right; padding: 10px; border: 1px solid #eadfce;">Total</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($order->items as $item)
            <tr>
                <td style="padding: 10px; border: 1px solid #eadfce;">
                    {{ $item->product_name }}
                    @if ($item->variant_label)
                        <div style="font-size: 12px; color: #7a6655;">{{ $item->variant_label }}</div>
                    @endif
                </td>
                <td style="text-align:center; padding: 10px; border: 1px solid #eadfce;">{{ $item->quantity }}</td>
                <td style="text-align:right; padding: 10px; border: 1px solid #eadfce;">Rs. {{ number_format((float) $item->unit_price, 2) }}</td>
                <td style="text-align:right; padding: 10px; border: 1px solid #eadfce;">Rs. {{ number_format((float) $item->line_total, 2) }}</td>
            </tr>
        @endforeach
    </tbody>
</table>

<table style="width:100%; margin-top: 16px;">
    <tr>
        <td style="text-align:right; padding: 4px 0;">Subtotal:</td>
        <td style="text-align:right; width: 140px; padding: 4px 0;">Rs. {{ number_format((float) $order->subtotal, 2) }}</td>
    </tr>
    @if ((float) $order->discount_total > 0)
        <tr>
            <td style="text-align:right; padding: 4px 0;">Discount:</td>
            <td style="text-align:right; width: 140px; padding: 4px 0;">- Rs. {{ number_format((float) $order->discount_total, 2) }}</td>
        </tr>
    @endif
    <tr>
        <td style="text-align:right; padding: 8px 0; font-weight: bold;">Total:</td>
        <td style="text-align:right; width: 140px; padding: 8px 0; font-weight: bold;">Rs. {{ number_format((float) $order->total_amount, 2) }}</td>
    </tr>
</table>
