/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminAbout from './pages/AdminAbout';
import AdminAnnouncements from './pages/AdminAnnouncements';
import AdminBanners from './pages/AdminBanners';
import AdminBlogs from './pages/AdminBlogs';
import AdminCategories from './pages/AdminCategories';
import AdminConfiguration from './pages/AdminConfiguration';
import AdminCoupons from './pages/AdminCoupons';
import AdminDashboard from './pages/AdminDashboard';
import AdminFooter from './pages/AdminFooter';
import AdminHeader from './pages/AdminHeader';
import AdminHeritage from './pages/AdminHeritage';
import AdminNavbarIcons from './pages/AdminNavbarIcons';
import AdminOrders from './pages/AdminOrders';
import AdminPages from './pages/AdminPages';
import AdminPalkova from './pages/AdminPalkova';
import AdminProducts from './pages/AdminProducts';
import AdminReviews from './pages/AdminReviews';
import AdminSettings from './pages/AdminSettings';
import AdminSignatureSweets from './pages/AdminSignatureSweets';
import AdminSiteSettings from './pages/AdminSiteSettings';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Contact from './pages/Contact';
import Home from './pages/Home';
import MyOrders from './pages/MyOrders';
import Orders from './pages/Orders';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ProductDetail from './pages/ProductDetail';
import Products from './pages/Products';
import TermsOfService from './pages/TermsOfService';
import TrackOrder from './pages/TrackOrder';
import About from './pages/About';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminAbout": AdminAbout,
    "AdminAnnouncements": AdminAnnouncements,
    "AdminBanners": AdminBanners,
    "AdminBlogs": AdminBlogs,
    "AdminCategories": AdminCategories,
    "AdminConfiguration": AdminConfiguration,
    "AdminCoupons": AdminCoupons,
    "AdminDashboard": AdminDashboard,
    "AdminFooter": AdminFooter,
    "AdminHeader": AdminHeader,
    "AdminHeritage": AdminHeritage,
    "AdminNavbarIcons": AdminNavbarIcons,
    "AdminOrders": AdminOrders,
    "AdminPages": AdminPages,
    "AdminPalkova": AdminPalkova,
    "AdminProducts": AdminProducts,
    "AdminReviews": AdminReviews,
    "AdminSettings": AdminSettings,
    "AdminSignatureSweets": AdminSignatureSweets,
    "AdminSiteSettings": AdminSiteSettings,
    "Cart": Cart,
    "Checkout": Checkout,
    "Contact": Contact,
    "Home": Home,
    "MyOrders": MyOrders,
    "Orders": Orders,
    "PrivacyPolicy": PrivacyPolicy,
    "ProductDetail": ProductDetail,
    "Products": Products,
    "TermsOfService": TermsOfService,
    "TrackOrder": TrackOrder,
    "About": About,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};