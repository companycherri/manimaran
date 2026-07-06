import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, MoveUp, MoveDown } from "lucide-react";
import { toast } from "sonner";

export default function AdminNavbarIcons() {
  const [loading, setLoading] = useState(true);
  const [icons, setIcons] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIcon, setEditingIcon] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    icon_type: "whatsapp",
    url: "",
    color: "#25D366",
    order: 0,
    active: true
  });

  const iconColors = {
    whatsapp: "#25D366",
    instagram: "#E4405F",
    facebook: "#1877F2",
    youtube: "#FF0000",
    twitter: "#1DA1F2",
    linkedin: "#0A66C2",
    spotify: "#1DB954",
    pinterest: "#E60023"
  };

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
      await loadIcons();
    } catch (error) {
      window.location.href = createPageUrl("Home");
    }
  };

  const loadIcons = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.NavbarIcon.list("order");
      setIcons(data);
    } catch (error) {
      console.error("Error loading icons:", error);
      toast.error("Failed to load icons");
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingIcon) {
        await base44.entities.NavbarIcon.update(editingIcon.id, formData);
        toast.success("Icon updated successfully");
      } else {
        await base44.entities.NavbarIcon.create(formData);
        toast.success("Icon added successfully");
      }
      setDialogOpen(false);
      resetForm();
      await loadIcons();
    } catch (error) {
      console.error("Error saving icon:", error);
      toast.error("Failed to save icon");
    }
  };

  const handleEdit = (icon) => {
    setEditingIcon(icon);
    setFormData({
      name: icon.name,
      icon_type: icon.icon_type,
      url: icon.url,
      color: icon.color,
      order: icon.order,
      active: icon.active
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this icon?")) return;
    try {
      await base44.entities.NavbarIcon.delete(id);
      toast.success("Icon deleted successfully");
      await loadIcons();
    } catch (error) {
      console.error("Error deleting icon:", error);
      toast.error("Failed to delete icon");
    }
  };

  const handleToggleActive = async (icon) => {
    try {
      await base44.entities.NavbarIcon.update(icon.id, { active: !icon.active });
      await loadIcons();
    } catch (error) {
      console.error("Error toggling icon:", error);
      toast.error("Failed to update icon");
    }
  };

  const handleMoveUp = async (icon, index) => {
    if (index === 0) return;
    const prevIcon = icons[index - 1];
    try {
      await base44.entities.NavbarIcon.update(icon.id, { order: prevIcon.order });
      await base44.entities.NavbarIcon.update(prevIcon.id, { order: icon.order });
      await loadIcons();
    } catch (error) {
      toast.error("Failed to reorder");
    }
  };

  const handleMoveDown = async (icon, index) => {
    if (index === icons.length - 1) return;
    const nextIcon = icons[index + 1];
    try {
      await base44.entities.NavbarIcon.update(icon.id, { order: nextIcon.order });
      await base44.entities.NavbarIcon.update(nextIcon.id, { order: icon.order });
      await loadIcons();
    } catch (error) {
      toast.error("Failed to reorder");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      icon_type: "whatsapp",
      url: "",
      color: "#25D366",
      order: icons.length,
      active: true
    });
    setEditingIcon(null);
  };

  const handleIconTypeChange = (value) => {
    setFormData({ 
      ...formData, 
      icon_type: value,
      color: iconColors[value] || "#000000"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8B6F47]">Loading icons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE8C5] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#5C4033] mb-2">Navbar Icons</h1>
            <p className="text-[#8B6F47]">Manage your sticky social navbar icons</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-[#FFD700] text-[#5C4033] hover:bg-[#FFA500]">
                <Plus className="w-4 h-4 mr-2" />
                Add Icon
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle className="text-[#5C4033]">
                  {editingIcon ? "Edit Icon" : "Add New Icon"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="WhatsApp"
                    required
                  />
                </div>

                <div>
                  <Label>Icon Type</Label>
                  <Select value={formData.icon_type} onValueChange={handleIconTypeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="spotify">Spotify</SelectItem>
                      <SelectItem value="pinterest">Pinterest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>URL</Label>
                  <Input
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://..."
                    required
                  />
                </div>

                <div>
                  <Label>Color (Hex Code)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="#25D366"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    min="0"
                  />
                </div>

                <Button type="submit" className="w-full bg-[#5C4033] text-white hover:bg-[#8B6F47]">
                  {editingIcon ? "Update Icon" : "Add Icon"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#5C4033]">Active Icons</CardTitle>
          </CardHeader>
          <CardContent>
            {icons.length === 0 ? (
              <div className="text-center py-12 text-[#8B6F47]">
                <p>No icons added yet. Click "Add Icon" to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {icons.map((icon, index) => (
                  <div
                    key={icon.id}
                    className="flex items-center justify-between p-4 bg-[#FFF8E7] rounded-lg border border-[#FFD700]/30"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                        style={{ backgroundColor: icon.color }}
                      >
                        {icon.icon_type.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#5C4033]">{icon.name}</h3>
                        <p className="text-sm text-[#8B6F47]">{icon.icon_type}</p>
                        <p className="text-xs text-[#8B6F47] truncate max-w-xs">{icon.url}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 mr-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveUp(icon, index)}
                          disabled={index === 0}
                          className="text-[#5C4033]"
                        >
                          <MoveUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveDown(icon, index)}
                          disabled={index === icons.length - 1}
                          className="text-[#5C4033]"
                        >
                          <MoveDown className="w-4 h-4" />
                        </Button>
                      </div>
                      <Switch
                        checked={icon.active}
                        onCheckedChange={() => handleToggleActive(icon)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(icon)}
                        className="text-[#5C4033]"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(icon.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}