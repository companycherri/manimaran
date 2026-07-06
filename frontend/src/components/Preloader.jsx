import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SiteSettings } from "@/entities/SiteSettings";

export default function Preloader({ isVisible }) {
  const [preloaderLogo, setPreloaderLogo] = React.useState("https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e6146089ccb876f02ada79/acefb1ad8_WhatsAppImage2025-12-29at55457PM.jpeg");

  React.useEffect(() => {
    loadPreloaderLogo();
  }, []);

  const loadPreloaderLogo = async () => {
    try {
      const settings = await SiteSettings.list();
      if (settings.length > 0 && settings[0].preloader_logo) {
        setPreloaderLogo(settings[0].preloader_logo);
      }
    } catch (error) {
      console.error("Error loading preloader logo:", error);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-white flex items-center justify-center logo-wrapper"
        >
          <motion.img
            src={preloaderLogo}
            alt="Loading..."
            className="max-w-64 max-h-64 object-contain logo-preview"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}