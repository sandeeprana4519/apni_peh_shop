import React, { useState, useEffect } from 'react';
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  MousePointerClick,
  PlusCircle,
  Settings,
  LogOut,
  Upload,
  Trash2,
  ExternalLink,
  AlertCircle,
  Eye,
  Check,
  X,
} from 'lucide-react';
import { PartnerStats, Category, AffiliatePlatform, Product } from '../types';

interface PartnerDashboardProps {
  partner: any;
  categories: Category[];
  platforms: AffiliatePlatform[];
  onLogout: () => void;
  onClose: () => void;
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({
  partner,
  categories,
  platforms,
  onLogout,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'add_product' | 'my_products' | 'settings'>('overview');

  // Stats state
  const [stats, setStats] = useState<PartnerStats>({
    total_products: 0,
    pending_products: 0,
    approved_products: 0,
    rejected_products: 0,
    total_clicks: 0,
  });

  // My products state
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Add Product form state
  const [prodName, setProdName] = useState('');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodCategoryId, setProdCategoryId] = useState('');
  const [prodPlatformId, setProdPlatformId] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodOriginalMrp, setProdOriginalMrp] = useState('');
  const [prodAffiliateUrl, setProdAffiliateUrl] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [uploadingProdImage, setUploadingProdImage] = useState(false);
  const [submitProductLoading, setSubmitProductLoading] = useState(false);
  const [submitProductMessage, setSubmitProductMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Settings form state
  const [profileName, setProfileName] = useState(partner?.full_name || '');
  const [profileMobile, setProfileMobile] = useState(partner?.mobile_number || '');
  const [profileImage, setProfileImage] = useState(partner?.profile_image || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load stats and my products
  const fetchDashboardData = async () => {
    try {
      const statsRes = await fetch('/api/partner/stats');
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      setLoadingProducts(true);
      const prodsRes = await fetch('/api/partner/products');
      const prodsData = await prodsRes.json();
      if (prodsData.success) {
        setMyProducts(prodsData.products);
      }
    } catch (err) {
      console.error('Error fetching partner data:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handle product image file upload with preview
  const handleProductImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingProdImage(true);
    setSubmitProductMessage(null);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setProdImageUrl(data.fileUrl);
      } else {
        setSubmitProductMessage({ type: 'error', text: data.message || 'Image upload failed' });
      }
    } catch {
      setSubmitProductMessage({ type: 'error', text: 'Error uploading image from device.' });
    } finally {
      setUploadingProdImage(false);
    }
  };

  // Submit product handler
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitProductMessage(null);

    if (!prodName.trim() || !prodImageUrl.trim() || !prodCategoryId || !prodPlatformId || !prodAffiliateUrl.trim()) {
      setSubmitProductMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    setSubmitProductLoading(true);

    try {
      const res = await fetch('/api/partner/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: prodName,
          image_url: prodImageUrl,
          category_id: prodCategoryId,
          platform_id: prodPlatformId,
          price: prodPrice ? parseFloat(prodPrice) : null,
          original_mrp: prodOriginalMrp ? parseFloat(prodOriginalMrp) : null,
          affiliate_url: prodAffiliateUrl,
          description: prodDescription,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitProductMessage({
          type: 'success',
          text: 'Product submitted successfully! It has been saved with PENDING status and will appear publicly once approved by an administrator.',
        });
        // Reset form
        setProdName('');
        setProdImageUrl('');
        setProdCategoryId('');
        setProdPlatformId('');
        setProdPrice('');
        setProdOriginalMrp('');
        setProdAffiliateUrl('');
        setProdDescription('');
        fetchDashboardData();
      } else {
        setSubmitProductMessage({ type: 'error', text: data.message || 'Product submission failed.' });
      }
    } catch {
      setSubmitProductMessage({ type: 'error', text: 'Server error while submitting product.' });
    } finally {
      setSubmitProductLoading(false);
    }
  };

  // Delete own product
  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product submission?')) return;

    try {
      const res = await fetch(`/api/partner/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchDashboardData();
      } else {
        alert(data.message || 'Could not delete product.');
      }
    } catch {
      alert('Network error deleting product.');
    }
  };

  // Update Settings
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMessage(null);
    setSettingsLoading(true);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: profileName,
          mobile_number: profileMobile,
          profile_image: profileImage,
          current_password: currentPassword || undefined,
          new_password: newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSettingsMessage({ type: 'success', text: 'Settings updated successfully.' });
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setSettingsMessage({ type: 'error', text: data.message || 'Failed to update settings.' });
      }
    } catch {
      setSettingsMessage({ type: 'error', text: 'Network error updating settings.' });
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Portal Header */}
        <div className="bg-slate-950 p-5 sm:p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 font-black text-lg flex items-center justify-center shadow-md">
              AP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-heading text-white">
                  Partner Portal
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  APPROVED PARTNER
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Welcome, <span className="text-white font-medium">{partner.full_name}</span> · Partner ID:{' '}
                <span className="font-mono text-amber-400 font-bold">{partner.partner_id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onLogout}
              className="py-1.5 px-3 rounded-lg border border-slate-700 bg-slate-900 hover:bg-red-950/40 text-slate-300 hover:text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Portal Navigation Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-xs font-bold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Dashboard Overview
          </button>
          <button
            onClick={() => setActiveTab('add_product')}
            className={`py-3 px-4 text-xs font-bold whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'add_product'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add New Product</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('my_products');
              fetchDashboardData();
            }}
            className={`py-3 px-4 text-xs font-bold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === 'my_products'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            My Products ({myProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 text-xs font-bold whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Partner Settings</span>
          </button>
        </div>

        {/* Portal Body (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 4 Mandatory Dashboard Statistics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                  <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
                    <span>Total Submitted</span>
                    <Package className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 tabular-nums">
                    {stats.total_products}
                  </div>
                  <div className="text-[10px] text-slate-400">All lifetime entries</div>
                </div>

                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-1">
                  <div className="text-amber-800 text-xs font-semibold flex items-center justify-between">
                    <span>Pending Review</span>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-amber-700 tabular-nums">
                    {stats.pending_products}
                  </div>
                  <div className="text-[10px] text-amber-600">Awaiting admin review</div>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-1">
                  <div className="text-emerald-800 text-xs font-semibold flex items-center justify-between">
                    <span>Approved & Live</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-700 tabular-nums">
                    {stats.approved_products}
                  </div>
                  <div className="text-[10px] text-emerald-600">Visible on public store</div>
                </div>

                <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 space-y-1">
                  <div className="text-rose-800 text-xs font-semibold flex items-center justify-between">
                    <span>Rejected</span>
                    <XCircle className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="text-2xl font-black text-rose-700 tabular-nums">
                    {stats.rejected_products}
                  </div>
                  <div className="text-[10px] text-rose-600">Requires correction</div>
                </div>

                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-1 col-span-2 lg:col-span-1">
                  <div className="text-blue-800 text-xs font-semibold flex items-center justify-between">
                    <span>Total Clicks</span>
                    <MousePointerClick className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-black text-blue-700 tabular-nums">
                    {stats.total_clicks}
                  </div>
                  <div className="text-[10px] text-blue-600">Outbound referral clicks</div>
                </div>
              </div>

              {/* Action Banner */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    Ready to recommend a new product?
                  </h3>
                  <p className="text-xs text-slate-600">
                    Add affiliate products from Amazon, Flipkart, or Meesho. Upload images directly from your device.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('add_product')}
                  className="py-2.5 px-5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors shrink-0 shadow-xs flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Submit New Product</span>
                </button>
              </div>

              {/* Recent Own Submissions Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Your Recent Submissions</h4>
                  <button
                    onClick={() => setActiveTab('my_products')}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    View All
                  </button>
                </div>

                {myProducts.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    No products submitted yet. Click "Add New Product" to submit your first affiliate deal.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {myProducts.slice(0, 3).map((prod) => (
                      <div
                        key={prod.id}
                        className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-3"
                      >
                        <img
                          src={prod.image_url}
                          alt={prod.product_name}
                          className="w-12 h-12 object-contain bg-white rounded-lg p-1 border border-slate-200"
                        />
                        <div className="overflow-hidden">
                          <h5 className="text-xs font-semibold text-slate-900 truncate">
                            {prod.product_name}
                          </h5>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold ${
                                prod.approval_status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : prod.approval_status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {prod.approval_status}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ₹{prod.price || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'add_product' && (
            <div className="max-w-2xl mx-auto space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-heading">
                  Submit a New Affiliate Product
                </h3>
                <p className="text-xs text-slate-500">
                  Products are stored with your Partner ID ({partner.partner_id}) and review status set to PENDING until approved by admin.
                </p>
              </div>

              {submitProductMessage && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    submitProductMessage.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {submitProductMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span>{submitProductMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleAddProductSubmit} className="space-y-4">
                {/* Product Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="e.g. Wireless Noise-Cancelling Headphones"
                    required
                    className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg py-2.5 px-3.5 text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white"
                  />
                </div>

                {/* Product Image Selection & Live Preview */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">
                    Product Image * (Upload from device or provide Image URL)
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    {/* Device Upload */}
                    <label className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-colors bg-slate-50 hover:bg-blue-50/50">
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs font-bold text-slate-700">
                        {uploadingProdImage ? 'Uploading Image...' : 'Choose from Device'}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">JPEG, PNG, WEBP, or SVG</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProductImageFile}
                        className="hidden"
                      />
                    </label>

                    {/* Image Preview Box */}
                    <div className="border border-slate-200 rounded-xl p-2 h-32 flex items-center justify-center bg-slate-50 relative">
                      {prodImageUrl ? (
                        <>
                          <img
                            src={prodImageUrl}
                            alt="Preview"
                            className="w-full h-full object-contain rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setProdImageUrl('')}
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                            title="Remove"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400">Live Image Preview</span>
                      )}
                    </div>
                  </div>

                  {/* Fallback URL input */}
                  <div className="pt-1">
                    <input
                      type="url"
                      value={prodImageUrl}
                      onChange={(e) => setProdImageUrl(e.target.value)}
                      placeholder="Or enter direct image URL (https://...)"
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Category & Platform dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Category *</label>
                    <select
                      value={prodCategoryId}
                      onChange={(e) => setProdCategoryId(e.target.value)}
                      required
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2.5 px-3 text-slate-900 focus:outline-hidden focus:border-blue-500"
                    >
                      <option value="">-- Select Category --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Affiliate Platform *</label>
                    <select
                      value={prodPlatformId}
                      onChange={(e) => setProdPlatformId(e.target.value)}
                      required
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2.5 px-3 text-slate-900 focus:outline-hidden focus:border-blue-500"
                    >
                      <option value="">-- Select Platform --</option>
                      {platforms.map((pl) => (
                        <option key={pl.id} value={pl.id}>
                          {pl.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price & MRP (Optional) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Sale Price (₹ Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      placeholder="e.g. 2999"
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2.5 px-3 text-slate-900 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Original MRP (₹ Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={prodOriginalMrp}
                      onChange={(e) => setProdOriginalMrp(e.target.value)}
                      placeholder="e.g. 4999"
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2.5 px-3 text-slate-900 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Affiliate Link (Required) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Affiliate Destination Link *
                  </label>
                  <input
                    type="url"
                    value={prodAffiliateUrl}
                    onChange={(e) => setProdAffiliateUrl(e.target.value)}
                    placeholder="https://www.amazon.in/dp/...?tag=yourtag or affiliate URL"
                    required
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2.5 px-3 text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    Must start with http:// or https://. Visitors clicking 'Buy Now' will be redirected through our verified tracking gateway.
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Product Highlights / Review Notes</label>
                  <textarea
                    rows={3}
                    value={prodDescription}
                    onChange={(e) => setProdDescription(e.target.value)}
                    placeholder="Provide brief highlights or why you recommend this product..."
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Submit / Done Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitProductLoading || uploadingProdImage}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    {submitProductLoading ? 'Submitting to Database...' : 'Submit / Done'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'my_products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    My Submitted Products
                  </h3>
                  <p className="text-xs text-slate-500">
                    Only products created under Partner ID ({partner.partner_id}) are displayed.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('add_product')}
                  className="py-1.5 px-3 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
              </div>

              {loadingProducts ? (
                <div className="text-center py-12 text-xs text-slate-400">Loading your submissions...</div>
              ) : myProducts.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <Package className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500">You haven't submitted any products yet.</p>
                  <button
                    onClick={() => setActiveTab('add_product')}
                    className="py-2 px-4 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
                  >
                    Submit First Product
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3">Product</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Platform</th>
                        <th className="p-3">Price</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Clicks</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {myProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 flex items-center gap-3">
                            <img
                              src={p.image_url}
                              alt={p.product_name}
                              className="w-10 h-10 object-contain rounded-md border border-slate-200 bg-white p-0.5 shrink-0"
                            />
                            <div className="max-w-[200px]">
                              <span className="font-semibold text-slate-900 truncate block">
                                {p.product_name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                #{p.id}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-slate-600 font-medium">{p.category_name}</td>
                          <td className="p-3">
                            <span
                              className="px-2 py-0.5 text-[10px] font-bold text-white rounded-md"
                              style={{ backgroundColor: p.platform_badge_color || '#2563EB' }}
                            >
                              {p.platform_name}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-900 tabular-nums">
                            {p.price ? `₹${Number(p.price).toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.approval_status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : p.approval_status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {p.approval_status}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-blue-600 tabular-nums">
                            {p.clicks_count || 0}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <a
                                href={p.affiliate_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100"
                                title="Visit Affiliate Link"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-xl mx-auto space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-heading">
                  Partner Profile & Security Settings
                </h3>
                <p className="text-xs text-slate-500">
                  Manage your display name, contact number, and update account password.
                </p>
              </div>

              {settingsMessage && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    settingsMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {settingsMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{settingsMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleSettingsSubmit} className="space-y-4">
                {/* Read-only Partner ID (Mandatory Requirement) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Partner ID (Permanent & Read-Only)
                  </label>
                  <input
                    type="text"
                    value={partner.partner_id}
                    readOnly
                    disabled
                    className="w-full text-xs font-mono font-bold bg-slate-200/80 border border-slate-300 rounded-lg py-2.5 px-3 text-slate-700 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400">
                    Generated sequentially by the server upon registration and cannot be edited.
                  </span>
                </div>

                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Display / Full Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2.5 px-3 text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Mobile Number */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Mobile Number</label>
                  <input
                    type="tel"
                    value={profileMobile}
                    onChange={(e) => setProfileMobile(e.target.value)}
                    required
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2.5 px-3 text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Change Password fields */}
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Change Password (Optional)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-600">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Required to change"
                        className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-600">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={settingsLoading}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {settingsLoading ? 'Saving Changes...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
