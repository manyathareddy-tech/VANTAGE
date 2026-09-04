export type NavTab = 
  | 'dashboard'
  | 'forecast'
  | 'inventory'
  | 'suggestions'
  | 'update_data'
  | 'chatbot'
  | 'settings';

export type StatusColor = 'green' | 'amber' | 'red';
export type TrendDirection = 'up' | 'down' | 'flat';

export interface RevenueTrend {
  recent: number;
  prior: number;
  direction: string;
}

export interface TopSuggestion {
  id: number | string;
  category: string;
  text: string;
  confidence_badge: string;
}

export interface DashboardSummary {
  cash_position: number;
  cash_trend_direction: TrendDirection;
  status_color: StatusColor;
  burn_rate: number;
  revenue_trend: RevenueTrend;
  inventory_alert_count: number;
  top_suggestions: TopSuggestion[];
  last_updated: string;
}

export interface HistoricalPoint {
  date?: string;
  value?: number;
  [key: string]: any;
}

export interface ForecastPoint {
  date: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
}

export interface ConfidenceBreakdown {
  [key: string]: number;
}

export interface ForecastResponse {
  business_id: number;
  sku_id?: number | null;
  historical: HistoricalPoint[];
  forecast: ForecastPoint[];
  model_used: string; // Internal only, do NOT render in UI
  mape: number | null;
  confidence_score: number;
  confidence_breakdown: ConfidenceBreakdown;
  validation_passed: boolean;
  failed_checks: string[];
  is_cold_start: boolean;
  explanation: string;
  // SKU-specific fields
  estimated_stockout_date?: string;
  revenue_impact_if_stockout?: number;
}

export interface ReorderRecommendation {
  should_reorder: boolean;
  target_stock: number;
}

export interface InventoryItem {
  id: number | string;
  sku_code: string;
  product_name: string;
  current_stock: number;
  reorder_point: number;
  is_flagged: boolean;
  flag_reason: string;
  days_to_stockout: string; // ISO date string
  reorder_recommendation?: ReorderRecommendation;
}

export type SuggestionStatus = 'pending' | 'approved' | 'dismissed';

export interface SuggestionItem {
  id: number | string;
  text: string;
  confidence_badge: string;
  referenced_numbers: number[];
  status: SuggestionStatus;
  created_at: string;
  category?: string; // Optional helper when flattened
}

export type SuggestionsResponse = Record<string, SuggestionItem[]>;

export interface DataStatusResponse {
  business_id: number;
  last_upload_at: string | null;
  row_count: number;
  is_demo_data: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'error';
  text: string;
  timestamp: Date;
}

export interface NotificationState {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}
