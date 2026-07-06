# Project Analysis

Analysis date: 2026-07-06

## 1. Frontend Framework and Folder Structure

The frontend is a Vite React 18 single page application in `frontend/`.

Detected framework and libraries:

- React 18 with `react-router-dom` for routing.
- Vite 6 with `@vitejs/plugin-react`.
- Base44 SDK and Vite plugin for generated entity/function integrations.
- Tailwind CSS with Radix UI-style local components under `src/components/ui`.
- TanStack React Query is configured globally, though most data fetching is direct Base44 SDK usage.
- Framer Motion for animations.
- Recharts for admin dashboard charts.
- Razorpay checkout script loaded dynamically in checkout.
- Stripe packages are installed but not used in the active checkout flow.

Important folders:

- `frontend/src/pages`: customer pages and admin pages.
- `frontend/src/components`: shared UI, layout widgets, product cards, cart cards, homepage sections, footer sections.
- `frontend/src/components/ui`: reusable component primitives.
- `frontend/src/api`: Base44 client setup.
- `frontend/src/lib`: auth context, query client, navigation tracking, app params, not-found page.
- `frontend/src/utils`: page URL helper.
- `frontend/base44/entities`: Base44 entity schemas.
- `frontend/base44/functions`: Base44 serverless functions for Razorpay and email workflows.
- `database_exports`: CSV exports for Base44 entities.
- `backend`: Laravel 12 skeleton application.

## 2. Pages and Routes

Routes are generated from `frontend/src/pages.config.js` and mounted in `frontend/src/App.jsx`.

Main customer routes:

- `/` -> `Home`
- `/Home`
- `/About`
- `/Products`
- `/ProductDetail?id={product_id}`
- `/Cart`
- `/Checkout`
- `/MyOrders`
- `/Orders`
- `/TrackOrder`
- `/Contact`
- `/PrivacyPolicy`
- `/TermsOfService`

Admin routes:

- `/AdminDashboard`
- `/AdminProducts`
- `/AdminOrders`
- `/AdminCategories`
- `/AdminBanners`
- `/AdminAnnouncements`
- `/AdminSignatureSweets`
- `/AdminReviews`
- `/AdminNavbarIcons`
- `/AdminHeader`
- `/AdminAbout`
- `/AdminPalkova`
- `/AdminHeritage`
- `/AdminPages`
- `/AdminCoupons`
- `/AdminBlogs`
- `/AdminFooter`
- `/AdminSiteSettings`
- `/AdminConfiguration`
- `/AdminSettings`
- `/AdminWhyChooseUs`

Routing notes:

- The application uses a `Layout` wrapper for all generated pages.
- `createPageUrl(pageName)` simply returns `/{pageName}` after replacing spaces with hyphens.
- Admin page protection is handled inside each admin page by checking Base44 user role.
- There is no centralized route guard for all admin routes, although `ProtectedRoute.jsx` exists.
- The backend has only `GET /` returning Laravel's welcome view. No Laravel API routes are implemented.

## 3. Components

Major layout/shared components:

- `Layout.jsx`: fixed header, admin sidebar, nav menu, cart count, newsletter subscription, footer, social/WhatsApp widgets.
- `AnnouncementBar`: loads active announcements.
- `FloatingWhatsApp`: floating WhatsApp contact button.
- `StickySocialNav`: active social/navbar icons.
- `Preloader`: site preloader.
- `UserProfileDialog`: profile edit/logout dialog.
- `UserNotRegisteredError`: app access error.
- `NavigationTracker`: Base44 navigation helper.

Product and cart components:

- `products/ProductCard`: product listing card linking to detail page.
- `products/CategoryFilter`: category filter component, apparently not used by `Products.jsx`.
- `cart/CartItemCard`: reusable cart item card, though `Cart.jsx` currently renders cart rows inline.
- `cart/CartSummary`: reusable summary, though `Cart.jsx` has inline summary markup.

Homepage components:

- `home/HeroSlider`
- `home/CategoryGrid`
- `home/SignatureProductCard`
- `home/ReviewsSection`
- `home/AboutPalkovaSection`
- `about/StatsStrip`
- `footer/GheeFooterSection`

