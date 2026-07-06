import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Leaf, Users, ShieldCheck, Truck, Heart, Clock, Star, Gift } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatsStrip from '@/components/about/StatsStrip';

const iconMap = {
  Award, Leaf, Users, ShieldCheck, Truck, Heart, Clock, Star, Gift
};

export default function About() {
  const [pageData, setPageData] = useState(null);
  const [siteSettings, setSiteSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      const pages = await base44.entities.Page.filter({ page_key: 'about', active: true });
      if (pages.length > 0) {
        setPageData(pages[0]);
      }
      const settings = await base44.entities.SiteSettings.list();
      if (settings.length > 0) {
        setSiteSettings(settings[0]);
      }
    } catch (error) {
      console.error("Error loading page:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#FED800] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Default content if no page data exists
  const defaultData = {
    title: "Our Story",
    content: "Pondy Sweets began as a small, family-run sweet shop with a simple mission: to share the authentic taste of traditional Indian sweets, made with pure ingredients and timeless recipes. Today, we carry forward that same passion on a larger scale, never compromising on the quality that defines our heritage.",
    sections: [
      { title: "Authenticity", content: "Honoring traditional recipes and cooking methods.", icon: "Award" },
      { title: "Purity", content: "Using only the finest, all-natural ingredients.", icon: "Leaf" },
      { title: "Community", content: "Sharing joy and celebrating moments together.", icon: "Users" }
    ]
  };

  const displayData = pageData || defaultData;

  return (
    <div className="bg-white">
      <div className="relative h-64 md:h-80 bg-gradient-to-r from-[#5C4033] to-[#8B6F47] flex items-center justify-center overflow-hidden">
        {(pageData?.banner_image || siteSettings?.about_banner) && (
          <img 
            src={pageData?.banner_image || siteSettings?.about_banner} 
            alt="About Banner" 
            className="absolute inset-0 w-full h-full object-cover object-center opacity-40"
          />
        )}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-5xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>
          {displayData.title}
        </motion.h1>
      </div>

      {/* Our Story Section */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {displayData.content_heading && (
            <h2 className="text-3xl md:text-4xl font-bold text-[#5C4033] mb-4">{displayData.content_heading}</h2>
          )}
          {!displayData.content_heading && (
            <h2 className="text-3xl md:text-4xl font-bold text-[#5C4033] mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              {siteSettings?.site_name || "Manimaran Palgova"}
            </h2>
          )}
          <div className="w-20 h-1 bg-[#FED800] mx-auto mb-6 rounded-full"></div>
          <p className="text-lg text-[#8B6F47] leading-relaxed max-w-3xl mx-auto">
            {displayData.content}
          </p>
        </motion.div>

        {/* Story + Image split */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <img
              src={pageData?.legacy_image || displayData.sections?.find(s => s.image_url)?.image_url || "https://images.unsplash.com/photo-1606631759898-6e9ee3f01e0a?w=800&q=80"}
              alt="Our Story"
              className="rounded-2xl shadow-2xl w-full h-72 md:h-96 object-cover"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h3 className="text-2xl md:text-3xl font-bold text-[#5C4033] mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              {pageData?.legacy_heading || "A Legacy Crafted with Love"}
            </h3>
            <p className="text-[#8B6F47] leading-relaxed mb-4">
              {pageData?.legacy_paragraph1 || "For generations, Manimaran Palgova has been a household name in Tamil Nadu — synonymous with the rich, melt-in-your-mouth taste of authentic Palgova. Our journey began in the heart of Pondicherry, where our founders believed that the finest sweets come from the finest care."}
            </p>
            <p className="text-[#8B6F47] leading-relaxed mb-6">
              {pageData?.legacy_paragraph2 || "Every batch of our Palgova is slow-cooked the traditional way — no shortcuts, no preservatives. Just pure milk, pure ghee, and pure passion. Over the decades, we have grown, but our recipe and our commitment remain unchanged."}
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Clock, label: "Since 1985" },
                { icon: ShieldCheck, label: "No Preservatives" },
                { icon: Star, label: "Award Winning" },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-2 bg-[#FFF8E7] border border-[#FED800]/50 text-[#5C4033] px-4 py-2 rounded-full text-sm font-semibold">
                  <Icon className="w-4 h-4 text-[#FED800]" />
                  {label}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* What We Offer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-[#5C4033] mb-3" style={{ fontFamily: 'Georgia, serif' }}>What We Offer</h2>
            <div className="w-16 h-1 bg-[#FED800] mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { icon: Gift, title: "Signature Palgova", desc: "Our iconic slow-cooked milk sweet — the original recipe, unchanged since 1985. Rich, creamy, and utterly authentic." },
              { icon: Leaf, title: "Pure Ingredients", desc: "Farm-fresh milk, hand-churned ghee, and premium natural ingredients — nothing artificial, ever." },
              { icon: Truck, title: "Pan-India Delivery", desc: "Fresh sweets delivered safely to your doorstep, packed with care to preserve every ounce of freshness." },
              { icon: Heart, title: "Festive Hampers", desc: "Custom hampers for weddings, festivals, and corporate gifting — curated with love and wrapped with elegance." },
              { icon: Award, title: "Cashew & Dry Fruit Sweets", desc: "Premium sweets crafted from the finest cashews, dry fruits, and saffron for a truly indulgent experience." },
              { icon: ShieldCheck, title: "Hygiene Assured", desc: "Manufactured in a clean, modern facility that upholds the highest standards of food safety and hygiene." },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
                whileHover={{
                  y: -8,
                  scale: 1.04,
                  boxShadow: "0 20px 48px rgba(254,216,0,0.25), 0 8px 24px rgba(92,64,51,0.12)",
                  transition: { type: "spring", stiffness: 280, damping: 16 }
                }}
                className="relative bg-[#FFF8E7] border border-[#FED800]/40 rounded-2xl p-6 shadow-sm cursor-default overflow-hidden group"
                style={{ willChange: "transform" }}
              >
                {/* Soft blink/glow highlight on hover */}
                <motion.div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    background: "linear-gradient(135deg, rgba(254,216,0,0.08) 0%, rgba(254,216,0,0.18) 100%)",
                    border: "1.5px solid rgba(254,216,0,0.7)"
                  }}
                />

                {/* Floating icon with shake on hover */}
                <motion.div
                  className="w-12 h-12 bg-[#FED800]/40 rounded-xl flex items-center justify-center mb-4 relative z-10"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                  whileHover={{
                    rotate: [0, -10, 10, -5, 5, 0],
                    scale: 1.15,
                    backgroundColor: "rgba(254,216,0,0.7)",
                    transition: { duration: 0.45, ease: "easeInOut" }
                  }}
                >
                  <Icon className="w-6 h-6 text-[#5C4033]" />
                </motion.div>

                <h4 className="font-bold text-[#5C4033] text-lg mb-2 relative z-10 group-hover:text-[#5C4033] transition-colors">{title}</h4>
                <p className="text-sm text-[#8B6F47] leading-relaxed relative z-10">{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Core Values */}
        {displayData.sections && displayData.sections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-[#5C4033] to-[#8B6F47] rounded-2xl p-10 md:p-14 shadow-2xl"
          >
            <h2 className="text-3xl font-bold text-white mb-2 text-center" style={{ fontFamily: 'Georgia, serif' }}>Our Core Values</h2>
            <div className="w-20 h-1 bg-[#FED800] mx-auto mb-10 rounded-full"></div>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              {displayData.sections.slice(0, 3).map((section, index) => {
                const IconComponent = section.icon && iconMap[section.icon] ? iconMap[section.icon] : Award;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 * (index + 1), duration: 0.5 }}
                    whileHover={{ y: -8, scale: 1.03 }}
                    className="bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-colors"
                  >
                    <div className="w-20 h-20 bg-[#FED800] rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
                      <IconComponent className="w-10 h-10 text-[#5C4033]" />
                    </div>
                    <h4 className="font-bold text-xl text-white mb-2">{section.title}</h4>
                    <p className="text-sm text-white/80 leading-relaxed">{section.content}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Our Promise */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20 text-center bg-[#FFF8E7] border border-[#FED800]/40 rounded-2xl px-8 py-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-[#5C4033] mb-4" style={{ fontFamily: 'Georgia, serif' }}>Our Promise to You</h2>
          <div className="w-16 h-1 bg-[#FED800] mx-auto mb-6 rounded-full"></div>
          <p className="text-[#8B6F47] text-lg leading-relaxed max-w-3xl mx-auto">
            Every box of Manimaran Palgova that leaves our kitchen carries the warmth of our family and the pride of our tradition. We promise that every sweet you receive is made fresh, with the same love and integrity we have held onto since the very beginning. Because to us, this isn't just a business — it's a lifelong dedication to sweetness.
          </p>
        </motion.div>
      </div>

      {/* Stats Strip */}
      <StatsStrip />
    </div>
  );
}