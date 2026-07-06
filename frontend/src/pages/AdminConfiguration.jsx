import React, { useState, useEffect } from "react";
import { Configuration } from "@/entities/Configuration";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Save, Eye, EyeOff, Mail, CreditCard } from "lucide-react";
import { toast } from "sonner";

export default function AdminConfiguration() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configId, setConfigId] = useState(null);
  const [showApiKeys, setShowApiKeys] = useState({
    resend: false,
    payment_api: false,
    payment_secret: false,
    payment_webhook: false
  });

  const [formData, setFormData] = useState({
    resend_api_key: "",
    resend_sender_email: "",
    resend_sender_name: "",
    resend_enabled: false,
    payment_gateway: "razorpay",
    payment_api_key: "",
    payment_secret_key: "",
    payment_webhook_secret: "",
    payment_enabled: true,
    admin_email: "contentcherri@gmail.com"
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
      await loadConfiguration();
    } catch (error) {
      window.location.href = createPageUrl("Home");
    }
  };

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      const configs = await Configuration.list();
      if (configs.length > 0) {
        setConfigId(configs[0].id);
        setFormData({
          resend_api_key: configs[0].resend_api_key || "",
          resend_sender_email: configs[0].resend_sender_email || "",
          resend_sender_name: configs[0].resend_sender_name || "",
          resend_enabled: configs[0].resend_enabled || false,
          payment_gateway: configs[0].payment_gateway || "razorpay",
          payment_api_key: configs[0].payment_api_key || "",
          payment_secret_key: configs[0].payment_secret_key || "",
          payment_webhook_secret: configs[0].payment_webhook_secret || "",
          payment_enabled: configs[0].payment_enabled !== false,
          admin_email: configs[0].admin_email || "contentcherri@gmail.com"
        });
      }
    } catch (error) {
      console.error("Error loading configuration:", error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (configId) {
        await Configuration.update(configId, formData);
      } else {
        const newConfig = await Configuration.create(formData);
        setConfigId(newConfig.id);
      }
      toast.success("Configuration saved successfully");
    } catch (error) {
      toast.error("Failed to save configuration");
      console.error(error);
    }

    setSaving(false);
  };

  const toggleShowKey = (field) => {
    setShowApiKeys(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8B6F47]">Loading configuration...</p>
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
            Configuration
          </h1>
          <p className="text-[#8B6F47]">Manage email and payment gateway settings</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#5C4033] flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#FFD700]" />
                Resend Email Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Resend API Key</Label>
                <div className="relative">
                  <Input
                    type={showApiKeys.resend ? "text" : "password"}
                    value={formData.resend_api_key}
                    onChange={(e) => setFormData({ ...formData, resend_api_key: e.target.value })}
                    placeholder="re_xxxxxxxxxxxxx"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('resend')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B6F47] hover:text-[#5C4033]"
                  >
                    {showApiKeys.resend ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-[#8B6F47] mt-1">Get your API key from resend.com</p>
              </div>

              <div>
                <Label>Sender Email Address</Label>
                <Input
                  type="email"
                  value={formData.resend_sender_email}
                  onChange={(e) => setFormData({ ...formData, resend_sender_email: e.target.value })}
                  placeholder="noreply@yourdomain.com"
                />
              </div>

              <div>
                <Label>Sender Name</Label>
                <Input
                  value={formData.resend_sender_name}
                  onChange={(e) => setFormData({ ...formData, resend_sender_name: e.target.value })}
                  placeholder="ManiMaran Palkova"
                />
              </div>

              <div>
                <Label>Admin Email for Notifications</Label>
                <Input
                  type="email"
                  value={formData.admin_email}
                  onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                  placeholder="admin@yourdomain.com"
                />
                <p className="text-xs text-[#8B6F47] mt-1">Receives order invoice copies and new newsletter subscription notifications</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#FFF8E7] rounded-lg">
                <div>
                  <Label className="text-base">Enable Email Service</Label>
                  <p className="text-xs text-[#8B6F47]">Turn on to send emails via Resend</p>
                </div>
                <Switch
                  checked={formData.resend_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, resend_enabled: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Gateway Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#5C4033] flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#FFD700]" />
                Payment Gateway Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Payment Gateway</Label>
                <Select
                  value={formData.payment_gateway}
                  onValueChange={(value) => setFormData({ ...formData, payment_gateway: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="razorpay">Razorpay</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>API Key / Client ID</Label>
                <div className="relative">
                  <Input
                    type={showApiKeys.payment_api ? "text" : "password"}
                    value={formData.payment_api_key}
                    onChange={(e) => setFormData({ ...formData, payment_api_key: e.target.value })}
                    placeholder="Enter your API key"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('payment_api')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B6F47] hover:text-[#5C4033]"
                  >
                    {showApiKeys.payment_api ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label>Secret Key</Label>
                <div className="relative">
                  <Input
                    type={showApiKeys.payment_secret ? "text" : "password"}
                    value={formData.payment_secret_key}
                    onChange={(e) => setFormData({ ...formData, payment_secret_key: e.target.value })}
                    placeholder="Enter your secret key"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('payment_secret')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B6F47] hover:text-[#5C4033]"
                  >
                    {showApiKeys.payment_secret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label>Webhook Secret (Optional)</Label>
                <div className="relative">
                  <Input
                    type={showApiKeys.payment_webhook ? "text" : "password"}
                    value={formData.payment_webhook_secret}
                    onChange={(e) => setFormData({ ...formData, payment_webhook_secret: e.target.value })}
                    placeholder="Enter webhook secret if applicable"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('payment_webhook')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B6F47] hover:text-[#5C4033]"
                  >
                    {showApiKeys.payment_webhook ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#FFF8E7] rounded-lg">
                <div>
                  <Label className="text-base">Enable Payment Gateway</Label>
                  <p className="text-xs text-[#8B6F47]">Turn on to accept payments</p>
                </div>
                <Switch
                  checked={formData.payment_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, payment_enabled: checked })}
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
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </form>
      </div>
    </div>
  );
}