import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { apiClient } from '../api/client';
import { ForecastResponse, InventoryItem } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Header } from '../components/common/Header';
import { LoadingSpinner, CardSkeleton } from '../components/common/LoadingSpinner';
import { ErrorDisplay } from '../components/common/ErrorDisplay';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Package,
  Building2,
  Calendar,
  Sparkles,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export const CashForecastScreen: React.FC = () => {
  const { business_id, selectedSkuForForecast, navigateToSkuForecast } = useApp();
  const [period, setPeriod] = useState<number>(30);
  const [selectedSkuId, setSelectedSkuId] = useState<number | null>(selectedSkuForForecast);
  const [skuList, setSkuList] = useState<InventoryItem[]>([]);
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWhyExpanded, setIsWhyExpanded] = useState(false);

  // Sync if selectedSkuForForecast changes externally
  useEffect(() => {
    if (selectedSkuForForecast !== null && selectedSkuForForecast !== undefined) {
      setSelectedSkuId(selectedSkuForForecast);
    }
  }, [selectedSkuForForecast]);

  // Fetch Inventory for SKU dropdown
  useEffect(() => {
    if (!business_id) return;
    apiClient.getInventory(business_id)
      .then(items => setSkuList(items || []))
      .catch(err => console.error('Failed to fetch SKU list for forecast dropdown:', err));
  }, [business_id]);

  // Fetch Forecast
  const fetchForecast = useCallback(async (refresh = false) => {
    if (!business_id) return;
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      let data: ForecastResponse;
      if (selectedSkuId) {
        data = await apiClient.getSkuForecast(business_id, selectedSkuId, period);
      } else {
        data = await apiClient.getCompanyForecast(business_id, period);
      }
      setForecastData(data);
    } catch (err: any) {
      console.error('Forecast fetch error:', err);
      setError(err.message || 'Failed to fetch cash forecast data from backend.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [business_id, selectedSkuId, period]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  // Transform historical and forecast points into unified chart series
  const chartData = useMemo(() => {
    if (!forecastData) return [];

    const points: any[] = [];

    // Format historical points
    if (Array.isArray(forecastData.historical)) {
      forecastData.historical.forEach((item) => {
        const rawDate = item.date || item.timestamp || item.day || item.ds;
        const rawVal = item.value ?? item.cash ?? item.y ?? item.amount;
        if (rawDate !== undefined) {
          points.push({
            dateStr: rawDate,
            formattedDate: formatDate(rawDate),
            historicalValue: typeof rawVal === 'number' ? rawVal : Number(rawVal) || 0,
            forecastValue: null,
            yhatLower: null,
            yhatUpper: null,
            range: null,
          });
        }
      });
    }

    // Connect forecast line seamlessly from last historical point
    if (points.length > 0 && Array.isArray(forecastData.forecast) && forecastData.forecast.length > 0) {
      const lastHist = points[points.length - 1];
      lastHist.forecastValue = lastHist.historicalValue;
      lastHist.yhatLower = lastHist.historicalValue;
      lastHist.yhatUpper = lastHist.historicalValue;
      lastHist.range = [lastHist.historicalValue, lastHist.historicalValue];
    }

    // Add forecast points
    if (Array.isArray(forecastData.forecast)) {
      forecastData.forecast.forEach((item) => {
        points.push({
          dateStr: item.date,
          formattedDate: formatDate(item.date),
          historicalValue: null,
          forecastValue: item.yhat,
          yhatLower: item.yhat_lower,
          yhatUpper: item.yhat_upper,
          range: [item.yhat_lower, item.yhat_upper],
        });
      });
    }

    return points;
  }, [forecastData]);

  // Currently selected SKU details if any
  const currentSku = useMemo(() => {
    if (!selectedSkuId) return null;
    return skuList.find(s => s.id.toString() === selectedSkuId.toString()) || null;
  }, [selectedSkuId, skuList]);

  return (
    <div className="flex-1 min-h-screen bg-[#e8e5f0]/60 pb-20 md:pb-12">
      <Header
        title="Cash Forecast"
        subtitle="Predictive liquidity curve and SKU inventory depletion"
        onRefresh={() => fetchForecast(true)}
        isRefreshing={isRefreshing}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Controls Bar: Mode selector & Period selector */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#d6d0e6] flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Company vs SKU Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Forecast Scope:
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedSkuId(null)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                  selectedSkuId === null
                    ? 'bg-[#3d3358] text-white shadow-xs'
                    : 'bg-[#e8e5f0] text-slate-700 hover:bg-[#dedae8]'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Company Level</span>
              </button>

              {/* SKU Dropdown */}
              <div className="relative">
                <select
                  value={selectedSkuId ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedSkuId(val ? Number(val) : null);
                  }}
                  className={`px-3.5 py-2 pr-8 rounded-xl text-xs sm:text-sm font-semibold appearance-none border transition-colors cursor-pointer ${
                    selectedSkuId !== null
                      ? 'bg-[#3d3358] text-white border-[#3d3358] shadow-xs'
                      : 'bg-[#e8e5f0] text-slate-700 border-transparent hover:bg-[#dedae8]'
                  }`}
                >
                  <option value="" className="bg-white text-slate-800">
                    -- Select SKU Forecast --
                  </option>
                  {skuList.map((sku) => (
                    <option key={sku.id} value={sku.id} className="bg-white text-slate-800">
                      {sku.sku_code} - {sku.product_name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className={`w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                    selectedSkuId !== null ? 'text-white' : 'text-slate-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Time Period Segmented Control: 7 days, 30 days, 90 days */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Period:</span>
            </span>
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setPeriod(days)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  period === days
                    ? 'bg-[#3d3358] text-white shadow-xs'
                    : 'bg-[#e8e5f0] text-slate-600 hover:bg-[#dedae8]'
                }`}
              >
                {days} days
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <CardSkeleton rows={6} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CardSkeleton rows={3} />
              <CardSkeleton rows={3} />
            </div>
          </div>
        ) : error ? (
          <ErrorDisplay
            title="Failed to generate cash forecast"
            message={error}
            onRetry={() => fetchForecast(false)}
            isRetrying={isLoading}
          />
        ) : forecastData ? (
          <>
            {/* SKU Specific Highlight Callout (estimated_stockout_date & revenue_impact_if_stockout) */}
            {selectedSkuId && (forecastData.estimated_stockout_date || forecastData.revenue_impact_if_stockout !== undefined) && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 shrink-0 mt-0.5">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-950">
                      SKU Depletion Risk Analysis: {currentSku?.product_name || `SKU #${selectedSkuId}`}
                    </h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Estimated stock-out date: <span className="font-bold underline">{formatDate(forecastData.estimated_stockout_date)}</span>
                    </p>
                  </div>
                </div>

                {forecastData.revenue_impact_if_stockout !== undefined && (
                  <div className="px-4 py-2 bg-amber-100/80 rounded-xl border border-amber-200 text-right shrink-0">
                    <span className="text-[11px] font-semibold text-amber-800 uppercase block">
                      Potential Revenue Impact
                    </span>
                    <span className="text-lg font-extrabold text-amber-950">
                      {formatCurrency(forecastData.revenue_impact_if_stockout)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Cold Start Banner */}
            {forecastData.is_cold_start && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center gap-3 text-indigo-900 shadow-xs">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
                <p className="text-xs sm:text-sm font-medium">
                  Estimate based on category averages — upload more data for a personalized forecast.
                </p>
              </div>
            )}

            {/* Validation Failed Banner */}
            {!forecastData.validation_passed && (
              <div className="bg-rose-50 border border-rose-300 rounded-2xl p-5 text-rose-950 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>This forecast didn't pass our validation checks and may be unreliable</span>
                </div>
                {forecastData.failed_checks && forecastData.failed_checks.length > 0 && (
                  <ul className="list-disc list-inside text-xs text-rose-800 pl-2 space-y-1">
                    {forecastData.failed_checks.map((check, idx) => (
                      <li key={idx}>{check}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* MAIN CHART CARD */}
            <div
              className={`bg-white rounded-2xl p-6 shadow-xs border border-[#d6d0e6] transition-opacity ${
                !forecastData.validation_passed ? 'opacity-70 bg-slate-50' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#3d3358]">
                    {selectedSkuId ? 'Projected SKU Stock & Run-Rate' : 'Projected Liquidity Trajectory'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Solid line represents historical data; dashed line represents {period}-day forward projection with 90% confidence envelope.
                  </p>
                </div>

                {forecastData.mape !== null && forecastData.mape !== undefined && (
                  <div className="text-right">
                    <span className="text-[11px] uppercase font-bold text-slate-400 block">Model MAPE</span>
                    <span className="text-xs font-semibold text-slate-700">{forecastData.mape.toFixed(2)}% error</span>
                  </div>
                )}
              </div>

              {/* Recharts Canvas */}
              <div className="w-full h-[360px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e0ed" vertical={false} />
                    <XAxis
                      dataKey="formattedDate"
                      stroke="#888"
                      fontSize={11}
                      tickLine={false}
                      dy={8}
                    />
                    <YAxis
                      stroke="#888"
                      fontSize={11}
                      tickLine={false}
                      dx={-4}
                      tickFormatter={(val) => (selectedSkuId ? `${val} units` : formatCurrency(val))}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const dataPoint = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                              <p className="font-semibold text-indigo-200">{label}</p>
                              {dataPoint.historicalValue !== null && (
                                <p className="text-emerald-400 font-medium">
                                  Historical: {selectedSkuId ? `${dataPoint.historicalValue} units` : formatCurrency(dataPoint.historicalValue)}
                                </p>
                              )}
                              {dataPoint.forecastValue !== null && (
                                <>
                                  <p className="text-indigo-400 font-medium">
                                    Forecast (yhat): {selectedSkuId ? `${dataPoint.forecastValue} units` : formatCurrency(dataPoint.forecastValue)}
                                  </p>
                                  {dataPoint.yhatLower !== null && dataPoint.yhatUpper !== null && (
                                    <p className="text-slate-400 text-[11px]">
                                      Confidence Range: {selectedSkuId ? `${dataPoint.yhatLower} - ${dataPoint.yhatUpper} units` : `${formatCurrency(dataPoint.yhatLower)} - ${formatCurrency(dataPoint.yhatUpper)}`}
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }}
                    />
                    
                    {/* Confidence Band (Shaded area between yhat_lower and yhat_upper) */}
                    <Area
                      type="monotone"
                      dataKey="range"
                      stroke="none"
                      fill="url(#confidenceBand)"
                      name="Confidence Band"
                    />

                    {/* Historical solid line */}
                    <Line
                      type="monotone"
                      dataKey="historicalValue"
                      stroke="#3d3358"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#3d3358' }}
                      activeDot={{ r: 5 }}
                      name="Historical"
                      connectNulls={false}
                    />

                    {/* Forecast dashed line continuing from historical */}
                    <Line
                      type="monotone"
                      dataKey="forecastValue"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      strokeDasharray="5 5"
                      dot={{ r: 3, fill: '#6366f1' }}
                      activeDot={{ r: 5 }}
                      name="Forecast (yhat)"
                      connectNulls={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CONFIDENCE SCORE & BREAKDOWN SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Large Confidence Score */}
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#d6d0e6] flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Forecast Confidence Score
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-extrabold text-[#3d3358]">
                      {forecastData.confidence_score}%
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-5 h-5 ${forecastData.confidence_score >= 80 ? 'text-emerald-500' : 'text-amber-500'}`} />
                    <span className="text-xs font-semibold text-slate-700">
                      {forecastData.confidence_score >= 80 ? 'High Statistical Significance' : 'Moderate Variance Detected'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Confidence Breakdown Bars */}
              <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-xs border border-[#d6d0e6]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                  Confidence Score Breakdown
                </h4>

                {forecastData.confidence_breakdown && Object.keys(forecastData.confidence_breakdown).length > 0 ? (
                  <div className="space-y-3.5">
                    {Object.entries(forecastData.confidence_breakdown).map(([key, rawVal]) => {
                      const val = typeof rawVal === 'number' ? rawVal : Number(rawVal) || 0;
                      return (
                        <div key={key}>
                          <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                            <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                            <span className="font-bold text-[#3d3358]">{val}%</span>
                          </div>
                          <div className="w-full bg-[#e8e5f0] h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#3d3358] h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(0, val))}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No breakdown sub-scores available for this period.</p>
                )}
              </div>
            </div>

            {/* EXPANDABLE "WHY?" SECTION (Collapsed by default) */}
            <div className="bg-white rounded-2xl border border-[#d6d0e6] shadow-xs overflow-hidden">
              <button
                onClick={() => setIsWhyExpanded(!isWhyExpanded)}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-[#e8e5f0]/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#e8e5f0] text-[#3d3358] flex items-center justify-center font-bold">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#3d3358]">Why is the forecast trending this way?</h4>
                    <p className="text-xs text-slate-500">Read the algorithmic and economic driver explanation</p>
                  </div>
                </div>

                <div className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                  {isWhyExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {isWhyExpanded && (
                <div className="p-5 pt-0 border-t border-slate-100 bg-[#fbfafc] text-sm text-slate-700 leading-relaxed space-y-2">
                  <p>{forecastData.explanation || 'No explanatory notes provided by the telemetry engine.'}</p>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
