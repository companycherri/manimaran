import React from "react";
import { useNavigate } from "react-router-dom";
import { Product } from "@/entities/Product";
import { CartItem } from "@/entities/CartItem";
import { SiteSettings } from "@/entities/SiteSettings";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingCart, Plus, Minus, Star, Check } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function ProductDetail() {
  const navigate = useNavigate();
  const [product, setProduct] = React.useState(null);
  const [selectedWeight, setSelectedWeight] = React.useState(null);
  const [quantity, setQuantity] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [adding, setAdding] = React.useState(false);
  const [whatsappNumber, setWhatsappNumber] = React.useState("");

  const getAvailableWeights = () => {
    if (!product) return [];
    
    if (product.unit === 'ml') {
      // For liquid products (ghee), return volumes in ml
      const volumes = [];
      if (product.price_200ml) volumes.push(200);
      if (product.price_500ml) volumes.push(500);
      if (product.price_1000ml) volumes.push(1000);
      return volumes;
    }
    
    // For kg products, return weights in grams
    const weights = [];
    if (product.price_250g) weights.push(250);
    if (product.price_500g) weights.push(500);
    if (product.price_per_kg) weights.push(1000);
    
    return weights;
  };

  const formatWeight = (value) => {
    if (product?.unit === 'ml') {
      // Format as volume for liquid products
      if (value >= 1000) {
        return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)} L`;
      }
      return `${value} ml`;
    }
    
    // Format as weight for solid products
    if (value >= 1000) {
      return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)} kg`;
    }
    return `${value} g`;
  };

  React.useEffect(() => {
    SiteSettings.list().then(settings => {
      if (settings.length > 0 && settings[0].whatsapp_number) {
        setWhatsappNumber(settings[0].whatsapp_number);
      }
    }).catch(() => {});
  }, []);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (productId) {
      loadProduct(productId);
    } else {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (product && !selectedWeight) {
      const weights = getAvailableWeights();
      if (weights.length > 0) {
        setSelectedWeight(weights[0]);
      }
    }
  }, [product]);

  const loadProduct = async (productId) => {
    setLoading(true);
    try {
      const products = await Product.filter({ id: productId });
      if (products && products.length > 0) {
        setProduct(products[0]);
      } else {
        setProduct(null);
      }
    } catch (error) {
      console.error("Error loading product:", error);
      setProduct(null);
    }
    setLoading(false);
  };

  const getPriceForWeight = (weight) => {
    if (!product || !weight) return 0;
    
    if (product.unit === 'ml') {
      // Pricing for liquid products (volumes)
      if (weight === 200 && product.price_200ml) return product.price_200ml;
      if (weight === 500 && product.price_500ml) return product.price_500ml;
      if (weight === 1000 && product.price_1000ml) return product.price_1000ml;
    } else {
      // Pricing for solid products (weights)
      if (weight === 250 && product.price_250g) return product.price_250g;
      if (weight === 500 && product.price_500g) return product.price_500g;
      if (weight === 1000 && product.price_per_kg) return product.price_per_kg;
    }
    
    return product.price || 0;
  };

  const getUnitPrice = () => getPriceForWeight(selectedWeight);
  const getTotalPrice = () => getUnitPrice() * quantity;

  const addToCart = async () => {
    if (!product || !selectedWeight) return;
    if (product.status === 'inactive') {
      toast.error("This product is currently unavailable.");
      return;
    }

    setAdding(true);
    try {
      const unitPrice = getPriceForWeight(selectedWeight);
      const cartItemData = {
        product_id: product.id,
        product_name: product.name,
        product_image: product.image_url,
        quantity: quantity,
        unit_price: unitPrice,
        unit: product.unit,
        weight: formatWeight(selectedWeight)
      };

      const isAuthenticated = await base44.auth.isAuthenticated();

      if (isAuthenticated) {
        await CartItem.create(cartItemData);
      } else {
        // Guest Cart Logic
        const guestCart = JSON.parse(localStorage.getItem('base44_guest_cart') || '[]');
        const existingItemIndex = guestCart.findIndex(item => 
          item.product_id === cartItemData.product_id && item.weight === cartItemData.weight
        );

        if (existingItemIndex > -1) {
          guestCart[existingItemIndex].quantity += quantity;
        } else {
          // Generate a temp ID for local handling
          cartItemData.id = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          guestCart.push(cartItemData);
        }
        
        localStorage.setItem('base44_guest_cart', JSON.stringify(guestCart));
        window.dispatchEvent(new Event('cart-updated'));
      }

      toast.success(`${product.name} (${formatWeight(selectedWeight)} × ${quantity}) added to cart!`);
      navigate(createPageUrl("Cart"));
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart");
    }
    setAdding(false);
  };

  const categoryLabels = {
    ghee_sweets: "Ghee Sweets",
    milk_sweets: "Milk Sweets",
    cashew_sweets: "Cashew Sweets",
    dry_fruit_sweets: "Dry Fruit Sweets",
    savouries: "Savouries",
    hampers: "Hampers",
    mysurpa: "Mysurpa",
    ghee: "Pure Ghee"
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8E7]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse grid md:grid-cols-2 gap-12">
            <div className="h-[500px] bg-gray-200 rounded-3xl" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-32 bg-gray-200 rounded" />
              <div className="h-12 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product || product.status === 'inactive') {
    return (
      <div className="min-h-screen bg-[#FFF8E7] flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <div className="text-8xl mb-4">😔</div>
          <h2 className="text-3xl font-bold text-[#5C4033] mb-4">
            {product ? "This product is currently unavailable." : "Product not found"}
          </h2>
          <p className="text-[#8B6F47] mb-6">
            {product ? "Please check back later or explore our other products." : "The product you're looking for doesn't exist."}
          </p>
          <Button 
            onClick={() => navigate(createPageUrl("Products"))}
            className="bg-[#FED800] text-[#5C4033] hover:bg-[#FFA500]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8E7]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Products"))}
          className="mb-6 text-[#5C4033] hover:text-[#FED800] hover:bg-[#FED800]/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>

        <div className="grid md:grid-cols-2 gap-8 bg-white rounded-3xl p-8 shadow-xl items-start">
          {/* Left Side - Image */}
          <div className="flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative bg-gradient-to-br from-[#FFF8E7] to-white rounded-2xl p-6 shadow-inner w-full aspect-square flex items-center justify-center"
            >
              <div className="w-full h-full flex items-center justify-center bg-white rounded-lg">
                <img
                  src={product.image_url || "https://images.unsplash.com/photo-1596513961086-8d1d39a8efb6?w=800"}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
              {product.featured && (
                <Badge className="absolute top-4 right-4 bg-[#FED800] text-[#5C4033] border-0 shadow-lg">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Featured
                </Badge>
              )}
            </motion.div>
          </div>

          {/* Right Side - Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col justify-start"
          >
            {product.show_category_badge !== false && product.category && (
              <Badge className="w-fit mb-4 bg-[#5C4033] text-[#FED800] border-0">
                {categoryLabels[product.category] || 'Sweet'}
              </Badge>
            )}

            <h1 className="text-4xl font-bold text-[#5C4033] mb-6" style={{fontFamily: 'Georgia, serif'}}>
              {product.name}
            </h1>

            <div className="mb-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-bold text-[#5C4033]">
                  ₹{getTotalPrice().toFixed(2)}
                </span>
              </div>
              <p className="text-[#8B6F47] text-sm">
                ₹{getUnitPrice().toFixed(2)} / {selectedWeight ? formatWeight(selectedWeight) : ''} × {quantity} {quantity > 1 ? 'units' : 'unit'}
              </p>
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {product.in_stock ? (
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <Check className="w-5 h-5" />
                  In Stock - Ready to Ship
                </div>
              ) : (
                <Badge variant="outline" className="border-red-500 text-red-700">
                  Out of Stock
                </Badge>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <p className="text-[#5C4033] leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Weight/Volume Selector */}
            <div className="mb-6">
              <label className="block font-semibold text-[#5C4033] mb-3 uppercase text-sm">
                {product.unit === 'ml' ? 'Volume' : 'Weight'}
              </label>
              <div className="flex flex-wrap gap-3">
                {getAvailableWeights().map((weight) => (
                  <Button
                    key={weight}
                    variant={selectedWeight === weight ? "default" : "outline"}
                    onClick={() => setSelectedWeight(weight)}
                    className={selectedWeight === weight 
                      ? "bg-[#FED800] text-[#5C4033] hover:bg-[#FFA500] border-2 border-[#FED800]" 
                      : "border-2 border-gray-300 hover:border-[#FED800]"}
                    disabled={!product.in_stock}
                  >
                    {formatWeight(weight)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block font-semibold text-[#5C4033] mb-3 uppercase text-sm">
                Quantity
              </label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-12 w-12 border-2 border-gray-300 rounded-lg hover:border-[#FED800]"
                  disabled={!product.in_stock}
                >
                  <Minus className="w-5 h-5" />
                </Button>
                <div className="text-center min-w-[80px]">
                  <div className="text-2xl font-bold text-[#5C4033]">
                    {quantity}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-12 w-12 border-2 border-gray-300 rounded-lg hover:border-[#FED800]"
                  disabled={!product.in_stock}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={addToCart}
              disabled={!product.in_stock || adding}
              className="w-full bg-[#FED800] hover:bg-[#FFA500] text-[#5C4033] h-14 text-lg font-bold rounded-lg shadow-lg mb-8"
            >
              {adding ? (
                "Adding to Cart..."
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </>
              )}
            </Button>

            {/* Ingredients */}
            {product.ingredients && (
              <div className="mb-6 bg-[#FFF8E7] p-4 rounded-lg">
                <h3 className="font-semibold text-[#5C4033] mb-3 text-lg">
                  Ingredients:
                </h3>
                <ul className="space-y-2">
                  {product.ingredients.split(',').map((ingredient, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[#5C4033]">
                      <span className="text-[#FED800] mt-1">•</span>
                      <span>{ingredient.trim()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-3xl mb-2">🌿</div>
                <p className="text-xs text-[#5C4033] font-medium">Pure & Natural</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">👨‍🍳</div>
                <p className="text-xs text-[#5C4033] font-medium">Freshly Made</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">✓</div>
                <p className="text-xs text-[#5C4033] font-medium">FSSAI Approved</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating WhatsApp Order Button */}
      {product && whatsappNumber && (
        <motion.a
          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi! I'd like to order: *${product.name}*. Please let me know the availability and details.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, scale: 0.5, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 18 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#25D366] text-white px-5 py-3 rounded-full shadow-2xl font-semibold text-sm"
          style={{ boxShadow: "0 8px 30px rgba(37,211,102,0.45)" }}
        >
          {/* WhatsApp Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Order on WhatsApp
        </motion.a>
      )}
    </div>
  );
}