import React from "react";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

export default function CartSummary({ items, total, onCheckout }) {
  const deliveryFee = 0;
  const finalTotal = total + deliveryFee;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-xl border-2 border-[#FED800]/20 sticky top-24"
    >
      <h2 className="text-2xl font-bold text-[#5C4033] mb-6">Order Summary</h2>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-[#8B6F47]">
          <span>Subtotal ({items.length} items)</span>
          <span className="font-medium">₹{total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[#8B6F47]">
          <span>Delivery Fee</span>
          <span className="font-medium text-green-600">FREE</span>
        </div>
      </div>

      <div className="border-t border-[#FED800]/20 pt-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-[#5C4033]">Total</span>
          <span className="text-3xl font-bold text-[#FED800]">
            ₹{finalTotal.toFixed(2)}
          </span>
        </div>
      </div>

      <Button
        onClick={onCheckout}
        className="w-full bg-[#FED800] text-[#5C4033] hover:bg-[#FED800]/90 h-14 text-lg rounded-full font-semibold"
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
  );
}