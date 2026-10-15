export interface Product {
  id: number;
  product_name: string;
  slug: string;
  image_url: string;
  description?: string;
  category_id: number;
  category_name?: string;
  platform_id: number;
  platform_name?: string;
  platform_badge_color?: string;
  price?: number | null;
  original_mrp?: number | null;
  currency: string;
  rating: number;
  reviews_count: number;
  affiliate_url: string;
  added_by_role: 'ADMIN' | 'PARTNER';
  partner_id?: number | null;
  partner_code?: string | null;
  partner_name?: string | null;
  partner_avatar?: string | null;
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  publication_status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  rejection_reason?: string | null;
  is_featured: number | boolean;
  is_trending: number | boolean;
  display_priority: number;
  clicks_count: number;
  created_at: string;
  published_at?: string | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  image_url?: string;
  icon_name?: string;
  display_order: number;
  is_active: number | boolean;
}

export interface AffiliatePlatform {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
  badge_color: string;
  base_url?: string;
  display_order: number;
  is_active: number | boolean;
}

export interface Partner {
  id: number;
  partner_id: string; // e.g. AP00001
  full_name: string;
  email: string;
  mobile_number: string;
  profile_image?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  rejection_reason?: string | null;
  created_at: string;
}

export interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  image_url: string;
  cta_text: string;
  cta_link: string;
  badge_text?: string;
  banner_type: 'HERO' | 'PROMO_STRIP' | 'CATEGORY_HIGHLIGHT';
  display_order: number;
  is_active: number | boolean;
}

export interface WebsiteSettings {
  website_name: string;
  site_title: string;
  tagline: string;
  logo_url: string;
  favicon_url?: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  social_youtube: string;
  social_instagram: string;
  social_whatsapp: string;
  social_facebook: string;
  social_whatsapp_channel: string;
  footer_attribution: string;
  affiliate_disclosure: string;
}

export interface PartnerStats {
  total_products: number;
  pending_products: number;
  approved_products: number;
  rejected_products: number;
  total_clicks: number;
}
