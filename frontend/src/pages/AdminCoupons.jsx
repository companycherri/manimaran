import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Coupon } from "@/entities/Coupon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Ticket, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function AdminCoupons() {
  const [user, setUser] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    min_order_value: "0",
    max_discount: "",
    valid_from: "",
    valid_until: "",
    usage_limit: "",
    active: true
  });

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
      setUser(currentUser);
      await loadCoupons();
    } catch (error) {
      window.location.href = createPageUrl("Home");
    }
  };

  const loadCoupons = async () => {
    setLoading(true);
    const allCoupons = await Coupon.list("-created_date");
    setCoupons(allCoupons);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const couponData = {
        ...formData,
        code: formData.code.toUpperCase(),
        discount_value: parseFloat(formData.discount_value),
        min_order_value: parseFloat(formData.min_order_value),
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null
      };
      
      if (editingCoupon) {
        await Coupon.update(editingCoupon.id, couponData);
        toast.success("Coupon updated successfully");
      } else {
        await Coupon.create({ ...couponData, used_count: 0 });
        toast.success("Coupon created successfully");
      }
      
      setDialogOpen(false);
      resetForm();
      await loadCoupons();
    } catch (error) {
      toast.error("Failed to save coupon");
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_order_value: (coupon.min_order_value || 0).toString(),
      max_discount: coupon.max_discount ? coupon.max_discount.toString() : "",
      valid_from: coupon.valid_from || "",
      valid_until: coupon.valid_until || "",
      usage_limit: coupon.usage_limit ? coupon.usage_limit.toString() : "",
      active: coupon.active !== false
    });
    setDialogOpen(true);
  };

  const handleDelete = async (couponId) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    
    try {
      await Coupon.delete(couponId);
      toast.success("Coupon deleted successfully");
      await loadCoupons();
    } catch (error) {
      toast.error("Failed to delete coupon");
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Coupon code copied!");
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      min_order_value: "0",
      max_discount: "",
      valid_from: "",
      valid_until: "",
      usage_limit: "",
      active: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8B6F47]">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE8C5] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#5C4033]">Coupon Management</h1>
            <p className="text-[#8B6F47]">{coupons.length} coupons configured</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-[#FFD700] text-[#5C4033] hover:bg-[#FFA500]">
                <Plus className="w-4 h-4 mr-2" />
                Add Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-[#5C4033]">
                  {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Coupon Code *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., DIWALI25"
                    required
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Discount Type *</Label>
                    <Select value={formData.discount_type} onValueChange={(value) => setFormData({ ...formData, discount_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Discount Value *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Min Order Value</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.min_order_value}
                      onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                    />
                  </div>
                  {formData.discount_type === "percentage" && (
                    <div>
                      <Label>Max Discount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.max_discount}
                        onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Valid From</Label>
                    <Input
                      type="date"
                      value={formData.valid_from}
                      onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Valid Until</Label>
                    <Input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Usage Limit</Label>
                  <Input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span>Active</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-[#FFD700] text-[#5C4033] hover:bg-[#FFA500]">
                    {editingCoupon ? "Update Coupon" : "Create Coupon"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Coupons List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon, index) => (
            <motion.div
              key={coupon.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-bl-full opacity-10" />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-6 h-6 text-[#FFD700]" />
                      <span className="text-2xl font-bold text-[#5C4033] font-mono">
                        {coupon.code}
                      </span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyCode(coupon.code)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  {coupon.description && (
                    <p className="text-sm text-[#8B6F47] mb-4">{coupon.description}</p>
                  )}

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#8B6F47]">Discount:</span>
                      <span className="font-semibold text-[#5C4033]">
                        {coupon.discount_type === "percentage" 
                          ? `${coupon.discount_value}%` 
                          : `₹${coupon.discount_value}`}
                      </span>
                    </div>
                    {coupon.min_order_value > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[#8B6F47]">Min Order:</span>
                        <span className="font-semibold">₹{coupon.min_order_value}</span>
                      </div>
                    )}
                    {coupon.usage_limit && (
                      <div className="flex justify-between">
                        <span className="text-[#8B6F47]">Used:</span>
                        <span className="font-semibold">{coupon.used_count || 0} / {coupon.usage_limit}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    {coupon.active ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                    )}
                    {coupon.valid_until && new Date(coupon.valid_until) < new Date() && (
                      <Badge variant="outline" className="border-red-500 text-red-700">
                        Expired
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(coupon)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(coupon.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {coupons.length === 0 && (
          <div className="text-center py-16">
            <Ticket className="w-16 h-16 text-[#8B6F47] mx-auto mb-4" />
            <p className="text-[#8B6F47] text-lg">No coupons created yet</p>
            <p className="text-sm text-[#8B6F47] mb-4">Create discount coupons to attract customers</p>
          </div>
        )}
      </div>
    </div>
  );
}