import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Clock,
  Users,
  Grid,
  ShoppingCart,
  Image as ImageIcon,
  Settings,
  UserCheck,
  LogOut,
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Check,
  XCircle,
  Eye,
  Trash2,
  Edit,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Upload,
  Star,
  Flame,
  ArrowUpDown,
  History,
  KeyRound,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Category, AffiliatePlatform, WebsiteSettings, Product } from '../../types';

interface AdminPortalProps {
  admin: any;
  onLogout: () => void;
  onBackToStore: () => void;
  onStoreDataChanged: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  admin,
  onLogout,
  onBackToStore,
  onStoreDataChanged,
}) => {
  const [currentTab, setCurrentTab] = useState<
    'overview' | 'products' | 'pending' | 'partners' | 'categories' | 'platforms' | 'banners' | 'settings' | 'profile'
  >('overview');

  // Stats
  const [stats, setStats] = useState<any>({
    total_partners: 0,
    pending_partners: 0,
    approved_partners: 0,
    suspended_partners: 0,
    total_products: 0,
    pending_products: 0,
    published_products: 0,
    rejected_hidden_products: 0,
    total_categories: 0,
    total_platforms: 0,
    total_clicks: 0,
  });

  // Data lists
  const [productsList, setProductsList] = useState<any[]>([]);
  const [partnersList, setPartnersList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [platformsList, setPlatformsList] = useState<any[]>([]);
  const [bannersList, setBannersList] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings>({} as any);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters for products
  const [prodSearch, setProdSearch] = useState('');
  const [prodApprovalFilter, setProdApprovalFilter] = useState('');
  const [prodPubFilter, setProdPubFilter] = useState('');

  // Modals & form states
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [rejectingProduct, setRejectingProduct] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [productHistory, setProductHistory] = useState<any[] | null>(null);

  // Partner management states
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnerStatusFilter, setPartnerStatusFilter] = useState('');
  const [selectedPartnerProducts, setSelectedPartnerProducts] = useState<any | null>(null);
  const [resettingPartnerPassword, setResettingPartnerPassword] = useState<any | null>(null);
  const [newPartnerPassword, setNewPartnerPassword] = useState('');

  // Category management form
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Tag');

  // Platform management form
  const [newPlatName, setNewPlatName] = useState('');
  const [newPlatColor, setNewPlatColor] = useState('#2563EB');
  const [newPlatUrl, setNewPlatUrl] = useState('');

  // Banner form
  const [showAddBannerModal, setShowAddBannerModal] = useState(false);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerType, setBannerType] = useState<'HERO' | 'PROMO_STRIP'>('HERO');
  const [bannerCtaText, setBannerCtaText] = useState('Shop Now');
  const [bannerCtaLink, setBannerCtaLink] = useState('#featured');

  // Admin Add Product Form State (Immediate publication)
  const [formName, setFormName] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPlatform, setFormPlatform] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formMrp, setFormMrp] = useState('');
  const [formAffiliateUrl, setFormAffiliateUrl] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState('10');
  const [formFeatured, setFormFeatured] = useState(false);
  const [formTrending, setFormTrending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Admin Profile Settings form state
  const [adminFullName, setAdminFullName] = useState(admin?.full_name || '');
  const [adminEmail, setAdminEmail] = useState(admin?.email || '');
  const [adminCurrentPass, setAdminCurrentPass] = useState('');
  const [adminNewPass, setAdminNewPass] = useState('');

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const [ovRes, logsRes, setsRes] = await Promise.all([
        fetch('/api/admin/overview'),
        fetch('/api/admin/logs'),
        fetch('/api/admin/settings'),
      ]);

      const [ovData, logsData, setsData] = await Promise.all([
        ovRes.json(),
        logsRes.json(),
        setsRes.json(),
      ]);

      if (ovData.success) setStats(ovData.stats);
      if (logsData.success) setActivityLogs(logsData.logs || []);
      if (setsData.success) setWebsiteSettings(setsData.settings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (prodSearch) params.append('search', prodSearch);
      if (prodApprovalFilter) params.append('approval_status', prodApprovalFilter);
      if (prodPubFilter) params.append('publication_status', prodPubFilter);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const data = await res.json();
      if (data.success) setProductsList(data.products);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPartners = async () => {
    try {
      const params = new URLSearchParams();
      if (partnerSearch) params.append('search', partnerSearch);
      if (partnerStatusFilter) params.append('status', partnerStatusFilter);

      const res = await fetch(`/api/admin/partners?${params.toString()}`);
      const data = await res.json();
      if (data.success) setPartnersList(data.partners);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTaxonomies = async () => {
    try {
      const [cRes, pRes, bRes] = await Promise.all([
        fetch('/api/admin/categories'),
        fetch('/api/admin/platforms'),
        fetch('/api/admin/banners'),
      ]);
      const [cData, pData, bData] = await Promise.all([cRes.json(), pRes.json(), bRes.json()]);
      if (cData.success) setCategoriesList(cData.categories);
      if (pData.success) setPlatformsList(pData.platforms);
      if (bData.success) setBannersList(bData.banners);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOverviewData();
    fetchProducts();
    fetchPartners();
    fetchTaxonomies();
  }, []);

  useEffect(() => {
    if (currentTab === 'products' || currentTab === 'pending') fetchProducts();
    if (currentTab === 'partners') fetchPartners();
    if (currentTab === 'categories' || currentTab === 'platforms' || currentTab === 'banners') fetchTaxonomies();
    if (currentTab === 'overview') fetchOverviewData();
  }, [currentTab]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Image Upload helper
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    setUploadingImage(true);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setter(data.fileUrl);
        showToast('success', 'Image uploaded successfully from device.');
      } else {
        showToast('error', data.message || 'Image upload failed.');
      }
    } catch {
      showToast('error', 'Network error uploading image.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Admin create product
  const handleCreateAdminProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: formName,
          image_url: formImage,
          category_id: formCategory,
          platform_id: formPlatform,
          price: formPrice,
          original_mrp: formMrp,
          affiliate_url: formAffiliateUrl,
          description: formDesc,
          display_priority: formPriority,
          is_featured: formFeatured ? 1 : 0,
          is_trending: formTrending ? 1 : 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Admin product created and published immediately!');
        setShowAddProductModal(false);
        // reset form
        setFormName('');
        setFormImage('');
        setFormCategory('');
        setFormPlatform('');
        setFormPrice('');
        setFormMrp('');
        setFormAffiliateUrl('');
        setFormDesc('');
        fetchProducts();
        fetchOverviewData();
        onStoreDataChanged();
      } else {
        showToast('error', data.message || 'Failed to create product.');
      }
    } catch {
      showToast('error', 'Network error creating product.');
    }
  };

  // Moderate Partner Product
  const handleModerateProduct = async (productId: number, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}/moderate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approval_status: status,
          rejection_reason: reason || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Product ${status.toLowerCase()} successfully.`);
        setRejectingProduct(null);
        setRejectionReason('');
        fetchProducts();
        fetchOverviewData();
        onStoreDataChanged();
      } else {
        showToast('error', data.message);
      }
    } catch {
      showToast('error', 'Network error updating product moderation.');
    }
  };

  // Toggle Publication (Published vs Draft vs Archived/Hidden)
  const handleTogglePublication = async (productId: number, newStatus: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') => {
    try {
      const res = await fetch(`/api/admin/products/${productId}/publication`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publication_status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message);
        fetchProducts();
        onStoreDataChanged();
      } else {
        showToast('error', data.message);
      }
    } catch {
      showToast('error', 'Error changing publication state.');
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this product? This action is irreversible.')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Product deleted permanently.');
        fetchProducts();
        fetchOverviewData();
        onStoreDataChanged();
      } else {
        showToast('error', data.message);
      }
    } catch {
      showToast('error', 'Error deleting product.');
    }
  };

  // Moderate Partner
  const handleUpdatePartnerStatus = async (partnerId: number, status: string, reason?: string) => {
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejection_reason: reason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message);
        fetchPartners();
        fetchOverviewData();
        onStoreDataChanged();
      } else {
        showToast('error', data.message);
      }
    } catch {
      showToast('error', 'Error updating partner status.');
    }
  };

  // Reset Partner Password
  const handleResetPartnerPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingPartnerPassword || !newPartnerPassword) return;
    try {
      const res = await fetch(`/api/admin/partners/${resettingPartnerPassword.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPartnerPassword }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Partner password reset successfully.');
        setResettingPartnerPassword(null);
        setNewPartnerPassword('');
      } else {
        showToast('error', data.message);
      }
    } catch {
      showToast('error', 'Error resetting partner password.');
    }
  };

  // Category Actions
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName, icon_name: newCatIcon }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Category created successfully.');
        setNewCatName('');
        fetchTaxonomies();
        onStoreDataChanged();
      } else {
        showToast('error', data.message);
      }
    } catch {
      showToast('error', 'Error creating category.');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Category deleted safely.');
        fetchTaxonomies();
        onStoreDataChanged();
      } else {
        showToast('error', data.message);
      }
    } catch {
      showToast('error', 'Error deleting category.');
    }
  };

  // Platform Actions
  const handleCreatePlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlatName) return;
    try {
      const res = await fetch('/api/admin/platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlatName, badge_color: newPlatColor, base_url: newPlatUrl }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Affiliate platform created.');
        setNewPlatName('');
        setNewPlatUrl('');
        fetchTaxonomies();
        onStoreDataChanged();
      } else {
        showToast('error', data.message);
      }
    } catch {
      showToast('error', 'Error creating platform.');
    }
  };

  const handleDeletePlatform = async (id: number) => {
    if (!confirm('Delete this platform?')) return;
    try {
      const res = await fetch(`/api/admin/platforms/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Platform deleted safely.');
        fetchTaxonomies();
        onStoreDataChanged();
      } else {
        showToast('error', data.message);
      }
    } catch {
      showToast('error', 'Error deleting platform.');
    }
  };

  // Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(websiteSettings),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Website settings saved to MySQL successfully.');
        onStoreDataChanged();
      } else {
        showToast('error', data.message);
      }
    } catch {
      showToast('error', 'Error saving settings.');
    }
  };

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: adminFullName,
          email: adminEmail,
          current_password: adminCurrentPass || undefined,
          new_password: adminNewPass || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Admin profile and security credentials updated.');
        setAdminCurrentPass('');
        setAdminNewPass('');
      } else {
        showToast('error', data.message);
      }
    } catch {
      showToast('error', 'Error updating admin profile.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification Banner */}
      {actionMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold transition-all border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950 border-emerald-600 text-emerald-200'
              : 'bg-rose-950 border-rose-600 text-rose-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Admin Top Navigation Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-black text-slate-950 text-sm">
            AP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight">Apni Pehchaan CRM</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {admin.role?.toUpperCase() || 'SUPERADMIN'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">Hostinger MySQL Integrated Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToStore}
            className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Storefront</span>
          </button>
          <button
            onClick={onLogout}
            className="py-1.5 px-3 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Layout Container (Sidebar + Content Area) */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 bg-slate-900/80 border-r border-slate-800 p-4 space-y-1 shrink-0 overflow-y-auto">
          <button
            onClick={() => setCurrentTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              currentTab === 'overview'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setCurrentTab('pending')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              currentTab === 'pending'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4" />
              <span>Pending Approvals</span>
            </div>
            {stats.pending_partners + stats.pending_products > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                {stats.pending_partners + stats.pending_products}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('products')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              currentTab === 'products'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products Management</span>
          </button>

          <button
            onClick={() => setCurrentTab('partners')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              currentTab === 'partners'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Partner Management</span>
          </button>

          <div className="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Catalog & Taxonomies
          </div>

          <button
            onClick={() => setCurrentTab('categories')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              currentTab === 'categories'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Categories</span>
          </button>

          <button
            onClick={() => setCurrentTab('platforms')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              currentTab === 'platforms'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Affiliate Platforms</span>
          </button>

          <button
            onClick={() => setCurrentTab('banners')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              currentTab === 'banners'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Banners & Promotions</span>
          </button>

          <div className="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Settings & System
          </div>

          <button
            onClick={() => setCurrentTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              currentTab === 'settings'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Website Settings</span>
          </button>

          <button
            onClick={() => setCurrentTab('profile')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              currentTab === 'profile'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Profile & Security</span>
          </button>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {/* TAB 1: OVERVIEW WITH ALL 10 MYSQL STATS */}
          {currentTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold font-heading text-white">Platform Dashboard</h1>
                  <p className="text-xs text-slate-400">
                    Real-time metrics calculated directly from Hostinger MySQL tables.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchOverviewData}
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Statistics</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAddProductModal(true);
                      setCurrentTab('products');
                    }}
                    className="py-1.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Admin Product</span>
                  </button>
                </div>
              </div>

              {/* 10 Required MySQL Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400">Total Partners</span>
                  <div className="text-2xl font-black text-white tabular-nums">{stats.total_partners}</div>
                  <span className="text-[10px] text-slate-500">Registered creators</span>
                </div>

                <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-4 space-y-1">
                  <span className="text-[11px] font-semibold text-amber-300">Pending Partners</span>
                  <div className="text-2xl font-black text-amber-400 tabular-nums">{stats.pending_partners}</div>
                  <span className="text-[10px] text-amber-500/80">Require review</span>
                </div>

                <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-4 space-y-1">
                  <span className="text-[11px] font-semibold text-emerald-300">Approved Partners</span>
                  <div className="text-2xl font-black text-emerald-400 tabular-nums">{stats.approved_partners}</div>
                  <span className="text-[10px] text-emerald-500/80">Active in store</span>
                </div>

                <div className="bg-rose-950/30 border border-rose-800/50 rounded-xl p-4 space-y-1">
                  <span className="text-[11px] font-semibold text-rose-300">Suspended Partners</span>
                  <div className="text-2xl font-black text-rose-400 tabular-nums">{stats.suspended_partners}</div>
                  <span className="text-[10px] text-rose-500/80">Deactivated</span>
                </div>

                <div className="bg-blue-950/30 border border-blue-800/50 rounded-xl p-4 space-y-1">
                  <span className="text-[11px] font-semibold text-blue-300">Total Products</span>
                  <div className="text-2xl font-black text-blue-400 tabular-nums">{stats.total_products}</div>
                  <span className="text-[10px] text-blue-500/80">All submissions</span>
                </div>

                <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-4 space-y-1">
                  <span className="text-[11px] font-semibold text-amber-300">Pending Products</span>
                  <div className="text-2xl font-black text-amber-400 tabular-nums">{stats.pending_products}</div>
                  <span className="text-[10px] text-amber-500/80">Require moderation</span>
                </div>

                <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-4 space-y-1">
                  <span className="text-[11px] font-semibold text-emerald-300">Published Products</span>
                  <div className="text-2xl font-black text-emerald-400 tabular-nums">{stats.published_products}</div>
                  <span className="text-[10px] text-emerald-500/80">Visible publicly</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400">Rejected / Hidden</span>
                  <div className="text-2xl font-black text-slate-300 tabular-nums">{stats.rejected_hidden_products}</div>
                  <span className="text-[10px] text-slate-500">Archived/declined</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400">Taxonomies</span>
                  <div className="text-2xl font-black text-white tabular-nums">
                    {stats.total_categories} <span className="text-xs font-normal text-slate-400">/ {stats.total_platforms}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Cats / Platforms</span>
                </div>

                <div className="bg-indigo-950/40 border border-indigo-800/50 rounded-xl p-4 space-y-1">
                  <span className="text-[11px] font-semibold text-indigo-300">Recorded Clicks</span>
                  <div className="text-2xl font-black text-indigo-400 tabular-nums">{stats.total_clicks}</div>
                  <span className="text-[10px] text-indigo-500/80">Outbound Buy Nows</span>
                </div>
              </div>

              {/* Quick Actions & Recent Audit Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Actions Alert */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Attention Required</span>
                  </h3>

                  {stats.pending_partners + stats.pending_products === 0 ? (
                    <div className="p-4 bg-slate-950 rounded-xl text-xs text-slate-400 text-center">
                      Queue is clear. No pending partner applications or product submissions.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats.pending_partners > 0 && (
                        <div className="p-3.5 bg-amber-950/40 border border-amber-800/40 rounded-xl flex items-center justify-between">
                          <span className="text-xs text-amber-200">
                            <strong>{stats.pending_partners}</strong> partner registration(s) awaiting approval
                          </span>
                          <button
                            onClick={() => setCurrentTab('pending')}
                            className="py-1 px-3 bg-amber-500 text-slate-950 font-bold rounded-md text-xs"
                          >
                            Review Applications
                          </button>
                        </div>
                      )}

                      {stats.pending_products > 0 && (
                        <div className="p-3.5 bg-blue-950/40 border border-blue-800/40 rounded-xl flex items-center justify-between">
                          <span className="text-xs text-blue-200">
                            <strong>{stats.pending_products}</strong> product submission(s) pending review
                          </span>
                          <button
                            onClick={() => setCurrentTab('pending')}
                            className="py-1 px-3 bg-blue-500 text-white font-bold rounded-md text-xs"
                          >
                            Moderate Products
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Audit Activity Logs */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-400" />
                    <span>Recent Administrative Activity Logs</span>
                  </h3>

                  {activityLogs.length === 0 ? (
                    <div className="p-4 bg-slate-950 rounded-xl text-xs text-slate-400 text-center">
                      No administrative actions logged yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                      {activityLogs.slice(0, 8).map((log) => (
                        <div
                          key={log.id}
                          className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-200">{log.action}</span>
                            <span className="text-[11px] text-slate-400 block">{log.details}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono shrink-0">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PENDING APPROVALS QUEUE */}
          {currentTab === 'pending' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold font-heading text-white">Pending Approvals Queue</h2>
                <p className="text-xs text-slate-400">
                  High-priority moderation queue for partner registration applications and product submissions.
                </p>
              </div>

              {/* Pending Partners Section */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-400" />
                    <span>Partner Applications ({partnersList.filter((p) => p.status === 'PENDING').length})</span>
                  </h3>
                </div>

                {partnersList.filter((p) => p.status === 'PENDING').length === 0 ? (
                  <div className="p-6 bg-slate-950 rounded-xl text-center text-xs text-slate-500">
                    No pending partner applications.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {partnersList
                      .filter((p) => p.status === 'PENDING')
                      .map((p) => (
                        <div
                          key={p.id}
                          className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{p.full_name}</span>
                              <span className="font-mono text-xs text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded-sm">
                                {p.partner_id}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400">
                              <span>{p.email}</span> · <span>{p.mobile_number}</span> · Registered:{' '}
                              {new Date(p.created_at).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdatePartnerStatus(p.id, 'APPROVED')}
                              className="py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve Account</span>
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Enter rejection reason (optional):');
                                if (reason !== null) handleUpdatePartnerStatus(p.id, 'REJECTED', reason);
                              }}
                              className="py-1.5 px-3.5 bg-rose-950 border border-rose-800 text-rose-300 hover:bg-rose-900 rounded-lg text-xs font-bold flex items-center gap-1.5"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Pending Products Section */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-400" />
                    <span>Product Submissions ({productsList.filter((pr) => pr.approval_status === 'PENDING').length})</span>
                  </h3>
                </div>

                {productsList.filter((pr) => pr.approval_status === 'PENDING').length === 0 ? (
                  <div className="p-6 bg-slate-950 rounded-xl text-center text-xs text-slate-500">
                    No pending product submissions awaiting review.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {productsList
                      .filter((pr) => pr.approval_status === 'PENDING')
                      .map((pr) => (
                        <div
                          key={pr.id}
                          className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={pr.image_url}
                              alt={pr.product_name}
                              className="w-14 h-14 object-contain bg-white rounded-lg p-1 border border-slate-800 shrink-0"
                            />
                            <div>
                              <h4 className="font-bold text-sm text-white line-clamp-1">{pr.product_name}</h4>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                                <span className="font-bold text-slate-200">
                                  {pr.price ? `₹${Number(pr.price).toLocaleString('en-IN')}` : 'Check Price'}
                                </span>
                                <span>·</span>
                                <span className="text-blue-400">{pr.platform_name}</span>
                                <span>·</span>
                                <span>Category: {pr.category_name}</span>
                                <span>·</span>
                                <span className="text-amber-400 font-mono">By: {pr.partner_code || 'Staff'} ({pr.partner_name})</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={pr.affiliate_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-slate-400 hover:text-blue-400 bg-slate-900 rounded-lg text-xs flex items-center gap-1"
                              title="Inspect Destination Link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Inspect Link</span>
                            </a>
                            <button
                              onClick={() => handleModerateProduct(pr.id, 'APPROVED')}
                              className="py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve & Publish</span>
                            </button>
                            <button
                              onClick={() => setRejectingProduct(pr)}
                              className="py-1.5 px-3.5 bg-rose-950 border border-rose-800 text-rose-300 hover:bg-rose-900 rounded-lg text-xs font-bold flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject...</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCTS MANAGEMENT */}
          {currentTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold font-heading text-white">Product Catalog Management</h2>
                  <p className="text-xs text-slate-400">
                    Add new products, set priority ordering, toggle featured badges, and moderate listings.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="py-2 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Admin Product</span>
                </button>
              </div>

              {/* Filters Bar */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <input
                    type="text"
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
                    placeholder="Search by product name or partner..."
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-3 text-white focus:outline-hidden focus:border-amber-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                </div>

                <select
                  value={prodApprovalFilter}
                  onChange={(e) => setProdApprovalFilter(e.target.value)}
                  className="text-xs bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-300"
                >
                  <option value="">All Approvals</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REJECTED">REJECTED</option>
                </select>

                <select
                  value={prodPubFilter}
                  onChange={(e) => setProdPubFilter(e.target.value)}
                  className="text-xs bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-300"
                >
                  <option value="">All Publications</option>
                  <option value="PUBLISHED">PUBLISHED (Live)</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="ARCHIVED">ARCHIVED (Hidden)</option>
                </select>

                <button
                  onClick={fetchProducts}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                >
                  Apply Filters
                </button>
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Product</th>
                      <th className="p-3">Platform</th>
                      <th className="p-3">Curated By</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Approval</th>
                      <th className="p-3">Visibility</th>
                      <th className="p-3">Clicks</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {productsList.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-500">
                          No products match the selected criteria.
                        </td>
                      </tr>
                    ) : (
                      productsList.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/40">
                          <td className="p-3 flex items-center gap-3">
                            <img
                              src={p.image_url}
                              alt={p.product_name}
                              className="w-10 h-10 object-contain bg-white rounded-md p-0.5 border border-slate-800 shrink-0"
                            />
                            <div className="max-w-[220px]">
                              <span className="font-bold text-white truncate block">{p.product_name}</span>
                              <span className="text-[10px] text-slate-500">{p.category_name}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className="px-2 py-0.5 text-[10px] font-bold text-white rounded-md"
                              style={{ backgroundColor: p.platform_badge_color || '#2563EB' }}
                            >
                              {p.platform_name}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-200">
                              {p.added_by_role === 'ADMIN' ? 'Staff Admin' : p.partner_name}
                            </div>
                            <div className="text-[10px] font-mono text-amber-400">{p.partner_code || 'ADMIN'}</div>
                          </td>
                          <td className="p-3 font-bold text-slate-200 tabular-nums">
                            {p.price ? `₹${Number(p.price).toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="p-3 font-mono font-bold text-amber-400 tabular-nums">
                            {p.display_priority}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.approval_status === 'APPROVED'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : p.approval_status === 'PENDING'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-rose-950 text-rose-300 border border-rose-800'
                              }`}
                            >
                              {p.approval_status}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                p.publication_status === 'PUBLISHED'
                                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {p.publication_status}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-300">{p.clicks_count || 0}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick publication toggle */}
                              {p.publication_status === 'PUBLISHED' ? (
                                <button
                                  onClick={() => handleTogglePublication(p.id, 'ARCHIVED')}
                                  className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-950 rounded-md"
                                  title="Hide from Storefront"
                                >
                                  Hide
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleTogglePublication(p.id, 'PUBLISHED')}
                                  className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-950 rounded-md"
                                  title="Publish to Storefront"
                                >
                                  Publish
                                </button>
                              )}

                              <button
                                onClick={() => setEditingProduct(p)}
                                className="p-1.5 text-slate-400 hover:text-white bg-slate-950 rounded-md"
                                title="Edit Product Details"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-950 rounded-md"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PARTNER MANAGEMENT */}
          {currentTab === 'partners' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold font-heading text-white">Partner Management</h2>
                  <p className="text-xs text-slate-400">
                    View applicant profiles, search sequential IDs, toggle account access, or reset passwords.
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <input
                    type="text"
                    value={partnerSearch}
                    onChange={(e) => setPartnerSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchPartners()}
                    placeholder="Search by Name, Partner ID (AP00001), Email, or Phone..."
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-3 text-white focus:outline-hidden focus:border-amber-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                </div>

                <select
                  value={partnerStatusFilter}
                  onChange={(e) => setPartnerStatusFilter(e.target.value)}
                  className="text-xs bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-300"
                >
                  <option value="">All Statuses</option>
                  <option value="APPROVED">APPROVED (Active)</option>
                  <option value="PENDING">PENDING</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>

                <button
                  onClick={fetchPartners}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                >
                  Search
                </button>
              </div>

              {/* Partners Table */}
              <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Partner ID</th>
                      <th className="p-3">Full Name</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Submitted</th>
                      <th className="p-3">Clicks</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Moderation & Security</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {partnersList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          No partners found.
                        </td>
                      </tr>
                    ) : (
                      partnersList.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-mono font-bold text-amber-400">{p.partner_id}</td>
                          <td className="p-3 font-bold text-white">{p.full_name}</td>
                          <td className="p-3 text-slate-400">
                            <div>{p.email}</div>
                            <div className="text-[11px] text-slate-500">{p.mobile_number}</div>
                          </td>
                          <td className="p-3 font-semibold text-slate-300 tabular-nums">{p.total_products || 0}</td>
                          <td className="p-3 font-semibold text-blue-400 tabular-nums">{p.total_clicks || 0}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.status === 'APPROVED'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : p.status === 'PENDING'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-rose-950 text-rose-300 border border-rose-800'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Status changer */}
                              {p.status === 'APPROVED' ? (
                                <button
                                  onClick={() => handleUpdatePartnerStatus(p.id, 'SUSPENDED')}
                                  className="py-1 px-2.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 rounded-md text-[11px]"
                                >
                                  Suspend
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdatePartnerStatus(p.id, 'APPROVED')}
                                  className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[11px] font-semibold"
                                >
                                  Activate
                                </button>
                              )}

                              <button
                                onClick={() => setResettingPartnerPassword(p)}
                                className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-950 rounded-md"
                                title="Reset Partner Password"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: CATEGORIES */}
          {currentTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold font-heading text-white">Categories Management</h2>
                  <p className="text-xs text-slate-400">
                    Add or manage product taxonomy. Unsafe deletion is prevented if products reference the category.
                  </p>
                </div>
              </div>

              {/* Add Category Form */}
              <form onSubmit={handleCreateCategory} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="New category name (e.g. Home Decor)"
                  required
                  className="text-xs bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white flex-1 min-w-[200px]"
                />
                <button
                  type="submit"
                  className="py-2 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
              </form>

              {/* Categories Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {categoriesList.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-white">{c.name}</h4>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {c.products_count || 0} associated products
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-md hover:bg-slate-800"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: AFFILIATE PLATFORMS */}
          {currentTab === 'platforms' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold font-heading text-white">Affiliate Platforms</h2>
                  <p className="text-xs text-slate-400">
                    Manage affiliate merchants (Amazon, Flipkart, Meesho, Myntra, Ajio).
                  </p>
                </div>
              </div>

              {/* Add Platform Form */}
              <form onSubmit={handleCreatePlatform} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={newPlatName}
                  onChange={(e) => setNewPlatName(e.target.value)}
                  placeholder="Platform name (e.g. Nykaa)"
                  required
                  className="text-xs bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white flex-1 min-w-[180px]"
                />
                <input
                  type="color"
                  value={newPlatColor}
                  onChange={(e) => setNewPlatColor(e.target.value)}
                  title="Badge Color"
                  className="w-9 h-8 bg-slate-950 border border-slate-800 rounded-md cursor-pointer"
                />
                <input
                  type="url"
                  value={newPlatUrl}
                  onChange={(e) => setNewPlatUrl(e.target.value)}
                  placeholder="Base URL (https://...)"
                  className="text-xs bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white flex-1 min-w-[180px]"
                />
                <button
                  type="submit"
                  className="py-2 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Platform</span>
                </button>
              </form>

              {/* Platforms Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {platformsList.map((pl) => (
                  <div
                    key={pl.id}
                    className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: pl.badge_color }} />
                      <div>
                        <h4 className="font-bold text-sm text-white">{pl.name}</h4>
                        <span className="text-[11px] text-slate-500">{pl.products_count || 0} active products</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePlatform(pl.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-md hover:bg-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: BANNERS */}
          {currentTab === 'banners' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold font-heading text-white">Promotional Banners</h2>
                  <p className="text-xs text-slate-400">
                    Manage top hero carousel banners and promotional split cards.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bannersList.map((b) => (
                  <div key={b.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-400 uppercase bg-amber-950/40 px-2 py-0.5 rounded-sm">
                        {b.banner_type}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Order: {b.display_order}</span>
                    </div>
                    <h4 className="font-bold text-white text-base">{b.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{b.subtitle}</p>
                    <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-xs">
                      <span className="text-blue-400 font-semibold">{b.cta_text}</span>
                      <span className="text-slate-500 text-[11px]">{b.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: WEBSITE SETTINGS */}
          {currentTab === 'settings' && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h2 className="text-xl font-bold font-heading text-white">Website & Social Configuration</h2>
                <p className="text-xs text-slate-400">
                  Customizable branding, contact details, social channels, and legal copy.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Brand Identity
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300">Website Name</label>
                      <input
                        type="text"
                        value={websiteSettings.website_name || ''}
                        onChange={(e) => setWebsiteSettings({ ...websiteSettings, website_name: e.target.value })}
                        className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300">Tagline</label>
                      <input
                        type="text"
                        value={websiteSettings.tagline || ''}
                        onChange={(e) => setWebsiteSettings({ ...websiteSettings, tagline: e.target.value })}
                        className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Social Media Channels
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300">YouTube URL</label>
                      <input
                        type="url"
                        value={websiteSettings.social_youtube || ''}
                        onChange={(e) => setWebsiteSettings({ ...websiteSettings, social_youtube: e.target.value })}
                        className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300">Instagram URL</label>
                      <input
                        type="url"
                        value={websiteSettings.social_instagram || ''}
                        onChange={(e) => setWebsiteSettings({ ...websiteSettings, social_instagram: e.target.value })}
                        className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300">WhatsApp Link</label>
                      <input
                        type="url"
                        value={websiteSettings.social_whatsapp || ''}
                        onChange={(e) => setWebsiteSettings({ ...websiteSettings, social_whatsapp: e.target.value })}
                        className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300">Facebook URL</label>
                      <input
                        type="url"
                        value={websiteSettings.social_facebook || ''}
                        onChange={(e) => setWebsiteSettings({ ...websiteSettings, social_facebook: e.target.value })}
                        className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-white"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs text-slate-300">WhatsApp Broadcast Channel URL</label>
                      <input
                        type="url"
                        value={websiteSettings.social_whatsapp_channel || ''}
                        onChange={(e) => setWebsiteSettings({ ...websiteSettings, social_whatsapp_channel: e.target.value })}
                        className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Footer & Mandatory Attribution
                  </h3>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300">Footer Attribution Text</label>
                    <input
                      type="text"
                      value={websiteSettings.footer_attribution || ''}
                      onChange={(e) => setWebsiteSettings({ ...websiteSettings, footer_attribution: e.target.value })}
                      className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-white font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="py-3 px-6 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Configuration to MySQL</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 9: ADMIN PROFILE & SECURITY */}
          {currentTab === 'profile' && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold font-heading text-white">Administrator Credentials</h2>
                <p className="text-xs text-slate-400">
                  Update administrative display profile and master account password.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Full Name</label>
                  <input
                    type="text"
                    value={adminFullName}
                    onChange={(e) => setAdminFullName(e.target.value)}
                    required
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg py-2.5 px-3 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Email Address</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg py-2.5 px-3 text-white"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Change Password (Optional)
                  </h4>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300">Current Password</label>
                    <input
                      type="password"
                      value={adminCurrentPass}
                      onChange={(e) => setAdminCurrentPass(e.target.value)}
                      placeholder="Required to set new password"
                      className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300">New Password</label>
                    <input
                      type="password"
                      value={adminNewPass}
                      onChange={(e) => setAdminNewPass(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs"
                >
                  Save Profile Settings
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Add Product Modal (Admin -> Immediate Publication) */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Add New Admin Product</h3>
                <span className="text-[11px] text-emerald-400 font-semibold">
                  Admin-created products become published immediately on the storefront.
                </span>
              </div>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdminProduct} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Product Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Premium Noise Cancelling Headphones"
                  required
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-white"
                />
              </div>

              {/* Image upload / URL */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Product Image * (Upload from device or enter image URL)
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Uploading...' : 'Choose from Device'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setFormImage)}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="url"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="Or paste direct image URL (https://...)"
                    required
                    className="flex-1 text-xs bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-white"
                  />
                </div>
                {formImage && (
                  <div className="w-16 h-16 bg-white p-1 rounded-lg border border-slate-700 mt-2">
                    <img src={formImage} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>

              {/* Category & Platform */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    required
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-white"
                  >
                    <option value="">-- Select Category --</option>
                    {categoriesList
                      .filter((c) => c.is_active)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Platform *</label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value)}
                    required
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-white"
                  >
                    <option value="">-- Select Platform --</option>
                    {platformsList
                      .filter((pl) => pl.is_active)
                      .map((pl) => (
                        <option key={pl.id} value={pl.id}>
                          {pl.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Price & MRP */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Sale Price (₹ Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="2999"
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Original MRP (₹ Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formMrp}
                    onChange={(e) => setFormMrp(e.target.value)}
                    placeholder="4999"
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-white"
                  />
                </div>
              </div>

              {/* Affiliate Destination Link */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Affiliate Link *</label>
                <input
                  type="url"
                  value={formAffiliateUrl}
                  onChange={(e) => setFormAffiliateUrl(e.target.value)}
                  placeholder="https://www.amazon.in/dp/..."
                  required
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-white"
                />
              </div>

              {/* Display Priority & Badges */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Display Priority</label>
                  <input
                    type="number"
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    placeholder="10"
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-white"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-6">
                  <input
                    type="checkbox"
                    checked={formFeatured}
                    onChange={(e) => setFormFeatured(e.target.checked)}
                    className="rounded-sm text-amber-500"
                  />
                  <span>Mark Featured</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-6">
                  <input
                    type="checkbox"
                    checked={formTrending}
                    onChange={(e) => setFormTrending(e.target.checked)}
                    className="rounded-sm text-amber-500"
                  />
                  <span>Mark Trending</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-md"
              >
                Publish Product to Storefront
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reject Product Modal */}
      {rejectingProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">Reject Partner Submission</h3>
            <p className="text-xs text-slate-400">
              Provide feedback for <span className="text-white font-semibold">{rejectingProduct.product_name}</span>.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Invalid affiliate link or unclear product photo"
              className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-hidden"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRejectingProduct(null)}
                className="py-2 px-3.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleModerateProduct(rejectingProduct.id, 'REJECTED', rejectionReason)}
                className="py-2 px-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Partner Password Modal */}
      {resettingPartnerPassword && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <form onSubmit={handleResetPartnerPassword} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">Reset Partner Password</h3>
            <p className="text-xs text-slate-400">
              Set a temporary new password for <span className="text-amber-400 font-mono font-bold">{resettingPartnerPassword.partner_id}</span> ({resettingPartnerPassword.full_name}).
            </p>
            <input
              type="password"
              value={newPartnerPassword}
              onChange={(e) => setNewPartnerPassword(e.target.value)}
              placeholder="New password (min 6 characters)"
              required
              className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setResettingPartnerPassword(null)}
                className="py-2 px-3.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs"
              >
                Set New Password
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
