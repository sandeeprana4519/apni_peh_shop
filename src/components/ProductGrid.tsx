import React from 'react';
import { Filter, SlidersHorizontal, ArrowUpDown, RefreshCw, X, ChevronDown } from 'lucide-react';
import { Product, Category, AffiliatePlatform, Partner } from '../types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  platforms: AffiliatePlatform[];
  partners: Partner[];
  selectedCategory: number | null;
  onSelectCategory: (id: number | null) => void;
  selectedPlatform: number | null;
  onSelectPlatform: (id: number | null) => void;
  selectedPartner: number | null;
  onSelectPartner: (id: number | null) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onResetFilters: () => void;
  onOpenDetails: (product: Product) => void;
  isWishlisted?: (productId: number) => boolean;
  onToggleWishlist?: (product: Product) => void;
  loading?: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onLoadMore?: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  categories,
  platforms,
  partners,
  selectedCategory,
  onSelectCategory,
  selectedPlatform,
  onSelectPlatform,
  selectedPartner,
  onSelectPartner,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
  onResetFilters,
  onOpenDetails,
  isWishlisted,
  onToggleWishlist,
  loading = false,
  totalCount,
  currentPage,
  totalPages,
  onLoadMore,
}) => {
  const hasActiveFilters =
    Boolean(searchQuery) ||
    selectedCategory !== null ||
    selectedPlatform !== null ||
    selectedPartner !== null ||
    sortBy !== 'newest';

  return (
    <section id="browse-all-products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Filter Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
            All Curated Products
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Showing {products.length} of {totalCount} verified affiliate deals
          </p>
        </div>

        {/* Combined Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Selector */}
          <div className="relative">
            <select
              value={selectedCategory === null ? '' : selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value ? Number(e.target.value) : null)}
              className="appearance-none bg-white border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden focus:border-blue-500 shadow-2xs"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Platform Selector */}
          <div className="relative">
            <select
              value={selectedPlatform === null ? '' : selectedPlatform}
              onChange={(e) => onSelectPlatform(e.target.value ? Number(e.target.value) : null)}
              className="appearance-none bg-white border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden focus:border-blue-500 shadow-2xs"
            >
              <option value="">All Platforms</option>
              {platforms.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Partner Selector */}
          <div className="relative">
            <select
              value={selectedPartner === null ? '' : selectedPartner}
              onChange={(e) => onSelectPartner(e.target.value ? Number(e.target.value) : null)}
              className="appearance-none bg-white border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden focus:border-blue-500 shadow-2xs"
            >
              <option value="">All Partners</option>
              {partners.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  {pt.partner_id} - {pt.full_name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Sorting */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden focus:border-blue-500 shadow-2xs"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Highest Rated</option>
              <option value="popular">Most Popular</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="py-2 px-3 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="pt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Active filters:</span>
          {searchQuery && (
            <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium flex items-center gap-1">
              Search: "{searchQuery}"
              <button onClick={() => onSearchChange('')} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedCategory !== null && (
            <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium flex items-center gap-1">
              Category: {categories.find((c) => c.id === selectedCategory)?.name}
              <button onClick={() => onSelectCategory(null)} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedPlatform !== null && (
            <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium flex items-center gap-1">
              Platform: {platforms.find((pl) => pl.id === selectedPlatform)?.name}
              <button onClick={() => onSelectPlatform(null)} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedPartner !== null && (
            <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 font-medium flex items-center gap-1">
              Partner: {partners.find((pt) => pt.id === selectedPartner)?.full_name}
              <button onClick={() => onSelectPartner(null)} className="hover:text-amber-950">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Grid of Products */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 mt-6 space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No matching products found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords, clearing categories, or selecting another platform.
          </p>
          <button
            onClick={onResetFilters}
            className="py-2 px-4 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
          {products.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onOpenDetails={onOpenDetails}
              isWishlisted={isWishlisted ? isWishlisted(prod.id) : false}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      )}

      {/* Load More / Pagination */}
      {totalPages > 1 && currentPage < totalPages && (
        <div className="text-center pt-10">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="py-3 px-8 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 transition-colors shadow-2xs hover:shadow-xs disabled:opacity-50"
          >
            {loading ? 'Loading more products...' : 'Load More Products'}
          </button>
        </div>
      )}
    </section>
  );
};
