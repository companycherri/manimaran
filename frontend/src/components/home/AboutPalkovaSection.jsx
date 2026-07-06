import React, { useState, useEffect } from "react";
import { Palkova } from "@/entities/Palkova";
import { motion } from "framer-motion";

export default function AboutPalkovaSection() {
  const [palkovaData, setPalkovaData] = useState(null);

  useEffect(() => {
    loadPalkovaData();
  }, []);

  const loadPalkovaData = async () => {
    try {
      const items = await Palkova.filter({ active: true });
      if (items.length > 0) {
        setPalkovaData(items[0]);
      }
    } catch (error) {
      console.error("Error loading Palkova section:", error);
    }
  };

  if (!palkovaData) return null;

  return (
  <section className="bg-[#FFF8E7] py-16">
      <div className="max-w-screen-xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h2
            className="text-4xl md:text-5xl font-bold mb-6 text-[#5C4033]"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {palkovaData.title}
          </h2>

          {palkovaData.subtitle && (
            <p className="text-4xl md:text-5xl font-bold mb-6" >
              {palkovaData.subtitle}
            </p>
          )}

          <p className="" 
          >
            {palkovaData.description}
          </p>

          {palkovaData.image_url && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8"
            >
              <img
                src={palkovaData.image_url}
                alt={palkovaData.title}
                className="rounded-2xl shadow-xl mx-auto max-w-3xl w-full object-cover"
              />
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}