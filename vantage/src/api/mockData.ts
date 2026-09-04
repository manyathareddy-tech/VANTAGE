import {
  DashboardSummary,
  ForecastResponse,
  InventoryItem,
  SuggestionsResponse,
  DataStatusResponse,
} from '../types';

export const mockDashboardData: DashboardSummary = {
  cash_position: 1845000,
  cash_trend_direction: 'up',
  status_color: 'green',
  burn_rate: 320000,
  revenue_trend: {
    recent: 1420000,
    prior: 1250000,
    direction: 'up',
  },
  inventory_alert_count: 3,
  top_suggestions: [
    {
      id: 101,
      category: 'tax',
      text: 'File GSTR-3B before the 20th to unlock ₹85,000 in eligible input tax credit before fiscal cutoff.',
      confidence_badge: 'high',
    },
    {
      id: 102,
      category: 'loans',
      text: 'Working capital loan interest rate is 14.5%. Refinancing under CGTMSE scheme could save ₹42,000 annually.',
      confidence_badge: 'high',
    },
    {
      id: 103,
      category: 'packaging',
      text: 'Bulk purchase order for corrugated boxes from local vendor can reduce unit cost by 8.5% (saving approx ₹18,500).',
      confidence_badge: 'medium',
    },
  ],
  last_updated: new Date().toISOString(),
};

export const mockInventoryList: InventoryItem[] = [
  {
    id: 1,
    sku_code: 'SKU-TEX-001',
    product_name: 'Premium Cotton Twill Fabric 40s (100m Roll)',
    current_stock: 14,
    reorder_point: 25,
    is_flagged: true,
    flag_reason: 'Stock level critically below safety buffer; 4 orders pending',
    days_to_stockout: '2026-09-08',
    reorder_recommendation: {
      should_reorder: true,
      target_stock: 50,
    },
  },
  {
    id: 2,
    sku_code: 'SKU-TEX-008',
    product_name: 'Dye Pigment Reactive Royal Navy (25kg Drum)',
    current_stock: 3,
    reorder_point: 10,
    is_flagged: true,
    flag_reason: 'Supplier lead time is 12 days; stockout projected within a week',
    days_to_stockout: '2026-09-07',
    reorder_recommendation: {
      should_reorder: true,
      target_stock: 20,
    },
  },
  {
    id: 3,
    sku_code: 'SKU-PKG-012',
    product_name: 'Export Grade Corrugated Boxes (Heavy Duty)',
    current_stock: 120,
    reorder_point: 300,
    is_flagged: true,
    flag_reason: 'High consumption run rate; reorder window closing',
    days_to_stockout: '2026-09-14',
    reorder_recommendation: {
      should_reorder: true,
      target_stock: 600,
    },
  },
  {
    id: 4,
    sku_code: 'SKU-TEX-045',
    product_name: 'Mercerized Sewing Thread 3-Ply White (Cones)',
    current_stock: 450,
    reorder_point: 150,
    is_flagged: false,
    flag_reason: '',
    days_to_stockout: '2026-11-28',
    reorder_recommendation: {
      should_reorder: false,
      target_stock: 450,
    },
  },
  {
    id: 5,
    sku_code: 'SKU-ACC-099',
    product_name: 'Brass Metallic Zippers YKK-Grade 18cm',
    current_stock: 1200,
    reorder_point: 400,
    is_flagged: false,
    flag_reason: '',
    days_to_stockout: '2026-12-15',
    reorder_recommendation: {
      should_reorder: false,
      target_stock: 1200,
    },
  },
  {
    id: 6,
    sku_code: 'SKU-TEX-082',
    product_name: 'Linen Blend Weave Slate Grey (50m Roll)',
    current_stock: 35,
    reorder_point: 20,
    is_flagged: false,
    flag_reason: '',
    days_to_stockout: '2026-10-22',
    reorder_recommendation: {
      should_reorder: false,
      target_stock: 50,
    },
  },
];

