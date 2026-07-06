import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CreditCard, Smartphone } from "lucide-react";

export default function GheeFooterSection() {
  const [gheeProduct, setGheeProduct] = useState(null);

  useEffect(() => {
    loadGheeProduct();
  }, []);

  const loadGheeProduct = async () => {
    try {
      const products = await base44.entities.Product.filter({ 
        featured_in_footer: true,
        category: "ghee" 
      });
      if (products.length > 0) {
        setGheeProduct(products[0]);
      }
    } catch (error) {
      console.error("Error loading ghee product:", error);
    }
  };

  if (!gheeProduct) return null;

  return (
    <div className="mt-12 pt-8 border-t border-[#FED800]/20">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        {/* Left: Product Info */}
        <div className="flex items-center gap-6">
          {gheeProduct.image_url && (
            <img 
              src={gheeProduct.image_url} 
              alt={gheeProduct.name}
              className="w-32 h-32 object-cover rounded-lg shadow-lg"
            />
          )}
          <div>
            <h3 className="text-2xl font-bold text-[#FED800] mb-2">
              {gheeProduct.name}
            </h3>
            {gheeProduct.description && (
              <p className="text-[#FFF8E7]/90 text-sm mb-3">
                {gheeProduct.description}
              </p>
            )}
            <div className="space-y-1 text-sm">
              {gheeProduct.price_200ml && (
                <p className="text-[#FFF8E7]">200ml - ₹{gheeProduct.price_200ml}</p>
              )}
              {gheeProduct.price_500ml && (
                <p className="text-[#FFF8E7]">500ml - ₹{gheeProduct.price_500ml}</p>
              )}
              {gheeProduct.price_1000ml && (
                <p className="text-[#FFF8E7]">1000ml - ₹{gheeProduct.price_1000ml}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Payment Options */}
        <div className="flex flex-col items-end">
          <h4 className="text-lg font-semibold text-[#FED800] mb-4">
            We Accept
          </h4>
          <div className="flex flex-wrap gap-3 justify-end">
            <div className="bg-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md">
              <CreditCard className="w-5 h-5 text-[#5C4033]" />
              <span className="text-[#5C4033] font-medium text-sm">Card</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md">
              <Smartphone className="w-5 h-5 text-[#5C4033]" />
              <span className="text-[#5C4033] font-medium text-sm">UPI</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow-md">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" 
                alt="Razorpay" 
                className="h-5"
              />
            </div>
          </div>
          <p className="text-xs text-[#FFF8E7]/70 mt-3">Secure payment gateway</p>
        </div>
      </div>
    </div>
  );
}