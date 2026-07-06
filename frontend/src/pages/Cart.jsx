import React from "react";
import { useNavigate } from "react-router-dom";
import { CartItem } from "@/entities/CartItem";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingBag, Trash2, Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    setLoading(true);
    try {
      const isAuthenticated = await base44.auth.isAuthenticated();
      if (isAuthenticated) {
        const user = await base44.auth.me();
        const items = await CartItem.filter({ created_by: user.email }, "-created_date");
        setCartItems(items);
      } else {
        const guestCart = JSON.parse(localStorage.getItem('base44_guest_cart') || '[]');
        setCartItems(guestCart);
      }
    } catch (error) {
      console.error("Error loading cart:", error);
      setCartItems([]);
    }
    setLoading(false);
  };

  const updateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      const isAuthenticated = await base44.auth.isAuthenticated();
      if (isAuthenticated) {
        await CartItem.update(item.id, { quantity: newQuantity });
      } else {
        const guestCart = JSON.parse(localStorage.getItem('base44_guest_cart') || '[]');
        const updatedCart = guestCart.map(cartItem =>
          cartItem.id === item.id ? { ...cartItem, quantity: newQuantity } : cartItem
        );
        localStorage.setItem('base44_guest_cart', JSON.stringify(updatedCart));
        window.dispatchEvent(new Event('cart-updated'));
      }
      toast.success("Cart updated");
      loadCart();
    } catch (error) {
      console.error("Error updating cart:", error);
      toast.error("Failed to update cart");
    }
  };

  const removeItem = async (itemId) => {
    try {
      const isAuthenticated = await base44.auth.isAuthenticated();
      if (isAuthenticated) {
        await CartItem.delete(itemId);
      } else {
        const guestCart = JSON.parse(localStorage.getItem('base44_guest_cart') || '[]');
        const updatedCart = guestCart.filter(item => item.id !== itemId);
        localStorage.setItem('base44_guest_cart', JSON.stringify(updatedCart));
        window.dispatchEvent(new Event('cart-updated'));
      }
      toast.success("Item removed from cart");
      loadCart();
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    }
  };

  const total = cartItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <Button
        variant="outline"
        onClick={() => navigate(createPageUrl("Products"))}
        className="mb-6 border-[#5C4033] text-[#5C4033] hover:bg-[#5C4033] hover:text-white rounded-full"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Continue Shopping
      </Button>

      <h1 className="text-3xl md:text-4xl font-bold text-[#5C4033] mb-6 md:mb-8 flex items-center gap-3">
        <ShoppingBag className="w-7 h-7 md:w-8 md:h-8 text-[#FED800]" />
        Your Cart
      </h1>

      {cartItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-white rounded-3xl shadow-lg"
        >
          <div className="text-8xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-[#5C4033] mb-2">Your cart is empty</h2>
          <p className="text-[#8B6F47] mb-6">Add some delicious sweets to get started!</p>
          <Button
            onClick={() => navigate(createPageUrl("Products"))}
            className="bg-[#FED800] text-[#5C4033] hover:bg-[#FED800]/90 rounded-full"
          >
            Browse Products
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {cartItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl p-4 md:p-6 shadow-md border-2 border-[#FED800]/20"
                >
                  <div className="flex gap-3 md:gap-4">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-[#FFF8E7] flex-shrink-0">
                      <img
                        src={item.product_image || "https://images.unsplash.com/photo-1596513961086-8d1d39a8efb6?w=200"}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <h3 className="font-bold text-[#5C4033] text-base md:text-lg mb-1 break-words">
                          {item.product_name}
                        </h3>
                        <p className="text-[#8B6F47] text-sm">
                          ₹{item.unit_price} {item.weight ? `/ ${item.weight}` : `/ ${item.unit}`}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between mt-3 gap-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item, item.quantity - 1)}
                            className="h-8 w-8 rounded-full border-[#FED800]"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="font-bold text-[#5C4033] w-6 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item, item.quantity + 1)}
                            className="h-8 w-8 rounded-full border-[#FED800]"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#FED800] text-lg md:text-xl">
                            ₹{(item.unit_price * item.quantity).toFixed(2)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Cart Summary */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 md:p-6 shadow-xl border-2 border-[#FED800]/20 lg:sticky lg:top-24"
            >
              <h2 className="text-xl md:text-2xl font-bold text-[#5C4033] mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-[#8B6F47]">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span className="font-medium">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#8B6F47]">
                  <span>Delivery Fee</span>
                  <span className="font-medium text-green-600">FREE</span>
                </div>
              </div>

              <div className="border-t border-[#FED800]/20 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg md:text-xl font-bold text-[#5C4033]">Total</span>
                  <span className="text-2xl md:text-3xl font-bold text-[#FED800]">
                    ₹{total.toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                onClick={async () => {
                  const isAuthenticated = await base44.auth.isAuthenticated();
                  if (!isAuthenticated) {
                    toast.error("Please login to proceed to checkout");
                    base44.auth.redirectToLogin(createPageUrl("Checkout"));
                    return;
                  }
                  navigate(createPageUrl("Checkout"));
                }}
                className="w-full bg-[#FED800] text-[#5C4033] hover:bg-[#FED800]/90 h-12 md:h-14 text-base md:text-lg rounded-full font-semibold"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Proceed to Checkout
              </Button>

              <div className="mt-6 text-center">
                <p className="text-xs text-[#8B6F47]">
                  🔒 Secure Checkout • 🌿 Fresh Products
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}