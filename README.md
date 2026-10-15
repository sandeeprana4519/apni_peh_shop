# Apni Pehchaan - Affiliate Marketing Platform

Production-ready Affiliate Marketing storefront and Partner Management platform built with **Node.js, Express.js 5.x, React, Tailwind CSS**, and **Hostinger MySQL** with phpMyAdmin database management.

> **Design Attribution**: © 2026 Apni Pehchaan. All Rights Reserved. Design by **Happiiz Business Solutions**.

---

## 🚀 Key Features

### 1. Public Storefront (Homepage)
- **Top Announcement & Header**: Brand logo (metallic gold and onyx monogram), global search, category navigation, Partner Portal access, wishlist, and deals link.
- **Hero Promotional Banner Carousel**: Auto-scrolling carousel matching the reference layout with bold campaigns, custom podium art, and responsive touch gestures.
- **Horizontally Scrolling Categories**: Category images and icons with smooth snap scrolling on mobile and desktop navigation controls.
- **Horizontally Scrolling Approved Partners**: Verified influencer badges, sequential Partner IDs (e.g., `AP00001`), and quick product filtering.
- **Horizontally Scrolling Affiliate Platforms**: Amazon, Flipkart, Meesho, Myntra, and Ajio badges with brand colors.
- **Featured Products Carousel**: Hand-vetted items with ratings, MRP discounts, and direct "Buy Now" affiliate redirection.
- **Promotional Banners**: "Summer Sale Up to 50% OFF" and "Top Brands Best Deals".
- **Trending Products & Latest Arrivals Carousels**: Multiple specialized carousels with "View All" filters.
- **Comprehensive Product Catalog**: Combined multi-select filtering by category, platform, partner, and newest-first sorting with load more pagination.
- **Newsletter Subscription**: "Stay Updated" section for e-commerce deals.
- **Complete Footer**: Home, About Us, Contact Us, Privacy Policy, Terms & Conditions, Affiliate Disclosure, Disclaimer, Partner Login, Partner Registration, and social links (YouTube, Instagram, WhatsApp, Facebook, WhatsApp Channel).

### 2. Partner Management & Sequential IDs
- **Self-Service Registration**: Validates full name, email, mobile, password, optional profile image, and legal acceptance.
- **Sequential Partner IDs**: Automatically generated safely on the server in format `AP00001`, `AP00002`, `AP00003`, etc.
- **Two-Step Approval**: All new registrations start in `PENDING` status. Only approved accounts can access the Partner Dashboard.
- **Partner Dashboard**:
  - Live statistics: Total Submitted, Pending Review, Approved & Published, Rejected, and Outbound Clicks.
  - **Add New Product**: Name, category, platform, price, MRP, affiliate URL, and direct image upload from phone or computer with live preview.
  - **My Products**: Strict database-level isolation ensuring partners only see and manage their own submissions.
  - **Partner Settings**: Profile name, mobile number, avatar, and password change (requires current password). Partner ID is strictly read-only.

### 3. Click Analytics & Safe Redirection
- Outbound clicks route through `/api/click/:id` which logs the click, IP address, user agent, and timestamp into `product_clicks` and atomically increments `clicks_count`.
- Safe 302 redirection to official merchant checkout URLs.

### 4. Admin CRM & Customization
- Built-in moderation portal to approve/reject partners and products.
- Configurable settings for website name, tagline, logo, contact details, social links, and footer attribution.

---

## 🗄️ Database Architecture (Hostinger MySQL & phpMyAdmin)

The application uses **Hostinger MySQL** as its single, dedicated relational database via the `mysql2/promise` driver.

### Database Tables in `database.sql`:
1. `admins`: Administrator accounts with `username`, `email`, `password` (visible in phpMyAdmin), `password_hash` (bcrypt), and roles.
2. `partners`: Affiliate partners with `partner_id` (`AP00001`), `full_name`, `email`, `mobile_number`, `password` (visible in phpMyAdmin), `password_hash`, and approval status.
3. `categories`: Product categories with icons and display ordering.
4. `affiliate_platforms`: Amazon, Flipkart, Meesho, Myntra, etc.
5. `products`: Affiliate deals with foreign keys to categories, platforms, and partners, approval and publication statuses, price, and click counts.
6. `banners`: Hero carousels and promotional cards.
7. `website_settings`: Configurable key-value store for branding, social channels, and legal notices.
8. `product_clicks`: Detailed click analytics tracking.
9. `product_status_history`: Audit trail for approval and status changes.
10. `admin_activity_logs`: Administrative actions log.
11. `sessions`: Secure Express session persistence.

