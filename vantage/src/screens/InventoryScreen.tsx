import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { apiClient } from '../api/client';
import { InventoryItem } from '../types';
import { formatDate } from '../utils/formatters';
import { Header } from '../components/common/Header';
import { LoadingSpinner, CardSkeleton } from '../components/common/LoadingSpinner';
import { ErrorDisplay } from '../components/common/ErrorDisplay';
import { EmptyState } from '../components/common/EmptyState';
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  Package,
  ArrowRight,
  TrendingUp,
  X,
  Calendar,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

export const InventoryScreen: React.FC = () => {
  const { business_id, navigateToSkuForecast } = useApp();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected SKU for detail drawer/modal
  const [selectedSkuId, setSelectedSkuId] = useState<number | string | null>(null);
  const [skuDetail, setSkuDetail] = useState<InventoryItem | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Debounce search query (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Inventory List
  const fetchInventory = useCallback(async (refresh = false) => {
    if (!business_id) return;
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getInventory(business_id, debouncedSearch);
      setItems(data || []);
    } catch (err: any) {
      console.error('Inventory fetch error:', err);
      setError(err.message || 'Failed to fetch inventory records.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [business_id, debouncedSearch]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Fetch Detail when item selected
  useEffect(() => {
    if (!selectedSkuId || !business_id) {
      setSkuDetail(null);
      return;
    }

    setIsLoadingDetail(true);
    setDetailError(null);

    apiClient.getInventoryDetail(business_id, selectedSkuId)
      .then((detail) => setSkuDetail(detail))
      .catch((err) => {
        console.error('SKU detail fetch error:', err);
        setDetailError(err.message || 'Failed to load SKU detail.');
      })
      .finally(() => setIsLoadingDetail(false));
  }, [selectedSkuId, business_id]);

  const flaggedItems = items.filter((item) => item.is_flagged);
  const healthyItems = items.filter((item) => !item.is_flagged);

  return (
    <div className="flex-1 min-h-screen bg-[#e8e5f0]/60 pb-20 md:pb-12">
      <Header
        title="Inventory"
        subtitle="Stockout risk alerts & reorder intelligence"
        onRefresh={() => fetchInventory(true)}
        isRefreshing={isRefreshing}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Search Bar */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs border border-[#d6d0e6]">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by SKU code or product name..."
              className="w-full pl-11 pr-4 py-2.5 bg-[#e8e5f0]/40 border border-[#d6d0e6] rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3d3358] focus:border-transparent text-sm font-medium transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <CardSkeleton rows={3} />
            <CardSkeleton rows={3} />
          </div>
        ) : error ? (
          <ErrorDisplay
            title="Failed to retrieve inventory data"
            message={error}
            onRetry={() => fetchInventory(false)}
            isRetrying={isLoading}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Package}
            title={searchQuery ? 'No inventory items match your search' : 'No inventory records found'}
            description={searchQuery ? `Try searching with a different SKU code or product keyword.` : 'Upload inventory CSV to view stockout alerts and reorder suggestions.'}
          />
        ) : (
          <div className="space-y-8">
            {/* SECTION 1: Needs Attention (is_flagged = true) */}
            {flaggedItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-rose-950">
                    Needs Attention ({flaggedItems.length})
                  </h3>
                  <span className="text-xs text-rose-700 font-medium ml-1">
                    Projected stock depletion risk
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {flaggedItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedSkuId(item.id)}
                      className="bg-white rounded-2xl p-5 border-l-4 border-l-rose-500 border border-[#d6d0e6] shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-mono text-xs font-bold text-[#3d3358] bg-[#e8e5f0] px-2 py-0.5 rounded">
                            {item.sku_code}
                          </span>
                          <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Action Required</span>
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-slate-900 group-hover:text-[#3d3358] transition-colors">
                          {item.product_name}
                        </h4>

                        {/* Flag Reason */}
                        {item.flag_reason && (
                          <p className="text-xs font-medium text-rose-600 mt-1.5 leading-snug">
                            {item.flag_reason}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-500 block">Current Stock</span>
                          <span className="font-bold text-slate-900 text-sm">
                            {item.current_stock} units
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Projected Stockout</span>
                          <span className="font-bold text-rose-700 text-sm flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {/* Date formatted as required, never raw day count */}
                            {formatDate(item.days_to_stockout)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 2: Healthy (is_flagged = false) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#3d3358]">
                  Healthy Stock ({healthyItems.length})
                </h3>
              </div>

              {healthyItems.length === 0 ? (
                <p className="text-xs text-slate-500 italic bg-white p-4 rounded-xl border border-[#d6d0e6]">
                  All current SKUs are flagged for attention.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {healthyItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedSkuId(item.id)}
                      className="bg-white rounded-2xl p-5 border-l-4 border-l-emerald-500 border border-[#d6d0e6] shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-mono text-xs font-bold text-[#3d3358] bg-[#e8e5f0] px-2 py-0.5 rounded">
                            {item.sku_code}
                          </span>
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Normal</span>
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-slate-900 group-hover:text-[#3d3358] transition-colors">
                          {item.product_name}
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-500 block">Current Stock</span>
                          <span className="font-bold text-slate-900 text-sm">
                            {item.current_stock} units
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Safe Depletion Date</span>
                          <span className="font-bold text-slate-700 text-sm flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {/* Formatted date, never raw number */}
                            {formatDate(item.days_to_stockout)}
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
      </div>

      {/* SKU DETAIL MODAL / DRAWER */}
      {selectedSkuId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#d6d0e6] overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-[#fbfafc]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#3d3358] text-white flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#3d3358]">SKU Diagnostics</h3>
                  <span className="text-xs text-slate-500 font-mono">
                    ID: {selectedSkuId}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedSkuId(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {isLoadingDetail ? (
                <LoadingSpinner label="Loading SKU parameters..." />
              ) : detailError ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                  {detailError}
                </div>
              ) : skuDetail ? (
                <>
                  <div>
                    <span className="font-mono text-xs font-bold text-[#3d3358] bg-[#e8e5f0] px-2 py-0.5 rounded">
                      {skuDetail.sku_code}
                    </span>
                    <h4 className="text-lg font-bold text-slate-900 mt-1.5">
                      {skuDetail.product_name}
                    </h4>
                    {skuDetail.flag_reason && (
                      <p className="text-xs text-rose-600 font-medium mt-1">
                        {skuDetail.flag_reason}
                      </p>
                    )}
                  </div>

                  {/* Stock Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4 bg-[#e8e5f0]/40 p-4 rounded-xl border border-[#d6d0e6]">
                    <div>
                      <span className="text-xs text-slate-500 font-medium block">Current Stock</span>
                      <span className="text-xl font-extrabold text-[#3d3358]">
                        {skuDetail.current_stock} units
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-medium block">Reorder Point</span>
                      <span className="text-xl font-extrabold text-slate-700">
                        {skuDetail.reorder_point} units
                      </span>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-[#d6d0e6]/60">
                      <span className="text-xs text-slate-500 font-medium block">Projected Stockout Date</span>
                      <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        {formatDate(skuDetail.days_to_stockout)}
                      </span>
                    </div>
                  </div>

                  {/* Reorder Recommendation Block */}
                  {skuDetail.reorder_recommendation && skuDetail.reorder_recommendation.should_reorder ? (
                    <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-1">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>Reorder Recommended</span>
                      </div>
                      <p className="text-xs text-amber-800">
                        Target stock recommendation: <strong className="font-bold">{skuDetail.reorder_recommendation.target_stock} units</strong>
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Stock level is currently sufficient. No immediate replenishment required.</span>
                    </div>
                  )}

                  {/* View Forecast for this SKU Button */}
                  <button
                    onClick={() => {
                      const skuNum = Number(skuDetail.id);
                      setSelectedSkuId(null);
                      navigateToSkuForecast(skuNum);
                    }}
                    className="w-full py-3 px-4 bg-[#3d3358] hover:bg-[#2d2542] text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>View Forecast for this SKU</span>
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
