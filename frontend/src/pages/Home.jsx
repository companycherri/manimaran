import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Product } from "@/entities/Product";
import { Heritage } from "@/entities/Heritage";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Award, Bus, Shield } from "lucide-react";
import { motion } from "framer-motion";
import ProductCard from "../components/products/ProductCard";
import SignatureProductCard from "../components/home/SignatureProductCard";
import HeroSlider from "../components/home/HeroSlider";
import CategoryGrid from "../components/home/CategoryGrid";
import AboutPalkovaSection from "../components/home/AboutPalkovaSection";
import ReviewsSection from "../components/home/ReviewsSection";

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [heritageSection, setHeritageSection] = useState(null);
  const [whyData, setWhyData] = useState(null);
  const [playVideo, setPlayVideo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const products = await Product.filter({ featured: true }, "signature_display_order");
      // Only show active products to customers (missing status is treated as active)
      setFeaturedProducts(products.filter(p => p.status !== 'inactive').slice(0, 8));

      const heritageItems = await Heritage.filter({ active: true });
      if (heritageItems.length > 0) setHeritageSection(heritageItems[0]);

      const whyItems = await base44.entities.WhyChooseUs.list();
      if (whyItems.length > 0) setWhyData(whyItems[0]);
    } catch (error) {
      console.error("Error loading home page data:", error);
      setFeaturedProducts([]);
      setHeritageSection(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-[#FFF8E7] to-white">

      <HeroSlider />
      <CategoryGrid />

      {/* Featured Products */}
      <section className="bg-gradient-to-br from-[#FFFAF0] via-white to-[#FFF8E7] py-20">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
              <h2 className="text-3xl md:text-5xl font-bold text-[#5C4033] mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                Our Signature Sweets
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#FED800] to-transparent mx-auto mb-4"></div>
              <p className="text-[#8B6F47] text-lg">Handpicked bestsellers, loved by all.</p>
            </motion.div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-96 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {featuredProducts.map((product, index) => (
                <motion.div key={product.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <SignatureProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to={createPageUrl("Products")}>
              <Button size="lg" className="bg-[#5C4033] text-white hover:bg-[#8B6F47]">
                View All Sweets <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* HERITAGE SECTION */}
      {!loading && (
      <section className="bg-gradient-to-br from-[#8B6F47]/5 via-[#FED800]/5 to-[#8B6F47]/5 py-20 border-y border-[#FED800]/20">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-12 items-center">

          {/* LEFT SIDE */}
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }}>
            <div className="relative rounded-2xl shadow-2xl" style={{ width: '100%' }}>
              {playVideo ? (
                <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', background: '#000' }}>
                  <video
                    src={heritageSection?.video_url}
                    controls
                    autoPlay
                    className="w-full block"
                    style={{ display: 'block', width: '100%', height: 'auto' }}
                  />
                </div>
              ) : (
                <div style={{ aspectRatio: '4/3', position: 'relative' }}>
                  <img
                    src={heritageSection?.banner_image || heritageSection?.image_url}
                    alt="Manimaran Palkova"
                    className="w-full h-full rounded-2xl"
                    style={{
                      objectFit: 'cover',
                      objectPosition: 'center',
                      filter: 'brightness(0.72) contrast(1.08) saturate(1.1)',
                      transition: 'transform 0.6s ease',
                    }}
                  />

                  {/* Vignette overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.5) 100%)',
                    borderRadius: '16px',
                  }} />

                  {/* Bottom gradient */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
                    borderRadius: '0 0 16px 16px',
                  }} />

                  {/* PREMIUM PILL BUTTON */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: '14px',
                  }}>
                    <button
                      onClick={() => setPlayVideo(true)}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 26px 10px 10px',
                        borderRadius: '60px',
                        border: '1px solid rgba(255,255,255,0.35)',
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(12px)',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        transition: 'background 0.4s ease, border-color 0.4s ease, transform 0.3s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.95)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.querySelector('.pill-icon').style.background = '#3B1F0A';
                        e.currentTarget.querySelector('.pill-icon svg').style.color = '#ffffff';
                        e.currentTarget.querySelector('.pill-text').style.color = '#3B1F0A';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)';
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.querySelector('.pill-icon').style.background = 'rgba(255,255,255,0.9)';
                        e.currentTarget.querySelector('.pill-icon svg').style.color = '#3B1F0A';
                        e.currentTarget.querySelector('.pill-text').style.color = '#ffffff';
                      }}
                    >
                      {/* Circle icon */}
                      <span
                        className="pill-icon"
                        style={{
                          width: '40px', height: '40px',
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.9)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'background 0.4s ease',
                        }}
                      >
                        <svg
                          width="14" height="14" viewBox="0 0 24 24" fill="currentColor"
                          style={{ color: '#3B1F0A', marginLeft: '2px', transition: 'color 0.3s ease' }}
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>

                      {/* Label */}
                      <span
                        className="pill-text"
                        style={{
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: '700',
                          letterSpacing: '0.2em',
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                          transition: 'color 0.4s ease',
                        }}
                      >
                        Play Video
                      </span>
                    </button>
                  </div>

                  {/* Bottom brand line */}
                  <div style={{
                    position: 'absolute', bottom: '16px', left: '20px', right: '20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{
                      color: 'rgba(255,255,255,0.75)',
                      fontSize: '11px', fontWeight: '500',
                      letterSpacing: '0.06em',
                    }}>
                      Since 1985 · Authentic Sweets
                    </span>
                  </div>
                </div>
                )}
            </div>
          </motion.div>

          {/* RIGHT SIDE */}
          <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }}>
            <h2 className="text-4xl md:text-5xl font-bold text-[#5C4033] mb-6" style={{ fontFamily: 'Georgia, serif' }}>
              {heritageSection?.title || "Our Heritage of Taste"}
            </h2>
            <p className="text-lg text-[#8B6F47] mb-6 leading-relaxed">
              {heritageSection?.description || "Since 1985, Manimaran Palkova has been a cherished name for authentic sweets..."}
            </p>
            <Link to={createPageUrl("About")}>
              <Button variant="outline" className="border-2 border-[#5C4033] text-[#5C4033] hover:bg-[#5C4033] hover:text-white">
                Read Our Story <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
      )}

      {/* VIDEO POPUP */}
      {showVideo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="relative w-[90%] md:w-[700px]">
            <button
              onClick={() => setShowVideo(false)}
              className="absolute -top-10 right-0 text-white text-2xl"
            >
              ✕
            </button>
            <video
              src={heritageSection?.video_url}
              controls
              autoPlay
              className="w-full rounded-xl"
            />
          </div>
        </div>
      )}

      {/* WHY CHOOSE US */}
      {!loading && <section className="py-20 bg-white">
        <div className="max-w-screen-xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-[#5C4033] mb-3" style={{ fontFamily: 'Georgia, serif' }}>
              {whyData?.heading || "Why Manimaran Palkova?"}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#FED800] to-transparent mx-auto mb-4"></div>
            {whyData?.description && (
              <p className="text-[#8B6F47] text-lg max-w-2xl mx-auto">{whyData.description}</p>
            )}
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Award, title: whyData?.box1_title || "Premium Quality", text: whyData?.box1_text || "Made with the finest ingredients, our sweets uphold decades of quality tradition." },
              { icon: Bus, title: whyData?.box2_title || "Swift Delivery", text: whyData?.box2_text || "Fresh sweets delivered to your doorstep with care and speed." },
              { icon: Shield, title: whyData?.box3_title || "100% Authentic", text: whyData?.box3_text || "Original recipes passed down generations, never compromised." },
            ].map(({ icon: BoxIcon, title, text }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="text-center p-8 rounded-2xl border border-[#FED800]/40 bg-[#FFF8E7] hover:shadow-lg hover:border-[#FED800] transition-all"
              >
                <div className="w-16 h-16 bg-[#FED800]/30 rounded-full flex items-center justify-center mx-auto mb-5">
                  <BoxIcon className="text-[#5C4033]" size={30} />
                </div>
                <h3 className="text-xl font-bold text-[#5C4033] mb-3">{title}</h3>
                <p className="text-[#8B6F47] leading-relaxed">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>}

      <AboutPalkovaSection />

      <ReviewsSection />

    </div>
  );
}