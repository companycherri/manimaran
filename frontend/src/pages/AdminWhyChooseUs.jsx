import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminWhyChooseUs() {
  const [data, setData] = useState({
    heading: "",
    description: "",
    box1_title: "",
    box1_text: "",
    box2_title: "",
    box2_text: "",
    box3_title: "",
    box3_text: "",
    active: true,
  });
  const [recordId, setRecordId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const items = await base44.entities.WhyChooseUs.list();
    if (items.length > 0) {
      setData(items[0]);
      setRecordId(items[0].id);
    }
  };

  const handleChange = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (recordId) {
        await base44.entities.WhyChooseUs.update(recordId, data);
      } else {
        const created = await base44.entities.WhyChooseUs.create(data);
        setRecordId(created.id);
      }
      toast.success("Saved successfully!");
    } catch (e) {
      toast.error("Failed to save.");
    }
    setSaving(false);
  };

  const fields = [
    { key: "heading", label: "Section Heading", multiline: false },
    { key: "description", label: "Section Description", multiline: true },
    { key: "box1_title", label: "Box 1 Title", multiline: false },
    { key: "box1_text", label: "Box 1 Text", multiline: true },
    { key: "box2_title", label: "Box 2 Title", multiline: false },
    { key: "box2_text", label: "Box 2 Text", multiline: true },
    { key: "box3_title", label: "Box 3 Title", multiline: false },
    { key: "box3_text", label: "Box 3 Text", multiline: true },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-[#5C4033] mb-6">Why Choose Us Section</h1>
      <div className="bg-white rounded-2xl shadow p-6 space-y-5">
        {fields.map(({ key, label, multiline }) => (
          <div key={key}>
            <label className="block text-sm font-semibold text-[#5C4033] mb-1">{label}</label>
            {multiline ? (
              <textarea
                value={data[key] || ""}
                onChange={(e) => handleChange(key, e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FED800]"
              />
            ) : (
              <Input
                value={data[key] || ""}
                onChange={(e) => handleChange(key, e.target.value)}
              />
            )}
          </div>
        ))}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#FED800] text-[#5C4033] hover:bg-[#FFA500] font-bold"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}