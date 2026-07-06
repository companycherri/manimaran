import React from "react";
import { Product } from "@/entities/Product";
import { SiteSettings } from "@/entities/SiteSettings";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "../components/products/ProductCard";


export default function Products() {
  const [products, setProducts] = React.useState([]);
  const [filteredProducts, setFilteredProducts] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [bannerImage, setBannerImage] = React.useState(null);

  React.useEffect(() => {
    loadProducts();
    loadBanner();
  }, []);

  const loadBanner = async () => {
    try {
      const settings = await SiteSettings.list();
      if (settings.length > 0 && settings[0].products_banner) {
        setBannerImage(settings[0].products_banner);
      }
    } catch (error) {
      console.error("Error loading banner:", error);
    }
  };

  const [categoryFilter, setCategoryFilter] = React.useState(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search');
    const category = params.get('category');

    if (search) {
      setSearchQuery(search);
    }
    if (category) {
      setCategoryFilter(category);
    }
  }, []);

  React.useEffect(() => {
    filterProducts();
  }, [products, searchQuery, categoryFilter]);

  const loadProducts = async () => {
    const allProducts = await Product.list("display_order");
    // Only show active products to customers (missing status is treated as active)
    setProducts(allProducts.filter(p => p.status !== 'inactive'));
    setLoading(false);
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (categoryFilter) {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  return (
    <div className="bg-white">
      {/* Banner */}
      <div className="relative h-80 bg-gradient-to-r from-[#5C4033] to-[#8B6F47] flex items-center justify-center overflow-hidden">
        {bannerImage && (
          <img 
            src={bannerImage} 
            alt="Products Banner" 
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center"
        >
          <h1 className="text-5xl font-bold text-white mb-3" style={{fontFamily: 'Georgia, serif'}}>
            Our Products
          </h1>
          <p className="text-white text-lg">Discover our range of authentic delicacies</p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B6F47]" />
          <Input
            placeholder="Search for sweets, snacks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-white border-[#FED800]/30 focus:border-[#FED800] h-12 text-base shadow-sm"
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6 flex justify-between items-center">
        <p className="text-[#8B6F47] font-medium">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'} Found
        </p>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-96 animate-pulse shadow" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl shadow">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-bold text-[#5C4033] mb-2">No products found</h3>
          <p className="text-[#8B6F47]">Try adjusting your search or filters</p>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          <AnimatePresence>
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
      </div>
    </div>
  );
}