UI primitives:

- Many local Radix/Tailwind components exist under `components/ui`: dialog, button, input, select, table, card, toast, tabs, sidebar, sheet, dropdown, etc.

## 4. Authentication Flow

Current authentication depends on Base44:

- `AuthContext.jsx` reads app params such as `app_id`, `access_token`, `functions_version`, and `app_base_url`.
- It checks Base44 public app settings through `/api/apps/public/prod/public-settings/by-id/{appId}`.
- If a Base44 access token is present, it calls `base44.auth.me()`.
- Login redirects use `base44.auth.redirectToLogin()`.
- Logout uses `base44.auth.logout()`.
- Admin access checks are page-local and rely on `user.role === 'admin'`.
- Profile updates use `base44.auth.updateMe(formData)`.

Important migration notes:

- The future Laravel backend should replace Base44 auth with Laravel Sanctum or session auth.
- Admin authorization should move to Laravel policies/gates/middleware.
- User profile fields needed beyond Laravel defaults: phone, address, city, pincode, role.
- Guest cart currently lives in localStorage and is merged after login during checkout.

## 5. Products Flow

Customer product list:

- `Products.jsx` loads all products using `Product.list("display_order")`.
- Products with `status === 'inactive'` are hidden.
- Search filters name and description.
- URL query params support `search` and `category`.
- Products page banner comes from `SiteSettings.products_banner`.

Product detail:

- `ProductDetail.jsx` loads a product by `Product.filter({ id })`.
- Inactive products show an unavailable state.
- Supports kg-based products with 250g, 500g, and 1kg pricing.
- Supports ml-based products with 200ml, 500ml, and 1000ml pricing.
- Adds selected variant, quantity, price, and product snapshot data to cart.
- Guests use localStorage key `base44_guest_cart`.
- Authenticated users create `CartItem` records.
- WhatsApp order link uses `SiteSettings.whatsapp_number`.

Admin products:

- `AdminProducts.jsx` supports create, update, delete, image upload, stock status, product status, category, display order, featured flags, footer feature flag, ingredients, and keywords.
- File uploads use Base44 `UploadFile`.

Product issues to address:

- Product variants are embedded as columns on `products`; a normalized `product_variants` table is recommended.
- Cart allows duplicate authenticated cart rows for the same product/variant instead of merging.
- Stock is only boolean, with no inventory quantity or reservation.
- Price is trusted from cart snapshots during checkout; Laravel should recalculate totals server-side from current product/variant data.

## 6. Cart Flow

Guest cart:

- Stored in browser localStorage under `base44_guest_cart`.
- Items include temporary `guest_*` IDs.
- Quantity update and removal happen locally.
- Header cart count reads localStorage when the user is not authenticated.

Authenticated cart:

- Stored as Base44 `CartItem` records.
- Items are filtered by `created_by: user.email`.
- Quantity updates call `CartItem.update`.
- Removal calls `CartItem.delete`.
- Checkout requires login; unauthenticated users are redirected to login.

Cart migration requirements:

- Use a `cart_items` table tied to `user_id` for authenticated users.
- Keep optional guest cart in localStorage or create server-side anonymous carts by token.
- Merge guest cart after login.
- Enforce product availability and pricing server-side.
- Add uniqueness on `user_id + product_id + variant_id` if duplicate rows should be merged.

## 7. Checkout Flow

Current checkout process:

1. `Checkout.jsx` requires `base44.auth.me()`.
2. Any guest cart items are copied into Base44 `CartItem` records and localStorage is cleared.
3. Checkout loads authenticated cart items.
4. Customer name, phone, and delivery address are prefilled from the Base44 user.
5. On submit, it verifies cart products are not inactive.
6. It generates the next order number client-side by reading the latest order and incrementing `ORD-000001`.
7. It invokes `createRazorpayOrder`.
8. Razorpay checkout modal is opened.
9. Razorpay handler invokes `verifyRazorpayPayment`.
10. If verified, the frontend creates the `Order` record.
11. It invokes `sendOrderConfirmation`.
12. It deletes cart items one by one.
13. It navigates to `MyOrders`.

