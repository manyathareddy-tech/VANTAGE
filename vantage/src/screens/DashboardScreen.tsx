import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { apiClient } from '../api/client';
import { DashboardSummary } from '../types';
import { formatCurrency, formatDate, renderHighlightedText } from '../utils/formatters';
import { Header } from '../components/common/Header';
import { CardSkeleton } from '../components/common/LoadingSpinner';
import { ErrorDisplay } from '../components/common/ErrorDisplay';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const { business_id, navigateToSuggestionsCategory, setActiveTab } = useApp();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async (refresh = false) => {
    if (!business_id) return;
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const summary = await apiClient.getDashboardSummary(business_id);
      setData(summary);
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err.message || 'Failed to fetch dashboard summary from backend.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [business_id]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const getCategoryBadgeClass = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'tax':
      case 'tax_compliance':
        return 'bg-blue-100 text-blue-700';
      case 'loans':
      case 'loan_repayment':
        return 'bg-purple-100 text-purple-700';
      case 'inventory':
      case 'stock':
        return 'bg-orange-100 text-orange-700';
      case 'salaries':
      case 'payroll':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-purple-100 text-purple-800';
    }
  };

  const getConfidenceBadgeClass = (confidence: string) => {
    switch (confidence?.toLowerCase()) {
      case 'high':
        return 'bg-green-100 text-green-700';
      case 'medium':
      case 'med':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-[#e8e5f0] pb-20 md:pb-12">
      <Header
        title="Dashboard"
        subtitle={data?.last_updated ? `Last updated: ${formatDate(data.last_updated, true)}` : 'Financial telemetry & operational health'}
        onRefresh={() => fetchSummary(true)}
        isRefreshing={isRefreshing}
      />

      <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="space-y-6">
            <CardSkeleton rows={4} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <CardSkeleton rows={2} />
              <CardSkeleton rows={2} />
              <CardSkeleton rows={2} />
            </div>
            <CardSkeleton rows={3} />
          </div>
        ) : error ? (
          <ErrorDisplay
            title="Unable to connect to financial telemetry"
            message={error}
            onRetry={() => fetchSummary(false)}
            isRetrying={isLoading}
          />
        ) : data ? (
          <>
            {/* HERO CARD: Current Cash Position (Geometric Balance Hero Card) */}
            {(() => {
              const isGreen = data.status_color === 'green';
              const isAmber = data.status_color === 'amber';
              const borderColor = isGreen
                ? 'border-green-500'
                : isAmber
                ? 'border-amber-500'
                : 'border-red-500';
              const circleBg = isGreen
                ? 'bg-green-50'
                : isAmber
                ? 'bg-amber-50'
                : 'bg-red-50';
              const trendTextColor =
                data.cash_trend_direction === 'up'
                  ? 'text-green-600'
                  : data.cash_trend_direction === 'down'
                  ? 'text-rose-600'
                  : 'text-slate-500';

              return (
                <div
                  className={`bg-white rounded-2xl shadow-sm border-l-[6px] ${borderColor} p-6 sm:p-8 flex flex-col justify-center relative overflow-hidden`}
                >
                  {/* Decorative Geometric Circle */}
                  <div
                    className={`absolute top-0 right-0 w-32 h-32 ${circleBg} opacity-20 -mr-16 -mt-16 rounded-full pointer-events-none`}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Current Cash Position
                      </h2>

                      <div className="flex items-baseline gap-3 flex-wrap">
                        <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                          {formatCurrency(data.cash_position)}
                        </span>
                        
                        <span className={`flex items-center gap-1 font-bold text-base sm:text-lg ${trendTextColor}`}>
                          {data.cash_trend_direction === 'up' ? (
                            <>
                              <span className="text-xl leading-none">↑</span>
                              <span>Positive Trend</span>
                            </>
                          ) : data.cash_trend_direction === 'down' ? (
                            <>
                              <span className="text-xl leading-none">↓</span>
                              <span>Declining</span>
                            </>
                          ) : (
                            <span>Steady</span>
                          )}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-2 font-medium">
                        Status: <span className="font-bold uppercase tracking-wider">{data.status_color === 'green' ? 'Healthy growth' : data.status_color === 'amber' ? 'Caution watch' : 'Shortfall risk detected'}</span> over trailing 30 days
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab('forecast')}
                        className="px-4 py-2.5 bg-[#3d3358] hover:bg-[#2d2642] text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                      >
                        <span>View Cash Forecast</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ROW OF 3 STAT TILES (Geometric Balance Design) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Tile 1: Burn Rate */}
              <div className="bg-white rounded-xl shadow-sm p-5 border border-purple-100 flex flex-col justify-between">
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    Burn Rate
                  </h3>
                  <div className="flex justify-between items-end">
                    <span className="text-xl sm:text-2xl font-bold text-slate-800">
                      {formatCurrency(data.burn_rate)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 mb-1">/ MONTH</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-amber-400 w-2/3 h-full rounded-full"></div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-3 font-medium">
                  Monthly operational expenditure run rate
                </p>
              </div>

              {/* Tile 2: Revenue Trend */}
              <div className="bg-white rounded-xl shadow-sm p-5 border border-purple-100 flex flex-col justify-between">
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    Revenue Trend
                  </h3>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xl sm:text-2xl font-bold text-slate-800">
                      {formatCurrency(data.revenue_trend?.recent)}
                    </span>
                    {data.revenue_trend?.prior ? (
                      <span className="text-[10px] font-bold text-green-600">
                        Prior: {formatCurrency(data.revenue_trend.prior)}
                      </span>
                    ) : null}
                  </div>

                  {data.revenue_trend?.prior ? (
                    (() => {
                      const changePct = ((data.revenue_trend.recent - data.revenue_trend.prior) / data.revenue_trend.prior) * 100;
                      const isPositive = changePct >= 0;
                      return (
                        <p className={`text-[11px] font-bold mt-2 flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-rose-600'}`}>
                          <span>{isPositive ? '▲' : '▼'}</span>
                          <span>{Math.abs(changePct).toFixed(1)}% {isPositive ? 'Growth' : 'Decline'}</span>
                        </p>
                      );
                    })()
                  ) : (
                    <p className="text-[11px] text-slate-500 font-bold mt-2 capitalize">
                      Trend: {data.revenue_trend?.direction || 'Steady'}
                    </p>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mt-3 font-medium">
                  Direction: <span className="capitalize font-semibold text-slate-600">{data.revenue_trend?.direction}</span>
                </p>
              </div>

              {/* Tile 3: Inventory Alerts */}
              <div className="bg-white rounded-xl shadow-sm p-5 border border-purple-100 relative flex flex-col justify-between">
                {data.inventory_alert_count > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                    {data.inventory_alert_count} Alerts
                  </div>
                )}
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    Inventory Alerts
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${data.inventory_alert_count > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {data.inventory_alert_count > 0 ? '!' : '✓'}
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-slate-800">
                      {data.inventory_alert_count > 0 ? 'Critical Low' : 'Healthy Levels'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3">
                  <span>{data.inventory_alert_count} SKUs at risk</span>
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className="text-[#3d3358] font-bold hover:underline cursor-pointer"
                  >
                    View SKUs →
                  </button>
                </div>
              </div>
            </div>

            {/* PRIORITY SUGGESTIONS (Geometric Balance Design) */}
            <div className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-purple-50 bg-slate-50/50 flex justify-between items-center">
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  Priority Suggestions
                </h2>
                <button
                  onClick={() => setActiveTab('suggestions')}
                  className="text-[10px] text-[#3d3358] font-bold underline cursor-pointer hover:opacity-80"
                >
                  View All
                </button>
              </div>

              <div className="p-6">
                {!data.top_suggestions || data.top_suggestions.length === 0 ? (
                  <div className="py-8 text-center">
                    <Sparkles className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-700">
                      No pending suggestions — telemetry is clean.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.top_suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        onClick={() => navigateToSuggestionsCategory(suggestion.category)}
                        className="p-4 rounded-xl border border-purple-50 bg-purple-50/20 hover:border-purple-200 transition-colors cursor-pointer flex flex-col justify-between gap-3 group"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${getCategoryBadgeClass(suggestion.category)}`}>
                              {suggestion.category}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${getConfidenceBadgeClass(suggestion.confidence_badge)}`}>
                              {suggestion.confidence_badge} Confidence
                            </span>
                          </div>

                          <p className="text-sm text-slate-700 leading-relaxed font-medium group-hover:text-slate-900 transition-colors">
                            {renderHighlightedText(suggestion.text, suggestion.referenced_numbers)}
                          </p>
                        </div>

                        <div className="flex items-center justify-end text-[10px] font-bold text-[#3d3358] underline group-hover:opacity-80">
                          Review in Suggestions →
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
