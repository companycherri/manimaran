import React, { useState, useEffect } from "react";
import { SiteSettings } from "@/entities/SiteSettings";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Save } from "lucide-react";
import { toast } from "sonner";

export default function AdminSiteSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState(null);
  const [uploading, setUploading] = useState({});
  const [formData, setFormData] = useState({
    site_name: "",
    tagline: "",
    logo: null,
    preloader_logo: null,
    favicon: null,
    about_banner: null,
    contact_banner: null,
    products_banner: null,
    phone: "",
    whatsapp_number: "",
    email: "",
    address: "",
    top_bar_text: "",
    footer_text: "",
    social_facebook: "",
    social_instagram: "",
    social_youtube: "",
    social_twitter: "",
    social_whatsapp: "",
    reviews_heading: ""
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await base44.auth.me();
      if (user.role !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }
      await loadSettings();
    } catch (error) {
      window.location.href = createPageUrl("Home");
    }
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settings = await SiteSettings.list();
      if (settings.length > 0) {
        setSettingsId(settings[0].id);
        setFormData({
          site_name: settings[0].site_name || "",
          tagline: settings[0].tagline || "",
          logo: settings[0].logo || null,
          preloader_logo: settings[0].preloader_logo || null,
          favicon: settings[0].favicon || null,
          about_banner: settings[0].about_banner || null,
          contact_banner: settings[0].contact_banner || null,
          products_banner: settings[0].products_banner || null,
          phone: settings[0].phone || "",
          whatsapp_number: settings[0].whatsapp_number || "",
          email: settings[0].email || "",
          address: settings[0].address || "",
          top_bar_text: settings[0].top_bar_text || "",
          footer_text: settings[0].footer_text || "",
          social_facebook: settings[0].social_facebook || "",
          social_instagram: settings[0].social_instagram || "",
          social_youtube: settings[0].social_youtube || "",
          social_twitter: settings[0].social_twitter || "",
          social_whatsapp: settings[0].social_whatsapp || "",
          reviews_heading: settings[0].reviews_heading || ""
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
    setLoading(false);
  };

  const handleFileUpload = async (field, file) => {
    if (!file) return;
    
    setUploading({ ...uploading, [field]: true });
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, [field]: file_url });
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
      console.error(error);
    }
    setUploading({ ...uploading, [field]: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (settingsId) {
        await SiteSettings.update(settingsId, formData);
      } else {
        const newSettings = await SiteSettings.create(formData);
        setSettingsId(newSettings.id);
      }
      toast.success("Settings saved successfully");
      await loadSettings();
    } catch (error) {
      toast.error("Failed to save settings");
      console.error(error);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8B6F47]">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE8C5] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#5C4033] mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8 text-[#FFD700]" />
            Site Settings
          </h1>
          <p className="text-[#8B6F47]">Manage your website configuration</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#5C4033]">General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Site Name *</Label>
                <Input
                  value={formData.site_name}
                  onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                  placeholder="ManiMaran Palkova"
                  required
                />
              </div>

              <div>
                <Label>Tagline</Label>
                <Input
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Since 1985"
                />
              </div>

              <div>
                <Label>Logo</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload('logo', e.target.files[0])}
                    disabled={uploading.logo}
                    className="flex-1"
                  />
                  {uploading.logo && <span className="text-sm text-[#8B6F47]">Uploading...</span>}
                </div>
                {formData.logo && (
                  <div className="mt-2 admin-logo-preview">
                    <img src={formData.logo} alt="Logo preview" className="h-16 w-16 object-contain" />
                  </div>
                )}
              </div>

              <div>
                <Label>Favicon</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload('favicon', e.target.files[0])}
                    disabled={uploading.favicon}
                    className="flex-1"
                  />
                  {uploading.favicon && <span className="text-sm text-[#8B6F47]">Uploading...</span>}
                </div>
                {formData.favicon && (
                  <div className="mt-2 admin-logo-preview">
                    <img src={formData.favicon} alt="Favicon preview" className="h-8 w-8 object-contain" />
                  </div>
                )}
                <p className="text-xs text-[#8B6F47] mt-1">Browser tab icon (recommended: 32x32 or 64x64 px)</p>
              </div>

              <div>
                <Label>Preloader Logo</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload('preloader_logo', e.target.files[0])}
                    disabled={uploading.preloader_logo}
                    className="flex-1"
                  />
                  {uploading.preloader_logo && <span className="text-sm text-[#8B6F47]">Uploading...</span>}
                </div>
                {formData.preloader_logo && (
                  <div className="mt-2 admin-logo-preview">
                    <img src={formData.preloader_logo} alt="Preloader preview" className="h-16 w-16 object-contain" />
                  </div>
                )}
                <p className="text-xs text-[#8B6F47] mt-1">Logo shown during page loading</p>
              </div>

              <div>
                <Label>About Page Banner</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload('about_banner', e.target.files[0])}
                    disabled={uploading.about_banner}
                    className="flex-1"
                  />
                  {uploading.about_banner && <span className="text-sm text-[#8B6F47]">Uploading...</span>}
                </div>
                {formData.about_banner && (
                  <div className="mt-2">
                    <img src={formData.about_banner} alt="About banner preview" className="h-24 w-full object-cover border rounded" />
                  </div>
                )}
                <p className="text-xs text-[#8B6F47] mt-1">Banner image shown at the top of About page</p>
              </div>

              <div>
                <Label>Contact Page Banner</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload('contact_banner', e.target.files[0])}
                    disabled={uploading.contact_banner}
                    className="flex-1"
                  />
                  {uploading.contact_banner && <span className="text-sm text-[#8B6F47]">Uploading...</span>}
                </div>
                {formData.contact_banner && (
                  <div className="mt-2">
                    <img src={formData.contact_banner} alt="Contact banner preview" className="h-24 w-full object-cover border rounded" />
                  </div>
                )}
                <p className="text-xs text-[#8B6F47] mt-1">Banner image shown at the top of Contact page</p>
              </div>

              <div>
                <Label>Products Page Banner</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload('products_banner', e.target.files[0])}
                    disabled={uploading.products_banner}
                    className="flex-1"
                  />
                  {uploading.products_banner && <span className="text-sm text-[#8B6F47]">Uploading...</span>}
                </div>
                {formData.products_banner && (
                  <div className="mt-2">
                    <img src={formData.products_banner} alt="Products banner preview" className="h-24 w-full object-cover border rounded" />
                  </div>
                )}
                <p className="text-xs text-[#8B6F47] mt-1">Banner image shown at the top of Products page</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#5C4033]">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <Label>WhatsApp Number (with country code, no + or spaces)</Label>
                <Input
                  value={formData.whatsapp_number}
                  onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                  placeholder="919876543210"
                />
                <p className="text-xs text-[#8B6F47] mt-1">Example: 919876543210 for +91 9876543210</p>
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="orders@manimaranpalkova.com"
                />
              </div>

              <div>
                <Label>Address</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123, Heritage Street, Pondicherry - 605001"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#5C4033]">Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Top Bar Text</Label>
                <Input
                  value={formData.top_bar_text}
                  onChange={(e) => setFormData({ ...formData, top_bar_text: e.target.value })}
                  placeholder="Free delivery on orders above ₹500"
                />
              </div>

              <div>
                <Label>Footer About Text</Label>
                <Textarea
                  value={formData.footer_text}
                  onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                  placeholder="Carrying forward a rich legacy..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Reviews Section Heading</Label>
                <Input
                  value={formData.reviews_heading}
                  onChange={(e) => setFormData({ ...formData, reviews_heading: e.target.value })}
                  placeholder="What Our Customers Say"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#5C4033]">Social Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Facebook URL</Label>
                <Input
                  value={formData.social_facebook}
                  onChange={(e) => setFormData({ ...formData, social_facebook: e.target.value })}
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div>
                <Label>Instagram URL</Label>
                <Input
                  value={formData.social_instagram}
                  onChange={(e) => setFormData({ ...formData, social_instagram: e.target.value })}
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div>
                <Label>YouTube URL</Label>
                <Input
                  value={formData.social_youtube}
                  onChange={(e) => setFormData({ ...formData, social_youtube: e.target.value })}
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div>
                <Label>Twitter URL</Label>
                <Input
                  value={formData.social_twitter}
                  onChange={(e) => setFormData({ ...formData, social_twitter: e.target.value })}
                  placeholder="https://twitter.com/..."
                />
              </div>

              <div>
                <Label>WhatsApp URL</Label>
                <Input
                  value={formData.social_whatsapp}
                  onChange={(e) => setFormData({ ...formData, social_whatsapp: e.target.value })}
                  placeholder="https://wa.me/..."
                />
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={saving}
            className="w-full bg-[#FFD700] text-[#5C4033] hover:bg-[#FFA500] h-12 text-lg"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </div>
    </div>
  );
}