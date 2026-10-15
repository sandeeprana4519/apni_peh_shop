// server.ts
import express from "express";
import session from "express-session";
import path3 from "path";
import fs3 from "fs";
import { fileURLToPath } from "url";

// server/routes/api.ts
import { Router } from "express";

// server/db.ts
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
var mysqlPool = null;
var isConnectedToMySQL = false;
var connectionMessage = "Initializing database...";
var DB_HOST = process.env.DB_HOST || "";
var DB_USER = process.env.DB_USER || "";
var DB_PASSWORD = process.env.DB_PASSWORD || "";
var DB_NAME = process.env.DB_NAME || "";
var DB_PORT = parseInt(process.env.DB_PORT || "3306", 10);
if (DB_HOST && DB_USER && DB_NAME) {
  try {
    mysqlPool = mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: DB_PORT,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 1e4
    });
    mysqlPool.getConnection().then((conn) => {
      conn.release();
      isConnectedToMySQL = true;
      connectionMessage = `Connected to Hostinger MySQL (${DB_NAME} on ${DB_HOST})`;
      console.log(`[Database] Hostinger MySQL connection established successfully.`);
    }).catch((err) => {
      isConnectedToMySQL = false;
      connectionMessage = `Hostinger MySQL connection failed: ${err.message}. Operating in Local Fallback mode with complete seed data.`;
      console.warn(`[Database] Hostinger MySQL not reachable (${err.message}). Using local store engine.`);
    });
  } catch (err) {
    isConnectedToMySQL = false;
    connectionMessage = `MySQL initialization error: ${err.message}`;
  }
} else {
  connectionMessage = "Hostinger MySQL credentials not configured in .env. Operating in Local Fallback mode.";
}
async function hasAdminAccount() {
  if (isConnectedToMySQL && mysqlPool) {
    try {
      const [rows] = await mysqlPool.query("SELECT id FROM admins LIMIT 1");
      return rows && rows.length > 0;
    } catch {
      return memoryStore.admins.length > 0;
    }
  }
  return memoryStore.admins.length > 0;
}
async function logAdminActivity(adminId, action, targetType, targetId, details, ip) {
  const cleanIp = String(ip || "").slice(0, 45);
  if (isConnectedToMySQL && mysqlPool) {
    try {
      await mysqlPool.execute(
        "INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
        [adminId, action, targetType, targetId ? String(targetId) : null, details, cleanIp]
      );
      return;
    } catch (err) {
      console.error("Error logging admin activity to MySQL:", err);
    }
  }
  memoryStore.admin_activity_logs.unshift({
    id: memoryStore.admin_activity_logs.length + 1,
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId ? String(targetId) : null,
    details,
    ip_address: cleanIp,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  });
  saveStore();
}
async function logProductStatusChange(productId, prevStatus, newStatus, adminId, notes) {
  if (isConnectedToMySQL && mysqlPool) {
    try {
      await mysqlPool.execute(
        "INSERT INTO product_status_history (product_id, previous_status, new_status, changed_by_admin_id, notes, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
        [productId, prevStatus, newStatus, adminId, notes]
      );
      return;
    } catch (err) {
      console.error("Error logging product status change to MySQL:", err);
    }
  }
  memoryStore.product_status_history.unshift({
    id: memoryStore.product_status_history.length + 1,
    product_id: productId,
    previous_status: prevStatus,
    new_status: newStatus,
    changed_by_admin_id: adminId,
    notes,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  });
  saveStore();
}
function getDatabaseStatus() {
  return {
    connected: isConnectedToMySQL,
    type: isConnectedToMySQL ? "mysql" : "local_fallback",
    host: DB_HOST || "localhost",
    database: DB_NAME || "apni_pehchaan_db",
    message: connectionMessage
  };
}
var LOCAL_STORE_FILE = path.join(process.cwd(), "local_db_store.json");
var DEFAULT_HASH = bcrypt.hashSync("password123", 10);
var DEFAULT_ADMIN_HASH = bcrypt.hashSync("admin123", 10);
function createInitialData() {
  return {
    admins: [
      {
        id: 1,
        username: "superadmin",
        email: "admin@apnipehchaan.com",
        password_hash: DEFAULT_ADMIN_HASH,
        full_name: "Platform Administrator",
        role: "superadmin",
        is_active: 1,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      }
    ],
    partners: [
      {
        id: 1,
        partner_id: "AP00001",
        full_name: "Rohan Sharma",
        email: "rohan.sharma@example.com",
        mobile_number: "+91 98112 23344",
        password_hash: DEFAULT_HASH,
        profile_image: "/images/avatars/partner_1.png",
        status: "APPROVED",
        rejection_reason: null,
        created_at: "2026-09-01T10:00:00Z"
      },
      {
        id: 2,
        partner_id: "AP00002",
        full_name: "Priya Verma",
        email: "priya.verma@example.com",
        mobile_number: "+91 98223 34455",
        password_hash: DEFAULT_HASH,
        profile_image: "/images/avatars/partner_2.png",
        status: "APPROVED",
        rejection_reason: null,
        created_at: "2026-09-10T12:30:00Z"
      },
      {
        id: 3,
        partner_id: "AP00003",
        full_name: "Amit Patel",
        email: "amit.patel@example.com",
        mobile_number: "+91 98334 45566",
        password_hash: DEFAULT_HASH,
        profile_image: "/images/avatars/partner_3.png",
        status: "APPROVED",
        rejection_reason: null,
        created_at: "2026-09-18T15:45:00Z"
      },
      {
        id: 4,
        partner_id: "AP00004",
        full_name: "Sneha Kulkarni",
        email: "sneha.k@example.com",
        mobile_number: "+91 98445 56677",
        password_hash: DEFAULT_HASH,
        profile_image: null,
        status: "PENDING",
        rejection_reason: null,
        created_at: "2026-10-12T09:15:00Z"
      }
    ],
    categories: [
      { id: 1, name: "Electronics", slug: "electronics", icon_name: "Smartphone", display_order: 1, is_active: 1 },
      { id: 2, name: "Fashion", slug: "fashion", icon_name: "Shirt", display_order: 2, is_active: 1 },
      { id: 3, name: "Home & Living", slug: "home-living", icon_name: "Armchair", display_order: 3, is_active: 1 },
      { id: 4, name: "Beauty", slug: "beauty", icon_name: "Sparkles", display_order: 4, is_active: 1 },
      { id: 5, name: "Sports", slug: "sports", icon_name: "Dumbbell", display_order: 5, is_active: 1 },
      { id: 6, name: "Toys", slug: "toys", icon_name: "Smile", display_order: 6, is_active: 1 },
      { id: 7, name: "Footwear", slug: "footwear", icon_name: "Footprints", display_order: 7, is_active: 1 },
      { id: 8, name: "Deals", slug: "deals", icon_name: "Tag", display_order: 8, is_active: 1 }
    ],
    affiliate_platforms: [
      { id: 1, name: "Amazon", slug: "amazon", badge_color: "#FF9900", base_url: "https://www.amazon.in", is_active: 1, display_order: 1 },
      { id: 2, name: "Flipkart", slug: "flipkart", badge_color: "#2874F0", base_url: "https://www.flipkart.com", is_active: 1, display_order: 2 },
      { id: 3, name: "Meesho", slug: "meesho", badge_color: "#9B27B0", base_url: "https://www.meesho.com", is_active: 1, display_order: 3 },
      { id: 4, name: "Myntra", slug: "myntra", badge_color: "#FF3F6C", base_url: "https://www.myntra.com", is_active: 1, display_order: 4 },
      { id: 5, name: "Ajio", slug: "ajio", badge_color: "#2C4152", base_url: "https://www.ajio.com", is_active: 1, display_order: 5 }
    ],
    banners: [
      {
        id: 1,
        title: "Upgrade Your Everyday",
        subtitle: "Top brands. Great prices. Handpicked recommendations for you.",
        image_url: "/images/banners/hero_lifestyle.jpg",
        cta_text: "Shop Now",
        cta_link: "#featured",
        badge_text: "New Arrivals",
        banner_type: "HERO",
        display_order: 1,
        is_active: 1
      },
      {
        id: 2,
        title: "Festive Style & Identity",
        subtitle: "Discover trending apparel and modern accessories with guaranteed discounts.",
        image_url: "/images/banners/hero_fashion.jpg",
        cta_text: "Explore Fashion",
        cta_link: "#trending",
        badge_text: "Top Picks",
        banner_type: "HERO",
        display_order: 2,
        is_active: 1
      },
      {
        id: 3,
        title: "Summer Sale Up to 50% OFF",
        subtitle: "Seasonal collections curated directly by verified style partners.",
        image_url: "/images/banners/promo_summer.jpg",
        cta_text: "Shop Deals",
        cta_link: "#deals",
        badge_text: "Limited Time",
        banner_type: "PROMO_STRIP",
        display_order: 1,
        is_active: 1
      },
      {
        id: 4,
        title: "Top Brands Best Deals",
        subtitle: "Hand-vetted deals across Amazon, Flipkart, and Meesho.",
        image_url: "/images/banners/promo_brands.jpg",
        cta_text: "Shop Now",
        cta_link: "#featured",
        badge_text: "Editor Choice",
        banner_type: "PROMO_STRIP",
        display_order: 2,
        is_active: 1
      }
    ],
    products: [
      {
        id: 1,
        product_name: "Wireless Noise-Cancelling Headphones",
        slug: "wireless-noise-cancelling-headphones",
        image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
        description: "Immersive wireless over-ear headphones with custom acoustic drivers, 35hr playback, and deep bass.",
        category_id: 1,
        platform_id: 1,
        price: 2999,
        original_mrp: 4999,
        currency: "INR",
        rating: 4.8,
        reviews_count: 120,
        affiliate_url: "https://www.amazon.in/dp/B09XYZHEAD?tag=apnipehchaan-21",
        added_by_role: "PARTNER",
        partner_id: 1,
        approval_status: "APPROVED",
        publication_status: "PUBLISHED",
        is_featured: 1,
        is_trending: 1,
        display_priority: 10,
        views_count: 340,
        clicks_count: 84,
        created_at: "2026-09-15T11:00:00Z",
        published_at: "2026-09-15T12:00:00Z"
      },
      {
        id: 2,
        product_name: "Cloud-Foam Running Shoes (White)",
        slug: "cloud-foam-running-shoes-white",
        image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
        description: "Lightweight breathable sports running shoes with ergonomic cushioning and high traction rubber outsole.",
        category_id: 7,
        platform_id: 2,
        price: 1899,
        original_mrp: 2999,
        currency: "INR",
        rating: 4.6,
        reviews_count: 98,
        affiliate_url: "https://www.flipkart.com/running-shoes/p/itm123?affid=apnipehchaan",
        added_by_role: "PARTNER",
        partner_id: 2,
        approval_status: "APPROVED",
        publication_status: "PUBLISHED",
        is_featured: 1,
        is_trending: 1,
        display_priority: 9,
        views_count: 290,
        clicks_count: 62,
        created_at: "2026-09-20T14:00:00Z",
        published_at: "2026-09-20T15:00:00Z"
      },
      {
        id: 3,
        product_name: "AMOLED Smart Fitness Watch Pro",
        slug: "amoled-smart-fitness-watch-pro",
        image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
        description: "Always-on AMOLED display with heart rate monitoring, SpO2 sensor, sleep analysis, and Bluetooth calling.",
        category_id: 1,
        platform_id: 1,
        price: 3499,
        original_mrp: 5999,
        currency: "INR",
        rating: 4.7,
        reviews_count: 210,
        affiliate_url: "https://www.amazon.in/dp/B08SMARTWATCH?tag=apnipehchaan-21",
        added_by_role: "PARTNER",
        partner_id: 1,
        approval_status: "APPROVED",
        publication_status: "PUBLISHED",
        is_featured: 1,
        is_trending: 0,
        display_priority: 8,
        views_count: 420,
        clicks_count: 145,
        created_at: "2026-09-22T08:30:00Z",
        published_at: "2026-09-22T09:00:00Z"
      },
      {
        id: 4,
        product_name: "Urban Water-Resistant Travel Backpack",
        slug: "urban-water-resistant-travel-backpack",
        image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
        description: "Premium ballistic nylon laptop backpack with USB charging port, waterproof zippers, and anti-theft pocket.",
        category_id: 2,
        platform_id: 3,
        price: 1299,
        original_mrp: 2499,
        currency: "INR",
        rating: 4.5,
        reviews_count: 86,
        affiliate_url: "https://www.meesho.com/travel-backpack/p/456?ref=apnipehchaan",
        added_by_role: "PARTNER",
        partner_id: 3,
        approval_status: "APPROVED",
        publication_status: "PUBLISHED",
        is_featured: 1,
        is_trending: 0,
        display_priority: 7,
        views_count: 195,
        clicks_count: 51,
        created_at: "2026-09-28T16:00:00Z",
        published_at: "2026-09-28T16:30:00Z"
      },
      {
        id: 5,
        product_name: "Modern Velvet Accent Lounge Armchair",
        slug: "modern-velvet-accent-lounge-armchair",
        image_url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80",
        description: "Luxurious velvet armchair with high resilience foam and gold tapered metal legs for living rooms and bedrooms.",
        category_id: 3,
        platform_id: 2,
        price: 7999,
        original_mrp: 12999,
        currency: "INR",
        rating: 4.9,
        reviews_count: 44,
        affiliate_url: "https://www.flipkart.com/velvet-armchair/p/itm789?affid=apnipehchaan",
        added_by_role: "PARTNER",
        partner_id: 2,
        approval_status: "APPROVED",
        publication_status: "PUBLISHED",
        is_featured: 0,
        is_trending: 1,
        display_priority: 6,
        views_count: 180,
        clicks_count: 29,
        created_at: "2026-10-01T10:00:00Z",
        published_at: "2026-10-01T11:00:00Z"
      },
      {
        id: 6,
        product_name: "Organic Vitamin C Radiance Face Serum",
        slug: "organic-vitamin-c-radiance-face-serum",
        image_url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
        description: "Brightening vitamin C face serum formulated with hyaluronic acid and ferulic acid for radiant glowing skin.",
        category_id: 4,
        platform_id: 3,
        price: 599,
        original_mrp: 999,
        currency: "INR",
        rating: 4.8,
        reviews_count: 175,
        affiliate_url: "https://www.meesho.com/face-serum/p/789?ref=apnipehchaan",
        added_by_role: "PARTNER",
        partner_id: 3,
        approval_status: "APPROVED",
        publication_status: "PUBLISHED",
        is_featured: 0,
        is_trending: 1,
        display_priority: 5,
        views_count: 310,
        clicks_count: 93,
        created_at: "2026-10-03T14:30:00Z",
        published_at: "2026-10-03T15:00:00Z"
      },
      {
        id: 7,
        product_name: "Slim Fit Pure Combed Cotton Casual Shirt",
        slug: "slim-fit-pure-combed-cotton-casual-shirt",
        image_url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80",
        description: "Breathable combed cotton casual shirt with spread collar and curved hem. Suitable for formal and casual wear.",
        category_id: 2,
        platform_id: 4,
        price: 899,
        original_mrp: 1799,
        currency: "INR",
        rating: 4.4,
        reviews_count: 63,
        affiliate_url: "https://www.myntra.com/casual-shirt/p/shirt101?ref=apnipehchaan",
        added_by_role: "PARTNER",
        partner_id: 1,
        approval_status: "APPROVED",
        publication_status: "PUBLISHED",
        is_featured: 0,
        is_trending: 1,
        display_priority: 4,
        views_count: 140,
        clicks_count: 38,
        created_at: "2026-10-05T09:00:00Z",
        published_at: "2026-10-05T09:30:00Z"
      },
      {
        id: 8,
        product_name: "Anti-Slip Cast Iron Neoprene Dumbbells Pair",
        slug: "anti-slip-cast-iron-neoprene-dumbbells-pair",
        image_url: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&auto=format&fit=crop&q=80",
        description: "Hexagonal anti-roll cast iron dumbbells coated with comfortable non-slip neoprene for home workouts.",
        category_id: 5,
        platform_id: 1,
        price: 1499,
        original_mrp: 2499,
        currency: "INR",
        rating: 4.6,
        reviews_count: 52,
        affiliate_url: "https://www.amazon.in/dp/B07DUMBBELL?tag=apnipehchaan-21",
        added_by_role: "ADMIN",
        partner_id: null,
        approval_status: "APPROVED",
        publication_status: "PUBLISHED",
        is_featured: 0,
        is_trending: 0,
        display_priority: 3,
        views_count: 110,
        clicks_count: 19,
        created_at: "2026-10-06T12:00:00Z",
        published_at: "2026-10-06T12:30:00Z"
      }
    ],
    website_settings: {
      website_name: "Apni Pehchaan",
      site_title: "Apni Pehchaan - Your Style Your Identity",
      tagline: "Your Style Your Identity",
      logo_url: "/logo.svg",
      contact_email: "support@apnipehchaan.com",
      contact_phone: "+91 98765 43210",
      contact_address: "Level 4, Business Tower, Connaught Place, New Delhi, 110001, India",
      social_youtube: "https://youtube.com/@apnipehchaan",
      social_instagram: "https://instagram.com/apnipehchaan",
      social_whatsapp: "https://wa.me/919876543210",
      social_facebook: "https://facebook.com/apnipehchaan",
      social_whatsapp_channel: "https://whatsapp.com/channel/apnipehchaan",
      footer_attribution: "\xA9 2026 Apni Pehchaan. All Rights Reserved. Design by Happiiz Business Solutions.",
      affiliate_disclosure: "Apni Pehchaan is a participant in affiliate advertising programs including Amazon Associates, Flipkart Affiliate, and Meesho Influencer Program designed to provide a means for sites to earn referral fees by advertising and linking to merchant platforms at no extra cost to buyers."
    },
    product_clicks: [],
    product_status_history: [],
    admin_activity_logs: []
  };
}
var memoryStore = (() => {
  if (fs.existsSync(LOCAL_STORE_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(LOCAL_STORE_FILE, "utf-8"));
      return { ...createInitialData(), ...parsed };
    } catch {
      return createInitialData();
    }
  }
  return createInitialData();
})();
function saveStore() {
  try {
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(memoryStore, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist store:", err);
  }
}
async function generateNextPartnerId() {
  if (isConnectedToMySQL && mysqlPool) {
    const [rows] = await mysqlPool.query("SELECT partner_id FROM partners ORDER BY id DESC LIMIT 1");
    if (rows && rows.length > 0) {
      const lastId = rows[0].partner_id;
      const num = parseInt(lastId.replace("AP", ""), 10) || 0;
      return `AP${String(num + 1).padStart(5, "0")}`;
    }
    return "AP00001";
  }
  const partners = memoryStore.partners;
  let maxNum = 0;
  for (const p of partners) {
    const num = parseInt(p.partner_id.replace("AP", ""), 10);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  }
  return `AP${String(maxNum + 1).padStart(5, "0")}`;
}

// server/controllers/publicController.ts
async function getSettings(_req, res) {
  try {
    if (isConnectedToMySQL && mysqlPool) {
      const [rows] = await mysqlPool.query("SELECT setting_key, setting_value FROM website_settings");
      const settingsMap = {};
      for (const r of rows) {
        settingsMap[r.setting_key] = r.setting_value;
      }
      res.json({ success: true, settings: settingsMap });
      return;
    }
    res.json({ success: true, settings: memoryStore.website_settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function getCategories(_req, res) {
  try {
    if (isConnectedToMySQL && mysqlPool) {
      const [rows] = await mysqlPool.query("SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order ASC");
      res.json({ success: true, categories: rows });
      return;
    }
    const categories = memoryStore.categories.filter((c) => c.is_active).sort((a, b) => a.display_order - b.display_order);
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function getPlatforms(_req, res) {
  try {
    if (isConnectedToMySQL && mysqlPool) {
      const [rows] = await mysqlPool.query("SELECT * FROM affiliate_platforms WHERE is_active = 1 ORDER BY display_order ASC");
      res.json({ success: true, platforms: rows });
      return;
    }
    const platforms = memoryStore.affiliate_platforms.filter((p) => p.is_active).sort((a, b) => a.display_order - b.display_order);
    res.json({ success: true, platforms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function getBanners(_req, res) {
  try {
    if (isConnectedToMySQL && mysqlPool) {
      const [rows] = await mysqlPool.query("SELECT * FROM banners WHERE is_active = 1 ORDER BY display_order ASC");
      res.json({ success: true, banners: rows });
      return;
    }
    const banners = memoryStore.banners.filter((b) => b.is_active).sort((a, b) => a.display_order - b.display_order);
    res.json({ success: true, banners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function getApprovedPartners(_req, res) {
  try {
    if (isConnectedToMySQL && mysqlPool) {
      const [rows] = await mysqlPool.query(
        'SELECT id, partner_id, full_name, profile_image, created_at FROM partners WHERE status = "APPROVED" ORDER BY id ASC'
      );
      res.json({ success: true, partners: rows });
      return;
    }
    const partners = memoryStore.partners.filter((p) => p.status === "APPROVED").map(({ id, partner_id, full_name, profile_image, created_at }) => ({
      id,
      partner_id,
      full_name,
      profile_image,
      created_at
    }));
    res.json({ success: true, partners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function getPublicProducts(req, res) {
  try {
    const {
      search = "",
      category_id,
      platform_id,
      partner_id,
      collection,
      // 'featured', 'trending', 'latest'
      sort = "newest",
      // 'newest', 'price_asc', 'price_desc', 'rating_desc', 'popular'
      page = "1",
      limit = "12"
    } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const offset = (pageNum - 1) * limitNum;
    if (isConnectedToMySQL && mysqlPool) {
      let conditions = [
        'p.approval_status = "APPROVED"',
        'p.publication_status = "PUBLISHED"',
        "(c.is_active = 1 OR c.id IS NULL)",
        "(ap.is_active = 1 OR ap.id IS NULL)",
        '(pt.status = "APPROVED" OR p.added_by_role = "ADMIN")'
      ];
      const params = [];
      if (search) {
        conditions.push("(p.product_name LIKE ? OR c.name LIKE ? OR ap.name LIKE ?)");
        const s = `%${search}%`;
        params.push(s, s, s);
      }
      if (category_id) {
        conditions.push("p.category_id = ?");
        params.push(category_id);
      }
      if (platform_id) {
        conditions.push("p.platform_id = ?");
        params.push(platform_id);
      }
      if (partner_id) {
        conditions.push("p.partner_id = ?");
        params.push(partner_id);
      }
      if (collection === "featured") {
        conditions.push("p.is_featured = 1");
      } else if (collection === "trending") {
        conditions.push("(p.is_trending = 1 OR p.clicks_count > 0)");
      }
      let orderBy = "p.display_priority DESC, p.created_at DESC";
      if (sort === "price_asc") orderBy = "p.price ASC, p.display_priority DESC";
      else if (sort === "price_desc") orderBy = "p.price DESC, p.display_priority DESC";
      else if (sort === "rating_desc") orderBy = "p.rating DESC, p.display_priority DESC";
      else if (sort === "popular") orderBy = "p.clicks_count DESC, p.display_priority DESC";
      else if (collection === "trending") orderBy = "p.clicks_count DESC, p.display_priority DESC";
      else if (collection === "latest") orderBy = "COALESCE(p.published_at, p.created_at) DESC, p.display_priority DESC";
      const whereClause = conditions.join(" AND ");
      const countSql = `
        SELECT COUNT(*) as total 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        LEFT JOIN affiliate_platforms ap ON p.platform_id = ap.id 
        LEFT JOIN partners pt ON p.partner_id = pt.id
        WHERE ${whereClause}
      `;
      const [countRows] = await mysqlPool.execute(countSql, params);
      const total2 = countRows[0]?.total || 0;
      const dataSql = `
        SELECT 
          p.id, p.product_name, p.slug, p.image_url, p.description, 
          p.price, p.original_mrp, p.currency, p.rating, p.reviews_count, 
          p.affiliate_url, p.clicks_count, p.display_priority, p.is_featured, p.is_trending,
          p.added_by_role, p.created_at, p.published_at,
          c.id AS category_id, c.name AS category_name,
          ap.id AS platform_id, ap.name AS platform_name, ap.badge_color AS platform_badge_color,
          pt.id AS partner_id, pt.partner_id AS partner_code, pt.full_name AS partner_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN affiliate_platforms ap ON p.platform_id = ap.id
        LEFT JOIN partners pt ON p.partner_id = pt.id
        WHERE ${whereClause}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `;
      const [rows] = await mysqlPool.execute(dataSql, [...params, limitNum, offset]);
      res.json({
        success: true,
        products: rows,
        pagination: {
          total: total2,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total2 / limitNum)
        }
      });
      return;
    }
    let filtered = memoryStore.products.filter(
      (p) => {
        if (p.approval_status !== "APPROVED" || p.publication_status !== "PUBLISHED") return false;
        const cat = memoryStore.categories.find((c) => c.id === p.category_id);
        if (cat && !cat.is_active) return false;
        const plat = memoryStore.affiliate_platforms.find((pl) => pl.id === p.platform_id);
        if (plat && !plat.is_active) return false;
        if (p.added_by_role === "PARTNER" && p.partner_id) {
          const pt = memoryStore.partners.find((partner) => partner.id === p.partner_id);
          if (pt && pt.status !== "APPROVED") return false;
        }
        return true;
      }
    );
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((p) => {
        const cat = memoryStore.categories.find((c) => c.id === p.category_id);
        const plat = memoryStore.affiliate_platforms.find((pl) => pl.id === p.platform_id);
        return p.product_name.toLowerCase().includes(q) || cat && cat.name.toLowerCase().includes(q) || plat && plat.name.toLowerCase().includes(q);
      });
    }
    if (category_id) {
      filtered = filtered.filter((p) => p.category_id === Number(category_id));
    }
    if (platform_id) {
      filtered = filtered.filter((p) => p.platform_id === Number(platform_id));
    }
    if (partner_id) {
      filtered = filtered.filter((p) => p.partner_id === Number(partner_id));
    }
    if (collection === "featured") {
      filtered = filtered.filter((p) => p.is_featured);
    } else if (collection === "trending") {
      filtered = filtered.filter((p) => p.is_trending);
    }
    if (sort === "price_asc") {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sort === "price_desc") {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sort === "rating_desc") {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === "popular") {
      filtered.sort((a, b) => (b.clicks_count || 0) - (a.clicks_count || 0));
    } else {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limitNum).map((p) => {
      const category = memoryStore.categories.find((c) => c.id === p.category_id);
      const platform = memoryStore.affiliate_platforms.find((pl) => pl.id === p.platform_id);
      const partner = memoryStore.partners.find((pt) => pt.id === p.partner_id);
      return {
        ...p,
        category_name: category ? category.name : "General",
        platform_name: platform ? platform.name : "Store",
        platform_badge_color: platform ? platform.badge_color : "#2563EB",
        partner_name: partner ? partner.full_name : null,
        partner_code: partner ? partner.partner_id : null
      };
    });
    res.json({
      success: true,
      products: paginated,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function getProductDetails(req, res) {
  try {
    const productId = parseInt(req.params.id, 10);
    if (!productId) {
      res.status(400).json({ success: false, message: "Invalid product ID" });
      return;
    }
    if (isConnectedToMySQL && mysqlPool) {
      const sql = `
        SELECT 
          p.*,
          c.name AS category_name,
          ap.name AS platform_name, ap.badge_color AS platform_badge_color,
          pt.partner_id AS partner_code, pt.full_name AS partner_name, pt.profile_image AS partner_avatar
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN affiliate_platforms ap ON p.platform_id = ap.id
        LEFT JOIN partners pt ON p.partner_id = pt.id
        WHERE p.id = ? AND p.approval_status = 'APPROVED' AND p.publication_status = 'PUBLISHED'
        LIMIT 1
      `;
      const [rows] = await mysqlPool.execute(sql, [productId]);
      if (!rows || rows.length === 0) {
        res.status(404).json({ success: false, message: "Product not found or not published" });
        return;
      }
      res.json({ success: true, product: rows[0] });
      return;
    }
    const product = memoryStore.products.find(
      (p) => p.id === productId && p.approval_status === "APPROVED" && p.publication_status === "PUBLISHED"
    );
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found or not published" });
      return;
    }
    const category = memoryStore.categories.find((c) => c.id === product.category_id);
    const platform = memoryStore.affiliate_platforms.find((pl) => pl.id === product.platform_id);
    const partner = memoryStore.partners.find((pt) => pt.id === product.partner_id);
    res.json({
      success: true,
      product: {
        ...product,
        category_name: category ? category.name : "General",
        platform_name: platform ? platform.name : "Store",
        platform_badge_color: platform ? platform.badge_color : "#2563EB",
        partner_code: partner ? partner.partner_id : null,
        partner_name: partner ? partner.full_name : null,
        partner_avatar: partner ? partner.profile_image : null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function trackAndRedirectClick(req, res) {
  try {
    const productId = parseInt(req.params.id, 10);
    if (!productId) {
      res.status(400).send("Invalid product identifier.");
      return;
    }
    let targetUrl = "";
    let partnerId = null;
    let platformId = 1;
    if (isConnectedToMySQL && mysqlPool) {
      const [rows] = await mysqlPool.execute(
        'SELECT affiliate_url, partner_id, platform_id FROM products WHERE id = ? AND approval_status = "APPROVED" LIMIT 1',
        [productId]
      );
      if (!rows || rows.length === 0) {
        res.status(404).send("Product link not available or product is inactive.");
        return;
      }
      targetUrl = rows[0].affiliate_url;
      partnerId = rows[0].partner_id;
      platformId = rows[0].platform_id;
      await mysqlPool.execute("UPDATE products SET clicks_count = clicks_count + 1 WHERE id = ?", [productId]);
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
      const ua = req.headers["user-agent"] || "";
      const referrer = req.headers["referer"] || "";
      await mysqlPool.execute(
        "INSERT INTO product_clicks (product_id, partner_id, platform_id, affiliate_url, ip_address, user_agent, referrer) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [productId, partnerId, platformId, targetUrl, String(ip).slice(0, 45), String(ua).slice(0, 255), String(referrer).slice(0, 255)]
      );
    } else {
      const prod = memoryStore.products.find((p) => p.id === productId && p.approval_status === "APPROVED");
      if (!prod) {
        res.status(404).send("Product link not available or product is inactive.");
        return;
      }
      targetUrl = prod.affiliate_url;
      partnerId = prod.partner_id;
      platformId = prod.platform_id;
      prod.clicks_count = (prod.clicks_count || 0) + 1;
      memoryStore.product_clicks.push({
        id: memoryStore.product_clicks.length + 1,
        product_id: productId,
        partner_id: partnerId,
        platform_id: platformId,
        affiliate_url: targetUrl,
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
        referrer: req.headers["referer"],
        clicked_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      saveStore();
    }
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      res.status(400).send("Unsafe or invalid affiliate destination URL.");
      return;
    }
    res.redirect(302, targetUrl);
  } catch (err) {
    res.status(500).send(`Redirection error: ${err.message}`);
  }
}

// server/controllers/authController.ts
import bcrypt2 from "bcryptjs";
async function registerPartner(req, res) {
  try {
    const { full_name, email, mobile_number, password, confirm_password, terms_accepted, profile_image } = req.body;
    if (!full_name || typeof full_name !== "string" || full_name.trim().length < 2) {
      res.status(400).json({ success: false, message: "Full name is required (minimum 2 characters)." });
      return;
    }
    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400).json({ success: false, message: "A valid email address is required." });
      return;
    }
    if (!mobile_number || typeof mobile_number !== "string" || mobile_number.trim().length < 8) {
      res.status(400).json({ success: false, message: "A valid mobile contact number is required." });
      return;
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
      return;
    }
    if (password !== confirm_password) {
      res.status(400).json({ success: false, message: "Passwords do not match." });
      return;
    }
    if (!terms_accepted) {
      res.status(400).json({ success: false, message: "You must accept the Terms and Conditions and Privacy Policy." });
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile_number.trim();
    const cleanName = full_name.trim();
    if (isConnectedToMySQL && mysqlPool) {
      const [existing2] = await mysqlPool.execute("SELECT id FROM partners WHERE email = ? LIMIT 1", [cleanEmail]);
      if (existing2 && existing2.length > 0) {
        res.status(409).json({ success: false, message: "This email address is already registered." });
        return;
      }
      const partnerIdCode2 = await generateNextPartnerId();
      const salt2 = await bcrypt2.genSalt(10);
      const passwordHash2 = await bcrypt2.hash(password, salt2);
      const [result] = await mysqlPool.execute(
        `INSERT INTO partners (partner_id, full_name, email, mobile_number, password_hash, profile_image, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'PENDING', NOW())`,
        [partnerIdCode2, cleanName, cleanEmail, cleanMobile, passwordHash2, profile_image || null]
      );
      res.status(201).json({
        success: true,
        message: "Registration submitted successfully! Your account is pending admin approval.",
        partner: {
          id: result.insertId,
          partner_id: partnerIdCode2,
          full_name: cleanName,
          email: cleanEmail,
          status: "PENDING"
        }
      });
      return;
    }
    const existing = memoryStore.partners.find((p) => p.email.toLowerCase() === cleanEmail);
    if (existing) {
      res.status(409).json({ success: false, message: "This email address is already registered." });
      return;
    }
    const partnerIdCode = await generateNextPartnerId();
    const salt = await bcrypt2.genSalt(10);
    const passwordHash = await bcrypt2.hash(password, salt);
    const newPartner = {
      id: memoryStore.partners.length > 0 ? Math.max(...memoryStore.partners.map((p) => p.id)) + 1 : 1,
      partner_id: partnerIdCode,
      full_name: cleanName,
      email: cleanEmail,
      mobile_number: cleanMobile,
      password_hash: passwordHash,
      profile_image: profile_image || null,
      status: "PENDING",
      rejection_reason: null,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    memoryStore.partners.push(newPartner);
    saveStore();
    res.status(201).json({
      success: true,
      message: "Registration submitted successfully! Your account is pending admin review and approval.",
      partner: {
        id: newPartner.id,
        partner_id: newPartner.partner_id,
        full_name: newPartner.full_name,
        email: newPartner.email,
        status: "PENDING"
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function loginPartner(req, res) {
  try {
    const { login_identifier, password } = req.body;
    if (!login_identifier || !password) {
      res.status(400).json({ success: false, message: "Please provide your Partner ID or Email, and password." });
      return;
    }
    const identifier = String(login_identifier).trim();
    let partner = null;
    if (isConnectedToMySQL && mysqlPool) {
      const [rows] = await mysqlPool.execute(
        "SELECT * FROM partners WHERE partner_id = ? OR email = ? LIMIT 1",
        [identifier, identifier.toLowerCase()]
      );
      if (rows && rows.length > 0) {
        partner = rows[0];
      }
    } else {
      partner = memoryStore.partners.find(
        (p) => p.partner_id.toUpperCase() === identifier.toUpperCase() || p.email.toLowerCase() === identifier.toLowerCase()
      );
    }
    if (!partner) {
      res.status(401).json({ success: false, message: "Invalid Partner ID/Email or password." });
      return;
    }
    const isMatch = await bcrypt2.compare(password, partner.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: "Invalid Partner ID/Email or password." });
      return;
    }
    if (partner.status === "PENDING") {
      res.status(403).json({
        success: false,
        message: "Your partner account is currently PENDING approval from the administrator. You will be notified once activated."
      });
      return;
    }
    if (partner.status === "REJECTED") {
      res.status(403).json({
        success: false,
        message: `Your partner account application was rejected. ${partner.rejection_reason ? "Reason: " + partner.rejection_reason : "Please contact support."}`
      });
      return;
    }
    if (partner.status === "SUSPENDED") {
      res.status(403).json({
        success: false,
        message: "Your partner account has been suspended. Please contact support."
      });
      return;
    }
    if (partner.status !== "APPROVED") {
      res.status(403).json({ success: false, message: "Account is not authorized for dashboard access." });
      return;
    }
    req.session.partnerId = partner.id;
    req.session.partnerCode = partner.partner_id;
    req.session.partnerEmail = partner.email;
    req.session.partnerName = partner.full_name;
    res.json({
      success: true,
      message: "Login successful. Welcome back!",
      partner: {
        id: partner.id,
        partner_id: partner.partner_id,
        full_name: partner.full_name,
        email: partner.email,
        mobile_number: partner.mobile_number,
        profile_image: partner.profile_image,
        status: partner.status
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function getPartnerSession(req, res) {
  try {
    if (!req.session || !req.session.partnerId) {
      res.json({ authenticated: false, partner: null });
      return;
    }
    let partner = null;
    if (isConnectedToMySQL && mysqlPool) {
      const [rows] = await mysqlPool.execute(
        "SELECT id, partner_id, full_name, email, mobile_number, profile_image, status, created_at FROM partners WHERE id = ? LIMIT 1",
        [req.session.partnerId]
      );
      if (rows && rows.length > 0) partner = rows[0];
    } else {
      partner = memoryStore.partners.find((p) => p.id === req.session.partnerId);
    }
    if (!partner || partner.status !== "APPROVED") {
      req.session.destroy(() => {
      });
      res.json({ authenticated: false, partner: null });
      return;
    }
    res.json({
      authenticated: true,
      partner: {
        id: partner.id,
        partner_id: partner.partner_id,
        full_name: partner.full_name,
        email: partner.email,
        mobile_number: partner.mobile_number,
        profile_image: partner.profile_image,
        status: partner.status,
        created_at: partner.created_at
      }
    });
  } catch (err) {
    res.status(500).json({ authenticated: false, message: err.message });
  }
}
async function updatePartnerProfile(req, res) {
  try {
    const partnerId = req.session.partnerId;
    if (!partnerId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }
    const { full_name, mobile_number, profile_image, current_password, new_password } = req.body;
    if (!full_name || full_name.trim().length < 2) {
      res.status(400).json({ success: false, message: "Full name is required." });
      return;
    }
    if (!mobile_number || mobile_number.trim().length < 8) {
      res.status(400).json({ success: false, message: "Valid mobile number is required." });
      return;
    }
    let existing = null;
    if (isConnectedToMySQL && mysqlPool) {
      const [rows] = await mysqlPool.execute("SELECT * FROM partners WHERE id = ? LIMIT 1", [partnerId]);
      if (rows && rows.length > 0) existing = rows[0];
    } else {
      existing = memoryStore.partners.find((p) => p.id === partnerId);
    }
    if (!existing) {
      res.status(404).json({ success: false, message: "Partner record not found." });
      return;
    }
    let newHash = null;
    if (new_password) {
      if (!current_password) {
        res.status(400).json({ success: false, message: "Current password is required to set a new password." });
        return;
      }
      const match = await bcrypt2.compare(current_password, existing.password_hash);
      if (!match) {
        res.status(400).json({ success: false, message: "Current password is incorrect." });
        return;
      }
      if (new_password.length < 6) {
        res.status(400).json({ success: false, message: "New password must be at least 6 characters long." });
        return;
      }
      const salt = await bcrypt2.genSalt(10);
      newHash = await bcrypt2.hash(new_password, salt);
    }
    if (isConnectedToMySQL && mysqlPool) {
      if (newHash) {
        await mysqlPool.execute(
          "UPDATE partners SET full_name = ?, mobile_number = ?, profile_image = ?, password_hash = ? WHERE id = ?",
          [full_name.trim(), mobile_number.trim(), profile_image || existing.profile_image, newHash, partnerId]
        );
      } else {
        await mysqlPool.execute(
          "UPDATE partners SET full_name = ?, mobile_number = ?, profile_image = ? WHERE id = ?",
          [full_name.trim(), mobile_number.trim(), profile_image || existing.profile_image, partnerId]
        );
      }
    } else {
      existing.full_name = full_name.trim();
      existing.mobile_number = mobile_number.trim();
      if (profile_image) existing.profile_image = profile_image;
      if (newHash) existing.password_hash = newHash;
      saveStore();
    }
    req.session.partnerName = full_name.trim();
    res.json({
      success: true,
      message: "Profile settings updated successfully.",
      partner: {
        id: partnerId,
        partner_id: existing.partner_id,
        full_name: full_name.trim(),
        email: existing.email,
        mobile_number: mobile_number.trim(),
        profile_image: profile_image || existing.profile_image,
        status: existing.status
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
function logoutPartner(req, res) {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ success: false, message: "Could not log out. Please try again." });
      return;
    }
    res.clearCookie("connect.sid");
    res.json({ success: true, message: "Logged out successfully." });
  });
}
async function loginAdmin(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, message: "Username and password required." });
      return;
    }
    let admin = null;
    if (isConnectedToMySQL && mysqlPool) {
      const [rows] = await mysqlPool.execute(
        "SELECT * FROM admins WHERE username = ? OR email = ? LIMIT 1",
        [username, username]
      );
      if (rows && rows.length > 0) admin = rows[0];
    } else {
      admin = memoryStore.admins.find((a) => a.username === username || a.email === username);
    }
    if (!admin) {
      res.status(401).json({ success: false, message: "Invalid admin credentials." });
      return;
    }
    const match = await bcrypt2.compare(password, admin.password_hash);
    if (!match) {
      res.status(401).json({ success: false, message: "Invalid admin credentials." });
      return;
    }
    req.session.adminId = admin.id;
    req.session.adminUsername = admin.username;
    req.session.adminRole = admin.role;
    res.json({
      success: true,
      message: "Admin authentication granted.",
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        full_name: admin.full_name
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
function getAdminSession(req, res) {
  if (req.session && req.session.adminId) {
    res.json({
      authenticated: true,
      admin: {
        id: req.session.adminId,
        username: req.session.adminUsername,
        role: req.session.adminRole
      }
    });
  } else {
    res.json({ authenticated: false });
  }
}
function logoutAdmin(req, res) {
  req.session.adminId = void 0;
  req.session.adminUsername = void 0;
  req.session.adminRole = void 0;
  res.json({ success: true, message: "Admin logged out." });
}

// server/controllers/partnerController.ts
async function getPartnerStats(req, res) {
  try {
    const partnerId = req.session.partnerId;
    if (!partnerId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    if (isConnectedToMySQL && mysqlPool) {
      const [rows] = await mysqlPool.execute(
        `SELECT 
          COUNT(*) as total_products,
          SUM(CASE WHEN approval_status = 'PENDING' THEN 1 ELSE 0 END) as pending_products,
          SUM(CASE WHEN approval_status = 'APPROVED' AND publication_status = 'PUBLISHED' THEN 1 ELSE 0 END) as approved_products,
          SUM(CASE WHEN approval_status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_products,
          COALESCE(SUM(clicks_count), 0) as total_clicks
         FROM products
         WHERE partner_id = ?`,
        [partnerId]
      );
      const stats2 = rows[0] || {
        total_products: 0,
        pending_products: 0,
        approved_products: 0,
        rejected_products: 0,
        total_clicks: 0
      };
      res.json({ success: true, stats: stats2 });
      return;
    }
    const partnerProducts = memoryStore.products.filter((p) => p.partner_id === partnerId);
    const stats = {
      total_products: partnerProducts.length,
      pending_products: partnerProducts.filter((p) => p.approval_status === "PENDING").length,
      approved_products: partnerProducts.filter(
        (p) => p.approval_status === "APPROVED" && p.publication_status === "PUBLISHED"
      ).length,
      rejected_products: partnerProducts.filter((p) => p.approval_status === "REJECTED").length,
      total_clicks: partnerProducts.reduce((sum, p) => sum + (p.clicks_count || 0), 0)
    };
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function getPartnerProducts(req, res) {
  try {
    const partnerId = req.session.partnerId;
    if (!partnerId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    if (isConnectedToMySQL && mysqlPool) {
      const sql = `
        SELECT 
          p.id, p.product_name, p.slug, p.image_url, p.description,
          p.price, p.original_mrp, p.currency, p.affiliate_url,
          p.approval_status, p.publication_status, p.rejection_reason,
          p.clicks_count, p.created_at, p.published_at,
          c.id AS category_id, c.name AS category_name,
          ap.id AS platform_id, ap.name AS platform_name, ap.badge_color AS platform_badge_color
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN affiliate_platforms ap ON p.platform_id = ap.id
        WHERE p.partner_id = ?
        ORDER BY p.created_at DESC
      `;
      const [rows] = await mysqlPool.execute(sql, [partnerId]);
      res.json({ success: true, products: rows });
      return;
    }
    const ownProducts = memoryStore.products.filter((p) => p.partner_id === partnerId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((p) => {
      const category = memoryStore.categories.find((c) => c.id === p.category_id);
      const platform = memoryStore.affiliate_platforms.find((pl) => pl.id === p.platform_id);
      return {
        ...p,
        category_name: category ? category.name : "General",
        platform_name: platform ? platform.name : "Store",
        platform_badge_color: platform ? platform.badge_color : "#2563EB"
      };
    });
    res.json({ success: true, products: ownProducts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function addPartnerProduct(req, res) {
  try {
    const partnerId = req.session.partnerId;
    if (!partnerId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const {
      product_name,
      image_url,
      category_id,
      platform_id,
      price,
      original_mrp,
      affiliate_url,
      description
    } = req.body;
    if (!product_name || typeof product_name !== "string" || product_name.trim().length < 2) {
      res.status(400).json({ success: false, message: "Product name is required." });
      return;
    }
    if (!image_url || typeof image_url !== "string") {
      res.status(400).json({ success: false, message: "Product image is required." });
      return;
    }
    if (!category_id) {
      res.status(400).json({ success: false, message: "Please select a product category." });
      return;
    }
    if (!platform_id) {
      res.status(400).json({ success: false, message: "Please select an affiliate platform." });
      return;
    }
    if (!affiliate_url || typeof affiliate_url !== "string" || !affiliate_url.startsWith("http://") && !affiliate_url.startsWith("https://")) {
      res.status(400).json({ success: false, message: "A valid affiliate URL starting with http:// or https:// is required." });
      return;
    }
    const slug = product_name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") + "-" + Date.now().toString().slice(-4);
    const parsedPrice = price ? parseFloat(price) : null;
    const parsedMrp = original_mrp ? parseFloat(original_mrp) : null;
    if (isConnectedToMySQL && mysqlPool) {
      const sql = `
        INSERT INTO products (
          product_name, slug, image_url, description, category_id, platform_id,
          price, original_mrp, currency, affiliate_url, added_by_role, partner_id,
          approval_status, publication_status, is_featured, is_trending, clicks_count, created_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, 'INR', ?, 'PARTNER', ?,
          'PENDING', 'DRAFT', 0, 0, 0, NOW()
        )
      `;
      const [result] = await mysqlPool.execute(sql, [
        product_name.trim(),
        slug,
        image_url.trim(),
        description ? description.trim() : null,
        Number(category_id),
        Number(platform_id),
        parsedPrice,
        parsedMrp,
        affiliate_url.trim(),
        partnerId
      ]);
      res.status(201).json({
        success: true,
        message: "Product submitted successfully! It is now pending admin review before public listing.",
        productId: result.insertId
      });
      return;
    }
    const newProduct = {
      id: memoryStore.products.length > 0 ? Math.max(...memoryStore.products.map((p) => p.id)) + 1 : 1,
      product_name: product_name.trim(),
      slug,
      image_url: image_url.trim(),
      description: description ? description.trim() : "",
      category_id: Number(category_id),
      platform_id: Number(platform_id),
      price: parsedPrice,
      original_mrp: parsedMrp,
      currency: "INR",
      rating: 5,
      reviews_count: 0,
      affiliate_url: affiliate_url.trim(),
      added_by_role: "PARTNER",
      partner_id: partnerId,
      approval_status: "PENDING",
      publication_status: "DRAFT",
      rejection_reason: null,
      is_featured: 0,
      is_trending: 0,
      display_priority: 0,
      views_count: 0,
      clicks_count: 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      published_at: null
    };
    memoryStore.products.push(newProduct);
    saveStore();
    res.status(201).json({
      success: true,
      message: "Product submitted successfully! It is currently pending admin review before going live.",
      product: newProduct
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function deletePartnerProduct(req, res) {
  try {
    const partnerId = req.session.partnerId;
    const productId = parseInt(req.params.id, 10);
    if (!partnerId || !productId) {
      res.status(400).json({ success: false, message: "Invalid request" });
      return;
    }
    if (isConnectedToMySQL && mysqlPool) {
      const [result] = await mysqlPool.execute("DELETE FROM products WHERE id = ? AND partner_id = ?", [
        productId,
        partnerId
      ]);
      if (result.affectedRows === 0) {
        res.status(403).json({ success: false, message: "Product not found or not owned by you." });
        return;
      }
      res.json({ success: true, message: "Product deleted." });
      return;
    }
    const idx = memoryStore.products.findIndex((p) => p.id === productId && p.partner_id === partnerId);
    if (idx === -1) {
      res.status(403).json({ success: false, message: "Product not found or not owned by you." });
      return;
    }
    memoryStore.products.splice(idx, 1);
    saveStore();
    res.json({ success: true, message: "Product deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// server/controllers/adminController.ts
import bcrypt3 from "bcryptjs";

// server/middleware/security.ts
var rateLimitMap = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1e3);
function loginRateLimiter(windowMs = 15 * 60 * 1e3, maxAttempts = 6) {
  return (req, res, next) => {
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const key = `${clientIp}:${req.path}`;
    const now = Date.now();
    const record = rateLimitMap.get(key);
    if (!record || now > record.resetTime) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }
    if (record.count >= maxAttempts) {
      const waitMinutes = Math.ceil((record.resetTime - now) / 6e4);
      res.status(429).json({
        success: false,
        message: `Too many requests. For security reasons, this endpoint is temporarily locked. Please try again in ${waitMinutes} minute(s).`
      });
      return;
    }
    record.count += 1;
    next();
  };
}
function isValidAffiliateUrl(url) {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.") || hostname.startsWith("10.") || hostname.endsWith(".internal") || hostname.endsWith(".local")) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
function securityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
}

// server/controllers/adminController.ts
async function setupInitialAdmin(req, res) {
  try {
    const adminExists = await hasAdminAccount();
    if (adminExists) {
      res.status(403).json({
        success: false,
        message: "Admin setup has already been completed. This route is permanently disabled for security."
      });
      return;
    }
    const { username, email, full_name, password } = req.body;
    if (!username || !email || !password || password.length < 8) {
      res.status(400).json({
        success: false,
        message: "Username, valid email, and secure password (minimum 8 characters) are required."
      });
      return;
    }
    const salt = await bcrypt3.genSalt(10);
    const passwordHash = await bcrypt3.hash(password, salt);
    if (isConnectedToMySQL && mysqlPool) {
      const [result] = await mysqlPool.execute(
        `INSERT INTO admins (username, email, password_hash, full_name, role, is_active, created_at)
         VALUES (?, ?, ?, ?, 'superadmin', 1, NOW())`,
        [username.trim(), email.trim().toLowerCase(), passwordHash, full_name?.trim() || "Super Admin"]
      );
      await logAdminActivity(
        result.insertId,
        "INITIAL_ADMIN_SETUP",
        "ADMIN",
        result.insertId,
        `Initial superadmin account ${username} created`,
        req.ip || ""
      );
      res.status(201).json({
        success: true,
        message: "Initial administrator created successfully. Please log in through the Admin Login portal."
      });
      return;
    }
    const newAdmin = {
      id: 1,
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password_hash: passwordHash,
      full_name: full_name?.trim() || "Super Admin",
      role: "superadmin",
      is_active: 1,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    memoryStore.admins = [newAdmin];
    saveStore();
    await logAdminActivity(
      1,
      "INITIAL_ADMIN_SETUP",
      "ADMIN",
      1,
      `Initial superadmin account ${username} created`,
      req.ip || ""
    );
    res.status(201).json({
      success: true,
      message: "Initial administrator created successfully. Setup is now locked."
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function checkSetupStatus(_req, res) {
  try {
    const exists = await hasAdminAccount();
    res.json({ setupNeeded: !exists });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function getAdminOverview(_req, res) {
  try {
    if (isConnectedToMySQL && mysqlPool) {
      const [partnerStats] = await mysqlPool.query(`
        SELECT 
          COUNT(*) as total_partners,
          SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_partners,
          SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved_partners,
          SUM(CASE WHEN status = 'SUSPENDED' THEN 1 ELSE 0 END) as suspended_partners
        FROM partners
      `);
      const [productStats] = await mysqlPool.query(`
        SELECT 
          COUNT(*) as total_products,
          SUM(CASE WHEN approval_status = 'PENDING' THEN 1 ELSE 0 END) as pending_products,
          SUM(CASE WHEN approval_status = 'APPROVED' AND publication_status = 'PUBLISHED' THEN 1 ELSE 0 END) as published_products,
          SUM(CASE WHEN approval_status = 'REJECTED' OR publication_status = 'ARCHIVED' THEN 1 ELSE 0 END) as rejected_hidden_products,
          COALESCE(SUM(clicks_count), 0) as total_clicks
        FROM products
      `);
      const [counts] = await mysqlPool.query(`
        SELECT 
          (SELECT COUNT(*) FROM categories WHERE is_active = 1) as total_categories,
          (SELECT COUNT(*) FROM affiliate_platforms WHERE is_active = 1) as total_platforms
      `);
      res.json({
        success: true,
        stats: {
          total_partners: partnerStats[0]?.total_partners || 0,
          pending_partners: partnerStats[0]?.pending_partners || 0,
          approved_partners: partnerStats[0]?.approved_partners || 0,
          suspended_partners: partnerStats[0]?.suspended_partners || 0,
          total_products: productStats[0]?.total_products || 0,
          pending_products: productStats[0]?.pending_products || 0,
          published_products: productStats[0]?.published_products || 0,
          rejected_hidden_products: productStats[0]?.rejected_hidden_products || 0,
          total_categories: counts[0]?.total_categories || 0,
          total_platforms: counts[0]?.total_platforms || 0,
          total_clicks: productStats[0]?.total_clicks || 0
        }
      });
      return;
    }
    const partners = memoryStore.partners;
    const products = memoryStore.products;
    res.json({
      success: true,
      stats: {
        total_partners: partners.length,
        pending_partners: partners.filter((p) => p.status === "PENDING").length,
        approved_partners: partners.filter((p) => p.status === "APPROVED").length,
        suspended_partners: partners.filter((p) => p.status === "SUSPENDED").length,
        total_products: products.length,
        pending_products: products.filter((p) => p.approval_status === "PENDING").length,
        published_products: products.filter(
          (p) => p.approval_status === "APPROVED" && p.publication_status === "PUBLISHED"
        ).length,
        rejected_hidden_products: products.filter(
          (p) => p.approval_status === "REJECTED" || p.publication_status === "ARCHIVED"
        ).length,
        total_categories: memoryStore.categories.filter((c) => c.is_active).length,
        total_platforms: memoryStore.affiliate_platforms.filter((pl) => pl.is_active).length,
        total_clicks: products.reduce((acc, p) => acc + (p.clicks_count || 0), 0)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function getAdminProducts(req, res) {
  try {
    const { approval_status, publication_status, category_id, platform_id, search } = req.query;
    if (isConnectedToMySQL && mysqlPool) {
      let conditions = ["1=1"];
      const params = [];
      if (approval_status) {
        conditions.push("p.approval_status = ?");
        params.push(approval_status);
      }
      if (publication_status) {
        conditions.push("p.publication_status = ?");
        params.push(publication_status);
      }
      if (category_id) {
        conditions.push("p.category_id = ?");
        params.push(category_id);
      }
      if (platform_id) {
        conditions.push("p.platform_id = ?");
        params.push(platform_id);
      }
      if (search) {
        conditions.push("(p.product_name LIKE ? OR pt.partner_id LIKE ? OR pt.full_name LIKE ?)");
        const s = `%${search}%`;
        params.push(s, s, s);
      }
      const sql = `
        SELECT 
          p.*,
          c.name AS category_name,
          ap.name AS platform_name, ap.badge_color AS platform_badge_color,
          pt.partner_id AS partner_code, pt.full_name AS partner_name, pt.email AS partner_email,
          adm.full_name AS admin_creator_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN affiliate_platforms ap ON p.platform_id = ap.id
        LEFT JOIN partners pt ON p.partner_id = pt.id
        LEFT JOIN admins adm ON p.admin_id = adm.id
        WHERE ${conditions.join(" AND ")}
        ORDER BY p.display_priority DESC, p.id DESC
      `;
      const [rows] = await mysqlPool.execute(sql, params);
      res.json({ success: true, products: rows });
      return;
    }
    let prods = [...memoryStore.products];
    if (approval_status) prods = prods.filter((p) => p.approval_status === approval_status);
    if (publication_status) prods = prods.filter((p) => p.publication_status === publication_status);
    if (category_id) prods = prods.filter((p) => p.category_id === Number(category_id));
    if (platform_id) prods = prods.filter((p) => p.platform_id === Number(platform_id));
    if (search) {
      const q = String(search).toLowerCase();
      prods = prods.filter((p) => {
        const pt = memoryStore.partners.find((part) => part.id === p.partner_id);
        return p.product_name.toLowerCase().includes(q) || pt && (pt.partner_id.toLowerCase().includes(q) || pt.full_name.toLowerCase().includes(q));
      });
    }
    prods.sort((a, b) => (b.display_priority || 0) - (a.display_priority || 0) || b.id - a.id);
    const enriched = prods.map((p) => {
      const cat = memoryStore.categories.find((c) => c.id === p.category_id);
      const plat = memoryStore.affiliate_platforms.find((pl) => pl.id === p.platform_id);
      const pt = memoryStore.partners.find((partner) => partner.id === p.partner_id);
      return {
        ...p,
        category_name: cat ? cat.name : "General",
        platform_name: plat ? plat.name : "Store",
        platform_badge_color: plat ? plat.badge_color : "#2563EB",
        partner_name: pt ? pt.full_name : "Staff Administrator",
        partner_code: pt ? pt.partner_id : "STAFF"
      };
    });
    res.json({ success: true, products: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function createAdminProduct(req, res) {
  try {
    const adminId = req.session.adminId;
    const {
      product_name,
      image_url,
      category_id,
      platform_id,
      price,
      original_mrp,
      affiliate_url,
      description,
      display_priority = 10,
      is_featured = 0,
      is_trending = 0
    } = req.body;
    if (!product_name || !image_url || !category_id || !platform_id || !affiliate_url) {
      res.status(400).json({ success: false, message: "Missing required product fields." });
      return;
    }
    if (!isValidAffiliateUrl(affiliate_url)) {
      res.status(400).json({ success: false, message: "Invalid affiliate URL format. Must start with http:// or https://" });
      return;
    }
    const slug = product_name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") + "-" + Date.now().toString().slice(-4);
    const parsedPrice = price ? parseFloat(price) : null;
    const parsedMrp = original_mrp ? parseFloat(original_mrp) : null;
    if (isConnectedToMySQL && mysqlPool) {
      const sql = `
        INSERT INTO products (
          product_name, slug, image_url, description, category_id, platform_id,
          price, original_mrp, currency, affiliate_url, added_by_role, admin_id,
          approval_status, publication_status, is_featured, is_trending, display_priority,
          views_count, clicks_count, created_at, published_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, 'INR', ?, 'ADMIN', ?,
          'APPROVED', 'PUBLISHED', ?, ?, ?,
          0, 0, NOW(), NOW()
        )
      `;
      const [result] = await mysqlPool.execute(sql, [
        product_name.trim(),
        slug,
        image_url.trim(),
        description ? description.trim() : null,
        Number(category_id),
        Number(platform_id),
        parsedPrice,
        parsedMrp,
        affiliate_url.trim(),
        adminId || null,
        is_featured ? 1 : 0,
        is_trending ? 1 : 0,
        Number(display_priority) || 10
      ]);
      await logAdminActivity(
        adminId || null,
        "CREATE_PRODUCT",
        "PRODUCT",
        result.insertId,
        `Created and published admin product: ${product_name}`,
        req.ip || ""
      );
      res.status(201).json({
        success: true,
        message: "Product created and published to storefront successfully.",
        productId: result.insertId
      });
      return;
    }
    const newProd = {
      id: memoryStore.products.length > 0 ? Math.max(...memoryStore.products.map((p) => p.id)) + 1 : 1,
      product_name: product_name.trim(),
      slug,
      image_url: image_url.trim(),
      description: description ? description.trim() : "",
      category_id: Number(category_id),
      platform_id: Number(platform_id),
      price: parsedPrice,
      original_mrp: parsedMrp,
      currency: "INR",
      rating: 4.8,
      reviews_count: 50,
      affiliate_url: affiliate_url.trim(),
      added_by_role: "ADMIN",
      admin_id: adminId || 1,
      partner_id: null,
      approval_status: "APPROVED",
      publication_status: "PUBLISHED",
      is_featured: is_featured ? 1 : 0,
      is_trending: is_trending ? 1 : 0,
      display_priority: Number(display_priority) || 10,
      views_count: 0,
      clicks_count: 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      published_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    memoryStore.products.unshift(newProd);
    saveStore();
    await logAdminActivity(
      adminId || 1,
      "CREATE_PRODUCT",
      "PRODUCT",
      newProd.id,
      `Created and published admin product: ${product_name}`,
      req.ip || ""
    );
    res.status(201).json({
      success: true,
      message: "Product created and published to storefront successfully.",
      productId: newProd.id
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function updateAdminProduct(req, res) {
  try {
    const adminId = req.session.adminId;
    const productId = parseInt(req.params.id, 10);
    const {
      product_name,
      image_url,
      category_id,
      platform_id,
      price,
      original_mrp,
      affiliate_url,
      description,
      display_priority,
      is_featured,
      is_trending
    } = req.body;
    if (!product_name || !image_url || !category_id || !platform_id || !affiliate_url) {
      res.status(400).json({ success: false, message: "Missing required product fields." });
      return;
    }
    if (!isValidAffiliateUrl(affiliate_url)) {
      res.status(400).json({ success: false, message: "Invalid affiliate destination URL." });
      return;
    }
    const parsedPrice = price ? parseFloat(price) : null;
    const parsedMrp = original_mrp ? parseFloat(original_mrp) : null;
    if (isConnectedToMySQL && mysqlPool) {
      await mysqlPool.execute(
        `UPDATE products SET
          product_name = ?, image_url = ?, description = ?,
          category_id = ?, platform_id = ?, price = ?, original_mrp = ?,
          affiliate_url = ?, display_priority = ?, is_featured = ?, is_trending = ?,
          updated_at = NOW()
         WHERE id = ?`,
        [
          product_name.trim(),
          image_url.trim(),
          description ? description.trim() : null,
          Number(category_id),
          Number(platform_id),
          parsedPrice,
          parsedMrp,
          affiliate_url.trim(),
          Number(display_priority) || 0,
          is_featured ? 1 : 0,
          is_trending ? 1 : 0,
          productId
        ]
      );
      await logAdminActivity(adminId || null, "UPDATE_PRODUCT", "PRODUCT", productId, `Updated product #${productId}`, req.ip || "");
      res.json({ success: true, message: "Product updated successfully." });
      return;
    }
    const prod = memoryStore.products.find((p) => p.id === productId);
    if (!prod) {
      res.status(404).json({ success: false, message: "Product not found." });
      return;
    }
    prod.product_name = product_name.trim();
    prod.image_url = image_url.trim();
    prod.description = description || "";
    prod.category_id = Number(category_id);
    prod.platform_id = Number(platform_id);
    prod.price = parsedPrice;
    prod.original_mrp = parsedMrp;
    prod.affiliate_url = affiliate_url.trim();
    prod.display_priority = Number(display_priority) || 0;
    prod.is_featured = is_featured ? 1 : 0;
    prod.is_trending = is_trending ? 1 : 0;
    saveStore();
    await logAdminActivity(adminId || 1, "UPDATE_PRODUCT", "PRODUCT", productId, `Updated product #${productId}`, req.ip || "");
    res.json({ success: true, message: "Product updated successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function moderateProduct(req, res) {
  try {
    const adminId = req.session.adminId;
    const productId = parseInt(req.params.id, 10);
    const { approval_status, rejection_reason } = req.body;
    if (!["APPROVED", "REJECTED", "PENDING"].includes(approval_status)) {
      res.status(400).json({ success: false, message: "Invalid status code." });
      return;
    }
    const pubStatus = approval_status === "APPROVED" ? "PUBLISHED" : "DRAFT";
    if (isConnectedToMySQL && mysqlPool) {
      const [curr] = await mysqlPool.execute("SELECT approval_status FROM products WHERE id = ?", [productId]);
      const prev2 = curr[0]?.approval_status || "PENDING";
      await mysqlPool.execute(
        `UPDATE products SET
          approval_status = ?,
          publication_status = ?,
          rejection_reason = ?,
          published_at = IF(? = 'APPROVED', NOW(), published_at),
          updated_at = NOW()
         WHERE id = ?`,
        [approval_status, pubStatus, rejection_reason || null, approval_status, productId]
      );
      await logProductStatusChange(
        productId,
        prev2,
        approval_status,
        adminId || null,
        rejection_reason || `Product marked as ${approval_status}`
      );
      await logAdminActivity(
        adminId || null,
        "MODERATE_PRODUCT",
        "PRODUCT",
        productId,
        `Status set to ${approval_status}`,
        req.ip || ""
      );
      res.json({ success: true, message: `Product ${approval_status.toLowerCase()} successfully.` });
      return;
    }
    const prod = memoryStore.products.find((p) => p.id === productId);
    if (!prod) {
      res.status(404).json({ success: false, message: "Product not found." });
      return;
    }
    const prev = prod.approval_status;
    prod.approval_status = approval_status;
    prod.publication_status = pubStatus;
    prod.rejection_reason = rejection_reason || null;
    if (approval_status === "APPROVED") prod.published_at = (/* @__PURE__ */ new Date()).toISOString();
    saveStore();
    await logProductStatusChange(
      productId,
      prev,
      approval_status,
      adminId || 1,
      rejection_reason || `Product marked as ${approval_status}`
    );
    res.json({ success: true, message: `Product ${approval_status.toLowerCase()} successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function toggleProductPublication(req, res) {
  try {
    const adminId = req.session.adminId;
    const productId = parseInt(req.params.id, 10);
    const { publication_status } = req.body;
    if (!["PUBLISHED", "DRAFT", "ARCHIVED"].includes(publication_status)) {
      res.status(400).json({ success: false, message: "Invalid publication status" });
      return;
    }
    if (isConnectedToMySQL && mysqlPool) {
      await mysqlPool.execute("UPDATE products SET publication_status = ? WHERE id = ?", [publication_status, productId]);
      await logAdminActivity(adminId || null, "CHANGE_PUBLICATION", "PRODUCT", productId, `Set to ${publication_status}`, req.ip || "");
      res.json({ success: true, message: `Product is now ${publication_status}.` });
      return;
    }
    const prod = memoryStore.products.find((p) => p.id === productId);
    if (!prod) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }
    prod.publication_status = publication_status;
    saveStore();
    res.json({ success: true, message: `Product is now ${publication_status}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function deleteProductAdmin(req, res) {
  try {
    const adminId = req.session.adminId;
    const productId = parseInt(req.params.id, 10);
    if (isConnectedToMySQL && mysqlPool) {
      await mysqlPool.execute("DELETE FROM products WHERE id = ?", [productId]);
      await logAdminActivity(adminId || null, "DELETE_PRODUCT", "PRODUCT", productId, `Deleted product #${productId}`, req.ip || "");
      res.json({ success: true, message: "Product deleted permanently." });
      return;
    }
    const idx = memoryStore.products.findIndex((p) => p.id === productId);
    if (idx === -1) {
      res.status(404).json({ success: false, message: "Product not found." });
      return;
    }
    memoryStore.products.splice(idx, 1);
    saveStore();
    await logAdminActivity(adminId || 1, "DELETE_PRODUCT", "PRODUCT", productId, `Deleted product #${productId}`, req.ip || "");
    res.json({ success: true, message: "Product deleted permanently." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function getAllPartners(req, res) {
  try {
    const { status, search } = req.query;
    if (isConnectedToMySQL && mysqlPool) {
      let conditions = ["1=1"];
      const params = [];
      if (status) {
        conditions.push("p.status = ?");
        params.push(status);
      }
      if (search) {
        conditions.push("(p.full_name LIKE ? OR p.partner_id LIKE ? OR p.email LIKE ? OR p.mobile_number LIKE ?)");
        const s = `%${search}%`;
        params.push(s, s, s, s);
      }
      const sql = `
        SELECT 
          p.id, p.partner_id, p.full_name, p.email, p.mobile_number, p.profile_image,
          p.status, p.rejection_reason, p.created_at, p.approved_at,
          COUNT(pr.id) as total_products,
          COALESCE(SUM(pr.clicks_count), 0) as total_clicks
        FROM partners p
        LEFT JOIN products pr ON p.id = pr.partner_id
        WHERE ${conditions.join(" AND ")}
        GROUP BY p.id
        ORDER BY p.id DESC
      `;
      const [rows] = await mysqlPool.execute(sql, params);
      res.json({ success: true, partners: rows });
      return;
    }
    let list = [...memoryStore.partners];
    if (status) list = list.filter((p) => p.status === status);
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(
        (p) => p.full_name.toLowerCase().includes(q) || p.partner_id.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.mobile_number.includes(q)
      );
    }
    list.sort((a, b) => b.id - a.id);
    const enriched = list.map(({ password_hash, ...rest }) => {
      const prods = memoryStore.products.filter((pr) => pr.partner_id === rest.id);
      return {
        ...rest,
        total_products: prods.length,
        total_clicks: prods.reduce((acc, pr) => acc + (pr.clicks_count || 0), 0)
      };
    });
    res.json({ success: true, partners: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function getPartnerDetails(req, res) {
  try {
    const partnerId = parseInt(req.params.id, 10);
    if (isConnectedToMySQL && mysqlPool) {
      const [partnerRows] = await mysqlPool.execute(
        "SELECT id, partner_id, full_name, email, mobile_number, profile_image, status, rejection_reason, created_at, approved_at FROM partners WHERE id = ? LIMIT 1",
        [partnerId]
      );
      if (!partnerRows || partnerRows.length === 0) {
        res.status(404).json({ success: false, message: "Partner not found" });
        return;
      }
      const [products] = await mysqlPool.execute(
        `SELECT p.*, c.name as category_name, ap.name as platform_name 
         FROM products p 
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN affiliate_platforms ap ON p.platform_id = ap.id
         WHERE p.partner_id = ? ORDER BY p.id DESC`,
        [partnerId]
      );
      res.json({ success: true, partner: partnerRows[0], products });
      return;
    }
    const partner = memoryStore.partners.find((p) => p.id === partnerId);
    if (!partner) {
      res.status(404).json({ success: false, message: "Partner not found" });
      return;
    }
    const { password_hash, ...clean } = partner;
    const prods = memoryStore.products.filter((p) => p.partner_id === partnerId);
    res.json({ success: true, partner: clean, products: prods });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function updatePartnerStatus(req, res) {
  try {
    const adminId = req.session.adminId;
    const partnerId = parseInt(req.params.id, 10);
    const { status, rejection_reason } = req.body;
    if (!["APPROVED", "REJECTED", "PENDING", "SUSPENDED"].includes(status)) {
      res.status(400).json({ success: false, message: "Invalid partner status" });
      return;
    }
    if (isConnectedToMySQL && mysqlPool) {
      await mysqlPool.execute(
        `UPDATE partners SET 
          status = ?, 
          rejection_reason = ?,
          approved_by_admin_id = IF(? = 'APPROVED', ?, approved_by_admin_id),
          approved_at = IF(? = 'APPROVED', NOW(), approved_at),
          updated_at = NOW()
         WHERE id = ?`,
        [status, rejection_reason || null, status, adminId || null, status, partnerId]
      );
      await logAdminActivity(
        adminId || null,
        "UPDATE_PARTNER_STATUS",
        "PARTNER",
        partnerId,
        `Status set to ${status}${rejection_reason ? " (" + rejection_reason + ")" : ""}`,
        req.ip || ""
      );
      res.json({ success: true, message: `Partner status updated to ${status}.` });
      return;
    }
    const pt = memoryStore.partners.find((p) => p.id === partnerId);
    if (!pt) {
      res.status(404).json({ success: false, message: "Partner not found." });
      return;
    }
    pt.status = status;
    pt.rejection_reason = rejection_reason || null;
    saveStore();
    await logAdminActivity(
      adminId || 1,
      "UPDATE_PARTNER_STATUS",
      "PARTNER",
      partnerId,
      `Status set to ${status}`,
      req.ip || ""
    );
    res.json({ success: true, message: `Partner status updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function resetPartnerPassword(req, res) {
  try {
    const adminId = req.session.adminId;
    const partnerId = parseInt(req.params.id, 10);
    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) {
      res.status(400).json({ success: false, message: "New temporary password must be at least 6 characters." });
      return;
    }
    const salt = await bcrypt3.genSalt(10);
    const hash = await bcrypt3.hash(new_password, salt);
    if (isConnectedToMySQL && mysqlPool) {
      await mysqlPool.execute("UPDATE partners SET password_hash = ?, updated_at = NOW() WHERE id = ?", [hash, partnerId]);
      await logAdminActivity(adminId || null, "RESET_PARTNER_PASSWORD", "PARTNER", partnerId, "Password reset by admin", req.ip || "");
      res.json({ success: true, message: "Partner password has been reset securely." });
      return;
    }
    const pt = memoryStore.partners.find((p) => p.id === partnerId);
    if (!pt) {
      res.status(404).json({ success: false, message: "Partner not found" });
      return;
    }
    pt.password_hash = hash;
    saveStore();
    await logAdminActivity(adminId || 1, "RESET_PARTNER_PASSWORD", "PARTNER", partnerId, "Password reset by admin", req.ip || "");
    res.json({ success: true, message: "Partner password has been reset securely." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function deletePartnerAdmin(req, res) {
  try {
    const adminId = req.session.adminId;
    const partnerId = parseInt(req.params.id, 10);
    if (isConnectedToMySQL && mysqlPool) {
      await mysqlPool.execute("UPDATE products SET partner_id = NULL WHERE partner_id = ?", [partnerId]);
      await mysqlPool.execute("DELETE FROM partners WHERE id = ?", [partnerId]);
      await logAdminActivity(adminId || null, "DELETE_PARTNER", "PARTNER", partnerId, `Partner #${partnerId} deleted`, req.ip || "");
      res.json({ success: true, message: "Partner account deleted successfully." });
      return;
    }
    const idx = memoryStore.partners.findIndex((p) => p.id === partnerId);
    if (idx === -1) {
      res.status(404).json({ success: false, message: "Partner not found" });
      return;
    }
    memoryStore.partners.splice(idx, 1);
    memoryStore.products.forEach((pr) => {
      if (pr.partner_id === partnerId) pr.partner_id = null;
    });
    saveStore();
    await logAdminActivity(adminId || 1, "DELETE_PARTNER", "PARTNER", partnerId, `Partner #${partnerId} deleted`, req.ip || "");
    res.json({ success: true, message: "Partner account deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function getCategoriesAdmin(_req, res) {
  try {
    if (isConnectedToMySQL && mysqlPool) {
      const [rows] = await mysqlPool.query(`
        SELECT c.*, COUNT(p.id) as products_count 
        FROM categories c 
        LEFT JOIN products p ON c.id = p.category_id 
        GROUP BY c.id 
        ORDER BY c.display_order ASC, c.id ASC
      `);
      res.json({ success: true, categories: rows });
      return;
    }
    const categories = memoryStore.categories.map((c) => ({
      ...c,
      products_count: memoryStore.products.filter((p) => p.category_id === c.id).length
    }));
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function createCategory(req, res) {
  try {
    const adminId = req.session.adminId;
    const { name, icon_name, image_url, display_order = 0, is_active = 1 } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: "Category name is required." });
      return;
    }
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    if (isConnectedToMySQL && mysqlPool) {
      const [result] = await mysqlPool.execute(
        `INSERT INTO categories (name, slug, icon_name, image_url, display_order, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [name.trim(), slug, icon_name || "Tag", image_url || null, Number(display_order) || 0, is_active ? 1 : 0]
      );
      await logAdminActivity(adminId || null, "CREATE_CATEGORY", "CATEGORY", result.insertId, `Created category ${name}`, req.ip || "");
      res.status(201).json({ success: true, message: "Category created.", categoryId: result.insertId });
      return;
    }
    const newCat = {
      id: memoryStore.categories.length > 0 ? Math.max(...memoryStore.categories.map((c) => c.id)) + 1 : 1,
      name: name.trim(),
      slug,
      icon_name: icon_name || "Tag",
      image_url: image_url || null,
      display_order: Number(display_order) || 0,
      is_active: is_active ? 1 : 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    memoryStore.categories.push(newCat);
    saveStore();
    await logAdminActivity(adminId || 1, "CREATE_CATEGORY", "CATEGORY", newCat.id, `Created category ${name}`, req.ip || "");
    res.status(201).json({ success: true, message: "Category created.", categoryId: newCat.id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function updateCategory(req, res) {
  try {
    const adminId = req.session.adminId;
    const categoryId = parseInt(req.params.id, 10);
    const { name, icon_name, image_url, display_order, is_active } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: "Category name is required." });
      return;
    }
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    if (isConnectedToMySQL && mysqlPool) {
      await mysqlPool.execute(
        `UPDATE categories SET name = ?, slug = ?, icon_name = ?, image_url = ?, display_order = ?, is_active = ?, updated_at = NOW() WHERE id = ?`,
        [name.trim(), slug, icon_name || "Tag", image_url || null, Number(display_order) || 0, is_active ? 1 : 0, categoryId]
      );
      await logAdminActivity(adminId || null, "UPDATE_CATEGORY", "CATEGORY", categoryId, `Updated category ${name}`, req.ip || "");
      res.json({ success: true, message: "Category updated." });
      return;
    }
    const cat = memoryStore.categories.find((c) => c.id === categoryId);
    if (!cat) {
      res.status(404).json({ success: false, message: "Category not found." });
      return;
    }
    cat.name = name.trim();
    cat.slug = slug;
    cat.icon_name = icon_name || cat.icon_name;
    cat.image_url = image_url !== void 0 ? image_url : cat.image_url;
    cat.display_order = Number(display_order) || 0;
    cat.is_active = is_active ? 1 : 0;
    saveStore();
    await logAdminActivity(adminId || 1, "UPDATE_CATEGORY", "CATEGORY", categoryId, `Updated category ${name}`, req.ip || "");
    res.json({ success: true, message: "Category updated." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function deleteCategory(req, res) {
  try {
    const adminId = req.session.adminId;
    const categoryId = parseInt(req.params.id, 10);
    if (isConnectedToMySQL && mysqlPool) {
      const [countRows] = await mysqlPool.execute("SELECT COUNT(*) as count FROM products WHERE category_id = ?", [categoryId]);
      const productCount2 = countRows[0]?.count || 0;
      if (productCount2 > 0) {
        res.status(409).json({
          success: false,
          message: `Cannot delete category: it is referenced by ${productCount2} products. Please reassign the products or hide the category instead.`
        });
        return;
      }
      await mysqlPool.execute("DELETE FROM categories WHERE id = ?", [categoryId]);
      await logAdminActivity(adminId || null, "DELETE_CATEGORY", "CATEGORY", categoryId, `Deleted category #${categoryId}`, req.ip || "");
      res.json({ success: true, message: "Category deleted safely." });
      return;
    }
    const productCount = memoryStore.products.filter((p) => p.category_id === categoryId).length;
    if (productCount > 0) {
      res.status(409).json({
        success: false,
        message: `Cannot delete category: it is referenced by ${productCount} products. Please reassign or hide the category instead.`
      });
      return;
    }
    const idx = memoryStore.categories.findIndex((c) => c.id === categoryId);
    if (idx === -1) {
      res.status(404).json({ success: false, message: "Category not found." });
      return;
    }
    memoryStore.categories.splice(idx, 1);
    saveStore();
    await logAdminActivity(adminId || 1, "DELETE_CATEGORY", "CATEGORY", categoryId, `Deleted category #${categoryId}`, req.ip || "");
    res.json({ success: true, message: "Category deleted safely." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function getPlatformsAdmin(_req, res) {
  try {
    if (isConnectedToMySQL && mysqlPool) {
      const [rows] = await mysqlPool.query(`
        SELECT ap.*, COUNT(p.id) as products_count 
        FROM affiliate_platforms ap 
        LEFT JOIN products p ON ap.id = p.platform_id 
        GROUP BY ap.id 
        ORDER BY ap.display_order ASC
      `);
      res.json({ success: true, platforms: rows });
      return;
    }
    const platforms = memoryStore.affiliate_platforms.map((pl) => ({
      ...pl,
      products_count: memoryStore.products.filter((p) => p.platform_id === pl.id).length
    }));
    res.json({ success: true, platforms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function createPlatform(req, res) {
  try {
    const adminId = req.session.adminId;
    const { name, badge_color = "#2563EB", logo_url, base_url, display_order = 0, is_active = 1 } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: "Platform name is required." });
      return;
    }
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    if (isConnectedToMySQL && mysqlPool) {
      const [result] = await mysqlPool.execute(
        `INSERT INTO affiliate_platforms (name, slug, badge_color, logo_url, base_url, display_order, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [name.trim(), slug, badge_color, logo_url || null, base_url || null, Number(display_order) || 0, is_active ? 1 : 0]
      );
      await logAdminActivity(adminId || null, "CREATE_PLATFORM", "PLATFORM", result.insertId, `Created platform ${name}`, req.ip || "");
      res.status(201).json({ success: true, message: "Platform created.", platformId: result.insertId });
      return;
    }
    const newPlat = {
      id: memoryStore.affiliate_platforms.length > 0 ? Math.max(...memoryStore.affiliate_platforms.map((p) => p.id)) + 1 : 1,
      name: name.trim(),
      slug,
      badge_color,
      logo_url: logo_url || null,
      base_url: base_url || null,
      display_order: Number(display_order) || 0,
      is_active: is_active ? 1 : 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    memoryStore.affiliate_platforms.push(newPlat);
    saveStore();
    await logAdminActivity(adminId || 1, "CREATE_PLATFORM", "PLATFORM", newPlat.id, `Created platform ${name}`, req.ip || "");
    res.status(201).json({ success: true, message: "Platform created.", platformId: newPlat.id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function updatePlatform(req, res) {
  try {
    const adminId = req.session.adminId;
    const platformId = parseInt(req.params.id, 10);
    const { name, badge_color, logo_url, base_url, display_order, is_active } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: "Platform name is required." });
      return;
    }
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    if (isConnectedToMySQL && mysqlPool) {
      await mysqlPool.execute(
        `UPDATE affiliate_platforms SET name = ?, slug = ?, badge_color = ?, logo_url = ?, base_url = ?, display_order = ?, is_active = ?, updated_at = NOW() WHERE id = ?`,
        [name.trim(), slug, badge_color || "#2563EB", logo_url || null, base_url || null, Number(display_order) || 0, is_active ? 1 : 0, platformId]
      );
      await logAdminActivity(adminId || null, "UPDATE_PLATFORM", "PLATFORM", platformId, `Updated platform ${name}`, req.ip || "");
      res.json({ success: true, message: "Platform updated." });
      return;
    }
    const plat = memoryStore.affiliate_platforms.find((p) => p.id === platformId);
    if (!plat) {
      res.status(404).json({ success: false, message: "Platform not found." });
      return;
    }
    plat.name = name.trim();
    plat.slug = slug;
    plat.badge_color = badge_color || plat.badge_color;
    plat.logo_url = logo_url !== void 0 ? logo_url : plat.logo_url;
    plat.base_url = base_url !== void 0 ? base_url : plat.base_url;
    plat.display_order = Number(display_order) || 0;
    plat.is_active = is_active ? 1 : 0;
    saveStore();
    await logAdminActivity(adminId || 1, "UPDATE_PLATFORM", "PLATFORM", platformId, `Updated platform ${name}`, req.ip || "");
    res.json({ success: true, message: "Platform updated." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function deletePlatform(req, res) {
  try {
    const adminId = req.session.adminId;
    const platformId = parseInt(req.params.id, 10);
    if (isConnectedToMySQL && mysqlPool) {
      const [countRows] = await mysqlPool.execute("SELECT COUNT(*) as count FROM products WHERE platform_id = ?", [platformId]);
      const productCount2 = countRows[0]?.count || 0;
      if (productCount2 > 0) {
        res.status(409).json({
          success: false,
          message: `Cannot delete platform: it is associated with ${productCount2} products. Please reassign products or hide the platform.`
        });
        return;
      }
      await mysqlPool.execute("DELETE FROM affiliate_platforms WHERE id = ?", [platformId]);
      await logAdminActivity(adminId || null, "DELETE_PLATFORM", "PLATFORM", platformId, `Deleted platform #${platformId}`, req.ip || "");
      res.json({ success: true, message: "Platform deleted safely." });
      return;
    }
    const productCount = memoryStore.products.filter((p) => p.platform_id === platformId).length;
    if (productCount > 0) {
      res.status(409).json({
        success: false,
        message: `Cannot delete platform: it is associated with ${productCount} products. Please reassign or hide the platform.`
      });
      return;
    }
    const idx = memoryStore.affiliate_platforms.findIndex((p) => p.id === platformId);
    if (idx === -1) {
      res.status(404).json({ success: false, message: "Platform not found." });
      return;
    }
    memoryStore.affiliate_platforms.splice(idx, 1);
    saveStore();
    await logAdminActivity(adminId || 1, "DELETE_PLATFORM", "PLATFORM", platformId, `Deleted platform #${platformId}`, req.ip || "");
    res.json({ success: true, message: "Platform deleted safely." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function getBannersAdmin(_req, res) {
  try {
    if (isConnectedToMySQL && mysqlPool) {
      const [rows] = await mysqlPool.query("SELECT * FROM banners ORDER BY display_order ASC, id ASC");
      res.json({ success: true, banners: rows });
      return;
    }
    const banners = [...memoryStore.banners].sort((a, b) => a.display_order - b.display_order);
    res.json({ success: true, banners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function manageBanner(req, res) {
  try {
    const adminId = req.session.adminId;
    const { id, title, subtitle, image_url, cta_text, cta_link, badge_text, banner_type = "HERO", display_order = 0, is_active = 1 } = req.body;
    if (!title || !image_url) {
      res.status(400).json({ success: false, message: "Title and image URL are required." });
      return;
    }
    if (isConnectedToMySQL && mysqlPool) {
      if (id) {
        await mysqlPool.execute(
          `UPDATE banners SET title = ?, subtitle = ?, image_url = ?, cta_text = ?, cta_link = ?, badge_text = ?, banner_type = ?, display_order = ?, is_active = ?, updated_at = NOW() WHERE id = ?`,
          [title.trim(), subtitle || "", image_url.trim(), cta_text || "Shop Now", cta_link || "#", badge_text || "", banner_type, Number(display_order) || 0, is_active ? 1 : 0, id]
        );
        await logAdminActivity(adminId || null, "UPDATE_BANNER", "BANNER", id, `Updated banner: ${title}`, req.ip || "");
      } else {
        const [result] = await mysqlPool.execute(
          `INSERT INTO banners (title, subtitle, image_url, cta_text, cta_link, badge_text, banner_type, display_order, is_active, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [title.trim(), subtitle || "", image_url.trim(), cta_text || "Shop Now", cta_link || "#", badge_text || "", banner_type, Number(display_order) || 0, is_active ? 1 : 0]
        );
        await logAdminActivity(adminId || null, "CREATE_BANNER", "BANNER", result.insertId, `Created banner: ${title}`, req.ip || "");
      }
      res.json({ success: true, message: "Banner saved." });
      return;
    }
    if (id) {
      const idx = memoryStore.banners.findIndex((b) => b.id === Number(id));
      if (idx !== -1) {
        memoryStore.banners[idx] = { ...memoryStore.banners[idx], ...req.body };
      }
    } else {
      const newBanner = {
        id: memoryStore.banners.length > 0 ? Math.max(...memoryStore.banners.map((b) => b.id)) + 1 : 1,
        title: title.trim(),
        subtitle: subtitle || "",
        image_url: image_url.trim(),
        cta_text: cta_text || "Shop Now",
        cta_link: cta_link || "#",
        badge_text: badge_text || "",
        banner_type,
        display_order: Number(display_order) || 0,
        is_active: is_active ? 1 : 0
      };
      memoryStore.banners.push(newBanner);
    }
    saveStore();
    await logAdminActivity(adminId || 1, "MANAGE_BANNER", "BANNER", id || "NEW", `Saved banner: ${title}`, req.ip || "");
    res.json({ success: true, message: "Banner saved." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function deleteBanner(req, res) {
  try {
    const adminId = req.session.adminId;
    const bannerId = parseInt(req.params.id, 10);
    if (isConnectedToMySQL && mysqlPool) {
      await mysqlPool.execute("DELETE FROM banners WHERE id = ?", [bannerId]);
      await logAdminActivity(adminId || null, "DELETE_BANNER", "BANNER", bannerId, `Deleted banner #${bannerId}`, req.ip || "");
      res.json({ success: true, message: "Banner deleted." });
      return;
    }
    const idx = memoryStore.banners.findIndex((b) => b.id === bannerId);
    if (idx !== -1) {
      memoryStore.banners.splice(idx, 1);
      saveStore();
    }
    await logAdminActivity(adminId || 1, "DELETE_BANNER", "BANNER", bannerId, `Deleted banner #${bannerId}`, req.ip || "");
    res.json({ success: true, message: "Banner deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function getSettingsAdmin(_req, res) {
  try {
    if (isConnectedToMySQL && mysqlPool) {
      const [rows] = await mysqlPool.query("SELECT setting_key, setting_value FROM website_settings");
      const settingsMap = {};
      for (const r of rows) settingsMap[r.setting_key] = r.setting_value;
      res.json({ success: true, settings: settingsMap });
      return;
    }
    res.json({ success: true, settings: memoryStore.website_settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function updateSettings(req, res) {
  try {
    const adminId = req.session.adminId;
    const settings = req.body;
    if (isConnectedToMySQL && mysqlPool) {
      for (const [key, val] of Object.entries(settings)) {
        await mysqlPool.execute(
          `INSERT INTO website_settings (setting_key, setting_value) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE setting_value = ?`,
          [key, String(val), String(val)]
        );
      }
      await logAdminActivity(adminId || null, "UPDATE_SETTINGS", "SETTINGS", null, "Website configuration updated", req.ip || "");
      res.json({ success: true, message: "Website settings saved to MySQL successfully." });
      return;
    }
    for (const [key, val] of Object.entries(settings)) {
      memoryStore.website_settings[key] = String(val);
    }
    saveStore();
    await logAdminActivity(adminId || 1, "UPDATE_SETTINGS", "SETTINGS", null, "Website configuration updated", req.ip || "");
    res.json({ success: true, message: "Website settings updated successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function getAdminProfile(req, res) {
  try {
    const adminId = req.session.adminId;
    if (!adminId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    if (isConnectedToMySQL && mysqlPool) {
      const [rows] = await mysqlPool.execute("SELECT id, username, email, full_name, role, is_active FROM admins WHERE id = ?", [adminId]);
      if (rows && rows.length > 0) {
        res.json({ success: true, admin: rows[0] });
        return;
      }
    }
    const admin = memoryStore.admins.find((a) => a.id === adminId);
    if (!admin) {
      res.status(404).json({ success: false, message: "Admin not found" });
      return;
    }
    const { password_hash, ...rest } = admin;
    res.json({ success: true, admin: rest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function updateAdminProfile(req, res) {
  try {
    const adminId = req.session.adminId;
    const { full_name, email, current_password, new_password } = req.body;
    if (!adminId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    let admin = null;
    if (isConnectedToMySQL && mysqlPool) {
      const [rows] = await mysqlPool.execute("SELECT * FROM admins WHERE id = ?", [adminId]);
      if (rows && rows.length > 0) admin = rows[0];
    } else {
      admin = memoryStore.admins.find((a) => a.id === adminId);
    }
    if (!admin) {
      res.status(404).json({ success: false, message: "Admin not found" });
      return;
    }
    let newHash = null;
    if (new_password) {
      if (!current_password) {
        res.status(400).json({ success: false, message: "Current password is required to change password." });
        return;
      }
      const isMatch = await bcrypt3.compare(current_password, admin.password_hash);
      if (!isMatch) {
        res.status(400).json({ success: false, message: "Current password is incorrect." });
        return;
      }
      if (new_password.length < 8) {
        res.status(400).json({ success: false, message: "New password must be at least 8 characters long." });
        return;
      }
      const salt = await bcrypt3.genSalt(10);
      newHash = await bcrypt3.hash(new_password, salt);
    }
    if (isConnectedToMySQL && mysqlPool) {
      if (newHash) {
        await mysqlPool.execute(
          "UPDATE admins SET full_name = ?, email = ?, password_hash = ?, updated_at = NOW() WHERE id = ?",
          [full_name || admin.full_name, email || admin.email, newHash, adminId]
        );
      } else {
        await mysqlPool.execute(
          "UPDATE admins SET full_name = ?, email = ?, updated_at = NOW() WHERE id = ?",
          [full_name || admin.full_name, email || admin.email, adminId]
        );
      }
      await logAdminActivity(adminId, "UPDATE_PROFILE", "ADMIN", adminId, "Profile credentials updated", req.ip || "");
      res.json({ success: true, message: "Admin profile updated successfully." });
      return;
    }
    admin.full_name = full_name || admin.full_name;
    admin.email = email || admin.email;
    if (newHash) admin.password_hash = newHash;
    saveStore();
    await logAdminActivity(adminId, "UPDATE_PROFILE", "ADMIN", adminId, "Profile credentials updated", req.ip || "");
    res.json({ success: true, message: "Admin profile updated successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function getAdminLogs(_req, res) {
  try {
    if (isConnectedToMySQL && mysqlPool) {
      const [rows] = await mysqlPool.query(
        `SELECT l.*, a.username as admin_username, a.full_name as admin_name 
         FROM admin_activity_logs l 
         LEFT JOIN admins a ON l.admin_id = a.id 
         ORDER BY l.id DESC LIMIT 50`
      );
      res.json({ success: true, logs: rows });
      return;
    }
    res.json({ success: true, logs: memoryStore.admin_activity_logs.slice(0, 50) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
async function getProductStatusHistory(req, res) {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isConnectedToMySQL && mysqlPool) {
      const [rows] = await mysqlPool.execute(
        `SELECT h.*, a.full_name as admin_name 
         FROM product_status_history h 
         LEFT JOIN admins a ON h.changed_by_admin_id = a.id 
         WHERE h.product_id = ? ORDER BY h.id DESC`,
        [productId]
      );
      res.json({ success: true, history: rows });
      return;
    }
    const history = memoryStore.product_status_history.filter((h) => h.product_id === productId);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// server/middleware/auth.ts
function requirePartnerAuth(req, res, next) {
  if (!req.session || !req.session.partnerId) {
    res.status(401).json({ success: false, message: "Authentication required. Please log in as a partner." });
    return;
  }
  next();
}
function requireAdminAuth(req, res, next) {
  if (!req.session || !req.session.adminId) {
    res.status(401).json({ success: false, message: "Admin privileges required. Please log in as administrator." });
    return;
  }
  next();
}

// server/middleware/upload.ts
import multer from "multer";
import path2 from "path";
import fs2 from "fs";
var uploadsDir = path2.join(process.cwd(), "uploads");
if (!fs2.existsSync(uploadsDir)) {
  fs2.mkdirSync(uploadsDir, { recursive: true });
}
var storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path2.extname(file.originalname).toLowerCase();
    const cleanBase = path2.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${cleanBase}-${uniqueSuffix}${ext}`);
  }
});
var allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
var upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB max
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, WEBP, GIF, and SVG images are permitted."));
    }
  }
});

// server/routes/api.ts
var router = Router();
router.get("/status", (_req, res) => {
  res.json({ success: true, database: getDatabaseStatus() });
});
router.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: "No file uploaded or invalid image format." });
    return;
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    fileUrl,
    filename: req.file.filename,
    size: req.file.size
  });
});
router.get("/settings", getSettings);
router.get("/categories", getCategories);
router.get("/platforms", getPlatforms);
router.get("/banners", getBanners);
router.get("/partners/approved", getApprovedPartners);
router.get("/products", getPublicProducts);
router.get("/products/:id", getProductDetails);
router.post("/auth/register", registerPartner);
router.post("/auth/login", loginRateLimiter(15 * 60 * 1e3, 8), loginPartner);
router.get("/auth/session", getPartnerSession);
router.post("/auth/logout", logoutPartner);
router.put("/auth/profile", requirePartnerAuth, updatePartnerProfile);
router.get("/partner/stats", requirePartnerAuth, getPartnerStats);
router.get("/partner/products", requirePartnerAuth, getPartnerProducts);
router.post("/partner/products", requirePartnerAuth, addPartnerProduct);
router.delete("/partner/products/:id", requirePartnerAuth, deletePartnerProduct);
router.get("/admin/setup-status", checkSetupStatus);
router.post("/admin/setup", loginRateLimiter(60 * 60 * 1e3, 5), setupInitialAdmin);
router.post("/auth/admin/login", loginRateLimiter(15 * 60 * 1e3, 6), loginAdmin);
router.get("/auth/admin/session", getAdminSession);
router.post("/auth/admin/logout", logoutAdmin);
router.get("/admin/profile", requireAdminAuth, getAdminProfile);
router.put("/admin/profile", requireAdminAuth, updateAdminProfile);
router.get("/admin/overview", requireAdminAuth, getAdminOverview);
router.get("/admin/logs", requireAdminAuth, getAdminLogs);
router.get("/admin/products", requireAdminAuth, getAdminProducts);
router.post("/admin/products", requireAdminAuth, createAdminProduct);
router.put("/admin/products/:id", requireAdminAuth, updateAdminProduct);
router.put("/admin/products/:id/moderate", requireAdminAuth, moderateProduct);
router.put("/admin/products/:id/publication", requireAdminAuth, toggleProductPublication);
router.delete("/admin/products/:id", requireAdminAuth, deleteProductAdmin);
router.get("/admin/products/:id/history", requireAdminAuth, getProductStatusHistory);
router.get("/admin/partners", requireAdminAuth, getAllPartners);
router.get("/admin/partners/:id", requireAdminAuth, getPartnerDetails);
router.put("/admin/partners/:id/status", requireAdminAuth, updatePartnerStatus);
router.post("/admin/partners/:id/reset-password", requireAdminAuth, resetPartnerPassword);
router.delete("/admin/partners/:id", requireAdminAuth, deletePartnerAdmin);
router.get("/admin/categories", requireAdminAuth, getCategoriesAdmin);
router.post("/admin/categories", requireAdminAuth, createCategory);
router.put("/admin/categories/:id", requireAdminAuth, updateCategory);
router.delete("/admin/categories/:id", requireAdminAuth, deleteCategory);
router.get("/admin/platforms", requireAdminAuth, getPlatformsAdmin);
router.post("/admin/platforms", requireAdminAuth, createPlatform);
router.put("/admin/platforms/:id", requireAdminAuth, updatePlatform);
router.delete("/admin/platforms/:id", requireAdminAuth, deletePlatform);
router.get("/admin/banners", requireAdminAuth, getBannersAdmin);
router.post("/admin/banners", requireAdminAuth, manageBanner);
router.delete("/admin/banners/:id", requireAdminAuth, deleteBanner);
router.get("/admin/settings", requireAdminAuth, getSettingsAdmin);
router.post("/admin/settings", requireAdminAuth, updateSettings);
var api_default = router;

// server.ts
import dotenv from "dotenv";
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path3.dirname(__filename);
var app = express();
var PORT = parseInt(process.env.PORT || "3000", 10);
var isProd = process.env.NODE_ENV === "production";
app.use(securityHeaders);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.set("trust proxy", 1);
var sessionSecret = process.env.SESSION_SECRET || "apni_pehchaan_affiliate_secret_2026";
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: "apni_affiliate_sid",
    cookie: {
      secure: false,
      // Set to true if HTTPS-only behind reverse proxy with SSL termination
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1e3,
      // 7 days
      sameSite: "lax"
    }
  })
);
var uploadsDir2 = path3.join(__dirname, "uploads");
if (!fs3.existsSync(uploadsDir2)) {
  fs3.mkdirSync(uploadsDir2, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir2));
app.get("/api/click/:id", trackAndRedirectClick);
app.use("/api", api_default);
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    console.log("[Server] Vite middleware mounted for development.");
  } else {
    const distPath = path3.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path3.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Apni Pehchaan Affiliate Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("[Server] Fatal startup error:", err);
});
