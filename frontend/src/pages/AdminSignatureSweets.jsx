import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { Product } from "@/entities/Product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowLeft, Star, StarOff } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminSignatureSweets() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await User.me();
      if (currentUser.role !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }
      loadProducts();
    } catch (error) {
      window.location.href = createPageUrl("Home");
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    const allProducts = await Product.list("signature_display_order");
    setProducts(allProducts);
    setLoading(false);
  };

  const toggleFeatured = async (product) => {
    try {
      await Product.update(product.id, { featured: !product.featured });
      toast.success(product.featured ? "Removed from Signature Sweets" : "Added to Signature Sweets");
      loadProducts();
    } catch (error) {
      toast.error("Failed to update product");
    }
  };

  const updateDisplayOrder = async (productId, newOrder) => {
    try {
      await Product.update(productId, { signature_display_order: newOrder });
      toast.success("Display order updated");
      loadProducts();
    } catch (error) {
      toast.error("Failed to update display order");
    }
  };

  const updatePromoVideo = async (productId, videoUrl) => {
    try {
      await Product.update(productId, { promo_video_url: videoUrl });
      toast.success("Promo video updated");
      loadProducts();
    } catch (error) {
      toast.error("Failed to update promo video");
    }
  };

  const handleVideoUpload = async (productId, file) => {
    if (!file) return;
    try {
      toast.info("Uploading video...");
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await updatePromoVideo(productId, file_url);
    } catch (error) {
      toast.error("Failed to upload video");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredProducts = filteredProducts.filter(p => p.featured);
  const otherProducts = filteredProducts.filter(p => !p.featured);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8B6F47]">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE8C5] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("AdminDashboard")}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-[#5C4033]">Signature Sweets</h1>
              <p className="text-[#8B6F47]">Manage products displayed in the "Our Signature Sweets" section</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B6F47]" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Featured Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#5C4033] mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-[#FFD700] fill-current" />
            Currently Featured ({featuredProducts.length})
          </h2>
          {featuredProducts.length === 0 ? (
            <div className="bg-white/50 rounded-xl p-8 text-center border-2 border-dashed border-[#8B6F47]/30">
              <p className="text-[#8B6F47]">No signature sweets selected yet.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <motion.div layout key={product.id}>
                  <Card className="border-2 border-[#FFD700]">
                    <CardContent className="p-4">
                      <div className="aspect-square bg-[#FFF8E7] rounded-lg overflow-hidden mb-4 relative">
                        <img 
                          src={product.image_url || "https://images.unsplash.com/photo-1596513961086-8d1d39a8efb6?w=200"} 
                          alt={product.name} 
                          className="w-full h-full object-cover" 
                        />
                        <Badge className="absolute top-2 right-2 bg-[#FFD700] text-[#5C4033]">Featured</Badge>
                      </div>
                      <h3 className="font-bold text-[#5C4033] mb-2 truncate">{product.name}</h3>
                      <div className="mb-3">
                        <label className="text-xs text-[#8B6F47] mb-1 block">Display Order</label>
                        <Input
                          type="number"
                          value={product.signature_display_order || 0}
                          onChange={(e) => updateDisplayOrder(product.id, parseInt(e.target.value) || 0)}
                          className="h-8"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="text-xs text-[#8B6F47] mb-1 block">Promo Video (hover to play)</label>
                        {product.promo_video_url ? (
                          <div className="flex flex-col gap-1">
                            <video
                              src={product.promo_video_url}
                              className="w-full rounded-md"
                              style={{ maxHeight: 80 }}
                              muted
                              playsInline
                              controls={false}
                              onMouseEnter={e => e.target.play()}
                              onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs text-red-500 border-red-200 hover:bg-red-50"
                              onClick={() => updatePromoVideo(product.id, "")}
                            >
                              Remove Video
                            </Button>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center gap-2 w-full h-9 px-3 border-2 border-dashed border-[#8B6F47]/40 rounded-md cursor-pointer text-xs text-[#8B6F47] hover:border-[#8B6F47] hover:bg-[#FFF8E7] transition-colors">
                            📹 Upload Video
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) => handleVideoUpload(product.id, e.target.files[0])}
                            />
                          </label>
                        )}
                      </div>
                      <Button 
                       onClick={() => toggleFeatured(product)}
                       variant="destructive" 
                       className="w-full"
                      >
                       <StarOff className="w-4 h-4 mr-2" />
                       Remove
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Other Products Section */}
        <div>
          <h2 className="text-2xl font-bold text-[#5C4033] mb-4 text-opacity-80">
            Available Products
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {otherProducts.map((product) => (
              <motion.div layout key={product.id}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-[#FFF8E7] rounded-lg overflow-hidden mb-4">
                      <img 
                        src={product.image_url || "https://images.unsplash.com/photo-1596513961086-8d1d39a8efb6?w=200"} 
                        alt={product.name} 
                        className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" 
                      />
                    </div>
                    <h3 className="font-bold text-[#5C4033] mb-2 truncate">{product.name}</h3>
                    <Button 
                      onClick={() => toggleFeatured(product)}
                      className="w-full bg-[#5C4033] text-white hover:bg-[#8B6F47]"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Add to Signature
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}