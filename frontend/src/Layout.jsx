import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ShoppingCart, Home, Package, Gift, Info, Phone, Mail, MapPin, LayoutDashboard, X, Menu, User as UserIcon, BookOpen, Star, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CartItem } from "@/entities/CartItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Navigation } from "@/entities/Navigation";
import { SiteSettings } from "@/entities/SiteSettings";
import { Footer } from "@/entities/Footer";
import { Product } from "@/entities/Product";
import UserProfileDialog from "@/components/user/UserProfileDialog";
import Preloader from "@/components/Preloader";
import AnnouncementBar from "@/components/AnnouncementBar";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { base44 } from "@/api/base44Client";
import GheeFooterSection from "@/components/footer/GheeFooterSection";
import StickySocialNav from "@/components/StickySocialNav";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [cartCount, setCartCount] = React.useState(0);
  const [showAdminMenu, setShowAdminMenu] = React.useState(false);
  const [adminSidebarOpen, setAdminSidebarOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [navItems, setNavItems] = React.useState([]);
  const [siteSettings, setSiteSettings] = React.useState(null);
  const [footerData, setFooterData] = React.useState(null);
  const [currentUser, setCurrentUser] = React.useState(null);
  const [profileDialogOpen, setProfileDialogOpen] = React.useState(false);
  const [showPreloader, setShowPreloader] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [newsletterEmail, setNewsletterEmail] = React.useState("");
  const [subscribing, setSubscribing] = React.useState(false);

  // Initial preloader on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowPreloader(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Set favicon from settings
  React.useEffect(() => {
    loadFavicon();
  }, []);

  const loadFavicon = async () => {
    try {
      const settings = await SiteSettings.list();
      if (settings.length > 0 && settings[0].favicon) {
        const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/png';
        link.rel = 'icon';
        link.href = settings[0].favicon;
        document.getElementsByTagName('head')[0].appendChild(link);
      }
    } catch (error) {
      console.error("Error loading favicon:", error);
    }
  };

  // Show preloader when navigating to home
  React.useEffect(() => {
    if (location.pathname.includes('Home')) {

      setShowPreloader(true);
      const timer = setTimeout(() => {
        setShowPreloader(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  // Fetch cart count
  const fetchCartCount = async () => {
    try {
      const user = await base44.auth.me();
      if (user) {
        const items = await CartItem.filter({ created_by: user.email });
        setCartCount(items.length);
      } else {
        // Check local storage for guest cart
        const guestCart = JSON.parse(localStorage.getItem('base44_guest_cart') || '[]');
        setCartCount(guestCart.length);
      }
    } catch (error) {
      // Fallback to guest cart if auth check fails/user not found
      const guestCart = JSON.parse(localStorage.getItem('base44_guest_cart') || '[]');
      setCartCount(guestCart.length);
    }
  };

  React.useEffect(() => {
    fetchCartCount();

    // Listen for custom cart update events
    window.addEventListener('cart-updated', fetchCartCount);

    // Also listen for storage events (e.g. from other tabs)
    window.addEventListener('storage', fetchCartCount);

    return () => {
      window.removeEventListener('cart-updated', fetchCartCount);
      window.removeEventListener('storage', fetchCartCount);
    };
  }, [location.pathname]);

  React.useEffect(() => {
    checkIfAdmin();
    loadSiteData();
    checkUser();
  }, []);



  const checkUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (error) {
      setCurrentUser(null);
    }
  };

  const loadSiteData = async () => {
    try {
      // Load navigation items
      const nav = await Navigation.filter({ active: true }, "order");
      if (nav.length > 0) {
        setNavItems(nav);
      } else {
        // Default navigation if none exist
        setNavItems([

          { name: "Home", path: "Home", order: 1 },
          { name: "About Us", path: "About", order: 2 },
          { name: "Products", path: "Products", order: 3 },
          { name: "Contact Us", path: "Contact", order: 4 },



        ]);
      }

      // Load site settings
      const settings = await SiteSettings.list();
      if (settings.length > 0) {
        setSiteSettings(settings[0]);
      }

      // Load footer data
      const footer = await Footer.list();
      if (footer.length > 0) {
        setFooterData(footer[0]);
      }
    } catch (error) {
      console.error("Error loading site data:", error);
    }
  };

  const checkIfAdmin = async () => {
    try {
      const user = await base44.auth.me();
      if (user && user.role === 'admin') {
        setShowAdminMenu(true);
      } else {
        setShowAdminMenu(false);
      }
    } catch (error) {
      setShowAdminMenu(false);
    }
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = createPageUrl(`Products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleNewsletterSubscribe = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newsletterEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSubscribing(true);
    try {
      const existing = await base44.entities.NewsletterSubscription.filter({ email: newsletterEmail.toLowerCase() });
      
      if (existing.length > 0) {
        toast.info("You're already subscribed to our newsletter!");
        setNewsletterEmail("");
      } else {
        await base44.entities.NewsletterSubscription.create({
          email: newsletterEmail.toLowerCase(),
          subscribed_date: new Date().toISOString(),
          active: true
        });
        
        // Send notification emails
        try {
          await base44.functions.invoke('sendNewsletterSubscriptionEmail', {
            subscriberEmail: newsletterEmail.toLowerCase()
          });
        } catch (emailError) {
          console.error('Error sending emails:', emailError);
        }
        
        toast.success("Successfully subscribed! Check your email for confirmation.");
        setNewsletterEmail("");
      }
    } catch (error) {
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setSubscribing(false);
    }
  };

  const adminMenuItems = [
    { name: "Dashboard", path: "AdminDashboard", icon: LayoutDashboard },
    { name: "Products", path: "AdminProducts", icon: Package },
    { name: "Orders", path: "AdminOrders", icon: ShoppingCart },
    { name: "Categories", path: "AdminCategories", icon: Package },
    { name: "Banners", path: "AdminBanners", icon: Gift },
    { name: "Announcements", path: "AdminAnnouncements", icon: Menu },
    { name: "Signature Sweets", path: "AdminSignatureSweets", icon: Star },
    { name: "Reviews", path: "AdminReviews", icon: Star },
    { name: "Navbar Icons", path: "AdminNavbarIcons", icon: Menu },
    { name: "Header", path: "AdminHeader", icon: Menu },
    { name: "About Us", path: "AdminAbout", icon: Info },
    { name: "Palkova", path: "AdminPalkova", icon: Package },
    { name: "Heritage", path: "AdminHeritage", icon: Info },
    { name: "Pages", path: "AdminPages", icon: FileText },
    { name: "Coupons", path: "AdminCoupons", icon: Gift },
    { name: "Blogs", path: "AdminBlogs", icon: BookOpen },
    { name: "Footer", path: "AdminFooter", icon: Menu },
    { name: "Site Settings", path: "AdminSiteSettings", icon: Info },
    { name: "Configuration", path: "AdminConfiguration", icon: Info },
    { name: "Why Choose Us", path: "AdminWhyChooseUs", icon: Info },
  ];

  const isAdminPage = location.pathname.includes("Admin");

  return (
    <div className="min-h-screen bg-[#FFF8E7] font-['Poppins'] flex flex-col overflow-x-hidden">
      <Preloader isVisible={showPreloader} />

      {/* Announcement Bar */}
      {!isAdminPage && <AnnouncementBar />}

      {/* Admin Sidebar */}
      {showAdminMenu && isAdminPage && (
        <>
          {/* Mobile Overlay */}
          {adminSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setAdminSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div className={`fixed top-0 left-0 h-full w-64 bg-[#5C4033] text-white z-50 transform transition-transform duration-300 flex flex-col ${adminSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <div className="p-6 flex-shrink-0">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-[#FED800]">Admin Panel</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-white"
                  onClick={() => setAdminSidebarOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <nav className="space-y-2 px-6 pb-6 overflow-y-auto flex-1">
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === createPageUrl(item.path);
                return (
                  <Link
                    key={item.path}
                    to={createPageUrl(item.path)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                      ? "bg-[#FED800] text-[#5C4033] font-semibold"
                      : "text-white hover:bg-[#8B6F47]"
                      }`}
                    onClick={() => setAdminSidebarOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}

              <Link
                to={createPageUrl("Home")}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-[#8B6F47] mt-4 border-t border-[#8B6F47] pt-4"
              >
                <Home className="w-5 h-5" />
                Back to Website
              </Link>
            </nav>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className={`${showAdminMenu && isAdminPage ? 'lg:ml-64' : ''} overflow-x-hidden`}>

        {/* Mobile Menu Overlay */}
        {!isAdminPage && mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Menu */}
        {!isAdminPage && (
          <div className={`fixed top-0 right-0 h-full w-64 bg-white z-50 transform transition-transform duration-300 md:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-[#5C4033]">Menu</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const iconMap = {
                    'Home': Home,
                    'Contact Us': Phone,
                    'Contact': Phone
                  };
                  const Icon = iconMap[item.name];
                  const normalizedPath = location.pathname.replace(/^\//, '').split('?')[0];
                  const isActive = normalizedPath === item.path ||
                    (item.path === 'Home' && (location.pathname === '/' || normalizedPath === 'Home' || normalizedPath === ''));

                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.path)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all ${isActive
                        ? 'bg-[#FED800] text-[#5C4033]'
                        : 'text-[#5C4033] hover:bg-[#FED800]/20'
                        }`}
                    >
                      {item.name === 'Products' ? (
                        <img 
                          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e6146089ccb876f02ada79/ab0c6984d_fried-dough_4690176.png" 
                          alt="Products" 
                          className="w-5 h-5 object-contain"
                        />
                      ) : Icon ? (
                        <Icon className="w-5 h-5" />
                      ) : null}
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
          <div className={`w-full px-4 md:px-6 md:pl-16 py-4 flex items-center justify-between gap-4 md:gap-8 ${showAdminMenu && isAdminPage ? 'lg:pl-[272px]' : ''}`}>

            {/* Logo */}
            <Link to={createPageUrl(isAdminPage ? "AdminDashboard" : "Home")} className="flex items-center flex-shrink-0 header-logo">
              {siteSettings?.logo ? (
                <img src={siteSettings.logo} alt={siteSettings.site_name || "Logo"} className="h-12 md:h-16 object-contain" />
              ) : (
                <img src="https://i.imgur.com/vJc2Y2B.png" alt="Logo" className="h-12 md:h-16 object-contain" />
              )}
            </Link>

            {/* Desktop Navigation - Centered */}
            {!isAdminPage && (
              <nav className="hidden md:flex items-center gap-3 flex-1 justify-center">
                {navItems.map((item) => {
                  // Icon mapping for navigation items with sweets-themed icons
                  const iconMap = {
                    'Home': Home,
                    'Contact Us': Phone,
                    'Contact': Phone
                  };
                  const Icon = iconMap[item.name];
                  const normalizedPath = location.pathname.replace(/^\//, '').split('?')[0];
                  const isActive = normalizedPath === item.path ||
                    (item.path === 'Home' && (location.pathname === '/' || normalizedPath === 'Home' || normalizedPath === ''));

                  // Check if this is the Products link
                  const isProductsLink = item.name === 'Products' || item.path === 'Products';

                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.path)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all ${isActive
                        ? 'bg-[#FED800] text-[#5C4033] shadow-md'
                        : 'text-[#5C4033] hover:bg-[#FED800]/20 hover:text-[#5C4033]'
                        }`}
                    >
                      {Icon ? (
                        <Icon className="w-6 h-6" />
                      ) : null}
                      <span className="text-base">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Mobile Menu Button */}
            {!isAdminPage && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-[#5C4033]"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="w-6 h-6" />
              </Button>
            )}

            <div className="hidden md:flex items-center gap-3">
              {showAdminMenu && !isAdminPage && (
                <Link to={createPageUrl("AdminDashboard")} className="text-[#5C4033] hover:text-[#8B6F47] text-sm font-semibold transition-colors">
                  Admin Panel
                </Link>
              )}
              {showAdminMenu && isAdminPage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden text-[#5C4033]"
                  onClick={() => setAdminSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </Button>
              )}

              {/* Call Us Now Section */}
              {!isAdminPage && siteSettings?.phone && (
                <a
                  href={`tel:${siteSettings.phone}`}
                  className="hidden lg:flex items-center gap-2 px-3 py-2 text-[#5C4033] hover:text-[#FED800] transition-colors border-r border-gray-200 pr-4"
                >
                  <Phone className="w-5 h-5" />
                  <div className="flex flex-col">
                    <span className="text-xs text-[#8B6F47]">Call Us Now</span>
                    <span className="font-semibold text-sm">{siteSettings.phone}</span>
                  </div>
                </a>
              )}

              {!isAdminPage && (
                <>
                  <Link
                    to={createPageUrl("Cart")}
                    className={`relative flex items-center gap-2 px-3 md:px-4 py-2 rounded-full transition-all font-semibold shadow-sm ${cartCount > 0 ? 'bg-[#FED800] text-[#5C4033] hover:bg-[#FFA500]' : 'bg-transparent text-[#5C4033] hover:bg-[#FED800]/20 border border-[#5C4033]/20'}`}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span className="hidden lg:inline">Cart</span>
                    {cartCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-red-600 text-white h-5 w-5 md:h-6 md:w-6 flex items-center justify-center p-0 rounded-full text-xs">
                        {cartCount}
                      </Badge>
                    )}
                  </Link>
                  {currentUser ? (
                    <>
                      <Link
                        to={createPageUrl("MyOrders")}
                        className={`hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all ${location.pathname.includes('MyOrders') ? 'bg-[#FED800] text-[#5C4033] shadow-md' : 'text-[#5C4033] hover:bg-[#FED800]/20 hover:text-[#5C4033]'}`}
                      >
                        <Package className="w-5 h-5" />
                        My Orders
                      </Link>
                      <Button
                        onClick={() => setProfileDialogOpen(true)}
                        className="hidden lg:flex bg-[#5C4033] text-white hover:bg-[#8B6F47] rounded-full"
                      >
                        <UserIcon className="w-4 h-4 mr-2" />
                        {currentUser.full_name || "Profile"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleLogin}
                      className="hidden lg:flex bg-[#5C4033] text-white hover:bg-[#8B6F47] rounded-full"
                    >
                      <UserIcon className="w-4 h-4 mr-2" />
                      Login
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-[72px] md:pt-[88px]">
          {children}
        </main>

        {/* User Profile Dialog */}
        {currentUser && (
          <UserProfileDialog
            open={profileDialogOpen}
            onClose={() => setProfileDialogOpen(false)}
            user={currentUser}
            onUpdate={checkUser}
          />
        )}

        {/* Sticky Social Nav - Only show on non-admin pages */}
        {!isAdminPage && <StickySocialNav />}

        {/* Floating WhatsApp Button - Only show on non-admin pages */}
        {!isAdminPage && <FloatingWhatsApp whatsappNumber={siteSettings?.whatsapp_number} />}

        {/* Footer - Only show on non-admin pages */}
        {!isAdminPage && (
          <footer className="bg-[#5C4033] text-[#FFF8E7] pt-16 pb-8">
            <div className="max-w-screen-xl mx-auto px-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                <div className="footer-logo">
                  {siteSettings?.logo ? (
                    <img src={siteSettings.logo} alt={siteSettings.site_name || "Logo"} className="h-20 w-20 object-contain mb-4" />
                  ) : (
                    <img src="https://i.imgur.com/vJc2Y2B.png" alt="Logo" className="h-20 w-20 mb-4" />
                  )}
                  <p className="text-sm leading-relaxed">
                    {footerData?.about_text || siteSettings?.footer_text || "Carrying forward a rich legacy of authentic Indian sweets since 1985. Taste the tradition, feel the love."}
                  </p>
                  <div className="flex items-center gap-4 mt-4">
                    {siteSettings?.social_facebook && (
                      <a href={siteSettings.social_facebook} target="_blank" rel="noopener noreferrer" className="text-[#FED800] hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </a>
                    )}
                    {siteSettings?.social_instagram && (
                      <a href={siteSettings.social_instagram} target="_blank" rel="noopener noreferrer" className="text-[#FED800] hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </a>
                    )}
                    {siteSettings?.social_youtube && (
                      <a href={siteSettings.social_youtube} target="_blank" rel="noopener noreferrer" className="text-[#FED800] hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </a>
                    )}
                    {siteSettings?.social_twitter && (
                      <a href={siteSettings.social_twitter} target="_blank" rel="noopener noreferrer" className="text-[#FED800] hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-lg md:text-xl font-bold text-[#FED800] mb-5 tracking-wide">
                    Quick Links
                  </h4>

                  <ul className="space-y-3 text-sm md:text-base max-w-[240px]">


                    {footerData?.quick_links && footerData.quick_links.length > 0 ? (
                      footerData.quick_links.map((link, index) => (
                        <li key={index}>
                          {link.url.startsWith('http') ? (
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-[#FED800]">{link.label}</a>
                          ) : (
                            <Link to={createPageUrl(link.url)} className="hover:text-[#FED800]">{link.label}</Link>
                          )}
                        </li>
                      ))
                    ) : (
                      <>
                        <li><Link to={createPageUrl("Home")} className="hover:text-[#FED800]">Home</Link></li>
                        <li><Link to={createPageUrl("About")} className="hover:text-[#FED800]">About Us</Link></li>
                        <li><Link to={createPageUrl("Products")} className="hover:text-[#FED800]">Products</Link></li>
                        <li><Link to={createPageUrl("Contact")} className="hover:text-[#FED800]">Contact</Link></li>
                        <li><Link to={createPageUrl("TermsOfService")} className="hover:text-[#FED800]">Terms of Service</Link></li>
                        <li><Link to={createPageUrl("PrivacyPolicy")} className="hover:text-[#FED800]">Privacy Policy</Link></li>
                      </>
                    )}
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg md:text-xl font-bold text-[#FED800] mb-5 tracking-wide">
                    Contact Info
                  </h4>

                  <ul className="space-y-3 text-xs md:text-sm max-w-[280px]">

                    <li className="flex items-start gap-2">
                      <MapPin size={16} className="mt-1 flex-shrink-0" />
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(footerData?.contact_address || siteSettings?.address || "123, Heritage Street, Pondicherry - 605001")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#FED800] transition-colors"
                      >
                        {footerData?.contact_address || siteSettings?.address || "123, Heritage Street, Pondicherry - 605001"}
                      </a>
                    </li>
                    <li className="flex items-start gap-2">
                      <Phone size={16} className="mt-1 flex-shrink-0" />
                      <a
                        href={`tel:${footerData?.contact_phone || siteSettings?.phone || "+91 98765 43210"}`}
                        className="hover:text-[#FED800] transition-colors"
                      >
                        {footerData?.contact_phone || siteSettings?.phone || "+91 98765 43210"}
                      </a>
                    </li>
                    <li className="flex items-start gap-2">
                      <Mail size={16} className="mt-1 flex-shrink-0" />
                      <a
                        href={`mailto:${footerData?.contact_email || siteSettings?.email || "orders@manimaranpalkova.com"}`}
                        className="hover:text-[#FED800] transition-colors"
                      >
                        {footerData?.contact_email || siteSettings?.email || "orders@manimaranpalkova.com"}
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg md:text-xl font-bold text-[#FED800] mb-5 tracking-wide">
                    Newsletter
                  </h4>

                  <p className="text-sm md:text-base mb-4 text-[#FFF8E7]/90 leading-relaxed">


                    {footerData?.newsletter_text || "Get updates on new arrivals and special offers."}
                  </p>
                  <form onSubmit={handleNewsletterSubscribe} className="flex">
                    <Input
                      type="email"
                      placeholder="Your Email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      disabled={subscribing}
                      className="bg-[#8B6F47] border-0 rounded-r-none 
                  text-white placeholder:text-gray-300
                  text-sm md:text-base px-4"
                    />

                    <Button 
                      type="submit"
                      disabled={subscribing}
                      className="bg-[#FED800] text-[#5C4033] rounded-l-none hover:bg-[#FFA500]"
                    >
                      {subscribing ? "..." : "Subscribe"}
                    </Button>
                  </form>
                </div>
              </div>

              {/* Featured Ghee Product Section */}
              <GheeFooterSection />

              <div className="mt-8 pt-8 border-t border-[#FED800]/20 text-center text-sm">
                <p>{footerData?.copyright_text || `© ${new Date().getFullYear()} ${siteSettings?.site_name || "Manimaran Palkova"}. All Rights Reserved.`}</p>
              </div>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}