-- =====================================================================
-- Affiliate Marketing Platform Database Schema
-- Optimized for Hostinger MySQL & phpMyAdmin Import
-- Character Set: utf8mb4 / Collation: utf8mb4_unicode_ci
-- Engine: InnoDB
-- Designed for: Apni Pehchaan (Configurable Brand)
-- Attribution: Design by Happiiz Business Solutions
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- ---------------------------------------------------------------------
-- 1. Table: website_settings
-- Stores customizable brand identity, contact, and social settings
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `website_settings`;
CREATE TABLE `website_settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT NULL,
  `setting_group` VARCHAR(50) NOT NULL DEFAULT 'general',
  `description` VARCHAR(255) NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. Table: admins
-- Platform administrative users
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password` VARCHAR(100) NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `role` ENUM('superadmin', 'admin', 'moderator') NOT NULL DEFAULT 'admin',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_admin_username` (`username`),
  UNIQUE KEY `idx_admin_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. Table: partners
-- Registered affiliate partners with sequential APXXXXX IDs
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `partners`;
CREATE TABLE `partners` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `partner_id` VARCHAR(20) NOT NULL,
  `full_name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `mobile_number` VARCHAR(25) NOT NULL,
  `password` VARCHAR(100) NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `profile_image` VARCHAR(255) NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED') NOT NULL DEFAULT 'PENDING',
  `rejection_reason` TEXT NULL,
  `approved_by_admin_id` INT UNSIGNED NULL,
  `approved_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_partner_unique_id` (`partner_id`),
  UNIQUE KEY `idx_partner_email` (`email`),
  KEY `idx_partner_status` (`status`),
  CONSTRAINT `fk_partner_approved_by` FOREIGN KEY (`approved_by_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. Table: categories
-- Product categories with icons, images, and hierarchy
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(120) NOT NULL,
  `image_url` VARCHAR(255) NULL,
  `icon_name` VARCHAR(50) NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_category_slug` (`slug`),
  KEY `idx_category_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. Table: affiliate_platforms
-- Affiliate platforms (Amazon, Flipkart, Meesho, Myntra, etc.)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `affiliate_platforms`;
CREATE TABLE `affiliate_platforms` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `logo_url` VARCHAR(255) NULL,
  `badge_color` VARCHAR(30) NOT NULL DEFAULT '#2563EB',
  `base_url` VARCHAR(255) NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_platform_slug` (`slug`),
  KEY `idx_platform_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. Table: banners
