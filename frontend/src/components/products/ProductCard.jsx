import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function ProductCard({ product }) {
  const navigate = useNavigate();

  const handleViewProduct = () => {
    navigate(createPageUrl(`ProductDetail?id=${product.id}`));
  };

  return (
    <motion.div
      whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}
      className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 group cursor-pointer"
    >
      <div onClick={handleViewProduct}>
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#FFF8E7] to-white">
          <img
            src={product.image_url || "https://images.unsplash.com/photo-1596513961086-8d1d39a8efb6?w=400"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {product.featured && (
            <Badge className="absolute top-3 right-3 bg-[#FED800] text-[#5C4033] border-0 shadow-md">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Bestseller
            </Badge>
          )}
          {!product.in_stock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge className="bg-white text-red-600 border-0 font-semibold text-lg p-2">Out of Stock</Badge>
            </div>
          )}
        </div>
      </div>
      <div className="p-4 text-center">
        <div onClick={handleViewProduct} className="cursor-pointer">
          <h3 className="font-bold text-[#5C4033] text-lg mb-2 truncate group-hover:text-[#8B6F47] transition-colors">
            {product.name}
          </h3>
        </div>
        <div className="mb-4">
          {product.unit === 'ml' ? (
            (() => {
              const displayVolume = product.default_display_volume || '200ml';
              const priceMap = {
                '200ml': product.price_200ml,
                '500ml': product.price_500ml,
                '1000ml': product.price_1000ml
              };
              const price = priceMap[displayVolume];
              return price ? (
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-2xl font-bold text-[#5C4033]">₹{price}</span>
                  <span className="text-sm text-[#8B6F47] font-medium">/ {displayVolume}</span>
                </div>
              ) : null;
            })()
          ) : product.price_per_kg ? (
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-2xl font-bold text-[#5C4033]">₹{product.price_per_kg}</span>
              <span className="text-sm text-[#8B6F47] font-medium">/ kg</span>
            </div>
          ) : (
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-2xl font-bold text-[#5C4033]">₹{product.price}</span>
              <span className="text-sm text-[#8B6F47] font-medium">/ {product.unit}</span>
            </div>
          )}
        </div>
        <Button 
          onClick={handleViewProduct}
          disabled={!product.in_stock}
          className="w-full bg-[#5C4033] text-white hover:bg-[#8B6F47]"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </div>
    </motion.div>
  );
}