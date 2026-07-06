import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Navigation } from "@/entities/Navigation";
import { SiteSettings } from "@/entities/SiteSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, ArrowLeft, Menu, Save } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { UploadFile } from "@/integrations/Core";

export default function AdminHeader() {
  const [user, setUser] = useState(null);
  const [navItems, setNavItems] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    site_name: "Pondy Sweets",
    tagline: "Since 1985",
    logo_url: "",
    phone: "+91 98765 43210",
    email: "orders@pondysweets.com",
    address: "123, Heritage Street, Pondicherry - 605001",
    top_bar_text: "Pan-India Delivery | Bulk Orders | Wedding Specials",
    footer_text: "",
    social_facebook: "",
    social_instagram: "",
    social_twitter: ""
  });
  const [navForm, setNavForm] = useState({
    name: "",
    path: "",
    order: 0,
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
      await loadData();
    } catch (error) {
      window.location.href = createPageUrl("Home");
    }
  };

  const loadData = async () => {
    setLoading(true);
    
    // Load navigation items
    const items = await Navigation.list("order");
    setNavItems(items);
    
    // Load site settings
    const settings = await SiteSettings.list();
    if (settings.length > 0) {
      setSiteSettings(settings[0]);
      setSettingsForm({
        site_name: settings[0].site_name || "Pondy Sweets",
        tagline: settings[0].tagline || "Since 1985",
        logo_url: settings[0].logo_url || "",
        phone: settings[0].phone || "+91 98765 43210",
        email: settings[0].email || "orders@pondysweets.com",
        address: settings[0].address || "123, Heritage Street, Pondicherry - 605001",
        top_bar_text: settings[0].top_bar_text || "Pan-India Delivery | Bulk Orders | Wedding Specials",
        footer_text: settings[0].footer_text || "",
        social_facebook: settings[0].social_facebook || "",
        social_instagram: settings[0].social_instagram || "",
        social_twitter: settings[0].social_twitter || ""
      });
    }
    
    setLoading(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setSettingsForm({ ...settingsForm, logo_url: file_url });
      toast.success("Logo uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload logo");
    }
    setUploading(false);
  };

  const handleSaveSettings = async () => {
    try {
      if (siteSettings) {
        await SiteSettings.update(siteSettings.id, settingsForm);
      } else {
        await SiteSettings.create(settingsForm);
      }
      toast.success("Site settings saved successfully");
      await loadData();
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  const handleNavSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const navData = {
        ...navForm,
        order: parseInt(navForm.order)
      };
      
      if (editingItem) {
        await Navigation.update(editingItem.id, navData);
        toast.success("Navigation item updated");
      } else {
        await Navigation.create(navData);
        toast.success("Navigation item created");
      }
      
      setDialogOpen(false);
      resetNavForm();
      await loadData();
    } catch (error) {
      toast.error("Failed to save navigation item");
    }
  };

  const handleEditNav = (item) => {
    setEditingItem(item);
    setNavForm({
      name: item.name,
      path: item.path,
      order: item.order || 0,
      active: item.active !== false
    });
    setDialogOpen(true);
  };

  const handleDeleteNav = async (itemId) => {
    if (!confirm("Are you sure you want to delete this navigation item?")) return;
    
    try {
      await Navigation.delete(itemId);
      toast.success("Navigation item deleted");
      await loadData();
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  const resetNavForm = () => {
    setEditingItem(null);
    setNavForm({
      name: "",
      path: "",
      order: 0,
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("AdminDashboard")}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-[#5C4033]">Header & Site Settings</h1>
              <p className="text-[#8B6F47]">Manage your website header, navigation and site information</p>
            </div>
          </div>
        </div>

        {/* Site Settings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-[#5C4033] flex items-center gap-2">
              <Menu className="w-5 h-5" />
              Site Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Site Name *</Label>
                <Input
                  value={settingsForm.site_name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, site_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Tagline</Label>
                <Input
                  value={settingsForm.tagline}
                  onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Logo</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploading}
              />
              {settingsForm.logo_url && (
                <img src={settingsForm.logo_url} alt="Logo" className="mt-2 h-16 w-16 object-contain" />
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={settingsForm.phone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={settingsForm.email}
                  onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Address</Label>
              <Textarea
                value={settingsForm.address}
                onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <Label>Top Bar Announcement Text</Label>
              <Input
                value={settingsForm.top_bar_text}
                onChange={(e) => setSettingsForm({ ...settingsForm, top_bar_text: e.target.value })}
              />
            </div>

            <div>
              <Label>Footer About Text</Label>
              <Textarea
                value={settingsForm.footer_text}
                onChange={(e) => setSettingsForm({ ...settingsForm, footer_text: e.target.value })}
                rows={3}
                placeholder="About text shown in footer"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Facebook URL</Label>
                <Input
                  value={settingsForm.social_facebook}
                  onChange={(e) => setSettingsForm({ ...settingsForm, social_facebook: e.target.value })}
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
              <div>
                <Label>Instagram URL</Label>
                <Input
                  value={settingsForm.social_instagram}
                  onChange={(e) => setSettingsForm({ ...settingsForm, social_instagram: e.target.value })}
                  placeholder="https://instagram.com/yourpage"
                />
              </div>
              <div>
                <Label>Twitter URL</Label>
                <Input
                  value={settingsForm.social_twitter}
                  onChange={(e) => setSettingsForm({ ...settingsForm, social_twitter: e.target.value })}
                  placeholder="https://twitter.com/yourpage"
                />
              </div>
            </div>

            <Button onClick={handleSaveSettings} className="bg-[#FFD700] text-[#5C4033] hover:bg-[#FFA500]">
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </CardContent>
        </Card>

        {/* Navigation Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-[#5C4033]">Navigation Menu Items</CardTitle>
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetNavForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-[#FFD700] text-[#5C4033] hover:bg-[#FFA500]">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Menu Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-[#5C4033]">
                      {editingItem ? "Edit Menu Item" : "Add Menu Item"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleNavSubmit} className="space-y-4">
                    <div>
                      <Label>Menu Item Name *</Label>
                      <Input
                        value={navForm.name}
                        onChange={(e) => setNavForm({ ...navForm, name: e.target.value })}
                        placeholder="e.g., Mysurpa, About, Contact"
                        required
                      />
                    </div>

                    <div>
                      <Label>Path/URL *</Label>
                      <Input
                        value={navForm.path}
                        onChange={(e) => setNavForm({ ...navForm, path: e.target.value })}
                        placeholder="e.g., Products?category=mysurpa, About, Contact"
                        required
                      />
                    </div>

                    <div>
                      <Label>Display Order</Label>
                      <Input
                        type="number"
                        value={navForm.order}
                        onChange={(e) => setNavForm({ ...navForm, order: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={navForm.active}
                          onChange={(e) => setNavForm({ ...navForm, active: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span>Active</span>
                      </label>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1 bg-[#FFD700] text-[#5C4033] hover:bg-[#FFA500]">
                        {editingItem ? "Update" : "Create"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-[#8B6F47] font-mono text-sm">{item.order}</span>
                    <div>
                      <h3 className="font-bold text-[#5C4033]">{item.name}</h3>
                      <p className="text-sm text-[#8B6F47]">{item.path}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.active ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Active</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">Inactive</span>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleEditNav(item)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteNav(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {navItems.length === 0 && (
              <div className="text-center py-8 text-[#8B6F47]">
                No navigation items yet. Add one to get started!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}