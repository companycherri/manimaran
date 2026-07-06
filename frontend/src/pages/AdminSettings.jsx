import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Settings } from "@/entities/Settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function AdminSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    delivery_fee: "50",
    free_delivery_threshold: "500",
    delivery_time: "2-3 business days",
    local_delivery_time: "Same day",
    min_order_value: "100",
    payment_methods: "COD, UPI, Card",
    site_title: "Pondy Sweets",
    site_description: "Authentic Indian sweets since 1985",
    contact_email: "orders@pondysweets.com",
    contact_phone: "+91 98765 43210",
    address: "123, Heritage Street, Pondicherry - 605001",
    meta_keywords: "sweets, indian sweets, mysore pak, pondicherry"
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
      await loadSettings();
    } catch (error) {
      window.location.href = createPageUrl("Home");
    }
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const allSettings = await Settings.list();
      const settingsMap = {};
      allSettings.forEach(setting => {
        settingsMap[setting.key] = setting.value;
      });
      setSettings({ ...settings, ...settingsMap });
    } catch (error) {
      console.error("Error loading settings:", error);
    }
    setLoading(false);
  };

  const handleSave = async (category) => {
    setSaving(true);
    try {
      const categorySettings = Object.keys(settings).filter(key => {
        if (category === 'delivery') return key.includes('delivery') || key.includes('order');
        if (category === 'payment') return key.includes('payment');
        if (category === 'general') return key.includes('site') || key.includes('contact') || key.includes('address');
        if (category === 'seo') return key.includes('meta') || key.includes('keywords');
        return false;
      });

      for (const key of categorySettings) {
        const existing = await Settings.filter({ key });
        if (existing.length > 0) {
          await Settings.update(existing[0].id, {
            key,
            value: settings[key],
            category
          });
        } else {
          await Settings.create({
            key,
            value: settings[key],
            category
          });
        }
      }
      
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
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
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#5C4033] mb-2">Settings</h1>
          <p className="text-[#8B6F47]">Configure your store settings</p>
        </div>

        <Tabs defaultValue="delivery" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="delivery">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#5C4033]">Delivery Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Delivery Fee (₹)</Label>
                  <Input
                    type="number"
                    value={settings.delivery_fee}
                    onChange={(e) => setSettings({ ...settings, delivery_fee: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Free Delivery Threshold (₹)</Label>
                  <Input
                    type="number"
                    value={settings.free_delivery_threshold}
                    onChange={(e) => setSettings({ ...settings, free_delivery_threshold: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Standard Delivery Time</Label>
                  <Input
                    value={settings.delivery_time}
                    onChange={(e) => setSettings({ ...settings, delivery_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Local Delivery Time</Label>
                  <Input
                    value={settings.local_delivery_time}
                    onChange={(e) => setSettings({ ...settings, local_delivery_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Minimum Order Value (₹)</Label>
                  <Input
                    type="number"
                    value={settings.min_order_value}
                    onChange={(e) => setSettings({ ...settings, min_order_value: e.target.value })}
                  />
                </div>
                <Button onClick={() => handleSave('delivery')} disabled={saving} className="bg-[#FFD700] text-[#5C4033] hover:bg-[#FFA500]">
                  <Save className="w-4 h-4 mr-2" />
                  Save Delivery Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#5C4033]">Payment Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Accepted Payment Methods</Label>
                  <Input
                    value={settings.payment_methods}
                    onChange={(e) => setSettings({ ...settings, payment_methods: e.target.value })}
                    placeholder="COD, UPI, Card"
                  />
                </div>
                <Button onClick={() => handleSave('payment')} disabled={saving} className="bg-[#FFD700] text-[#5C4033] hover:bg-[#FFA500]">
                  <Save className="w-4 h-4 mr-2" />
                  Save Payment Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#5C4033]">General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Site Title</Label>
                  <Input
                    value={settings.site_title}
                    onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Site Description</Label>
                  <Input
                    value={settings.site_description}
                    onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    value={settings.contact_email}
                    onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input
                    value={settings.contact_phone}
                    onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  />
                </div>
                <Button onClick={() => handleSave('general')} disabled={saving} className="bg-[#FFD700] text-[#5C4033] hover:bg-[#FFA500]">
                  <Save className="w-4 h-4 mr-2" />
                  Save General Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#5C4033]">SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Meta Keywords</Label>
                  <Input
                    value={settings.meta_keywords}
                    onChange={(e) => setSettings({ ...settings, meta_keywords: e.target.value })}
                    placeholder="Comma-separated keywords"
                  />
                </div>
                <Button onClick={() => handleSave('seo')} disabled={saving} className="bg-[#FFD700] text-[#5C4033] hover:bg-[#FFA500]">
                  <Save className="w-4 h-4 mr-2" />
                  Save SEO Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}