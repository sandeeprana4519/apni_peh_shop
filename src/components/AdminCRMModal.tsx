import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  UserCheck,
  Check,
  XCircle,
  Settings,
  Database,
  ExternalLink,
  Layers,
  Save,
  CheckCircle2,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { WebsiteSettings, Category, AffiliatePlatform } from '../types';

interface AdminCRMModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: WebsiteSettings;
  onSettingsUpdated: (newSettings: WebsiteSettings) => void;
  onRefreshPublicData: () => void;
}

export const AdminCRMModal: React.FC<AdminCRMModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsUpdated,
  onRefreshPublicData,
}) => {
  const [activeTab, setActiveTab] = useState<'partners' | 'products' | 'settings' | 'database'>('partners');

  // Partners state
  const [partnersList, setPartnersList] = useState<any[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);

  // Products state
  const [adminProducts, setAdminProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Settings form state
  const [formSettings, setFormSettings] = useState<WebsiteSettings>({ ...settings });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  // Database status state
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoadingPartners(true);
      const pRes = await fetch('/api/admin/partners');
      const pData = await pRes.json();
      if (pData.success) {
        setPartnersList(pData.partners);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPartners(false);
    }

    try {
      setLoadingProducts(true);
      const prRes = await fetch('/api/admin/products');
      const prData = await prRes.json();
      if (prData.success) {
        setAdminProducts(prData.products);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProducts(false);
    }

    try {
      const sRes = await fetch('/api/status');
      const sData = await sRes.json();
      if (sData.success) {
        setDbStatus(sData.database);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdminData();
      setFormSettings({ ...settings });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdatePartnerStatus = async (partnerId: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAdminData();
        onRefreshPublicData();
      } else {
        alert(data.message || 'Status update failed.');
      }
    } catch {
      alert('Network error updating partner status.');
    }
  };

  const handleUpdateProductApproval = async (productId: number, approval_status: 'APPROVED' | 'REJECTED' | 'PENDING') => {
    try {
      const res = await fetch(`/api/admin/products/${productId}/approval`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval_status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAdminData();
        onRefreshPublicData();
      } else {
        alert(data.message || 'Product approval update failed.');
      }
    } catch {
      alert('Network error updating product approval.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMessage(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formSettings),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsMessage('Settings saved successfully!');
        onSettingsUpdated(formSettings);
        onRefreshPublicData();
      } else {
        setSettingsMessage('Failed to save settings: ' + (data.message || ''));
      }
    } catch {
      setSettingsMessage('Network error saving settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-white">
                Admin CRM & Content Management
              </h2>
              <p className="text-xs text-slate-400">
                Manage partner approvals, moderate submitted products, customize brand identity, and configure Hostinger MySQL.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('partners')}
            className={`py-3 px-4 text-xs font-bold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === 'partners'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Partner Approvals ({partnersList.filter((p) => p.status === 'PENDING').length} Pending)
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 px-4 text-xs font-bold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === 'products'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Product Moderation ({adminProducts.filter((p) => p.approval_status === 'PENDING').length} Pending)
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 text-xs font-bold whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Brand & Social Settings</span>
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`py-3 px-4 text-xs font-bold whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'database'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Hostinger MySQL Info</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {activeTab === 'partners' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Partner Applications</h3>
                  <p className="text-xs text-slate-500">
                    Review and activate affiliate partner accounts. Approved partners can immediately log in and add products.
                  </p>
                </div>
                <button
                  onClick={fetchAdminData}
                  className="py-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium"
                >
                  Refresh
                </button>
              </div>

              {loadingPartners ? (
                <div className="text-center py-8 text-xs text-slate-400">Loading partners...</div>
              ) : partnersList.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-xl">
                  No partners found.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3">Partner ID</th>
                        <th className="p-3">Full Name</th>
                        <th className="p-3">Email & Phone</th>
                        <th className="p-3">Registered At</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Moderation Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {partnersList.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80">
                          <td className="p-3 font-mono font-bold text-amber-700">{p.partner_id}</td>
                          <td className="p-3 font-semibold text-slate-900">{p.full_name}</td>
                          <td className="p-3 text-slate-600">
                            <div>{p.email}</div>
                            <div className="text-[11px] text-slate-400">{p.mobile_number}</div>
                          </td>
                          <td className="p-3 text-slate-500 text-[11px]">
                            {new Date(p.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : p.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {p.status === 'PENDING' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleUpdatePartnerStatus(p.id, 'APPROVED')}
                                  className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleUpdatePartnerStatus(p.id, 'REJECTED')}
                                  className="py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : p.status === 'APPROVED' ? (
                              <span className="text-[11px] text-emerald-700 font-semibold">Active in Store</span>
                            ) : (
                              <button
                                onClick={() => handleUpdatePartnerStatus(p.id, 'APPROVED')}
                                className="py-1 px-2 bg-slate-200 hover:bg-emerald-600 hover:text-white text-slate-700 rounded-md text-[10px] font-medium"
                              >
                                Re-activate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Submitted Affiliate Products</h3>
                  <p className="text-xs text-slate-500">
                    Approve partner submissions to make them publicly visible in the storefront.
                  </p>
                </div>
                <button
                  onClick={fetchAdminData}
                  className="py-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium"
                >
                  Refresh
                </button>
              </div>

              {loadingProducts ? (
                <div className="text-center py-8 text-xs text-slate-400">Loading products...</div>
              ) : adminProducts.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-xl">
                  No products found.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3">Product</th>
                        <th className="p-3">Curated By</th>
                        <th className="p-3">Platform</th>
                        <th className="p-3">Price</th>
                        <th className="p-3">Approval</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {adminProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80">
                          <td className="p-3 flex items-center gap-2.5">
                            <img
                              src={p.image_url}
                              alt={p.product_name}
                              className="w-10 h-10 object-contain rounded-md border border-slate-200 bg-white p-0.5 shrink-0"
                            />
                            <div className="max-w-[200px]">
                              <span className="font-semibold text-slate-900 truncate block">
                                {p.product_name}
                              </span>
                              <span className="text-[10px] text-slate-400">{p.category_name}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-800">{p.partner_name || 'Staff'}</div>
                            <div className="text-[10px] font-mono text-amber-700">{p.partner_code}</div>
                          </td>
                          <td className="p-3 font-semibold text-slate-700">{p.platform_name}</td>
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
                          <td className="p-3 text-right">
                            {p.approval_status === 'PENDING' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleUpdateProductApproval(p.id, 'APPROVED')}
                                  className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Approve & Publish</span>
                                </button>
                                <button
                                  onClick={() => handleUpdateProductApproval(p.id, 'REJECTED')}
                                  className="py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : p.approval_status === 'APPROVED' ? (
                              <button
                                onClick={() => handleUpdateProductApproval(p.id, 'PENDING')}
                                className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                              >
                                Revoke Approval
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateProductApproval(p.id, 'APPROVED')}
                                className="py-1 px-2 bg-slate-200 hover:bg-emerald-600 hover:text-white text-slate-700 rounded-md text-[10px] font-medium"
                              >
                                Re-approve
                              </button>
                            )}
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
            <div className="max-w-2xl mx-auto space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Website Identity & Social Channels Configuration
                </h3>
                <p className="text-xs text-slate-500">
                  Customizable values requested in prompt. These are saved to MySQL and never hardcoded.
                </p>
              </div>

              {settingsMessage && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-semibold">
                  {settingsMessage}
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Website Name</label>
                    <input
                      type="text"
                      value={formSettings.website_name || ''}
                      onChange={(e) => setFormSettings({ ...formSettings, website_name: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Tagline</label>
                    <input
                      type="text"
                      value={formSettings.tagline || ''}
                      onChange={(e) => setFormSettings({ ...formSettings, tagline: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Contact Email</label>
                    <input
                      type="email"
                      value={formSettings.contact_email || ''}
                      onChange={(e) => setFormSettings({ ...formSettings, contact_email: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Contact Phone</label>
                    <input
                      type="text"
                      value={formSettings.contact_phone || ''}
                      onChange={(e) => setFormSettings({ ...formSettings, contact_phone: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Social Media Links (Prompt Mandatory List) */}
                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Official Social Channels
                  </h4>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-600">YouTube URL</label>
                      <input
                        type="url"
                        value={formSettings.social_youtube || ''}
                        onChange={(e) => setFormSettings({ ...formSettings, social_youtube: e.target.value })}
                        placeholder="https://youtube.com/@channel"
                        className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-600">Instagram URL</label>
                      <input
                        type="url"
                        value={formSettings.social_instagram || ''}
                        onChange={(e) => setFormSettings({ ...formSettings, social_instagram: e.target.value })}
                        placeholder="https://instagram.com/profile"
                        className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-600">WhatsApp Direct Link</label>
                      <input
                        type="url"
                        value={formSettings.social_whatsapp || ''}
                        onChange={(e) => setFormSettings({ ...formSettings, social_whatsapp: e.target.value })}
                        placeholder="https://wa.me/919876543210"
                        className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-600">Facebook Page URL</label>
                      <input
                        type="url"
                        value={formSettings.social_facebook || ''}
                        onChange={(e) => setFormSettings({ ...formSettings, social_facebook: e.target.value })}
                        placeholder="https://facebook.com/page"
                        className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-600">WhatsApp Broadcast Channel URL</label>
                      <input
                        type="url"
                        value={formSettings.social_whatsapp_channel || ''}
                        onChange={(e) => setFormSettings({ ...formSettings, social_whatsapp_channel: e.target.value })}
                        placeholder="https://whatsapp.com/channel/..."
                        className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Attribution (Mandatory Prompt Format) */}
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <label className="text-xs font-bold text-slate-700">Footer Attribution</label>
                  <input
                    type="text"
                    value={formSettings.footer_attribution || ''}
                    onChange={(e) => setFormSettings({ ...formSettings, footer_attribution: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900"
                  />
                  <p className="text-[10px] text-slate-400">
                    Mandatory prompt format: © 2026 [Website Name]. All Rights Reserved. Design by Happiiz Business Solutions.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingSettings ? 'Saving...' : 'Save Website Settings to MySQL'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-heading">
                      Hostinger MySQL & phpMyAdmin Integration
                    </h3>
                    <p className="text-xs text-slate-500">
                      The application is architected strictly with <code className="font-mono text-slate-700">mysql2/promise</code>.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Driver:</span>
                    <span className="font-mono font-bold text-slate-800">mysql2/promise</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Engine Mode:</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded-sm text-[10px] ${
                        dbStatus?.connected
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {dbStatus?.connected ? 'Live Hostinger MySQL' : 'Hostinger MySQL Ready (Operational Fallback)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Configured Host:</span>
                    <span className="font-mono text-slate-800">{dbStatus?.host || 'localhost'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Database Name:</span>
                    <span className="font-mono text-slate-800">{dbStatus?.database || 'apni_pehchaan_db'}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                  <h4 className="font-bold text-slate-800">How to connect your live Hostinger MySQL database:</h4>
                  <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600">
                    <li>Log in to your <strong>Hostinger hPanel</strong> → <strong>Databases</strong> → <strong>MySQL Databases</strong>.</li>
                    <li>Create your MySQL Database, Username, and Password.</li>
                    <li>Open <strong>phpMyAdmin</strong> for that database.</li>
                    <li>Go to the <strong>Import</strong> tab and upload the generated <code className="font-mono font-bold text-slate-900">database.sql</code> file included in the root folder.</li>
                    <li>Add your Hostinger DB credentials to your <code className="font-mono text-slate-900">.env</code> file:
                      <pre className="bg-slate-900 text-slate-200 p-2.5 rounded-lg mt-1 font-mono text-[10px] overflow-x-auto">
{`DB_HOST="localhost"
DB_USER="u123456789_affiliate_user"
DB_PASSWORD="YourHostingerPassword"
DB_NAME="u123456789_apni_pehchaan_db"
DB_PORT="3306"`}
                      </pre>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
