import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Star } from "lucide-react";
import { toast } from "sonner";

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_image: "",
    review_text: "",
    rating: 5,
    order: 0,
    active: true
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await base44.auth.me();
      if (user.role !== 'admin') {
        window.location.href = "/Home";
        return;
      }
      loadReviews();
    } catch (error) {
      window.location.href = "/Home";
    }
  };

  const loadReviews = async () => {
    setLoading(true);
    const data = await base44.entities.Review.list("order");
    setReviews(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingReview) {
        await base44.entities.Review.update(editingReview.id, formData);
        toast.success("Review updated successfully");
      } else {
        await base44.entities.Review.create(formData);
        toast.success("Review added successfully");
      }
      setDialogOpen(false);
      resetForm();
      loadReviews();
    } catch (error) {
      toast.error("Failed to save review");
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review);
    setFormData({
      customer_name: review.customer_name,
      customer_image: review.customer_image || "",
      review_text: review.review_text,
      rating: review.rating,
      order: review.order || 0,
      active: review.active
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this review?")) {
      try {
        await base44.entities.Review.delete(id);
        toast.success("Review deleted successfully");
        loadReviews();
      } catch (error) {
        toast.error("Failed to delete review");
      }
    }
  };

  const resetForm = () => {
    setEditingReview(null);
    setFormData({
      customer_name: "",
      customer_image: "",
      review_text: "",
      rating: 5,
      order: 0,
      active: true
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, customer_image: result.file_url });
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE8C5] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-[#5C4033]">Customer Reviews</h1>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-[#5C4033] hover:bg-[#8B6F47] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingReview ? "Edit Review" : "Add New Review"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Customer Name *</Label>
                  <Input
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Customer Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                  {formData.customer_image && (
                    <img src={formData.customer_image} alt="Preview" className="mt-2 w-20 h-20 rounded-full object-cover" />
                  )}
                </div>
                <div>
                  <Label>Review Text *</Label>
                  <Textarea
                    value={formData.review_text}
                    onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <Label>Rating (1-5) *</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#5C4033] hover:bg-[#8B6F47] text-white">
                    {editingReview ? "Update" : "Add"} Review
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <Card key={review.id} className="bg-white">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {review.customer_image ? (
                      <img src={review.customer_image} alt={review.customer_name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#FFD700] flex items-center justify-center text-[#5C4033] font-bold">
                        {review.customer_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{review.customer_name}</CardTitle>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-[#FFD700] text-[#FFD700]' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(review)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(review.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-[#8B6F47] text-sm">{review.review_text}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-[#8B6F47]">
                  <span>Order: {review.order}</span>
                  <span className={`px-2 py-1 rounded ${review.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {review.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {reviews.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[#8B6F47] text-lg">No reviews yet. Add your first review!</p>
          </div>
        )}
      </div>
    </div>
  );
}