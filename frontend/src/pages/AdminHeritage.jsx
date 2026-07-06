import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Heritage } from "@/entities/Heritage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, ArrowLeft, Video, ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { UploadFile } from "@/integrations/Core";

export default function AdminHeritage() {
  const [user, setUser] = useState(null);
  const [heritageItems, setHeritageItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    banner_image: "",
    video_url: "",
    button_text: "Read Our Story",
    button_link: "About",
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
      await loadHeritage();
    } catch (error) {
      window.location.href = createPageUrl("Home");
    }
  };

  const loadHeritage = async () => {
    setLoading(true);
    const items = await Heritage.list();
    setHeritageItems(items);
    setLoading(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({ ...prev, banner_image: file_url }));
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
    }
    setUploadingImage(false);
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({ ...prev, video_url: file_url }));
      toast.success("Video uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload video");
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        await Heritage.update(editingItem.id, formData);
        toast.success("Heritage section updated successfully");
      } else {
        await Heritage.create(formData);
        toast.success("Heritage section created successfully");
      }
      
      setDialogOpen(false);
      resetForm();
      await loadHeritage();
    } catch (error) {
      toast.error("Failed to save heritage section");
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      banner_image: item.banner_image || "",
      video_url: item.video_url || "",
      button_text: item.button_text || "Read Our Story",
      button_link: item.button_link || "About",
      active: item.active !== false
    });
    setDialogOpen(true);
  };

  const handleDelete = async (itemId) => {
    if (!confirm("Are you sure you want to delete this heritage section?")) return;
    
    try {
      await Heritage.delete(itemId);
      toast.success("Heritage section deleted successfully");
      await loadHeritage();
    } catch (error) {
      toast.error("Failed to delete heritage section");
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      description: "",
      banner_image: "",
      video_url: "",
      button_text: "Read Our Story",
      button_link: "About",
      active: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8B6F47]">Loading heritage sections...</p>
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
              <h1 className="text-4xl font-bold text-[#5C4033]">Heritage Section Management</h1>
              <p className="text-[#8B6F47]">{heritageItems.length} sections configured</p>
            </div>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-[#FFD700] text-[#5C4033] hover:bg-[#FFA500]">
                <Plus className="w-4 h-4 mr-2" />
                Add Heritage Section
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-[#5C4033]">
                  {editingItem ? "Edit Heritage Section" : "Add New Heritage Section"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Section Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Description *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label>Banner / Thumbnail Image</Label>
                  {formData.banner_image ? (
                    <div className="mt-2 space-y-2">
                      <img
                        src={formData.banner_image}
                        alt="Banner"
                        className="w-full rounded-lg max-h-48 object-cover"
                      />
                      <button
                        type="button"
                        className="text-xs text-red-500 underline"
                        onClick={() => setFormData(prev => ({ ...prev, banner_image: "" }))}
                      >
                        Remove image
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 w-full h-12 mt-1 border-2 border-dashed border-[#8B6F47]/40 rounded-md cursor-pointer text-sm text-[#8B6F47] hover:border-[#8B6F47] hover:bg-[#FFF8E7] transition-colors">
                      <ImageIcon className="w-4 h-4" />
                      {uploadingImage ? "Uploading..." : "Upload Banner Image"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                  )}
                </div>

                <div>
                  <Label>Section Video</Label>
                  {formData.video_url ? (
                    <div className="mt-2 space-y-2">
                      <video
                        src={formData.video_url}
                        controls
                        className="w-full rounded-lg max-h-48 bg-black"
                      />
                      <button
                        type="button"
                        className="text-xs text-red-500 underline"
                        onClick={() => setFormData(prev => ({ ...prev, video_url: "" }))}
                      >
                        Remove video
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 w-full h-12 mt-1 border-2 border-dashed border-[#8B6F47]/40 rounded-md cursor-pointer text-sm text-[#8B6F47] hover:border-[#8B6F47] hover:bg-[#FFF8E7] transition-colors">
                      <Video className="w-4 h-4" />
                      {uploading ? "Uploading..." : "Upload Video"}
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleVideoUpload}
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>

                <div>
                  <Label>Button Text</Label>
                  <Input
                    value={formData.button_text}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Button Link (Page Name)</Label>
                  <Input
                    value={formData.button_link}
                    onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                    placeholder="e.g., About"
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
                    {editingItem ? "Update Section" : "Create Section"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Heritage Sections List */}
        <div className="space-y-4">
          {heritageItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <div className="w-48 h-32 bg-black rounded-lg overflow-hidden flex-shrink-0">
                      {item.video_url ? (
                        <video src={item.video_url} className="w-full h-full object-cover" muted />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#8B6F47] bg-[#FFF8E7]">
                          <Video className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-[#5C4033] mb-1">{item.title}</h3>
                          <p className="text-[#8B6F47] text-sm line-clamp-2">{item.description}</p>
                        </div>
                        {item.active ? (
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
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
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

        {heritageItems.length === 0 && (
          <div className="text-center py-16">
            <Video className="w-16 h-16 text-[#8B6F47] mx-auto mb-4" />
            <p className="text-[#8B6F47] text-lg">No heritage sections configured yet</p>
            <p className="text-sm text-[#8B6F47] mb-4">Add sections to display on your homepage</p>
          </div>
        )}
      </div>
    </div>
  );
}