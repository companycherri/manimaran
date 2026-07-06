import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";

export default function AdminAbout() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pageData, setPageData] = useState(null);
  const [formData, setFormData] = useState({
    title: "Our Story",
    banner_image: null,
    content: "",
    content_heading: "",
    legacy_image: "",
    legacy_heading: "A Legacy Crafted with Love",
    legacy_paragraph1: "",
    legacy_paragraph2: "",
    sections: [],
    active: true
  });
  const [stats, setStats] = useState([]);
  const [savingStats, setSavingStats] = useState(false);

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
      await loadData();
    } catch (error) {
      window.location.href = createPageUrl("Home");
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const pages = await base44.entities.Page.filter({ page_key: 'about' });
      if (pages.length > 0) {
        setPageData(pages[0]);
        setFormData({
          title: pages[0].title || "Our Story",
          banner_image: pages[0].banner_image || null,
          content: pages[0].content || "",
          content_heading: pages[0].content_heading || "",
          legacy_image: pages[0].legacy_image || "",
          legacy_heading: pages[0].legacy_heading || "A Legacy Crafted with Love",
          legacy_paragraph1: pages[0].legacy_paragraph1 || "",
          legacy_paragraph2: pages[0].legacy_paragraph2 || "",
          sections: pages[0].sections || [],
          active: pages[0].active !== false
        });
      }
      const loadedStats = await base44.entities.AboutStat.list('order');
      setStats(loadedStats);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const addStat = () => {
    setStats([...stats, { number: '', label: '', order: stats.length, active: true, _isNew: true }]);
  };

  const updateStat = (index, field, value) => {
    const updated = [...stats];
    updated[index] = { ...updated[index], [field]: value };
    setStats(updated);
  };

  const removeStat = async (index) => {
    const stat = stats[index];
    if (stat.id) {
      await base44.entities.AboutStat.delete(stat.id);
    }
    setStats(stats.filter((_, i) => i !== index));
  };

  const saveStats = async () => {
    setSavingStats(true);
    try {
      for (let i = 0; i < stats.length; i++) {
        const stat = stats[i];
        const { _isNew, id, created_date, updated_date, created_by, ...data } = stat;
        data.order = i;
        if (id) {
          await base44.entities.AboutStat.update(id, data);
        } else {
          await base44.entities.AboutStat.create(data);
        }
      }
      toast.success("Stats saved!");
      const refreshed = await base44.entities.AboutStat.list('order');
      setStats(refreshed);
    } catch (error) {
      console.error("Save stats error:", error);
      toast.error("Failed to save stats: " + error.message);
    }
    setSavingStats(false);
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, banner_image: file_url });
      toast.success("Banner uploaded");
    } catch (error) {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  const handleLegacyImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, legacy_image: file_url });
      toast.success("Image uploaded");
    } catch (error) {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  const handleSectionImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newSections = [...formData.sections];
      newSections[index] = { ...newSections[index], image_url: file_url };
      setFormData({ ...formData, sections: newSections });
      toast.success("Image uploaded");
    } catch (error) {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const dataToSave = {
        page_key: 'about',
        title: formData.title,
        banner_image: formData.banner_image,
        content: formData.content,
        content_heading: formData.content_heading,
        legacy_image: formData.legacy_image,
        legacy_heading: formData.legacy_heading,
        legacy_paragraph1: formData.legacy_paragraph1,
        legacy_paragraph2: formData.legacy_paragraph2,
        sections: formData.sections,
        active: formData.active
      };

      if (pageData) {
        await base44.entities.Page.update(pageData.id, dataToSave);
        toast.success("About page updated");
      } else {
        await base44.entities.Page.create(dataToSave);
        toast.success("About page created");
      }
      
      await loadData();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save");
    }
  };

  const addSection = () => {
    setFormData({
      ...formData,
      sections: [...formData.sections, { title: "", content: "", image_url: "", icon: "Award" }]
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FED800] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8B6F47]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE8C5] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("AdminDashboard")}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-[#5C4033]">About Us Page</h1>
              <p className="text-[#8B6F47]">Manage your About Us page content</p>
            </div>
          </div>
          <Link to={createPageUrl("About")} target="_blank">
            <Button variant="outline">Preview Page</Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-2xl font-bold text-[#5C4033]">Basic Information</h2>
                
                <div>
                  <Label>Page Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Our Story"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Banner Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    disabled={uploading}
                    className="mt-1"
                  />
                  {formData.banner_image && (
                    <div className="mt-3">
                      <img 
                        src={formData.banner_image} 
                        alt="Banner preview" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <p className="text-xs text-[#8B6F47] mt-2">Recommended: 1920x600px</p>
                </div>

                <div>
                  <Label className="text-base font-semibold">Main Story Section</Label>
                  <p className="text-sm text-[#8B6F47] mb-3">This section appears below the banner</p>
                  
                  <div className="space-y-3">
                    <div>
                      <Label>Section Heading</Label>
                      <Input
                        value={formData.content_heading}
                        onChange={(e) => setFormData({ ...formData, content_heading: e.target.value })}
                        placeholder="e.g., A Legacy of Taste Since 1985"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>Section Content</Label>
                      <Textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        rows={5}
                        placeholder="Tell your story here... (e.g., Pondy Sweets began as a small, family-run sweet shop...)"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Legacy / Story Section */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#5C4033]">Legacy Section</h2>
                  <p className="text-sm text-[#8B6F47]">"A Legacy Crafted with Love" — the image + text block below the intro</p>
                </div>

                <div>
                  <Label>Section Heading</Label>
                  <Input
                    value={formData.legacy_heading}
                    onChange={(e) => setFormData({ ...formData, legacy_heading: e.target.value })}
                    placeholder="A Legacy Crafted with Love"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Paragraph 1</Label>
                  <Textarea
                    value={formData.legacy_paragraph1}
                    onChange={(e) => setFormData({ ...formData, legacy_paragraph1: e.target.value })}
                    rows={3}
                    placeholder="e.g., For generations, Manimaran Palgova has been a household name..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Paragraph 2</Label>
                  <Textarea
                    value={formData.legacy_paragraph2}
                    onChange={(e) => setFormData({ ...formData, legacy_paragraph2: e.target.value })}
                    rows={3}
                    placeholder="e.g., Every batch of our Palgova is slow-cooked the traditional way..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Section Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLegacyImageUpload}
                    disabled={uploading}
                    className="mt-1"
                  />
                  {formData.legacy_image && (
                    <img
                      src={formData.legacy_image}
                      alt="Legacy preview"
                      className="mt-3 w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  <p className="text-xs text-[#8B6F47] mt-1">Recommended: 800x600px</p>
                </div>
              </CardContent>
            </Card>

            {/* Sections */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[#5C4033]">Core Values Sections</h2>
                    <p className="text-sm text-[#8B6F47]">Add up to 3 sections for best display</p>
                  </div>
                  <Button type="button" onClick={addSection} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Section
                  </Button>
                </div>

                <div className="space-y-4">
                  {formData.sections.map((section, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="bg-[#FFF8E7]">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center mb-3">
                            <Label className="font-semibold text-lg">Section {index + 1}</Label>
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
                              <Label>Title</Label>
                              <Input
                                value={section.title}
                                onChange={(e) => updateSection(index, 'title', e.target.value)}
                                placeholder="e.g., Authenticity"
                              />
                            </div>

                            <div>
                              <Label>Content</Label>
                              <Textarea
                                value={section.content}
                                onChange={(e) => updateSection(index, 'content', e.target.value)}
                                rows={2}
                                placeholder="Brief description"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>Icon Name</Label>
                                <Input
                                  value={section.icon}
                                  onChange={(e) => updateSection(index, 'icon', e.target.value)}
                                  placeholder="Award, Leaf, Users"
                                />
                                <p className="text-xs text-[#8B6F47] mt-1">Lucide icon name</p>
                              </div>

                              <div>
                                <Label>Section Image (Optional)</Label>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleSectionImageUpload(e, index)}
                                  disabled={uploading}
                                />
                                {section.image_url && (
                                  <img 
                                    src={section.image_url} 
                                    alt="Preview" 
                                    className="mt-2 w-full h-24 object-cover rounded"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}

                  {formData.sections.length === 0 && (
                    <div className="text-center py-8 text-[#8B6F47]">
                      <p>No sections added yet. Click "Add Section" to get started.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Active Toggle */}
            <Card>
              <CardContent className="p-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-[#5C4033] font-medium">Page is active (visible on website)</span>
                </label>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
              <Link to={createPageUrl("AdminDashboard")}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" className="bg-[#FED800] text-[#5C4033] hover:bg-[#FFA500]">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </form>

        {/* Stats Strip Section - Outside main form to avoid form submit interference */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-[#5C4033]">Stats Strip</h2>
                <p className="text-sm text-[#8B6F47]">Displayed below "Our Core Values" — dark banner with numbers in hexagons</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={addStat} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Stat
                </Button>
                <Button type="button" onClick={saveStats} disabled={savingStats} className="bg-[#FED800] text-[#5C4033] hover:bg-[#FFA500]">
                  <Save className="w-4 h-4 mr-2" />
                  {savingStats ? 'Saving...' : 'Save Stats'}
                </Button>
              </div>
            </div>

            {/* Preview */}
            {stats.filter(s => s.active !== false).length > 0 && (
              <div className="rounded-xl overflow-hidden mb-5" style={{ background: 'linear-gradient(135deg, #5C2A1E 0%, #7A3B2E 50%, #5C2A1E 100%)' }}>
                <div className="flex flex-wrap items-center justify-around px-4 py-5">
                  {stats.filter(s => s.active !== false).map((stat, i) => (
                    <div key={i} className="text-center px-4">
                      <div className="relative flex items-center justify-center mb-1">
                        <svg width="80" height="70" viewBox="0 0 100 88" fill="none"><polygon points="50,3 97,25 97,63 50,85 3,63 3,25" stroke="#FED800" strokeWidth="1.5" fill="none" opacity="0.5"/></svg>
                        <span className="absolute text-white font-black text-xl">{stat.number}</span>
                      </div>
                      <p className="text-[#FED800] text-xs font-semibold">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="h-1" style={{ background: 'linear-gradient(to right, transparent, #FED800 30%, #FED800 70%, transparent)' }} />
              </div>
            )}

            <div className="space-y-3">
              {stats.map((stat, index) => (
                <div key={stat.id || index} className="flex items-center gap-3 bg-[#FFF8E7] rounded-lg p-3">
                  <span className="text-xs font-bold text-[#8B6F47] w-5">{index + 1}</span>
                  <Input
                    value={stat.number}
                    onChange={(e) => updateStat(index, 'number', e.target.value)}
                    placeholder="e.g. 975"
                    className="w-28 text-center font-bold"
                  />
                  <Input
                    value={stat.label}
                    onChange={(e) => updateStat(index, 'label', e.target.value)}
                    placeholder="e.g. kg of sweets made"
                    className="flex-1"
                  />
                  <label className="flex items-center gap-1 text-xs text-[#8B6F47] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stat.active !== false}
                      onChange={(e) => updateStat(index, 'active', e.target.checked)}
                      className="w-3 h-3"
                    />
                    Active
                  </label>
                  <Button type="button" size="sm" variant="destructive" onClick={() => removeStat(index)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              {stats.length === 0 && (
                <p className="text-center py-6 text-[#8B6F47]">No stats yet. Click "Add Stat" to get started.</p>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}