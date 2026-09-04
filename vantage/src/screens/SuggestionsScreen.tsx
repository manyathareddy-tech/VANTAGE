import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { apiClient } from '../api/client';
import { SuggestionsResponse, SuggestionItem, SuggestionStatus } from '../types';
import {
  formatDate,
  renderHighlightedText,
  getConfidenceBadgeStyle,
} from '../utils/formatters';
import { Header } from '../components/common/Header';
import { LoadingSpinner, CardSkeleton } from '../components/common/LoadingSpinner';
import { ErrorDisplay } from '../components/common/ErrorDisplay';
import { EmptyState } from '../components/common/EmptyState';
import {
  Lightbulb,
  Check,
  X,
  History,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  Tag,
} from 'lucide-react';

export const SuggestionsScreen: React.FC = () => {
  const { business_id, selectedSuggestionCategory, showNotification } = useApp();
  const [data, setData] = useState<SuggestionsResponse>({});
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track collapsed state for Audit Trail per category
  const [expandedAuditTrail, setExpandedAuditTrail] = useState<Record<string, boolean>>({});
  
  // Action in-flight indicator
  const [actionLoadingId, setActionLoadingId] = useState<number | string | null>(null);

  // Set initial category from context if provided
  useEffect(() => {
    if (selectedSuggestionCategory) {
      setActiveCategory(selectedSuggestionCategory);
    }
  }, [selectedSuggestionCategory]);

  const fetchSuggestions = useCallback(async (refresh = false) => {
    if (!business_id) return;
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.getSuggestions(business_id);
      setData(response || {});
    } catch (err: any) {
      console.error('Suggestions fetch error:', err);
      setError(err.message || 'Failed to fetch suggestions from backend.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [business_id]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // Dynamically extract categories from API response object keys
  const categoryKeys = useMemo(() => {
    return Object.keys(data);
  }, [data]);

  // Handler for Approve & Dismiss with Optimistic Updates & Reversion
  const handleAction = async (
    targetCategory: string,
    suggestionId: number | string,
    action: 'approve' | 'dismiss'
  ) => {
    const previousState = JSON.parse(JSON.stringify(data));
    const newStatus: SuggestionStatus = action === 'approve' ? 'approved' : 'dismissed';

    // Optimistic Update
    setData((prev) => {
      const updated = { ...prev };
      if (updated[targetCategory]) {
        updated[targetCategory] = updated[targetCategory].map((item) =>
          item.id === suggestionId ? { ...item, status: newStatus } : item
        );
      }
      return updated;
    });

    setActionLoadingId(suggestionId);

    try {
      if (action === 'approve') {
        await apiClient.approveSuggestion(suggestionId);
        showNotification('Suggestion approved and archived to audit trail.', 'success');
      } else {
        await apiClient.dismissSuggestion(suggestionId);
        showNotification('Suggestion dismissed.', 'info');
      }
    } catch (err: any) {
      console.error(`Failed to ${action} suggestion:`, err);
      // Revert optimistic state
      setData(previousState);
      showNotification(`Failed to ${action} suggestion: ${err.message || 'Server error'}`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const toggleAuditTrail = (category: string) => {
    setExpandedAuditTrail((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Filter displayed categories according to activeCategory
  const displayedCategories = useMemo(() => {
    if (activeCategory === 'all') {
      return categoryKeys;
    }
    return categoryKeys.filter((k) => k === activeCategory);
  }, [activeCategory, categoryKeys]);

  return (
    <div className="flex-1 min-h-screen bg-[#e8e5f0]/60 pb-20 md:pb-12">
      <Header
        title="Suggestions"
        subtitle="Actionable financial optimization & cost reduction signals"
        onRefresh={() => fetchSuggestions(true)}
        isRefreshing={isRefreshing}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* CATEGORY FILTER CHIPS (dynamically generated from object keys) */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#d6d0e6]">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1 shrink-0 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              <span>Category:</span>
            </span>

            {/* "All" chip */}
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-[#3d3358] text-white shadow-xs'
                  : 'bg-[#e8e5f0] text-slate-700 hover:bg-[#dedae8]'
              }`}
            >
              All Categories ({categoryKeys.length})
            </button>

            {/* Dynamic chips from response keys */}
            {categoryKeys.map((catKey) => {
              const count = data[catKey]?.length || 0;
              const isSelected = activeCategory === catKey;
              return (
                <button
                  key={catKey}
                  onClick={() => setActiveCategory(catKey)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#3d3358] text-white shadow-xs'
                      : 'bg-[#e8e5f0] text-slate-700 hover:bg-[#dedae8]'
                  }`}
                >
                  <span>{catKey.replace(/_/g, ' ')}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-700'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <CardSkeleton rows={3} />
            <CardSkeleton rows={3} />
          </div>
        ) : error ? (
          <ErrorDisplay
            title="Failed to load suggestions"
            message={error}
            onRetry={() => fetchSuggestions(false)}
            isRetrying={isLoading}
          />
        ) : categoryKeys.length === 0 ? (
          <EmptyState
            icon={Lightbulb}
            title="No suggestions generated yet"
            description="Upload transactions or inventory data in the Update Data section to generate AI-driven cost optimizations."
          />
        ) : (
          <div className="space-y-8">
            {displayedCategories.map((category) => {
              const allItems = data[category] || [];
              const pendingItems = allItems.filter((i) => i.status === 'pending');
              const auditItems = allItems.filter((i) => i.status !== 'pending');
              const isAuditExpanded = expandedAuditTrail[category] || false;

              return (
                <div
                  key={category}
                  className="bg-white rounded-2xl p-6 shadow-xs border border-[#d6d0e6] space-y-5"
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#3d3358]"></span>
                      <h3 className="text-lg font-bold text-[#3d3358] uppercase tracking-wide">
                        {category.replace(/_/g, ' ')}
                      </h3>
                      <span className="text-xs text-slate-500 font-medium">
                        ({pendingItems.length} active)
                      </span>
                    </div>
                  </div>

                  {/* ACTIVE / PENDING SUGGESTIONS STACK */}
                  {pendingItems.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 text-xs italic bg-[#fbfafc] rounded-xl border border-dashed border-slate-200">
                      No pending suggestions in this category. All actions have been resolved.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-[#fbfafc] rounded-xl p-5 border border-[#d6d0e6] hover:border-[#3d3358]/40 transition-all shadow-xs flex flex-col justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                              {/* Confidence Badge */}
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getConfidenceBadgeStyle(
                                  item.confidence_badge
                                )}`}
                              >
                                {item.confidence_badge} confidence
                              </span>

                              <span className="text-xs text-slate-400 font-mono">
                                {formatDate(item.created_at)}
                              </span>
                            </div>

                            {/* Text with highlighted referenced numbers */}
                            <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal">
                              {renderHighlightedText(item.text, item.referenced_numbers)}
                            </p>
                          </div>

                          {/* Approve and Dismiss Action Buttons for pending items */}
                          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/80">
                            <button
                              onClick={() => handleAction(category, item.id, 'dismiss')}
                              disabled={actionLoadingId === item.id}
                              className="px-3.5 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                              <span>Dismiss</span>
                            </button>

                            <button
                              onClick={() => handleAction(category, item.id, 'approve')}
                              disabled={actionLoadingId === item.id}
                              className="px-4 py-2 bg-[#3d3358] hover:bg-[#2e2644] text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              <Check className="w-4 h-4 text-emerald-400" />
                              <span>Approve Suggestion</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* COLLAPSIBLE AUDIT TRAIL SECTION */}
                  {auditItems.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => toggleAuditTrail(category)}
                        className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-[#3d3358] py-2 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-slate-400" />
                          <span>Audit Trail ({auditItems.length} resolved records)</span>
                        </div>
                        {isAuditExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {isAuditExpanded && (
                        <div className="mt-3 space-y-2.5 animate-fade-in">
                          {auditItems.map((item) => (
                            <div
                              key={item.id}
                              className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 opacity-85"
                            >
                              <div className="flex-1">
                                <p className="text-slate-700 line-clamp-2">
                                  {renderHighlightedText(item.text, item.referenced_numbers)}
                                </p>
                                <span className="text-[10px] text-slate-400 block mt-1">
                                  Created: {formatDate(item.created_at, true)}
                                </span>
                              </div>

                              <div className="shrink-0 flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                                    item.status === 'approved'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-slate-200 text-slate-700 border border-slate-300'
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
