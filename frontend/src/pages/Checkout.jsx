import React from "react";
import { useNavigate } from "react-router-dom";
import { CartItem } from "@/entities/CartItem";
import { Order } from "@/entities/Order";
import { Product } from "@/entities/Product";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle2, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function Checkout() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = React.useState([]);
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    customer_name: "",
    customer_phone: "",
    delivery_address: ""
  });

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser) {
        // If we somehow got here without login (shouldn't happen with updated flow), redirect
        base44.auth.redirectToLogin(window.location.pathname);
        return;
      }

      // Check for guest cart items to sync
      const guestCart = JSON.parse(localStorage.getItem('base44_guest_cart') || '[]');
      if (guestCart.length > 0) {
        setLoading(true); // Ensure loading state
        try {
          // Create items in database
          await Promise.all(guestCart.map(item => {
            // Remove the temporary guest ID before creating
            const { id, ...itemData } = item; 
            return CartItem.create(itemData);
          }));
          
          // Clear guest cart
          localStorage.removeItem('base44_guest_cart');
          window.dispatchEvent(new Event('cart-updated'));
          toast.success("Your guest cart items have been merged!");
        } catch (syncError) {
          console.error("Error syncing guest cart:", syncError);
          toast.error("Failed to sync some cart items");
        }
      }
      
      const items = await CartItem.filter({ created_by: currentUser.email });
      setCartItems(items);
      setUser(currentUser);
      setFormData(prev => ({
        ...prev,
        customer_name: currentUser.full_name || "",
        customer_phone: currentUser.phone || "",
        delivery_address: currentUser.address || ""
      }));
      setLoading(false);
    } catch (error) {
      base44.auth.redirectToLogin(window.location.pathname);
    }
  };

  const total = cartItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Verify all cart products are still active before allowing checkout
      const productIds = [...new Set(cartItems.map(item => item.product_id).filter(Boolean))];
      const currentProducts = await Promise.all(productIds.map(id => Product.filter({ id })));
      const unavailableIds = new Set(
        productIds.filter((id, idx) => currentProducts[idx][0]?.status === 'inactive')
      );
      if (unavailableIds.size > 0) {
        toast.error("This product is currently unavailable.");
        setSubmitting(false);
        return;
      }

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load payment gateway");
        setSubmitting(false);
        return;
      }

      // Get existing orders to determine next order number
      const existingOrders = await Order.list('-created_date', 1);
      let nextOrderNumber = 1;
      
      if (existingOrders.length > 0) {
        const lastOrderNumber = existingOrders[0].order_number;
        const lastNumber = parseInt(lastOrderNumber.replace('ORD-', ''));
        nextOrderNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
      }
      
      const orderNumber = `ORD-${String(nextOrderNumber).padStart(6, '0')}`;

      // Create Razorpay order
      const { data: razorpayOrder } = await base44.functions.invoke('createRazorpayOrder', {
        amount: total,
        receipt: orderNumber
      });

      // Configure Razorpay payment
      const options = {
        key: razorpayOrder.keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'ManiMaran Palkova',
        description: 'Order Payment',
        order_id: razorpayOrder.orderId,
        prefill: {
          name: formData.customer_name,
          contact: formData.customer_phone
        },
        theme: {
          color: '#FED800'
        },
        handler: async (response) => {
          try {
            // Verify payment
            const { data: verification } = await base44.functions.invoke('verifyRazorpayPayment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verification.verified) {
              // Create order in database
              const newOrder = await Order.create({
                order_number: orderNumber,
                items: cartItems.map(item => ({
                  product_name: item.product_name,
                  quantity: item.quantity,
                  unit_price: item.unit_price,
                  unit: item.unit,
                  weight: item.weight
                })),
                total_amount: total,
                customer_name: formData.customer_name,
                customer_phone: formData.customer_phone,
                delivery_address: formData.delivery_address,
                order_date: new Date().toISOString(),
                payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                payment_status: 'completed',
                status: 'confirmed'
              });

              // Send order confirmation email
              try {
                const emailResponse = await base44.functions.invoke('sendOrderConfirmation', {
                  order_id: newOrder.id,
                  customer_email: user.email
                });
                console.log('Order confirmation email response:', emailResponse);
                if (emailResponse.data?.success) {
                  console.log('✓ Email sent successfully');
                }
              } catch (emailError) {
                console.error('Failed to send order confirmation email');
                console.error('Error:', emailError);
                console.error('Error message:', emailError.message);
                if (emailError.response) {
                  console.error('Response status:', emailError.response.status);
                  console.error('Response data:', JSON.stringify(emailError.response.data, null, 2));
                }
                // Don't block order completion if email fails
              }

              // Clear cart
              for (const item of cartItems) {
                await CartItem.delete(item.id);
              }

              toast.success("Payment successful! Order placed.");
              navigate(createPageUrl("MyOrders"));
            } else {
              toast.error("Payment verification failed");
            }
          } catch (error) {
            toast.error("Failed to verify payment");
          }
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            toast.error("Payment cancelled");
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error("Failed to initiate payment");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-white rounded-3xl" />
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    navigate(createPageUrl("Cart"));
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button
        variant="outline"
        onClick={() => navigate(createPageUrl("Cart"))}
        className="mb-6 border-[#5C4033] text-[#5C4033] hover:bg-[#5C4033] hover:text-white rounded-full"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Cart
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl p-8"
      >
        <h1 className="text-3xl font-bold text-[#5C4033] mb-8 flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-[#FED800]" />
          Checkout
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div>
            <h2 className="text-xl font-semibold text-[#5C4033] mb-4">Customer Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  required
                  className="mt-2 border-[#FED800]/30 focus:border-[#FED800]"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                  placeholder="+91 98765 43210"
                  required
                  className="mt-2 border-[#FED800]/30 focus:border-[#FED800]"
                />
              </div>

              <div>
                <Label htmlFor="address">Delivery Address *</Label>
                <Textarea
                  id="address"
                  value={formData.delivery_address}
                  onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
                  rows={3}
                  required
                  className="mt-2 border-[#FED800]/30 focus:border-[#FED800]"
                  placeholder="Enter your complete delivery address"
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t border-[#FED800]/20 pt-6">
            <h2 className="text-xl font-semibold text-[#5C4033] mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-[#8B6F47]">
                  <span>
                    {item.product_name} {item.weight && `(${item.weight})`} × {item.quantity}
                  </span>
                  <span className="font-medium">₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center text-xl font-bold text-[#5C4033] pt-4 border-t border-[#FED800]/20">
              <span>Total</span>
              <span className="text-[#FED800]">₹{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#FED800] text-[#5C4033] hover:bg-[#FED800]/90 h-14 text-lg rounded-full font-semibold"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            {submitting ? "Processing..." : "Proceed to Payment"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}