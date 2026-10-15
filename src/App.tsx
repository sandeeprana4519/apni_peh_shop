import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BannerCarousel } from './components/BannerCarousel';
import { CategoryScroll } from './components/CategoryScroll';
import { PartnerShowcase } from './components/PartnerShowcase';
import { PlatformScroll } from './components/PlatformScroll';
import { ProductCarousel } from './components/ProductCarousel';
import { ProductGrid } from './components/ProductGrid';
import { PromoStrip } from './components/PromoStrip';
import { Newsletter } from './components/Newsletter';
import { Footer } from './components/Footer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { PartnerAuthModal } from './components/PartnerAuthModal';
import { PartnerDashboard } from './components/PartnerDashboard';
import { AdminCRMModal } from './components/AdminCRMModal';
import { LegalModal } from './components/LegalModal';
import { WishlistModal } from './components/WishlistModal';
import { Product, Category, AffiliatePlatform, Partner, Banner, WebsiteSettings } from './types';

export default function App() {
  // Data states
  const [settings, setSettings] = useState<WebsiteSettings>({
    website_name: 'Apni Pehchaan',
    site_title: 'Apni Pehchaan - Your Style Your Identity',
    tagline: 'Your Style Your Identity',
    logo_url: '/logo.svg',
    contact_email: 'support@apnipehchaan.com',
    contact_phone: '+91 98765 43210',
    contact_address: 'Level 4, Business Tower, Connaught Place, New Delhi, 110001, India',
    social_youtube: 'https://youtube.com/@apnipehchaan',
    social_instagram: 'https://instagram.com/apnipehchaan',
    social_whatsapp: 'https://wa.me/919876543210',
    social_facebook: 'https://facebook.com/apnipehchaan',
    social_whatsapp_channel: 'https://whatsapp.com/channel/apnipehchaan',
    footer_attribution: '© 2026 Apni Pehchaan. All Rights Reserved. Design by Happiiz Business Solutions.',
    affiliate_disclosure:
      'Apni Pehchaan is a participant in affiliate advertising programs including Amazon Associates, Flipkart Affiliate, and Meesho Influencer Program designed to provide a means for sites to earn referral fees by advertising and linking to merchant platforms at no extra cost to buyers.',
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [platforms, setPlatforms] = useState<AffiliatePlatform[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [approvedPartners, setApprovedPartners] = useState<Partner[]>([]);

  // Products state
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [totalCatalogCount, setTotalCatalogCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<number | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('newest');

  // Partner authentication state
  const [partnerSession, setPartnerSession] = useState<any | null>(null);

  // Wishlist
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('apni_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals state
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);
  const [partnerAuthModalOpen, setPartnerAuthModalOpen] = useState(false);
  const [partnerAuthInitialTab, setPartnerAuthInitialTab] = useState<'login' | 'register'>('login');
  const [partnerDashboardOpen, setPartnerDashboardOpen] = useState(false);
  const [adminCRMOpen, setAdminCRMOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'about' | 'contact' | 'privacy' | 'terms' | 'disclosure' | 'disclaimer'>('about');
  const [wishlistModalOpen, setWishlistModalOpen] = useState(false);

  // Sync wishlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('apni_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error(e);
    }
  }, [wishlist]);

  const toggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const isWishlisted = (productId: number) => wishlist.some((p) => p.id === productId);

  // Fetch initial public bootstrap data
  const fetchPublicBootstrapData = async () => {
    try {
      const [setRes, catRes, platRes, banRes, partRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/categories'),
        fetch('/api/platforms'),
        fetch('/api/banners'),
        fetch('/api/partners/approved'),
      ]);

      const [setData, catData, platData, banData, partData] = await Promise.all([
        setRes.json(),
        catRes.json(),
        platRes.json(),
        banRes.json(),
        partRes.json(),
      ]);

      if (setData.success && setData.settings) {
        setSettings((prev) => ({ ...prev, ...setData.settings }));
      }
      if (catData.success && catData.categories) setCategories(catData.categories);
      if (platData.success && platData.platforms) setPlatforms(platData.platforms);
      if (banData.success && banData.banners) setBanners(banData.banners);
      if (partData.success && partData.partners) setApprovedPartners(partData.partners);
    } catch (err) {
      console.error('Error fetching bootstrap data:', err);
    }
  };

  // Check active partner session on mount
  const checkPartnerSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.authenticated && data.partner) {
        setPartnerSession(data.partner);
      } else {
        setPartnerSession(null);
      }
    } catch {
      setPartnerSession(null);
    }
  };

  // Fetch Featured, Trending, and Latest carousels
  const fetchCarouselProducts = async () => {
    try {
      const [featRes, trendRes, latestRes] = await Promise.all([
        fetch('/api/products?collection=featured&limit=8'),
        fetch('/api/products?collection=trending&limit=8'),
        fetch('/api/products?sort=newest&limit=8'),
      ]);

      const [featData, trendData, latestData] = await Promise.all([
        featRes.json(),
        trendRes.json(),
        latestRes.json(),
      ]);

      if (featData.success) setFeaturedProducts(featData.products);
      if (trendData.success) setTrendingProducts(trendData.products);
      if (latestData.success) setLatestProducts(latestData.products);
    } catch (err) {
      console.error('Error fetching carousels:', err);
    }
  };

  // Fetch filtered catalog products
  const fetchCatalogProducts = async (page: number = 1, append: boolean = false) => {
    setLoadingCatalog(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory !== null) params.append('category_id', String(selectedCategory));
      if (selectedPlatform !== null) params.append('platform_id', String(selectedPlatform));
      if (selectedPartner !== null) params.append('partner_id', String(selectedPartner));
      if (sortBy) params.append('sort', sortBy);
      params.append('page', String(page));
      params.append('limit', '12');

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        if (append) {
          setAllProducts((prev) => [...prev, ...data.products]);
        } else {
          setAllProducts(data.products);
        }
        setTotalCatalogCount(data.pagination.total);
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    fetchPublicBootstrapData();
    checkPartnerSession();
    fetchCarouselProducts();
  }, []);

  // Re-fetch catalog on filter/search/sort change
  useEffect(() => {
    setCurrentPage(1);
    fetchCatalogProducts(1, false);
  }, [searchQuery, selectedCategory, selectedPlatform, selectedPartner, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedPlatform(null);
    setSelectedPartner(null);
    setSortBy('newest');
  };

  const handleLogoutPartner = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setPartnerSession(null);
      setPartnerDashboardOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenLegalModal = (tab: 'about' | 'contact' | 'privacy' | 'terms' | 'disclosure' | 'disclaimer') => {
    setLegalModalTab(tab);
    setLegalModalOpen(true);
  };

  const handleOpenPartnerAuth = (initialTab: 'login' | 'register' = 'login') => {
    setPartnerAuthInitialTab(initialTab);
    setPartnerAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* 1. Header with logo, website name, navigation, search bar, and Partner Login */}
      <Header
        settings={settings}
        categories={categories}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectCategory={setSelectedCategory}
        selectedCategory={selectedCategory}
        partnerSession={partnerSession}
        onOpenPartnerAuth={handleOpenPartnerAuth}
        onOpenPartnerDashboard={() => setPartnerDashboardOpen(true)}
        onLogoutPartner={handleLogoutPartner}
        onOpenAdminCRM={() => setAdminCRMOpen(true)}
        wishlistCount={wishlist.length}
        onOpenWishlist={() => setWishlistModalOpen(true)}
      />

      {/* Main Homepage Flow (Strictly in requested order 1 to 9) */}
      <main className="flex-1">
        {/* 2. Scrolling promotional banner carousel */}
        <BannerCarousel
          banners={banners.filter((b) => b.banner_type === 'HERO')}
          onCtaClick={() => {
            const el = document.getElementById('browse-all-products');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 3. Horizontally scrolling categories with category image and name */}
        <CategoryScroll
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(catId) => {
            setSelectedCategory(catId);
            const el = document.getElementById('browse-all-products');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 4. Horizontally scrolling approved partners with profile image and name */}
        <PartnerShowcase
          partners={approvedPartners}
          selectedPartner={selectedPartner}
          onSelectPartner={(partnerId) => {
            setSelectedPartner(partnerId);
            const el = document.getElementById('browse-all-products');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 5. Horizontally scrolling affiliate platforms with logo and name */}
        <PlatformScroll
          platforms={platforms}
          selectedPlatform={selectedPlatform}
          onSelectPlatform={(platId) => {
            setSelectedPlatform(platId);
            const el = document.getElementById('browse-all-products');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 6. Featured Products carousel */}
        <div id="featured">
          <ProductCarousel
            title="Featured Products"
            subtitle="Top vetted picks with high ratings and verified discount pricing"
            products={featuredProducts}
            onOpenDetails={setSelectedProductDetails}
            onViewAll={() => {
              handleResetFilters();
              const el = document.getElementById('browse-all-products');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            isWishlisted={isWishlisted}
            onToggleWishlist={toggleWishlist}
          />
        </div>

        {/* Promotional Split Strip (Section 6 from Image 1) */}
        <PromoStrip
          onPromoClick={() => {
            const el = document.getElementById('browse-all-products');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 7. Trending Products carousel */}
        <div id="trending">
          <ProductCarousel
            title="Trending Recommendations"
            subtitle="Most viewed and active items popular with online shoppers this week"
            products={trendingProducts}
            onOpenDetails={setSelectedProductDetails}
            onViewAll={() => {
              setSortBy('popular');
              const el = document.getElementById('browse-all-products');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            isWishlisted={isWishlisted}
            onToggleWishlist={toggleWishlist}
          />
        </div>

        {/* 8. Add New / Latest Products carousel */}
        <div id="latest">
          <ProductCarousel
            title="Latest Product Arrivals"
            subtitle="Freshly approved submissions recently reviewed by verified partners"
            products={latestProducts}
            onOpenDetails={setSelectedProductDetails}
            onViewAll={() => {
              setSortBy('newest');
              const el = document.getElementById('browse-all-products');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            isWishlisted={isWishlisted}
            onToggleWishlist={toggleWishlist}
          />
        </div>

        {/* Comprehensive Full Catalog Grid with Multi-Filter Search & Pagination */}
        <ProductGrid
          products={allProducts}
          categories={categories}
          platforms={platforms}
          partners={approvedPartners}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedPlatform={selectedPlatform}
          onSelectPlatform={setSelectedPlatform}
          selectedPartner={selectedPartner}
          onSelectPartner={setSelectedPartner}
          sortBy={sortBy}
          onSortChange={setSortBy}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onResetFilters={handleResetFilters}
          onOpenDetails={setSelectedProductDetails}
          isWishlisted={isWishlisted}
          onToggleWishlist={toggleWishlist}
          loading={loadingCatalog}
          totalCount={totalCatalogCount}
          currentPage={currentPage}
          totalPages={totalPages}
          onLoadMore={() => {
            const nextPage = currentPage + 1;
            fetchCatalogProducts(nextPage, true);
          }}
        />

        {/* Section 7 from Image 1: Newsletter subscription */}
        <Newsletter />
      </main>

      {/* 9. Complete footer with legal pages, contact information, social links, and Partner Registration */}
      <Footer
        settings={settings}
        onOpenLegalModal={handleOpenLegalModal}
        onOpenPartnerAuth={handleOpenPartnerAuth}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProductDetails}
        onClose={() => setSelectedProductDetails(null)}
      />

      {/* Partner Registration & Login Modal */}
      <PartnerAuthModal
        isOpen={partnerAuthModalOpen}
        initialTab={partnerAuthInitialTab}
        onClose={() => setPartnerAuthModalOpen(false)}
        onLoginSuccess={(partner) => {
          setPartnerSession(partner);
          setPartnerDashboardOpen(true);
        }}
        onOpenLegalModal={(t) => {
          setLegalModalTab(t);
          setLegalModalOpen(true);
        }}
      />

      {/* Partner Portal / Dashboard */}
      {partnerDashboardOpen && partnerSession && (
        <PartnerDashboard
          partner={partnerSession}
          categories={categories}
          platforms={platforms}
          onLogout={handleLogoutPartner}
          onClose={() => setPartnerDashboardOpen(false)}
        />
      )}

      {/* Admin CRM Modal (Review Partners & Moderate Products) */}
      <AdminCRMModal
        isOpen={adminCRMOpen}
        onClose={() => setAdminCRMOpen(false)}
        settings={settings}
        onSettingsUpdated={(updated) => setSettings(updated)}
        onRefreshPublicData={() => {
          fetchPublicBootstrapData();
          fetchCarouselProducts();
          fetchCatalogProducts(1, false);
        }}
      />

      {/* Legal & Corporate Information Modal */}
      <LegalModal
        isOpen={legalModalOpen}
        tab={legalModalTab}
        onClose={() => setLegalModalOpen(false)}
        settings={settings}
      />

      {/* Wishlist Modal */}
      <WishlistModal
        isOpen={wishlistModalOpen}
        onClose={() => setWishlistModalOpen(false)}
        wishlist={wishlist}
        onRemoveFromWishlist={(id) => setWishlist((prev) => prev.filter((p) => p.id !== id))}
        onOpenDetails={setSelectedProductDetails}
      />
    </div>
  );
}