---

## 🛠️ Installation & Setup on Hostinger

### Step 1: Create MySQL Database on Hostinger
1. Log in to your **Hostinger hPanel**.
2. Navigate to **Databases** → **MySQL Databases**.
3. Create a new database (e.g., `u123456789_apni_pehchaan_db`) and user with a strong password.

### Step 2: Import Schema via phpMyAdmin
1. In Hostinger hPanel, click **Enter phpMyAdmin** next to your database.
2. Click the **Import** tab at the top.
3. Choose the `database.sql` file from this project and click **Go**.
4. All tables and seed data will be created with primary keys, indexes, and constraints.

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Hostinger database details:
```env
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="u123456789_affiliate_user"
DB_PASSWORD="YourSecureHostingerPassword"
DB_NAME="u123456789_apni_pehchaan_db"
SESSION_SECRET="your_random_long_session_secret_2026"
PORT="3000"
NODE_ENV="production"
```

### Step 4: Run the Application
```bash
npm install
npm run build
npm start
```
The server will start on port 3000, connecting directly to your Hostinger MySQL database.

---

## 🔐 Default Credentials (Showing in Database & phpMyAdmin)

- **Admin Account**:
  - Email: `admin@apnipehchaan.com` (or username `superadmin`)
  - Password: `admin123` (Visible in `admins.password` column in phpMyAdmin)
- **Demo Partner Account**:
  - Partner ID: `AP00001` (or email: `rohan.sharma@example.com`)
  - Password: `password123` (Visible in `partners.password` column in phpMyAdmin)

---

## 📁 Project Structure

```
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules (protecting .env and uploads)
├── database.sql              # Clean, importable Hostinger MySQL schema & seed data
├── index.html                # HTML entry point with typography
├── metadata.json             # AI Studio metadata
├── package.json              # Dependencies and build scripts
├── README.md                 # Documentation
├── server.ts                 # Full-stack Express server entry point
├── server/
│   ├── db.ts                 # Hostinger MySQL pool & operational engine
│   ├── middleware/
│   │   ├── auth.ts           # Session validation middleware
│   │   └── upload.ts         # Multer image upload configuration
│   ├── controllers/
│   │   ├── authController.ts # Partner registration, login, profile
│   │   ├── partnerController.ts # Dashboard, add product, my products
│   │   ├── adminController.ts   # Partner/product review, site settings
│   │   └── publicController.ts  # Storefront browsing, click redirection
│   └── routes/
│       └── api.ts            # Express API router
├── src/
│   ├── App.tsx               # Main application component
│   ├── main.tsx              # React DOM entry point
│   ├── index.css             # Tailwind CSS & typography utilities
│   ├── types.ts              # TypeScript data interfaces
│   └── components/
│       ├── BrandLogo.tsx     # AP luxury monogram logo
│       ├── Header.tsx        # Store header with search & partner auth
│       ├── BannerCarousel.tsx # Hero banner slider
│       ├── CategoryScroll.tsx # Horizontal category slider
│       ├── PartnerShowcase.tsx # Approved partners horizontal scroll
│       ├── PlatformScroll.tsx  # Affiliate platforms horizontal scroll
│       ├── ProductCard.tsx   # Product card with Buy Now & MRP discount
│       ├── ProductCarousel.tsx # Featured, Trending & Latest carousels
│       ├── ProductGrid.tsx   # Filterable catalog with search
│       ├── ProductDetailModal.tsx # Product details & Added By partner info
│       ├── PromoStrip.tsx    # Summer Sale & Top Brands cards
│       ├── Newsletter.tsx    # Email subscription
│       ├── Footer.tsx        # Footer with legal links & attribution
│       ├── PartnerAuthModal.tsx # Partner Login & Registration (AP00001)
│       ├── PartnerDashboard.tsx # Simple partner portal
│       ├── AdminCRMModal.tsx # Moderation & site customization
│       ├── LegalModal.tsx    # Legal pages & contact form
│       └── WishlistModal.tsx # Saved favorites drawer
└── uploads/                  # Uploaded product and profile images
```
