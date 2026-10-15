import React, { useState } from 'react';
import { Search, User, Heart, ShoppingBag, ShieldCheck, Menu, X, ChevronDown, LogOut, LayoutDashboard } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { WebsiteSettings, Category } from '../types';

interface HeaderProps {
  settings: WebsiteSettings;
  categories: Category[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectCategory: (categoryId: number | null) => void;
  selectedCategory: number | null;
  partnerSession: any;
  onOpenPartnerAuth: (initialTab?: 'login' | 'register') => void;
  onOpenPartnerDashboard: () => void;
  onLogoutPartner: () => void;
  onOpenAdminCRM: () => void;
  wishlistCount: number;
  onOpenWishlist: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  categories,
  searchQuery,
  onSearchChange,
  onSelectCategory,
  selectedCategory,
  partnerSession,
  onOpenPartnerAuth,
  onOpenPartnerDashboard,
  onLogoutPartner,
  onOpenAdminCRM,
  wishlistCount,
  onOpenWishlist,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const section = document.getElementById('browse-all-products');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
      {/* Top Banner Notice */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="font-medium text-amber-400">Verified Deals</span>
            <span className="text-slate-400 hidden sm:inline">|</span>
            <span className="truncate text-slate-300">Discover handpicked offers from Amazon, Flipkart & Meesho</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] shrink-0 font-medium">
            <button
              onClick={onOpenAdminCRM}
              className="text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
              title="Admin CRM & Approval Portal"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin CRM</span>
            </button>
            <span className="text-slate-600 hidden md:inline">|</span>
            <a href="#affiliate-disclosure" className="text-slate-400 hover:text-slate-200 hidden md:inline">
              Affiliate Disclosure
            </a>
          </div>
        </div>
      </div>

      {/* Main Header (Zone 1: Logo, Zone 2: Search, Zone 3: Actions) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4 md:gap-8">
          {/* Brand Logo */}
          <button
            onClick={() => {
              onSelectCategory(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-left shrink-0 focus:outline-hidden"
          >
            <BrandLogo
              name={settings.website_name || 'APNI PEHCHAAN'}
              tagline={settings.tagline || 'Your Style Your Identity'}
            />
          </button>

          {/* Search Bar - Center */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-xl items-center relative"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search for products, categories, or partners..."
              className="w-full bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-slate-900 placeholder-slate-400 text-sm rounded-l-lg py-2.5 pl-4 pr-10 border border-r-0 border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-hidden transition-all"
            />
            <button
              type="submit"
              className="h-[42px] px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg font-medium text-sm flex items-center justify-center transition-colors shadow-xs"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Right Action Icons (Account, Wishlist, Cart/Deals) */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Partner Account Button */}
            {partnerSession ? (
              <div className="relative flex items-center gap-2">
                <button
                  onClick={onOpenPartnerDashboard}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-lg border border-slate-200 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-50 transition-all text-xs font-semibold text-slate-900 shadow-xs"
                >
                  <LayoutDashboard className="w-4 h-4 text-amber-600" />
                  <div className="flex flex-col text-left">
                    <span className="truncate max-w-[100px]">{partnerSession.full_name || 'Partner'}</span>
                    <span className="text-[10px] text-amber-700 font-mono">{partnerSession.partner_id}</span>
                  </div>
                </button>
                <button
                  onClick={onLogoutPartner}
                  title="Logout"
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenPartnerAuth('login')}
                  className="flex flex-col items-center justify-center p-2 text-slate-700 hover:text-blue-600 rounded-lg transition-colors group"
                >
                  <User className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
                  <span className="text-[11px] font-medium mt-0.5">Partner Login</span>
                </button>
              </div>
            )}

            {/* Wishlist Link */}
            <button
              onClick={onOpenWishlist}
              className="relative flex flex-col items-center justify-center p-2 text-slate-700 hover:text-red-600 rounded-lg transition-colors group"
              title="Wishlist"
            >
              <Heart className="w-5 h-5 text-slate-600 group-hover:text-red-600" />
              <span className="text-[11px] font-medium mt-0.5 hidden sm:inline">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-2 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Quick Deals Link */}
            <a
              href="#deals"
              className="flex flex-col items-center justify-center p-2 text-slate-700 hover:text-blue-600 rounded-lg transition-colors group"
              title="Hot Deals"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
              </div>
              <span className="text-[11px] font-medium mt-0.5 hidden sm:inline">Deals</span>
            </a>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="md:hidden mt-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products, brands, or partners..."
              className="w-full bg-slate-100 text-slate-900 text-sm rounded-l-lg py-2 pl-3 pr-8 border border-r-0 border-slate-200 focus:outline-hidden"
            />
            <button
              type="submit"
              className="h-[38px] px-4 bg-blue-600 text-white rounded-r-lg font-medium text-sm flex items-center justify-center"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Navigation Bar (Row 2 matching Image 1: All Categories dropdown + Category Links) */}
      <nav className="border-t border-slate-100 bg-white hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-2">
              {/* All Categories Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
                  className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold rounded-md transition-colors ${
                    selectedCategory === null
                      ? 'text-slate-900 bg-slate-100/80'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span>All Categories</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${categoriesDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {categoriesDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50">
                    <button
                      onClick={() => {
                        onSelectCategory(null);
                        setCategoriesDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                      All Products
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          onSelectCategory(cat.id);
                          setCategoriesDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${
                          selectedCategory === cat.id
                            ? 'bg-blue-50 text-blue-600 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Horizontal Category Text Links */}
              {categories.slice(0, 6).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`py-3 px-3 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'text-blue-600 font-semibold border-b-2 border-blue-600 rounded-none'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}

              <a
                href="#deals"
                className="py-3 px-3 text-xs font-semibold text-rose-600 hover:text-rose-700 whitespace-nowrap transition-colors"
              >
                Hot Deals
              </a>
            </div>

            {/* Quick Partner CTA in Nav */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onOpenPartnerAuth('register')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors py-1 px-2.5 rounded-sm hover:bg-amber-50"
              >
                Become a Partner
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          <div className="font-semibold text-xs text-slate-400 uppercase tracking-wider">Categories</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onSelectCategory(null);
                setMobileMenuOpen(false);
              }}
              className={`p-2 text-left text-xs font-medium rounded-md ${
                selectedCategory === null ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-700'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id);
                  setMobileMenuOpen(false);
                }}
                className={`p-2 text-left text-xs font-medium rounded-md ${
                  selectedCategory === cat.id ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200 space-y-2">
            {partnerSession ? (
              <>
                <button
                  onClick={() => {
                    onOpenPartnerDashboard();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 bg-amber-50 text-amber-800 rounded-md text-xs font-semibold"
                >
                  Partner Dashboard ({partnerSession.partner_id})
                </button>
                <button
                  onClick={() => {
                    onLogoutPartner();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 text-red-600 hover:bg-red-50 rounded-md text-xs font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onOpenPartnerAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2 text-center text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Partner Login
                </button>
                <button
                  onClick={() => {
                    onOpenPartnerAuth('register');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2 text-center text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Partner Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
