import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

export default function CartItemCard({ item, onUpdateQuantity, onRemove }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-2xl p-6 shadow-md border-2 border-[#FED800]/20"
    >
      <div className="flex gap-4">
        <div className="w-24 h-24 rounded-xl overflow-hidden bg-[#FFF8E7] flex-shrink-0">
          <img
            src={item.product_image || "https://images.unsplash.com/photo-1596513961086-8d1d39a8efb6?w=200"}
            alt={item.product_name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-[#5C4033] text-lg mb-1">
              {item.product_name}
            </h3>
            <p className="text-[#8B6F47]">
              ₹{item.unit_price} {item.weight ? `/ ${item.weight}` : `/ ${item.unit}`}
            </p>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onUpdateQuantity(item, item.quantity - 1)}
                className="h-8 w-8 rounded-full border-[#FED800]"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="font-bold text-[#5C4033] w-8 text-center">
                {item.quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onUpdateQuantity(item, item.quantity + 1)}
                className="h-8 w-8 rounded-full border-[#FED800]"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-bold text-[#FED800] text-xl">
                ₹{(item.unit_price * item.quantity).toFixed(2)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(item.id)}
                className="text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}