import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Product } from "@/entities/Product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Search, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { UploadFile } from "@/integrations/Core";

export default function AdminProducts() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    price_250g: "",
    price_500g: "",
    price_1kg: "",
    price_200ml: "",
    price_500ml: "",
    price_1000ml: "",
    default_display_volume: "200ml",
    price_per_kg: "",
    max_weight_kg: "10",
    unit: "kg",
    category: "ghee_sweets",
    display_order: "0",
    image_url: "",
    in_stock: true,
    featured: false,
    featured_in_footer: false,
    show_category_badge: true,
    ingredients: "",
    keywords: "",
    status: "active"
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery]);

  const checkAuth = async () => {
    try {
      const currentUser = await User.me();
      if (currentUser.role !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }
      setUser(currentUser);
      await loadProducts();
    } catch (error) {
      window.location.href = createPageUrl("Home");
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    const allProducts = await Product.list("-created_date");
    setProducts(allProducts);
    setLoading(false);
  };

  const filterProducts = () => {
    if (!searchQuery) {
      setFilteredProducts(products);
      return;
    }
    
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData({ ...formData, image_url: file_url });
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const productData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : 0,
        price_250g: formData.price_250g ? parseFloat(formData.price_250g) : undefined,
        price_500g: formData.price_500g ? parseFloat(formData.price_500g) : undefined,
        price_1kg: formData.price_1kg ? parseFloat(formData.price_1kg) : undefined,
        price_200ml: formData.price_200ml ? parseFloat(formData.price_200ml) : undefined,
        price_500ml: formData.price_500ml ? parseFloat(formData.price_500ml) : undefined,
        price_1000ml: formData.price_1000ml ? parseFloat(formData.price_1000ml) : undefined,
        price_per_kg: formData.price_per_kg ? parseFloat(formData.price_per_kg) : undefined,
        max_weight_kg: formData.max_weight_kg ? parseFloat(formData.max_weight_kg) : 10,
        display_order: formData.display_order ? parseInt(formData.display_order) : 0,
        status: formData.status || "active"
      };
      
      if (editingProduct) {
        await Product.update(editingProduct.id, productData);
        toast.success("Product updated successfully");
      } else {
        await Product.create(productData);
        toast.success("Product created successfully");
      }
      
      setDialogOpen(false);
      resetForm();
      await loadProducts();
    } catch (error) {
      toast.error("Failed to save product");
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price?.toString() || "",
      price_250g: product.price_250g?.toString() || "",
      price_500g: product.price_500g?.toString() || "",
      price_1kg: product.price_1kg?.toString() || "",
      price_200ml: product.price_200ml?.toString() || "",
      price_500ml: product.price_500ml?.toString() || "",
      price_1000ml: product.price_1000ml?.toString() || "",
      default_display_volume: product.default_display_volume || "200ml",
      price_per_kg: product.price_per_kg?.toString() || "",
      max_weight_kg: product.max_weight_kg?.toString() || "10",
      unit: product.unit,
      category: product.category || "ghee_sweets",
      display_order: product.display_order?.toString() || "0",
      image_url: product.image_url || "",
      in_stock: product.in_stock,
      featured: product.featured || false,
      featured_in_footer: product.featured_in_footer || false,
      show_category_badge: product.show_category_badge !== false,
      ingredients: product.ingredients || "",
      keywords: product.keywords || "",
      status: product.status || "active"
    });
    setDialogOpen(true);
  };

  const handleDelete = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    try {
      await Product.delete(productId);
      toast.success("Product deleted successfully");
      await loadProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      price_250g: "",
      price_500g: "",
      price_1kg: "",
      price_200ml: "",
      price_500ml: "",
      price_1000ml: "",
      default_display_volume: "200ml",
      price_per_kg: "",
      max_weight_kg: "10",
      unit: "kg",
      category: "ghee_sweets",
      display_order: "0",
      image_url: "",
      in_stock: true,
      featured: false,
      featured_in_footer: false,
      show_category_badge: true,
      ingredients: "",
      keywords: "",
      status: "active"
    });
  };

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
              <h1 className="text-4xl font-bold text-[#5C4033]">Product Management</h1>
              <p className="text-[#8B6F47]">{products.length} products in catalog</p>
            </div>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-[#FFD700] text-[#5C4033] hover:bg-[#FFA500]">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-[#5C4033]">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Product Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Unit *</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Per Kg</SelectItem>
                      <SelectItem value="ml">Per ML</SelectItem>
                      <SelectItem value="piece">Per Piece</SelectItem>
                      <SelectItem value="box">Per Box</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Product Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-[#8B6F47] mt-1">Inactive products are hidden from customers on the website</p>
                </div>

                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                  />
                  <p className="text-xs text-[#8B6F47] mt-1">Lower numbers appear first on the products page</p>
                </div>

                {formData.unit === 'kg' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-semibold text-[#5C4033]">Dynamic Per-Kg Pricing</Label>
                      <p className="text-xs text-[#8B6F47] mb-3">Set base price per kg (this is the 1kg price)</p>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label>Price Per Kg (1kg price) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.price_per_kg}
                            onChange={(e) => setFormData({ ...formData, price_per_kg: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <Label className="text-base font-semibold text-[#5C4033]">Fixed Weight Pricing (Required)</Label>
                      <p className="text-xs text-[#8B6F47] mb-3">Set specific prices for 250g and 500g variants</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>250g Price *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.price_250g}
                            onChange={(e) => setFormData({ ...formData, price_250g: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>500g Price *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.price_500g}
                            onChange={(e) => setFormData({ ...formData, price_500g: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {formData.unit === 'ml' && (
                  <div className="space-y-4">
                    <Label className="text-base font-semibold text-[#5C4033]">Volume-Based Pricing (Required)</Label>
                    <p className="text-xs text-[#8B6F47] mb-3">Set specific prices for different volumes</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>200ml Price *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.price_200ml}
                          onChange={(e) => setFormData({ ...formData, price_200ml: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>500ml Price *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.price_500ml}
                          onChange={(e) => setFormData({ ...formData, price_500ml: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>1000ml Price *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.price_1000ml}
                          onChange={(e) => setFormData({ ...formData, price_1000ml: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Label>Default Volume Display on Product Card *</Label>
                      <Select 
                        value={formData.default_display_volume} 
                        onValueChange={(value) => setFormData({ ...formData, default_display_volume: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="200ml">200ml</SelectItem>
                          <SelectItem value="500ml">500ml</SelectItem>
                          <SelectItem value="1000ml">1000ml</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-[#8B6F47] mt-1">This volume price will be shown on the frontend product card</p>
                    </div>
                  </div>
                )}

                <div>
                  <Label>Product Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  {formData.image_url && (
                    <img src={formData.image_url} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
                  )}
                </div>

                <div>
                  <Label>Ingredients</Label>
                  <Textarea
                    value={formData.ingredients}
                    onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                    rows={2}
                  />
                </div>

                <div>
                  <Label>SEO Keywords (comma-separated)</Label>
                  <Input
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  />
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.in_stock}
                      onChange={(e) => setFormData({ ...formData, in_stock: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span>In Stock</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span>Featured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured_in_footer}
                      onChange={(e) => setFormData({ ...formData, featured_in_footer: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span>Show in Footer</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.show_category_badge}
                      onChange={(e) => setFormData({ ...formData, show_category_badge: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span>Show Category Badge</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-[#FFD700] text-[#5C4033] hover:bg-[#FFA500]">
                    {editingProduct ? "Update Product" : "Create Product"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="mb-6">
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

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="aspect-square bg-[#FFF8E7] rounded-lg overflow-hidden mb-4">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#8B6F47]">
                        No Image
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-[#5C4033] mb-1">{product.name}</h3>
                    </div>
                    {product.featured && (
                      <Badge className="bg-[#FFD700] text-[#5C4033]">Featured</Badge>
                    )}
                  </div>

                  <div className="mb-2">
                    <Badge className={product.status === 'inactive' ? "bg-gray-400 text-white" : "bg-green-600 text-white"}>
                      {product.status === 'inactive' ? "Inactive" : "Active"}
                    </Badge>
                  </div>
                  
                  <div className="mb-2">
                    {product.unit === 'kg' && product.price_per_kg ? (
                      <div className="text-sm">
                        {product.price_250g && <p className="text-[#5C4033]">250g: ₹{product.price_250g}</p>}
                        {product.price_500g && <p className="text-[#5C4033]">500g: ₹{product.price_500g}</p>}
                        <p className="text-[#5C4033] font-bold">1kg: ₹{product.price_per_kg}</p>
                      </div>
                    ) : product.unit === 'ml' ? (
                      <div className="text-sm">
                        {product.price_200ml && <p className="text-[#5C4033]">200ml: ₹{product.price_200ml}</p>}
                        {product.price_500ml && <p className="text-[#5C4033]">500ml: ₹{product.price_500ml}</p>}
                        {product.price_1000ml && <p className="text-[#5C4033] font-bold">1000ml: ₹{product.price_1000ml}</p>}
                      </div>
                    ) : (
                      <p className="text-2xl font-bold text-[#FFD700]">
                        ₹{product.price} / {product.unit}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant={product.in_stock ? "default" : "destructive"}>
                      {product.in_stock ? "In Stock" : "Out of Stock"}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#8B6F47] text-lg">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
}