Checkout concerns:

- Order number generation is client-side and race-prone.
- Order creation is client-side after payment verification; this can create inconsistent payment/order states.
- Cart totals are calculated client-side and sent to Razorpay.
- There is no coupon application in checkout even though coupons exist.
- There are no shipping fee, tax, delivery zone, or minimum order calculations.
- Failed payment attempts are not persisted.
- Payment webhooks are configured in the schema but not implemented.

Recommended Laravel checkout flow:

1. Frontend submits address/contact/coupon to `POST /api/checkout`.
2. Laravel validates cart, product availability, prices, delivery rules, and coupon.
3. Laravel creates a pending order and order items inside a transaction.
4. Laravel creates a Razorpay order from the server.
5. Frontend opens Razorpay with server-created order ID.
6. Frontend sends callback to `POST /api/payments/razorpay/verify`.
7. Laravel verifies signature, marks payment/order completed or confirmed, clears cart, and dispatches invoice/admin emails.
8. Razorpay webhook independently reconciles payment state.

## 8. Payment Flow

Detected payment provider:

- Razorpay is the active provider.
- `Configuration` entity supports `razorpay`, `stripe`, `paypal`, or `none`, but only Razorpay functions are implemented.
- Stripe dependencies are installed but unused.

Base44 functions:

- `createRazorpayOrder`: requires authenticated user, validates amount, creates Razorpay order using environment variables `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`, returns order ID, amount, currency, and key ID.
- `verifyRazorpayPayment`: requires authenticated user, verifies `razorpay_order_id|razorpay_payment_id` HMAC using `RAZORPAY_KEY_SECRET`.
- `sendOrderConfirmation`: loads order, site settings, configuration, sends customer invoice and admin notification using Resend first and Base44 email fallback.
- `sendNewsletterSubscriptionEmail`: sends newsletter emails.
- `sendContactEmail`: sends contact form email.

Payment gaps:

- No Laravel payment API exists.
- No Razorpay webhook handler exists.
- No `payments` table exists.
- No persistent payment attempt log exists.
- No server-side idempotency protection is visible.
- No reconciliation job exists.
- The frontend creates orders only after verification, which can miss orders if the browser closes after payment.

## 9. Database Entities Detected

Detected Base44 entities:

- AboutStat
- Announcement
- Banner
- Blog
- CartItem
- Category
- Configuration
- Coupon
- Footer
- Heritage
- NavbarIcon
- Navigation
- NewsletterSubscription
- Order
- Page
- Palkova
- Product
- Review
- Settings
- SiteSettings
- User
- WhyChooseUs

Detected CSV exports and sizes:

- `AboutStat_export.csv`: 5 lines
- `Announcement_export.csv`: 2 lines
- `Banner_export.csv`: 5 lines
- `Blog_export.csv`: 0 lines
- `CartItem_export.csv`: 28 lines
- `Category_export.csv`: 7 lines
- `ClientUser_export.csv`: 0 lines
- `Configuration_export.csv`: 2 lines
- `Coupon_export.csv`: 2 lines
- `Footer_export.csv`: 3 lines
- `Heritage_export.csv`: 2 lines
- `NavbarIcon_export.csv`: 5 lines
- `Navigation_export.csv`: 0 lines
- `NewsletterSubscription_export.csv`: 4 lines
- `Order_export.csv`: 114 lines
- `Page_export.csv`: 3 lines
- `Palkova_export.csv`: 4 lines
- `Product_export.csv`: 14 lines
- `Review_export.csv`: 5 lines
- `Settings_export.csv`: 6 lines
- `SiteSettings_export.csv`: 2 lines
- `WhyChooseUs_export.csv`: 3 lines

Important entity fields:

