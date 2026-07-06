import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function AdminFooter() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [footerId, setFooterId] = useState(null);
  const [formData, setFormData] = useState({
    about_title: "",
    about_text: "",
    quick_links: [],
    contact_address: "",
    contact_phone: "",
    contact_email: "",
    newsletter_title: "",
    newsletter_text: "",
    copyright_text: ""
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
      await loadFooter();
    } catch (error) {
      window.location.href = createPageUrl("Home");
    }
  };

  const loadFooter = async () => {
    setLoading(true);
    try {
      const footer = await base44.entities.Footer.list();
      if (footer.length > 0) {
        setFooterId(footer[0].id);
        setFormData({
          about_title: footer[0].about_title || "",
          about_text: footer[0].about_text || "",
          quick_links: footer[0].quick_links || [],
          contact_address: footer[0].contact_address || "",
          contact_phone: footer[0].contact_phone || "",
          contact_email: footer[0].contact_email || "",
          newsletter_title: footer[0].newsletter_title || "",
          newsletter_text: footer[0].newsletter_text || "",
          copyright_text: footer[0].copyright_text || ""
        });
      }
    } catch (error) {
      console.error("Error loading footer:", error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (footerId) {
        await base44.entities.Footer.update(footerId, formData);
      } else {
        const newFooter = await base44.entities.Footer.create(formData);
        setFooterId(newFooter.id);
      }
      toast.success("Footer saved successfully");
      await loadFooter();
    } catch (error) {
      toast.error("Failed to save footer");
      console.error(error);
    }

    setSaving(false);
  };

  const addQuickLink = () => {
    setFormData({
      ...formData,
      quick_links: [...formData.quick_links, { label: "", url: "" }]
    });
  };

  const removeQuickLink = (index) => {
    const newLinks = formData.quick_links.filter((_, i) => i !== index);
    setFormData({ ...formData, quick_links: newLinks });
  };

  const updateQuickLink = (index, field, value) => {
    const newLinks = [...formData.quick_links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setFormData({ ...formData, quick_links: newLinks });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8B6F47]">Loading footer settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE8C5] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("AdminDashboard")}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-[#5C4033]">Footer Management</h1>
            <p className="text-[#8B6F47]">Configure footer content and links</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#5C4033]">About Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={formData.about_title}
                  onChange={(e) => setFormData({ ...formData, about_title: e.target.value })}
                  placeholder="ManiMaran Palgova"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.about_text}
                  onChange={(e) => setFormData({ ...formData, about_text: e.target.value })}
                  placeholder="Carrying forward a rich legacy..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#5C4033] flex items-center justify-between">
                Quick Links
                <Button type="button" size="sm" onClick={addQuickLink} variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Link
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.quick_links.map((link, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label>Label</Label>
                    <Input
                      value={link.label}
                      onChange={(e) => updateQuickLink(index, 'label', e.target.value)}
                      placeholder="Home"
                    />
                  </div>
                  <div className="flex-1">
                    <Label>URL</Label>
                    <Input
                      value={link.url}
                      onChange={(e) => updateQuickLink(index, 'url', e.target.value)}
                      placeholder="/home or https://..."
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    onClick={() => removeQuickLink(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#5C4033]">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Address</Label>
                <Textarea
                  value={formData.contact_address}
                  onChange={(e) => setFormData({ ...formData, contact_address: e.target.value })}
                  placeholder="123, Heritage Street, Pondicherry - 605001"
                  rows={2}
                />
              </div>

              <div>
                <Label>Phone Number</Label>
                <Input
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <Label>Email Address</Label>
                <Input
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="orders@manimaranpalgova.com"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#5C4033]">Newsletter Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={formData.newsletter_title}
                  onChange={(e) => setFormData({ ...formData, newsletter_title: e.target.value })}
                  placeholder="Newsletter"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.newsletter_text}
                  onChange={(e) => setFormData({ ...formData, newsletter_text: e.target.value })}
                  placeholder="Get updates on new arrivals and special offers."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#5C4033]">Copyright</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label>Copyright Text</Label>
                <Input
                  value={formData.copyright_text}
                  onChange={(e) => setFormData({ ...formData, copyright_text: e.target.value })}
                  placeholder="© 2025 ManiMaran Palkova. All Rights Reserved."
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
            {saving ? "Saving..." : "Save Footer Settings"}
          </Button>
        </form>
      </div>
    </div>
  );
}