-- Scrolling promotional banners and highlights
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `banners`;
CREATE TABLE `banners` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(200) NOT NULL,
  `subtitle` VARCHAR(255) NULL,
  `image_url` VARCHAR(255) NOT NULL,
  `cta_text` VARCHAR(60) NOT NULL DEFAULT 'Shop Now',
  `cta_link` VARCHAR(255) NOT NULL DEFAULT '/',
  `badge_text` VARCHAR(60) NULL,
  `banner_type` ENUM('HERO', 'PROMO_STRIP', 'CATEGORY_HIGHLIGHT') NOT NULL DEFAULT 'HERO',
  `display_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_banner_order` (`display_order`),
  KEY `idx_banner_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. Table: products
-- Affiliate products with review/approval and multi-role ownership
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(280) NOT NULL,
  `image_url` VARCHAR(255) NOT NULL,
  `additional_images` JSON NULL,
  `description` TEXT NULL,
  `category_id` INT UNSIGNED NOT NULL,
  `platform_id` INT UNSIGNED NOT NULL,
  `price` DECIMAL(10,2) NULL,
  `original_mrp` DECIMAL(10,2) NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
  `rating` DECIMAL(2,1) NOT NULL DEFAULT 4.5,
  `reviews_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `affiliate_url` TEXT NOT NULL,
  `added_by_role` ENUM('ADMIN', 'PARTNER') NOT NULL DEFAULT 'PARTNER',
  `partner_id` INT UNSIGNED NULL,
  `admin_id` INT UNSIGNED NULL,
  `approval_status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `publication_status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `rejection_reason` TEXT NULL,
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `is_trending` TINYINT(1) NOT NULL DEFAULT 0,
  `display_priority` INT NOT NULL DEFAULT 0,
  `views_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `clicks_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `published_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  KEY `idx_product_category` (`category_id`),
  KEY `idx_product_platform` (`platform_id`),
  KEY `idx_product_partner` (`partner_id`),
  KEY `idx_product_approval` (`approval_status`),
  KEY `idx_product_publication` (`publication_status`),
  KEY `idx_product_featured` (`is_featured`),
  KEY `idx_product_trending` (`is_trending`),
  KEY `idx_product_clicks` (`clicks_count`),
  CONSTRAINT `fk_prod_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_prod_platform` FOREIGN KEY (`platform_id`) REFERENCES `affiliate_platforms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_prod_partner` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_prod_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. Table: product_clicks
-- Analytics tracking for outbound affiliate referral clicks
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `product_clicks`;
CREATE TABLE `product_clicks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT UNSIGNED NOT NULL,
  `partner_id` INT UNSIGNED NULL,
  `platform_id` INT UNSIGNED NOT NULL,
  `affiliate_url` TEXT NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  `referrer` VARCHAR(255) NULL,
  `clicked_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_click_product` (`product_id`),
  KEY `idx_click_partner` (`partner_id`),
  KEY `idx_click_time` (`clicked_at`),
  CONSTRAINT `fk_click_prod` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_click_partner` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_click_platform` FOREIGN KEY (`platform_id`) REFERENCES `affiliate_platforms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 9. Table: product_status_history
-- Audit log of status transitions (Pending -> Approved, Rejected, etc.)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `product_status_history`;
CREATE TABLE `product_status_history` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT UNSIGNED NOT NULL,
  `previous_status` VARCHAR(50) NOT NULL,
  `new_status` VARCHAR(50) NOT NULL,
  `changed_by_admin_id` INT UNSIGNED NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_history_product` (`product_id`),
  CONSTRAINT `fk_hist_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hist_admin` FOREIGN KEY (`changed_by_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. Table: admin_activity_logs
-- Comprehensive administrative audit log
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `admin_activity_logs`;
CREATE TABLE `admin_activity_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_id` INT UNSIGNED NULL,
  `action` VARCHAR(100) NOT NULL,
  `target_type` VARCHAR(50) NOT NULL,
  `target_id` VARCHAR(50) NULL,
  `details` TEXT NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_admin_log_admin` (`admin_id`),
  KEY `idx_admin_log_time` (`created_at`),
  CONSTRAINT `fk_log_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 11. Table: sessions
-- Server-side session store for Express sessions
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `session_id` VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
  `expires` INT UNSIGNED NOT NULL,
  `data` MEDIUMTEXT COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- SEED DATA (Ready for Immediate Testing & Production Deployment)
-- =====================================================================

-- Default Administrator
-- Credentials: admin@apnipehchaan.com / admin123 (both plain password and bcrypt hash stored)
INSERT INTO `admins` (`id`, `username`, `email`, `password`, `password_hash`, `full_name`, `role`, `is_active`) VALUES
(1, 'superadmin', 'admin@apnipehchaan.com', 'admin123', '$2b$10$MCcrS7s9EjwgJ29cYqipQupgvibmI361F7ZdczUWfKWTc/qxqxpFu', 'Platform Administrator', 'superadmin', 1)
ON DUPLICATE KEY UPDATE `username`=`username`, `password`='admin123';

-- Website Settings
INSERT INTO `website_settings` (`setting_key`, `setting_value`, `setting_group`, `description`) VALUES
('website_name', 'Apni Pehchaan', 'brand', 'Public business & platform name'),
('site_title', 'Apni Pehchaan - Your Style Your Identity', 'brand', 'SEO Title for homepage'),
('tagline', 'Your Style Your Identity', 'brand', 'Official brand tagline'),
('logo_url', '/images/ap_logo.svg', 'brand', 'Header and branding logo'),
('favicon_url', '/favicon.ico', 'brand', 'Browser favicon URL'),
('contact_email', 'support@apnipehchaan.com', 'contact', 'Customer support email address'),
('contact_phone', '+91 98765 43210', 'contact', 'Customer support helpline'),
('contact_address', 'Level 4, Business Tower, Connaught Place, New Delhi, 110001, India', 'contact', 'Physical office address'),
('social_youtube', 'https://youtube.com/@apnipehchaan', 'social', 'Official YouTube channel link'),
('social_instagram', 'https://instagram.com/apnipehchaan', 'social', 'Official Instagram profile link'),
('social_whatsapp', 'https://wa.me/919876543210', 'social', 'Official WhatsApp direct chat link'),
('social_facebook', 'https://facebook.com/apnipehchaan', 'social', 'Official Facebook page link'),
('social_whatsapp_channel', 'https://whatsapp.com/channel/apnipehchaan', 'social', 'Official WhatsApp Broadcast Channel'),
('footer_attribution', '© 2026 Apni Pehchaan. All Rights Reserved. Design by Happiiz Business Solutions.', 'legal', 'Mandatory copyright & design attribution'),
('affiliate_disclosure', 'Apni Pehchaan is a participant in affiliate advertising programs including Amazon Associates, Flipkart Affiliate, and Meesho Influencer Program designed to provide a means for sites to earn referral fees by advertising and linking to merchant platforms at no extra cost to buyers.', 'legal', 'Official regulatory affiliate disclosure')
ON DUPLICATE KEY UPDATE `setting_value`=VALUES(`setting_value`);

-- Categories
INSERT INTO `categories` (`id`, `name`, `slug`, `image_url`, `icon_name`, `display_order`, `is_active`) VALUES
(1, 'Electronics', 'electronics', '/images/categories/electronics.svg', 'Smartphone', 1, 1),
(2, 'Fashion', 'fashion', '/images/categories/fashion.svg', 'Shirt', 2, 1),
(3, 'Home & Living', 'home-living', '/images/categories/home.svg', 'Armchair', 3, 1),
(4, 'Beauty & Personal Care', 'beauty', '/images/categories/beauty.svg', 'Sparkles', 4, 1),
(5, 'Sports & Fitness', 'sports', '/images/categories/sports.svg', 'Dumbbell', 5, 1),
(6, 'Toys & Baby', 'toys', '/images/categories/toys.svg', 'Smile', 6, 1),
(7, 'Footwear', 'footwear', '/images/categories/footwear.svg', 'Footprints', 7, 1),
(8, 'Deals & Clearance', 'deals', '/images/categories/deals.svg', 'Tag', 8, 1)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Affiliate Platforms
INSERT INTO `affiliate_platforms` (`id`, `name`, `slug`, `logo_url`, `badge_color`, `base_url`, `display_order`, `is_active`) VALUES
(1, 'Amazon', 'amazon', '/images/platforms/amazon.svg', '#FF9900', 'https://www.amazon.in', 1, 1),
(2, 'Flipkart', 'flipkart', '/images/platforms/flipkart.svg', '#2874F0', 'https://www.flipkart.com', 2, 1),
(3, 'Meesho', 'meesho', '/images/platforms/meesho.svg', '#9B27B0', 'https://www.meesho.com', 3, 1),
(4, 'Myntra', 'myntra', '/images/platforms/myntra.svg', '#FF3F6C', 'https://www.myntra.com', 4, 1),
(5, 'Ajio', 'ajio', '/images/platforms/ajio.svg', '#2C4152', 'https://www.ajio.com', 5, 1)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Banners (Matching Image 1 Hero & Promotional Sections)
INSERT INTO `banners` (`id`, `title`, `subtitle`, `image_url`, `cta_text`, `cta_link`, `badge_text`, `banner_type`, `display_order`, `is_active`) VALUES
(1, 'Upgrade Your Everyday', 'Top brands. Great prices. Handpicked recommendations for you.', '/images/banners/hero_audio_lifestyle.svg', 'Shop Now', '#featured', 'New Arrivals', 'HERO', 1, 1),
(2, 'Festive Style & Fashion', 'Discover traditional and modern wear with top discounts across platforms.', '/images/banners/hero_fashion_style.svg', 'Explore Fashion', '#trending', 'Exclusive Offers', 'HERO', 2, 1),
(3, 'Summer Sale Up to 50% OFF', 'Special seasonal discount collections vetted by verified partners.', '/images/banners/promo_summer.svg', 'Shop Now', '#deals', 'Limited Time', 'PROMO_STRIP', 1, 1),
(4, 'Top Brands Best Deals', 'Curated luxury fashion, electronics, and accessories in one place.', '/images/banners/promo_brands.svg', 'Shop Now', '#featured', 'Editor Pick', 'PROMO_STRIP', 2, 1)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- Sample Approved Partners with AP00001 format
-- Credentials: password123 (both plain password and bcrypt hash stored)
INSERT INTO `partners` (`id`, `partner_id`, `full_name`, `email`, `mobile_number`, `password`, `password_hash`, `profile_image`, `status`, `created_at`) VALUES
(1, 'AP00001', 'Rohan Sharma', 'rohan.sharma@example.com', '9811223344', 'password123', '$2b$10$GjGmCd9XW2OJt/S9cS75Z.EIEVFrS9vnk5yYq9Kxc9G7K2Gg.P9yu', '/images/avatars/partner_rohan.svg', 'APPROVED', NOW()),
(2, 'AP00002', 'Priya Verma', 'priya.verma@example.com', '9822334455', 'password123', '$2b$10$GjGmCd9XW2OJt/S9cS75Z.EIEVFrS9vnk5yYq9Kxc9G7K2Gg.P9yu', '/images/avatars/partner_priya.svg', 'APPROVED', NOW()),
(3, 'AP00003', 'Amit Patel', 'amit.patel@example.com', '9833445566', 'password123', '$2b$10$GjGmCd9XW2OJt/S9cS75Z.EIEVFrS9vnk5yYq9Kxc9G7K2Gg.P9yu', '/images/avatars/partner_amit.svg', 'APPROVED', NOW()),
(4, 'AP00004', 'Sneha Kulkarni', 'sneha.k@example.com', '9844556677', 'password123', '$2b$10$GjGmCd9XW2OJt/S9cS75Z.EIEVFrS9vnk5yYq9Kxc9G7K2Gg.P9yu', '/images/avatars/partner_sneha.svg', 'PENDING', NOW())
ON DUPLICATE KEY UPDATE `full_name`=VALUES(`full_name`), `password`='password123';

-- Sample Approved and Published Products (Matching Layout in Image 1)
INSERT INTO `products` (`id`, `product_name`, `slug`, `image_url`, `description`, `category_id`, `platform_id`, `price`, `original_mrp`, `currency`, `rating`, `reviews_count`, `affiliate_url`, `added_by_role`, `partner_id`, `approval_status`, `publication_status`, `is_featured`, `is_trending`, `display_priority`, `clicks_count`) VALUES
(1, 'Wireless Over-Ear Noise Cancelling Headphones', 'wireless-over-ear-headphones', '/images/products/headphones.svg', 'Premium Hi-Res wireless audio with active noise cancellation and 40-hour battery life.', 1, 1, 2999.00, 4999.00, 'INR', 4.8, 120, 'https://www.amazon.in/dp/B09XYZHEAD', 'PARTNER', 1, 'APPROVED', 'PUBLISHED', 1, 1, 10, 84),
(2, 'Ultra Lightweight Breathable Running Shoes', 'running-shoes-white', '/images/products/running_shoes.svg', 'Engineered mesh running shoes with cushioned responsive midsole for maximum comfort.', 7, 2, 1899.00, 2999.00, 'INR', 4.6, 98, 'https://www.flipkart.com/running-shoes/p/itm123shoes', 'PARTNER', 2, 'APPROVED', 'PUBLISHED', 1, 1, 9, 62),
(3, 'Smart Fitness Tracker Watch with AMOLED Display', 'smart-watch-black', '/images/products/smartwatch.svg', 'Always-on AMOLED display with 24/7 heart rate, SpO2 sensor, and 120 sports tracking modes.', 1, 1, 3499.00, 5999.00, 'INR', 4.7, 210, 'https://www.amazon.in/dp/B08SMARTWATCH', 'PARTNER', 1, 'APPROVED', 'PUBLISHED', 1, 0, 8, 145),
(4, 'Water-Resistant Multi-Compartment Travel Backpack', 'travel-backpack-green', '/images/products/backpack.svg', 'Durable urban travel backpack with padded laptop sleeve and anti-theft hidden pocket.', 2, 3, 1299.00, 2499.00, 'INR', 4.5, 86, 'https://www.meesho.com/travel-backpack/p/456back', 'PARTNER', 3, 'APPROVED', 'PUBLISHED', 1, 0, 7, 51),
(5, 'Modern Velvet Ergonomic Accent Lounge Armchair', 'velvet-accent-armchair', '/images/products/armchair.svg', 'Luxurious velvet upholstered armchair with solid wooden tapered legs for modern living rooms.', 3, 2, 7999.00, 12999.00, 'INR', 4.9, 44, 'https://www.flipkart.com/velvet-armchair/p/itm789chair', 'PARTNER', 2, 'APPROVED', 'PUBLISHED', 0, 1, 6, 29),
(6, 'Natural Vitamin C Face Serum & Radiance Booster', 'vitamin-c-radiance-serum', '/images/products/serum.svg', 'Antioxidant-rich organic face serum for luminous, hydrated, and youthful skin texture.', 4, 3, 599.00, 999.00, 'INR', 4.8, 175, 'https://www.meesho.com/face-serum/p/789serum', 'PARTNER', 3, 'APPROVED', 'PUBLISHED', 0, 1, 5, 93),
(7, 'Solid Cotton Casual Slim Fit Button-Down Shirt', 'cotton-casual-slim-shirt', '/images/products/shirt.svg', 'Breathable 100% combed cotton casual shirt ideal for workplace and weekend outings.', 2, 4, 899.00, 1799.00, 'INR', 4.4, 63, 'https://www.myntra.com/casual-shirt/p/shirt101', 'PARTNER', 1, 'APPROVED', 'PUBLISHED', 0, 1, 4, 38),
(8, 'Adjustable High-Density Neoprene Dumbbell Set', 'adjustable-dumbbell-set', '/images/products/dumbbell.svg', 'Non-slip ergonomic neoprene coated dumbbells perfect for full-body home workouts.', 5, 1, 1499.00, 2499.00, 'INR', 4.6, 52, 'https://www.amazon.in/dp/B07DUMBBELL', 'ADMIN', NULL, 'APPROVED', 'PUBLISHED', 0, 0, 3, 19)
ON DUPLICATE KEY UPDATE `product_name`=VALUES(`product_name`);
