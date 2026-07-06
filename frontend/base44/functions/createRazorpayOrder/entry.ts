import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Razorpay from 'npm:razorpay@2.9.2';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { amount, currency = 'INR', receipt } = await req.json();

        if (!amount || amount <= 0) {
            return Response.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const razorpay = new Razorpay({
            key_id: Deno.env.get('RAZORPAY_KEY_ID'),
            key_secret: Deno.env.get('RAZORPAY_KEY_SECRET')
        });

        const options = {
            amount: Math.round(amount * 100), // Convert to paise
            currency,
            receipt: receipt || `receipt_${Date.now()}`,
            notes: {
                user_email: user.email,
                user_name: user.full_name
            }
        };

        const order = await razorpay.orders.create(options);

        return Response.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: Deno.env.get('RAZORPAY_KEY_ID')
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});