- Product: name, description, prices by weight/volume, category, display order, signature display order, image, promo video, in_stock, featured, featured_in_footer, ingredients, keywords, status.
- CartItem: product_id, product_name, product_image, quantity, unit_price, unit, weight.
- Order: order_number, items JSON, total_amount, customer fields, delivery address, status, order_date, tracking_id, payment_id, razorpay_order_id, payment_status.
- Coupon: code, discount type/value, min order value, max discount, validity dates, usage limit, used count, active.
- Configuration: email and payment settings, admin email, payment keys.
- SiteSettings/Footer/Navigation/Page/Banner/etc.: content management records.

## 10. Missing Backend APIs

The Laravel backend is a fresh Laravel 12 skeleton. Current backend contents include:

- Default `users`, `password_reset_tokens`, `sessions`, `cache`, and `jobs` migrations.
- Default `User` model.
- Default `routes/web.php` with only `/`.
- No `routes/api.php` detected.
- No controllers for products, cart, checkout, payment, orders, CMS, uploads, contact, newsletter, or admin.
- No migrations for ecommerce/CMS tables.
- No seeders/importers for `database_exports`.
- No mail classes, notifications, queues, policies, resources, or form requests for the app domain.

Missing API groups:

- Auth: register/login/logout/me/profile update, admin login/role checks.
- Products: list, detail, admin CRUD, image upload, variant management.
- Categories: list and admin CRUD.
- Cart: list, add, update quantity, remove, merge guest cart, clear.
- Checkout: validate cart, calculate totals, apply coupon, create pending order.
- Orders: customer order list/detail, admin list/detail, admin status update, track by order number.
- Payments: create Razorpay order, verify Razorpay callback, Razorpay webhook, payment retry/status.
- Coupons: validate/apply coupon, admin CRUD.
- CMS: pages, banners, announcements, reviews, footer, site settings, navigation, navbar icons, about stats, Palkova, heritage, why choose us, blogs.
- Email/contact: contact form submission, newsletter subscription, order invoice/admin notifications.
- Uploads/media: secured upload endpoints for product and CMS images/videos.
- Dashboard: revenue, order status, top products, customer/product counts.
- Import/admin tools: CSV import from `database_exports`.

## 11. Recommended Laravel Architecture

Recommended stack:

- Laravel 12 API backend.
- Laravel Sanctum for SPA authentication.
- MySQL or PostgreSQL for production.
- Laravel queues for emails, webhooks, and import jobs.
- Laravel policies and middleware for admin authorization.
- Eloquent API Resources for response shaping.
- Form Request classes for validation.
- Service classes for payment, checkout, cart, coupon, upload, and order number generation.
- Mailables/Notifications for invoices, admin notifications, contact form, and newsletter subscription.

Recommended folders:

- `app/Models`
- `app/Http/Controllers/Api/Auth`
- `app/Http/Controllers/Api/Storefront`
- `app/Http/Controllers/Api/Admin`
- `app/Http/Requests`
- `app/Http/Resources`
- `app/Services/Cart`
- `app/Services/Checkout`
- `app/Services/Payments`
- `app/Services/Cms`
- `app/Services/Imports`
- `app/Policies`
- `app/Mail`
- `app/Notifications`
- `app/Jobs`
- `database/migrations`
- `database/seeders`

Recommended route groups:

- Public storefront:
  - `GET /api/products`
  - `GET /api/products/{product}`
  - `GET /api/categories`
  - `GET /api/cms/home`
  - `GET /api/pages/{page_key}`
  - `GET /api/site-settings`
  - `POST /api/contact`
  - `POST /api/newsletter-subscriptions`
  - `GET /api/orders/track/{order_number}`

- Authenticated customer:
  - `GET /api/me`
  - `PATCH /api/me`
  - `GET /api/cart`
  - `POST /api/cart/items`
  - `PATCH /api/cart/items/{item}`
  - `DELETE /api/cart/items/{item}`
  - `POST /api/cart/merge`
  - `POST /api/checkout`
  - `POST /api/payments/razorpay/verify`
  - `GET /api/orders`
  - `GET /api/orders/{order}`

- Payment webhooks:
  - `POST /api/webhooks/razorpay`

