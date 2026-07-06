import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Phone, Mail, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { sendContactEmail } from '@/functions/sendContactEmail';

export default function Contact() {
  const [pageData, setPageData] = useState(null);
  const [siteSettings, setSiteSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadPageData();
  }, []);

  const handleBulkEnquiry = () => {
    const whatsappNumber = siteSettings?.whatsapp_number || "919876543210";
    const message = encodeURIComponent("Hello! I'm interested in bulk orders and wedding hampers. Could you please share more details about your special pricing and customization options?");
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  const loadPageData = async () => {
    try {
      const pages = await base44.entities.Page.filter({ page_key: 'contact', active: true });
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
    title: "Contact Us",
    content: "Looking to Contact Us? Write to us & we'll get back to you soonly!.",
    sections: [
      { title: "Our Address", content: "123, Heritage Street, Pondicherry - 605001", icon: "MapPin" },
      { title: "Email Us", content: "orders@pondysweets.com", icon: "Mail" },
      { title: "Call Us", content: "+91 98765 43210", icon: "Phone" }
    ]
  };

  const displayData = pageData || defaultData;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const whatsappNumber = siteSettings?.whatsapp_number || "919363008450";
      await sendContactEmail({ ...formData, whatsapp_number: whatsappNumber });

      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitted(true);
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <div className="relative h-64 md:h-80 bg-gradient-to-r from-[#5C4033] to-[#8B6F47] flex items-center justify-center overflow-hidden">
        {(pageData?.banner_image || siteSettings?.contact_banner) && (
          <img 
            src={pageData?.banner_image || siteSettings?.contact_banner} 
            alt="Contact Banner" 
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
      
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="bg-[#FFF8E7] p-6 rounded-2xl shadow-lg h-full flex flex-col"
          >
            <h2 className="text-2xl font-bold text-[#5C4033] mb-2">Get In Touch</h2>
            <p className="text-[#8B6F47] mb-4 text-sm">{displayData.content}</p>
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-grow flex flex-col items-center justify-center text-center py-8"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#5C4033] mb-2">Message Sent!</h3>
                <p className="text-[#8B6F47] mb-6">Thank you for reaching out. We'll get back to you as soon as possible.</p>
                <Button onClick={() => setSubmitted(false)} className="bg-[#FED800] text-[#5C4033] hover:bg-[#FFA500]">
                  Send Another Message
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 flex-grow flex flex-col">
                <Input 
                  placeholder="Your Name" 
                  className="h-11"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input 
                  type="email" 
                  placeholder="Your Email" 
                  className="h-11"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Input 
                  placeholder="Subject" 
                  className="h-11"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
                <Textarea 
                  placeholder="Your Message" 
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  className="flex-grow"
                />
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full bg-[#FED800] text-[#5C4033] hover:bg-[#FFA500] mt-auto"
                  disabled={submitting}
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            )}
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="relative bg-gradient-to-br from-[#8B3A26] via-[#A0522D] to-[#6B2E1F] p-6 rounded-2xl shadow-2xl overflow-hidden h-full flex flex-col"
            style={{
              background: 'linear-gradient(135deg, #8B3A26 0%, #A0522D 50%, #6B2E1F 100%)',
              boxShadow: '0 10px 40px rgba(92, 64, 51, 0.3), inset 0 1px 0 rgba(255, 215, 0, 0.1)'
            }}
          >
            {/* Decorative Pattern Overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `radial-gradient(circle at 20px 20px, rgba(255, 215, 0, 0.3) 2px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
            
            <h2 className="relative text-2xl font-bold text-[#FED800] mb-4" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>Contact Information</h2>
            <div className="space-y-4 flex-grow">
              {siteSettings?.address && (
                <div className="relative flex gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-[#FED800]/20">
                  <div className="w-10 h-10 bg-[#FED800] rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                    <MapPin className="w-5 h-5 text-[#5C4033]"/>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#FED800] text-sm">Our Address</h4>
                    <p className="text-[#FFF8E7] text-sm">{siteSettings.address}</p>
                  </div>
                </div>
              )}
              {siteSettings?.email && (
                <div className="relative flex gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-[#FED800]/20">
                  <div className="w-10 h-10 bg-[#FED800] rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                    <Mail className="w-5 h-5 text-[#5C4033]"/>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#FED800] text-sm">Email</h4>
                    <a href={`mailto:${siteSettings.email}`} className="text-[#FFF8E7] hover:text-[#FED800] transition-colors text-sm break-all">
                      {siteSettings.email}
                    </a>
                  </div>
                </div>
              )}
              {siteSettings?.phone && (
                <div className="relative flex gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-[#FED800]/20">
                  <div className="w-10 h-10 bg-[#FED800] rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                    <Phone className="w-5 h-5 text-[#5C4033]"/>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#FED800] text-sm">Call</h4>
                    <a href={`tel:${siteSettings.phone}`} className="text-[#FFF8E7] hover:text-[#FED800] transition-colors text-sm">
                      {siteSettings.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative mt-6 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-[#FED800]/20">
              <h3 className="text-lg font-bold text-[#FED800] mb-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>Bulk & Wedding Orders</h3>
              <p className="text-[#FFF8E7] mb-3 text-sm">
                Make your special occasions sweeter with Manimaran Palgova. We offer special pricing and custom hampers for weddings, corporate events, and bulk orders.
              </p>
              <Button 
                onClick={handleBulkEnquiry}
                variant="outline" 
                className="border-2 border-[#FED800] text-[#FED800] hover:bg-[#FED800] hover:text-[#5C4033] text-sm h-9"
              >
                Enquire Now
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Google Map Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12"
        >
          <h2 className="text-2xl font-bold text-[#5C4033] mb-4 text-center">Find Us Here</h2>
          <div className="w-full h-[450px] rounded-2xl overflow-hidden shadow-xl">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3902.63129941912!2d79.5855859741048!3d11.999994335436538!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a535b73fbc10289%3A0x184d01fd9fe97021!2sManimaran%20Palgova%20Company!5e0!3m2!1sen!2sus!4v1767610796320!5m2!1sen!2sus"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="ManiMaran Palkova Location"
            ></iframe>
          </div>
        </motion.div>
      </div>
    </div>
  );
}