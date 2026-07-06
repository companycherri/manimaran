import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, ArrowLeft, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminPages() {
  const [user, setUser] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    page_key: "",
    title: "",
    banner_image: null,
    content: "",
    sections: [],
    meta_description: "",
    active: true
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }
      setUser(currentUser);
      await loadData();
    } catch (error) {
      window.location.href = createPageUrl("Home");
    }
  };

  const loadData = async () => {
    setLoading(true);
    const pagesData = await base44.entities.Page.list();
    setPages(pagesData);
    setLoading(false);
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, banner_image: file_url });
      toast.success("Banner uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload banner");
    }
    setUploading(false);
  };

  const handleFileUpload = async (e, sectionIndex) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newSections = [...formData.sections];
      newSections[sectionIndex] = { ...newSections[sectionIndex], image_url: file_url };
      setFormData({ ...formData, sections: newSections });
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingPage) {
        await base44.entities.Page.update(editingPage.id, formData);
        toast.success("Page updated");
      } else {
        await base44.entities.Page.create(formData);
        toast.success("Page created");
      }
      
      setDialogOpen(false);
      resetForm();
      await loadData();
    } catch (error) {
      toast.error("Failed to save page");
    }
  };

  const handleEdit = (page) => {
    setEditingPage(page);
    setFormData({
      page_key: page.page_key,
      title: page.title,
      banner_image: page.banner_image || null,
      content: page.content || "",
      sections: page.sections || [],
      meta_description: page.meta_description || "",
      active: page.active !== false
    });
    setDialogOpen(true);
  };

  const handleDelete = async (pageId) => {
    if (!confirm("Are you sure you want to delete this page?")) return;
    
    try {
      await base44.entities.Page.delete(pageId);
      toast.success("Page deleted");
      await loadData();
    } catch (error) {
      toast.error("Failed to delete page");
    }
  };

  const addSection = () => {
    setFormData({
      ...formData,
      sections: [...formData.sections, { title: "", content: "", image_url: "", icon: "" }]
    });
  };

  const removeSection = (index) => {
    const newSections = formData.sections.filter((_, i) => i !== index);
    setFormData({ ...formData, sections: newSections });
  };

  const updateSection = (index, field, value) => {
    const newSections = [...formData.sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setFormData({ ...formData, sections: newSections });
  };

  const resetForm = () => {
    setEditingPage(null);
    setFormData({
      page_key: "",
      title: "",
      banner_image: null,
      content: "",
      sections: [],
      meta_description: "",
      active: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8B6F47]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE8C5] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("AdminDashboard")}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-[#5C4033]">Pages Management</h1>
              <p className="text-[#8B6F47]">Manage all website pages content</p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-[#FFD700] text-[#5C4033] hover:bg-[#FFA500]">
                <Plus className="w-4 h-4 mr-2" />
                Add Page
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-[#5C4033]">
                  {editingPage ? "Edit Page" : "Add New Page"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Page Key * (e.g., 'about', 'contact')</Label>
                    <Input
                      value={formData.page_key}
                      onChange={(e) => setFormData({ ...formData, page_key: e.target.value })}
                      placeholder="about"
                      required
                      disabled={editingPage !== null}
                    />
                  </div>
                  <div>
                    <Label>Page Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="About Us"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Banner Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    disabled={uploading}
                  />
                  {formData.banner_image && (
                    <img src={formData.banner_image} alt="Banner preview" className="mt-2 w-full h-32 object-cover rounded" />
                  )}
                  <p className="text-xs text-[#8B6F47] mt-1">Banner image shown at the top of the page</p>
                </div>

                <div>
                  <Label>Main Content</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={4}
                    placeholder="Main page content..."
                  />
                </div>

                <div>
                  <Label>Meta Description (SEO)</Label>
                  <Input
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    placeholder="Page description for search engines"
                  />
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-lg">Page Sections</Label>
                    <Button type="button" size="sm" onClick={addSection} variant="outline">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Section
                    </Button>
                  </div>

                  {formData.sections.map((section, index) => (
                    <Card key={index} className="mb-4">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-3">
                          <Label className="font-semibold">Section {index + 1}</Label>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => removeSection(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label>Section Title</Label>
                            <Input
                              value={section.title}
                              onChange={(e) => updateSection(index, 'title', e.target.value)}
                              placeholder="Section title"
                            />
                          </div>
                          <div>
                            <Label>Section Content</Label>
                            <Textarea
                              value={section.content}
                              onChange={(e) => updateSection(index, 'content', e.target.value)}
                              rows={3}
                              placeholder="Section content"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Icon (Lucide icon name)</Label>
                              <Input
                                value={section.icon}
                                onChange={(e) => updateSection(index, 'icon', e.target.value)}
                                placeholder="Award, Truck, Shield, etc."
                              />
                            </div>
                            <div>
                              <Label>Section Image</Label>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, index)}
                                disabled={uploading}
                              />
                              {section.image_url && (
                                <img src={section.image_url} alt="Preview" className="mt-2 w-full h-24 object-cover rounded" />
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
                    {editingPage ? "Update Page" : "Create Page"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map((page, index) => (
            <motion.div
              key={page.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-[#FFF8E7]">
                        <FileText className="w-6 h-6 text-[#5C4033]" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[#5C4033]">{page.title}</h3>
                        <p className="text-sm text-[#8B6F47]">/{page.page_key}</p>
                      </div>
                    </div>
                    {page.active ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  
                  {page.content && (
                    <p className="text-sm text-[#8B6F47] mb-4 line-clamp-2">{page.content}</p>
                  )}
                  
                  {page.sections && page.sections.length > 0 && (
                    <p className="text-xs text-[#8B6F47] mb-4">
                      {page.sections.length} section{page.sections.length !== 1 ? 's' : ''}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(page)} className="flex-1">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(page.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {pages.length === 0 && (
            <div className="col-span-full text-center py-16">
              <FileText className="w-16 h-16 text-[#8B6F47] mx-auto mb-4" />
              <p className="text-[#8B6F47] text-lg">No pages configured yet</p>
              <p className="text-[#8B6F47] text-sm">Create your first page to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}