- Admin:
  - `GET /api/admin/dashboard`
  - `apiResource /api/admin/products`
  - `apiResource /api/admin/product-variants`
  - `apiResource /api/admin/categories`
  - `apiResource /api/admin/orders`
  - `PATCH /api/admin/orders/{order}/status`
  - `apiResource /api/admin/coupons`
  - `apiResource /api/admin/pages`
  - CMS resource routes for banners, announcements, reviews, footer, settings, navigation, blogs, etc.
  - `POST /api/admin/uploads`
  - `POST /api/admin/import/base44`

Security recommendations:

- Never expose payment secret keys through CMS records returned to the browser.
- Store secrets in `.env` or encrypted settings.
- Recalculate all monetary totals server-side.
- Verify every cart item belongs to the authenticated user.
- Restrict admin APIs with `auth:sanctum` and `can:admin`.
- Use signed/idempotent webhook processing.
- Use database transactions for checkout and payment state transitions.

## 12. Recommended Database Schema

Core users:

- `users`: id, name, email, password, role, phone, address, city, pincode, email_verified_at, timestamps.

Catalog:

- `categories`: id, name, slug, description, image_url, sort_order, active, timestamps.
- `products`: id, category_id, name, slug, description, image_url, promo_video_url, unit, status, in_stock, featured, featured_in_footer, show_category_badge, display_order, signature_display_order, ingredients, keywords, timestamps.
- `product_variants`: id, product_id, label, unit, quantity_value, quantity_unit, price, compare_at_price, sku, stock_quantity, active, sort_order, timestamps.

Cart:

- `cart_items`: id, user_id, product_id, product_variant_id, quantity, unit_price_snapshot, product_name_snapshot, product_image_snapshot, variant_label_snapshot, timestamps.

Orders:

- `orders`: id, user_id, order_number, customer_name, customer_email, customer_phone, delivery_address, subtotal, discount_total, shipping_total, tax_total, total_amount, coupon_id, coupon_code, status, payment_status, order_date, tracking_id, notes, timestamps.
- `order_items`: id, order_id, product_id, product_variant_id, product_name, product_image, variant_label, unit, weight, quantity, unit_price, line_total, timestamps.
- `order_status_histories`: id, order_id, old_status, new_status, changed_by_user_id, note, timestamps.

Payments:

- `payments`: id, order_id, provider, provider_order_id, provider_payment_id, provider_signature, amount, currency, status, raw_payload, verified_at, timestamps.
- `payment_events`: id, provider, event_id, event_type, payload, processed_at, timestamps.

Coupons:

- `coupons`: id, code, description, discount_type, discount_value, min_order_value, max_discount, valid_from, valid_until, usage_limit, used_count, active, timestamps.
- Optional `coupon_redemptions`: id, coupon_id, user_id, order_id, discount_amount, timestamps.

CMS/content:

- `site_settings`: id, site_name, tagline, logo, preloader_logo, favicon, banners, phone, whatsapp_number, email, address, footer_text, social links, reviews_heading, timestamps.
- `pages`: id, page_key, title, banner_image, content, content_heading, legacy fields, sections JSON, meta_description, active, timestamps.
- `banners`: id, title, subtitle, description, media_type, image_url, video_url, link_url, button_text, active, sort_order, timestamps.
- `announcements`: id, text, active, background_color, text_color, scroll_speed, sort_order, timestamps.
- `reviews`: id, customer_name, customer_image, review_text, rating, active, sort_order, timestamps.
- `navigation_items`: id, name, path, parent_id, active, sort_order, timestamps.
- `navbar_icons`: id, name, icon_type, url, color, active, sort_order, timestamps.
- `footers`: id, about_title, about_text, quick_links JSON, contact fields, newsletter fields, copyright_text, timestamps.
- `about_stats`: id, number, label, active, sort_order, timestamps.
- `heritage_sections`: id, title, description, image_url, banner_image, video_url, button_text, button_link, active, timestamps.
- `palkova_sections`: id, title, subtitle, description, image_url, button_text, button_link, active, timestamps.
- `why_choose_us`: id, heading, description, box1_title, box1_text, box2_title, box2_text, box3_title, box3_text, active, timestamps.
- `blogs`: id, title, slug, excerpt, content, featured_image, author, published, publish_date, tags, timestamps.

