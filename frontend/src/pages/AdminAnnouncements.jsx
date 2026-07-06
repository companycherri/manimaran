import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function AdminAnnouncements() {
  const [user, setUser] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    text: "",
    active: true,
    background_color: "#C41E3A",
    text_color: "#FFFFFF",
    scroll_speed: 50,
    order: 0
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        window.location.href = "/";
        return;
      }
      setUser(currentUser);
      await loadAnnouncements();
    } catch (error) {
      window.location.href = "/";
    }
  };

  const loadAnnouncements = async () => {
    setLoading(true);
    const items = await base44.entities.Announcement.list("order");
    setAnnouncements(items);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await base44.entities.Announcement.update(editing.id, formData);
        toast.success("Announcement updated successfully");
      } else {
        await base44.entities.Announcement.create(formData);
        toast.success("Announcement created successfully");
      }
      setDialogOpen(false);
      setEditing(null);
      setFormData({
        text: "",
        active: true,
        background_color: "#C41E3A",
        text_color: "#FFFFFF",
        scroll_speed: 50,
        order: 0
      });
      loadAnnouncements();
    } catch (error) {
      toast.error("Failed to save announcement");
    }
  };

  const handleEdit = (announcement) => {
    setEditing(announcement);
    setFormData(announcement);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      try {
        await base44.entities.Announcement.delete(id);
        toast.success("Announcement deleted");
        loadAnnouncements();
      } catch (error) {
        toast.error("Failed to delete announcement");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE8C5] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#5C4033]">Announcement Bar</h1>
            <p className="text-[#8B6F47] mt-2">Manage scrolling announcements at the top of your website</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormData({
                    text: "",
                    active: true,
                    background_color: "#C41E3A",
                    text_color: "#FFFFFF",
                    scroll_speed: 50,
                    order: 0
                  });
                }}
                className="bg-[#5C4033] hover:bg-[#8B6F47]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Announcement" : "Add New Announcement"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Announcement Text</Label>
                  <Input
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    placeholder="Celebrate the joy of gifting with our premium sweets"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.background_color}
                        onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                        className="w-20 h-10"
                      />
                      <Input
                        value={formData.background_color}
                        onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                        placeholder="#C41E3A"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.text_color}
                        onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                        className="w-20 h-10"
                      />
                      <Input
                        value={formData.text_color}
                        onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Scroll Speed (seconds)</Label>
                    <Input
                      type="number"
                      value={formData.scroll_speed}
                      onChange={(e) => setFormData({ ...formData, scroll_speed: Number(e.target.value) })}
                      min="10"
                      max="200"
                    />
                    <p className="text-xs text-gray-500 mt-1">Lower is faster</p>
                  </div>

                  <div>
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label>Active</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#5C4033] hover:bg-[#8B6F47]">
                    {editing ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{announcement.text}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleEdit(announcement)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-2 font-semibold ${announcement.active ? 'text-green-600' : 'text-gray-400'}`}>
                      {announcement.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Background:</span>
                    <span
                      className="ml-2 inline-block w-6 h-6 rounded border align-middle"
                      style={{ backgroundColor: announcement.background_color }}
                    />
                  </div>
                  <div>
                    <span className="text-gray-500">Text Color:</span>
                    <span
                      className="ml-2 inline-block w-6 h-6 rounded border align-middle"
                      style={{ backgroundColor: announcement.text_color }}
                    />
                  </div>
                  <div>
                    <span className="text-gray-500">Speed:</span>
                    <span className="ml-2 font-semibold">{announcement.scroll_speed}s</span>
                  </div>
                </div>
                
                {/* Preview */}
                <div className="mt-4">
                  <Label className="text-xs text-gray-500 mb-2 block">Preview:</Label>
                  <div
                    className="py-2 text-sm font-medium overflow-hidden"
                    style={{
                      backgroundColor: announcement.background_color,
                      color: announcement.text_color
                    }}
                  >
                    <div className="whitespace-nowrap">
                      {announcement.text}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {announcements.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500 mb-4">No announcements yet</p>
                <Button
                  onClick={() => setDialogOpen(true)}
                  className="bg-[#5C4033] hover:bg-[#8B6F47]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Announcement
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}