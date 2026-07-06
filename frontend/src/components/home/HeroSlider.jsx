import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Banner } from '@/entities/Banner';

// Variants for animation when sliding between banners
const variants = {
  enter: (direction) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0
  })
};

export default function HeroSlider() {
  const [[page, direction], setPage] = useState([0, 0]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const activeBanners = await Banner.filter({ active: true }, "order");
      const videoBanners = activeBanners.filter(b => b.media_type === 'video' && b.video_url);

      if (videoBanners.length > 0) {
        setBanners(videoBanners);
      } else if (activeBanners.length > 0) {
        setBanners(activeBanners);
      } else {
        setBanners([
          {
            id: '1',
            title: "Christmas & New Year Special Sweets",
            subtitle: "Celebrate the season of joy",
            description: "Discover our festive collection of premium sweets, perfect for gifting this Christmas and New Year.",
            image_url: "https://images.unsplash.com/photo-1512909006721-3d6018887383?w=1200&q=80",
            link_url: "Products?category=hampers",
            button_text: "Explore Festive Collection"
          }
        ]);
      }
    } catch (error) {
      console.error("Error loading banners:", error);
    }
    setLoading(false);
  };

  const paginate = (newDirection) => {
    setPage([(page + newDirection + banners.length) % banners.length, newDirection]);
  };

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        paginate(1);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [page, banners.length]);

  if (loading || banners.length === 0) {
    return (
      <div className="relative h-[400px] md:h-[600px] w-full bg-gray-900 animate-pulse" />
    );
  }

  const slideIndex = page % banners.length;
  const currentBanner = banners[slideIndex];
  const isVideo = currentBanner.media_type === 'video' && currentBanner.video_url;

  return (
    <div className="relative h-[400px] md:h-[600px] w-full overflow-hidden bg-gray-900">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={page}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="absolute h-full w-full"
        >
          {isVideo ? (
            <video
              src={currentBanner.video_url}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={currentBanner.image_url}
              alt={currentBanner.title}
              className="w-full h-full object-cover"
            />
          )}
          {/* Dark overlay — matching the screenshot's warm dark tint */}
          <div className="absolute inset-0 bg-black/50" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex items-center z-10">
        <div className="max-w-screen-xl mx-auto px-4 w-full">
          <div className="max-w-2xl text-left text-white">

            {/* Main title — exactly as DevTools: Georgia serif, font-bold, text-2xl/4xl, off-white span */}
            <motion.h1
              key={slideIndex + '-title'}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: 'easeOut' }}
              className="text-2xl md:text-4xl font-bold mb-2 leading-tight text-left"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              <span
                className="text-[#FED800] transition-all duration-300 cursor-pointer"
                style={{ color: 'rgba(249,249,247,0.88)' }}
              >
                {currentBanner.title}
              </span>
            </motion.h1>

            {/* Subtitle — yellow bold serif, matching screenshot exactly */}
            {currentBanner.subtitle && (
              <motion.p
                key={slideIndex + '-subtitle'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.6, ease: 'easeOut' }}
                className="text-base md:text-2xl font-bold mb-4 text-left"
                style={{
                  fontFamily: 'Georgia, serif',
                  color: 'rgba(249,249,247,0.88)'
                }}
              >
                {currentBanner.subtitle}
              </motion.p>
            )}

            {/* Description — regular weight white text */}
            {currentBanner.description && (
              <motion.p
                key={slideIndex + '-desc'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.6, ease: 'easeOut' }}
                className="text-sm md:text-xl text-gray-100 mb-6 leading-relaxed text-left"
                style={{ fontFamily: 'inherit' }}
              >
                {currentBanner.description}
              </motion.p>
            )}

            {/* CTA Button — yellow pill with dark brown text, matching screenshot */}
            <Link to={createPageUrl(currentBanner.link_url || "Products")}>
              <Button
                size="lg"
                className="relative overflow-hidden group"
                style={{
                  backgroundColor: '#FED800',
                  color: '#5C4033',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: '14px',
                  padding: '12px 28px',
                  borderRadius: '999px',
                  border: 'none',
                  boxShadow: '0 8px 24px rgba(254,216,0,0.4)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(254,216,0,0.65)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(254,216,0,0.4)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {currentBanner.button_text || "Order Now"}
                  <span style={{ fontSize: '18px', transition: 'transform 0.3s' }}>→</span>
                </span>
              </Button>
            </Link>

          </div>
        </div>
      </div>

      {/* Prev / Next arrows */}
      {banners.length > 1 && (
        <>
          <div className="absolute top-1/2 -translate-y-1/2 left-4 z-20">
            <Button
              size="icon"
              variant="outline"
              className="rounded-full bg-white/20 hover:bg-white/40 border-0 text-white"
              onClick={() => paginate(-1)}
            >
              <ChevronLeft />
            </Button>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 right-4 z-20">
            <Button
              size="icon"
              variant="outline"
              className="rounded-full bg-white/20 hover:bg-white/40 border-0 text-white"
              onClick={() => paginate(1)}
            >
              <ChevronRight />
            </Button>
          </div>

          {/* Dot indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {banners.map((_, i) => (
              <div
                key={i}
                onClick={() => setPage([i, i > slideIndex ? 1 : -1])}
                style={{
                  height: '8px',
                  width: i === slideIndex ? '24px' : '8px',
                  borderRadius: '999px',
                  background: i === slideIndex ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}