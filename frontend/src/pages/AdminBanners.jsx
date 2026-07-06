import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Banner } from "@/entities/Banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, ArrowLeft, Image, Video } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { UploadFile } from "@/integrations/Core";

export default function AdminBanners() {
  const [user, setUser] = useState(null);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    media_type: "image",
    image_url: "",
    video_url: "",
    link_url: "",
    button_text: "Shop Now",
    active: true,
    order: 0
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
      await loadBanners();
    } catch (error) {
      window.location.href = createPageUrl("Home");
    }
  };

  const loadBanners = async () => {
    setLoading(true);
    const allBanners = await Banner.list("order");
    setBanners(allBanners);
    setLoading(false);
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      if (type === 'image') {
        setFormData({ ...formData, image_url: file_url });
        toast.success("Image uploaded successfully");
      } else if (type === 'video') {
        setFormData({ ...formData, video_url: file_url });
        toast.success("Video uploaded successfully");
      }
    } catch (error) {
      toast.error(`Failed to upload ${type}`);
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const bannerData = {
        ...formData,
        order: parseInt(formData.order)
      };
      
      if (editingBanner) {
        await Banner.update(editingBanner.id, bannerData);
        toast.success("Banner updated successfully");
      } else {
        await Banner.create(bannerData);
        toast.success("Banner created successfully");
      }
      
      setDialogOpen(false);
      resetForm();
      await loadBanners();
    } catch (error) {
      toast.error("Failed to save banner");
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || "",
      description: banner.description || "",
      media_type: banner.media_type || "image",
      image_url: banner.image_url || "",
      video_url: banner.video_url || "",
      link_url: banner.link_url || "",
      button_text: banner.button_text || "Shop Now",
      active: banner.active !== false,
      order: banner.order || 0
    });
    setDialogOpen(true);
  };

  const handleDelete = async (bannerId) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    
    try {
      await Banner.delete(bannerId);
      toast.success("Banner deleted successfully");
      await loadBanners();
    } catch (error) {
      toast.error("Failed to delete banner");
    }
  };

  const resetForm = () => {
    setEditingBanner(null);
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      media_type: "image",
      image_url: "",
      video_url: "",
      link_url: "",
      button_text: "Shop Now",
      active: true,
      order: 0
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8B6F47]">Loading banners...</p>
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
              <h1 className="text-4xl font-bold text-[#5C4033]">Banner Management</h1>
              <p className="text-[#8B6F47]">{banners.length} banners configured</p>
            </div>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-[#FFD700] text-[#5C4033] hover:bg-[#FFA500]">
                <Plus className="w-4 h-4 mr-2" />
                Add Banner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-[#5C4033]">
                  {editingBanner ? "Edit Banner" : "Add New Banner"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Banner Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Subtitle</Label>
                  <Input
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
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
                  <Label>Media Type *</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="media_type"
                        value="image"
                        checked={formData.media_type === "image"}
                        onChange={(e) => setFormData({ ...formData, media_type: e.target.value })}
                        className="w-4 h-4"
                      />
                      <Image className="w-4 h-4" />
                      <span>Image</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="media_type"
                        value="video"
                        checked={formData.media_type === "video"}
                        onChange={(e) => setFormData({ ...formData, media_type: e.target.value })}
                        className="w-4 h-4"
                      />
                      <Video className="w-4 h-4" />
                      <span>Video</span>
                    </label>
                  </div>
                </div>

                {formData.media_type === "image" && (
                  <div>
                    <Label>Banner Image *</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'image')}
                      disabled={uploading}
                    />
                    {formData.image_url && (
                      <img src={formData.image_url} alt="Preview" className="mt-2 w-full h-48 object-cover rounded-lg" />
                    )}
                  </div>
                )}

                {formData.media_type === "video" && (
                  <div>
                    <Label>Banner Video *</Label>
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileUpload(e, 'video')}
                      disabled={uploading}
                    />
                    {formData.video_url && (
                      <video src={formData.video_url} controls className="mt-2 w-full h-48 rounded-lg" />
                    )}
                  </div>
                )}

                <div>
                  <Label>Link URL</Label>
                  <Input
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="e.g., Products?category=hampers"
                  />
                </div>

                <div>
                  <Label>Button Text</Label>
                  <Input
                    value={formData.button_text}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: e.target.value })}
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
                    <span>Active (Show on website)</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-[#FFD700] text-[#5C4033] hover:bg-[#FFA500]">
                    {editingBanner ? "Update Banner" : "Create Banner"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Banners List */}
        <div className="space-y-4">
          {banners.map((banner, index) => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <div className="w-48 h-32 bg-[#FFF8E7] rounded-lg overflow-hidden flex-shrink-0 relative">
                      {banner.media_type === "video" && banner.video_url ? (
                        <>
                          <video src={banner.video_url} className="w-full h-full object-cover" />
                          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                            <Video className="w-3 h-3" />
                            VIDEO
                          </div>
                        </>
                      ) : banner.image_url ? (
                        <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#8B6F47]">
                          <Image className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-[#5C4033] mb-1">{banner.title}</h3>
                          {banner.subtitle && (
                            <p className="text-[#8B6F47] mb-2">{banner.subtitle}</p>
                          )}
                          {banner.description && (
                            <p className="text-sm text-[#8B6F47]">{banner.description}</p>
                          )}
                        </div>
                        {banner.active ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(banner)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(banner.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {banners.length === 0 && (
          <div className="text-center py-16">
            <Image className="w-16 h-16 text-[#8B6F47] mx-auto mb-4" />
            <p className="text-[#8B6F47] text-lg">No banners configured yet</p>
            <p className="text-sm text-[#8B6F47] mb-4">Add banners to display on your homepage</p>
          </div>
        )}
      </div>
    </div>
  );
}