Configuration:

- `settings`: id, key, value, category, description, timestamps.
- `app_configurations`: id, admin_email, payment_gateway, payment_enabled, email_enabled, encrypted provider config, timestamps.

Newsletter/contact:

- `newsletter_subscriptions`: id, email, subscribed_at, active, timestamps.
- `contact_messages`: id, name, email, phone, subject, message, handled_at, timestamps.

Media:

- `media_assets`: id, disk, path, url, mime_type, size, uploaded_by_user_id, entity_type, entity_id, timestamps.

## 13. Complete Implementation Roadmap

Phase 1: Backend foundation

- Configure Laravel environment, database, mail, queues, and Sanctum.
- Add `routes/api.php` and SPA CORS/session settings.
- Extend `users` table with role and profile fields.
- Add auth endpoints and admin middleware.
- Add base API response/resource conventions.

Phase 2: Schema and import

- Create migrations for catalog, cart, orders, payments, coupons, CMS, settings, newsletter, contact, and media.
- Create Eloquent models and relationships.
- Build CSV import commands/seeders for `database_exports`.
- Normalize product pricing into `product_variants`.
- Import order item JSON into `order_items`.

Phase 3: Public storefront APIs

- Implement product/category listing and product detail.
- Implement site settings, homepage CMS, page content, banners, reviews, announcements, footer, and navigation APIs.
- Replace frontend Base44 reads on public pages with Laravel API calls.

Phase 4: Auth and profile migration

- Replace Base44 auth client with Laravel Sanctum calls.
- Implement login/logout/me/profile update.
- Add admin role protection to route groups and UI.
- Migrate `base44.auth.me()` calls to a shared frontend auth service.

Phase 5: Cart

- Implement authenticated cart APIs.
- Preserve guest cart in localStorage or introduce anonymous cart tokens.
- Add guest-to-user merge endpoint.
- Merge duplicate product/variant rows.
- Recalculate cart totals from server product/variant prices.

Phase 6: Checkout and orders

- Implement checkout service with transactions.
- Generate order numbers server-side with locking or a sequence table.
- Create pending orders before payment.
- Add order item snapshots.
- Implement customer order history and admin order management.
- Implement order tracking by order number.

Phase 7: Payments

- Implement Razorpay order creation server-side.
- Implement Razorpay payment verification.
- Implement Razorpay webhook processing and idempotency.
- Add `payments` and `payment_events` persistence.
- Move all payment secrets to `.env` or encrypted configuration.
- Add failed/cancelled payment state handling.

Phase 8: Emails and notifications

- Port order invoice and admin notification templates to Laravel Mailables.
- Port contact form and newsletter emails.
- Queue all outbound email.
- Add retry/failure logging.
- Keep email failure non-blocking after successful order creation.

Phase 9: Admin CMS and uploads

- Implement admin CRUD APIs for products, categories, coupons, orders, and CMS entities.
- Implement secure upload endpoint using Laravel filesystem.
- Replace Base44 upload calls in admin pages.
- Add dashboard summary API.

Phase 10: Frontend API migration

- Create a typed API client layer to replace direct Base44 entity calls.
- Migrate page by page: public content, products, cart, checkout, orders, admin.
- Remove Base44 Vite plugin and legacy imports after migration.
- Remove unused Stripe packages unless Stripe is intentionally added.

Phase 11: Testing

- Add feature tests for auth, products, cart, checkout, payment verification, webhooks, coupons, and admin authorization.
- Add import tests for CSV data.
- Add frontend smoke tests for product browsing, add-to-cart, checkout, and admin CRUD.
- Test payment failure, duplicate webhook, duplicate order number, inactive product, expired coupon, and empty cart cases.

Phase 12: Deployment

- Configure production database, queues, storage, mail, and Razorpay webhook URL.
- Run import from Base44 exports.
- Verify order/payment/email flows in Razorpay test mode.
- Enable monitoring/logging for payment webhooks and queued jobs.
- Perform final data freeze, import delta, DNS/app switch, and post-launch reconciliation.

