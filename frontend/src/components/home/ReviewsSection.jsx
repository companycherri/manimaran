import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [heading, setHeading] = useState("What Our Customers Say");

  useEffect(() => {
    loadReviews();
    loadSettings();
  }, []);

  const loadReviews = async () => {
    try {
      const data = await base44.entities.Review.filter({ active: true }, "order");
      setReviews(data);
    } catch (error) {
      console.error("Error loading reviews:", error);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await base44.entities.SiteSettings.list();
      if (settings.length > 0) {
        const savedHeading = settings[0].reviews_heading;
        if (savedHeading && savedHeading.trim() !== "") {
          setHeading(savedHeading);
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  if (reviews.length === 0) return null;

  // Duplicate reviews for seamless loop
  const duplicatedReviews = [...reviews, ...reviews, ...reviews];

  return (
    <section className="bg-gradient-to-br from-[#FFF8E7] to-white py-16 overflow-hidden">
      <div className="max-w-screen-xl mx-auto px-4 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-[#5C4033] mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            {heading}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#FED800] to-transparent mx-auto"></div>
        </motion.div>
      </div>

      <div className="relative">
        <div className="flex gap-6 animate-scroll-reviews">
          {duplicatedReviews.map((review, index) => (
            <div
              key={`${review.id}-${index}`}
              className="flex-shrink-0 w-[350px] md:w-[400px]"
            >
              <div className="bg-gradient-to-br from-[#FFF8E7] via-[#FFF0D4] to-[#FFE8C5] rounded-2xl p-6 shadow-lg border border-[#FED800]/20 h-full">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < review.rating ? 'fill-[#FED800] text-[#FED800]' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <p className="text-[#5C4033] text-base mb-6 leading-relaxed">
                  "{review.review_text}"
                </p>
                <div className="flex items-center gap-3 mt-auto">
                  {review.customer_image ? (
                    <img
                      src={review.customer_image}
                      alt={review.customer_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#FED800]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FED800] to-[#FFA500] flex items-center justify-center text-white font-bold text-lg">
                      {review.customer_name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-[#5C4033]">{review.customer_name}</p>
                    <p className="text-sm text-[#8B6F47]">Customer</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Gradient overlays for fade effect */}
        <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-[#FFF8E7]/60 to-transparent pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-white/60 to-transparent pointer-events-none"></div>
      </div>

      <style>{`
        @keyframes scroll-reviews {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        .animate-scroll-reviews {
          animation: scroll-reviews 45s linear infinite;
        }
        .animate-scroll-reviews:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}