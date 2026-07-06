import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createHmac } from 'node:crypto';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return Response.json({ error: 'Missing payment details' }, { status: 400 });
        }

        // Verify signature
        const secret = Deno.env.get('RAZORPAY_KEY_SECRET');
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        const isValid = expectedSignature === razorpay_signature;

        return Response.json({
            verified: isValid,
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});