export function generateForecastMock(period: number, skuId?: number | null): ForecastResponse {
  const days = period || 30;
  const historical = [];
  const forecast = [];
  const baseValue = skuId ? 85 : 1800000;
  const now = new Date();

  // Generate 15 historical points
  for (let i = 14; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * (days / 15));
    const randomVariation = (Math.sin(i / 2) * 0.15 + (Math.random() * 0.1 - 0.05)) * baseValue;
    historical.push({
      date: d.toISOString().split('T')[0],
      value: Math.round(baseValue + randomVariation),
    });
  }

  const lastHistoricalVal = historical[historical.length - 1].value;

  // Generate forecast points
  for (let i = 1; i <= 10; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i * (days / 10));
    const trend = skuId ? - (i * 6) : (i * 35000);
    const expected = Math.max(0, Math.round(lastHistoricalVal + trend + (Math.random() * 0.05 - 0.025) * baseValue));
    const spread = (i * 0.03 + 0.04) * baseValue;
    
    forecast.push({
      date: d.toISOString().split('T')[0],
      yhat: expected,
      yhat_lower: Math.max(0, Math.round(expected - spread)),
      yhat_upper: Math.round(expected + spread),
    });
  }

  return {
    business_id: 1,
    sku_id: skuId || null,
    historical,
    forecast,
    model_used: 'ensemble_arima_prophet_v2', // NEVER displayed in UI
    mape: 4.8,
    confidence_score: 88,
    confidence_breakdown: {
      'Cash Inflow Consistency': 92,
      'Vendor Payment Cycle': 85,
      'Seasonal Demand Pattern': 86,
      'Receivables Ageing': 89,
    },
    validation_passed: true,
    failed_checks: [],
    is_cold_start: false,
    explanation: skuId
      ? 'Demand has surged by 28% over the past 30 days due to festive export commitments. The current depletion trajectory indicates stockout around 08 Sep 2026 without replenishment.'
      : 'Forecast projects healthy positive cash flow driven by 12% higher collections in trade receivables and stable operational overheads across the next billing cycle.',
    estimated_stockout_date: skuId ? '2026-09-08' : undefined,
    revenue_impact_if_stockout: skuId ? 145000 : undefined,
  };
}

export const mockSuggestionsData: SuggestionsResponse = {
  tax: [
    {
      id: 201,
      text: 'File your GSTR-3B before the 20th of this month to unlock ₹85,000 in eligible input tax credit and avoid late fee penalties of ₹50 per day.',
      confidence_badge: 'high',
      referenced_numbers: [85000, 20, 50],
      status: 'pending',
      created_at: '2026-08-30T10:15:00Z',
    },
    {
      id: 202,
      text: 'Advance Tax Q2 instalment of ₹1,40,000 is due on 15 September to prevent Section 234C interest liability of ₹4,200.',
      confidence_badge: 'high',
      referenced_numbers: [140000, 15, 234, 4200],
      status: 'pending',
      created_at: '2026-08-28T14:30:00Z',
    },
  ],
  loans: [
    {
      id: 203,
      text: 'Your current overdraft facility is charged at 14.5% interest on an average utilization of ₹6,50,000. Switching to CGTMSE collateral-free term credit at 9.8% will save ₹30,550 annually.',
      confidence_badge: 'high',
      referenced_numbers: [14.5, 650000, 9.8, 30550],
      status: 'pending',
      created_at: '2026-08-29T09:00:00Z',
    },
  ],
  packaging: [
    {
      id: 204,
      text: 'Aggregating purchase orders for corrugated boxes with Vendor Shiva Packaging saves ₹18,500 based on a minimum threshold order volume of 500 units.',
      confidence_badge: 'medium',
      referenced_numbers: [18500, 500],
      status: 'pending',
      created_at: '2026-08-25T11:20:00Z',
    },
  ],
  salaries: [
    {
      id: 205,
      text: 'Automating EPFO statutory remittance before the 15th will streamline reconciliation for 24 staff members and prevent damages of ₹12,000.',
      confidence_badge: 'medium',
      referenced_numbers: [15, 24, 12000],
      status: 'pending',
      created_at: '2026-08-22T16:00:00Z',
    },
  ],
  transportation: [
    {
      id: 206,
      text: 'Switching inter-state consignment routing for Gujarat dispatches can cut freight charges by ₹22,400 across 8 scheduled container loads.',
      confidence_badge: 'low',
      referenced_numbers: [22400, 8],
      status: 'pending',
      created_at: '2026-08-20T12:00:00Z',
    },
  ],
};

export const mockDataStatus: DataStatusResponse = {
  business_id: 1,
  last_upload_at: '2026-08-31T18:45:00Z',
  row_count: 1420,
  is_demo_data: true,
};
