import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const items = await base44.entities.Announcement.filter({ active: true }, "order");
      setAnnouncements(items);
    } catch (error) {
      console.error("Error loading announcements:", error);
    }
  };

  if (announcements.length === 0) return null;

  return (
    <div className="w-full overflow-hidden relative">
      {announcements.map((announcement, index) => (
        <div
          key={announcement.id}
          className="py-2 text-sm font-medium"
          style={{
            backgroundColor: announcement.background_color || "#C41E3A",
            color: announcement.text_color || "#FFFFFF"
          }}
        >
          <div className="animate-scroll whitespace-nowrap inline-block">
            {Array(5).fill(announcement.text).map((text, i) => (
              <span key={i} className="mx-8">
                {text}
              </span>
            ))}
          </div>
        </div>
      ))}
      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll ${announcements[0]?.scroll_speed || 50}s linear infinite;
        }
      `}</style>
    </div>
  );
}