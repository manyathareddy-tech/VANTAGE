import {
  DashboardSummary,
  ForecastResponse,
  InventoryItem,
  SuggestionsResponse,
  DataStatusResponse,
} from '../types';
import {
  mockDashboardData,
  mockInventoryList,
  generateForecastMock,
  mockSuggestionsData,
  mockDataStatus,
} from './mockData';

export const DEFAULT_API_URL = 'http://127.0.0.1:8000';

class ApiClient {
  private baseUrl: string = DEFAULT_API_URL;
  private useMockFallback: boolean = true; // Fallback smoothly if 127.0.0.1:8000 is unreachable in container preview

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setUseMockFallback(fallback: boolean) {
    this.useMockFallback = fallback;
  }

  public getUseMockFallback(): boolean {
    return this.useMockFallback;
  }

  /**
   * Helper to parse and extract human-readable error from FastAPI response
   */
  private async parseError(response: Response): Promise<string> {
    try {
      const data = await response.json();
      if (data.detail) {
        if (typeof data.detail === 'string') return data.detail;
        if (Array.isArray(data.detail)) {
          return data.detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
        }
        return JSON.stringify(data.detail);
      }
      if (data.message) return data.message;
      return `Server returned error ${response.status}: ${response.statusText}`;
    } catch {
      return `Server returned error ${response.status}: ${response.statusText}`;
    }
  }

  /**
   * 1. Onboarding / Auth Start
   * POST /auth/start
   * Body: { "business_name": "<input value>" }
   * Response: { "business_id": <int> }
   */
  public async authStart(businessName: string): Promise<{ business_id: number }> {
    const endpoint = `${this.baseUrl}/auth/start`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ business_name: businessName }),
      });

      if (!res.ok) {
        const errorMsg = await this.parseError(res);
        throw new Error(errorMsg);
      }

      return await res.json();
    } catch (err: any) {
      if (this.useMockFallback && (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('NetworkError'))) {
        console.warn(`[VANTAGE] Backend at ${this.baseUrl} is unreachable. Providing instant demo session for "${businessName}".`);
        return { business_id: 1 };
      }
      throw err;
    }
  }

  /**
   * 2. Dashboard Summary
   * GET /dashboard-summary?business_id={id}
   */
  public async getDashboardSummary(businessId: number): Promise<DashboardSummary> {
    const endpoint = `${this.baseUrl}/dashboard-summary?business_id=${businessId}`;
    try {
      const res = await fetch(endpoint, {
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) {
        const errorMsg = await this.parseError(res);
        throw new Error(errorMsg);
      }

      return await res.json();
    } catch (err: any) {
      if (this.useMockFallback && (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('NetworkError'))) {
        return mockDashboardData;
      }
      throw err;
    }
  }

  /**
   * 3a. Company Cash Forecast
   * GET /forecast?business_id={id}&period={days}
   */
  public async getCompanyForecast(businessId: number, period: number = 30): Promise<ForecastResponse> {
    const endpoint = `${this.baseUrl}/forecast?business_id=${businessId}&period=${period}`;
    try {
      const res = await fetch(endpoint, {
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) {
        const errorMsg = await this.parseError(res);
        throw new Error(errorMsg);
      }

      return await res.json();
    } catch (err: any) {
      if (this.useMockFallback && (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('NetworkError'))) {
        return generateForecastMock(period, null);
      }
      throw err;
    }
  }

  /**
   * 3b. SKU Cash Forecast
   * GET /forecast/sku/{sku_id}?business_id={id}&period={days}
   */
  public async getSkuForecast(businessId: number, skuId: number | string, period: number = 30): Promise<ForecastResponse> {
    const endpoint = `${this.baseUrl}/forecast/sku/${skuId}?business_id=${businessId}&period=${period}`;
    try {
      const res = await fetch(endpoint, {
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) {
        const errorMsg = await this.parseError(res);
        throw new Error(errorMsg);
      }

      return await res.json();
    } catch (err: any) {
      if (this.useMockFallback && (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('NetworkError'))) {
        return generateForecastMock(period, Number(skuId) || 1);
      }
      throw err;
    }
  }

  /**
   * 4a. Inventory List
   * GET /inventory?business_id={id}&search={query}
   */
  public async getInventory(businessId: number, search?: string): Promise<InventoryItem[]> {
    let endpoint = `${this.baseUrl}/inventory?business_id=${businessId}`;
    if (search && search.trim().length > 0) {
      endpoint += `&search=${encodeURIComponent(search.trim())}`;
    }
    try {
      const res = await fetch(endpoint, {
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) {
        const errorMsg = await this.parseError(res);
        throw new Error(errorMsg);
      }

      return await res.json();
    } catch (err: any) {
      if (this.useMockFallback && (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('NetworkError'))) {
        if (!search || !search.trim()) {
          return mockInventoryList;
        }
        const q = search.toLowerCase();
        return mockInventoryList.filter(
          item => item.product_name.toLowerCase().includes(q) || item.sku_code.toLowerCase().includes(q)
        );
      }
      throw err;
    }
  }

  /**
   * 4b. Inventory Detail
   * GET /inventory/{sku_id}?business_id={id}
   */
  public async getInventoryDetail(businessId: number, skuId: number | string): Promise<InventoryItem> {
    const endpoint = `${this.baseUrl}/inventory/${skuId}?business_id=${businessId}`;
    try {
      const res = await fetch(endpoint, {
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) {
        const errorMsg = await this.parseError(res);
        throw new Error(errorMsg);
      }

      return await res.json();
    } catch (err: any) {
      if (this.useMockFallback && (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('NetworkError'))) {
        const found = mockInventoryList.find(i => i.id.toString() === skuId.toString()) || mockInventoryList[0];
        return {
          ...found,
          reorder_recommendation: found.reorder_recommendation || {
            should_reorder: found.is_flagged,
            target_stock: found.reorder_point * 2,
          }
        };
      }
      throw err;
    }
  }

  /**
   * 5. Suggestions
   * GET /suggestions?business_id={id}&category={optional}
   * Returns an OBJECT keyed by category name: { [category]: SuggestionItem[] }
   */
  public async getSuggestions(businessId: number, category?: string): Promise<SuggestionsResponse> {
    let endpoint = `${this.baseUrl}/suggestions?business_id=${businessId}`;
    if (category && category.trim().length > 0 && category.toLowerCase() !== 'all') {
      endpoint += `&category=${encodeURIComponent(category.trim())}`;
    }
    try {
      const res = await fetch(endpoint, {
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) {
        const errorMsg = await this.parseError(res);
        throw new Error(errorMsg);
      }

      return await res.json();
    } catch (err: any) {
      if (this.useMockFallback && (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('NetworkError'))) {
        if (category && category.toLowerCase() !== 'all' && mockSuggestionsData[category]) {
          return { [category]: mockSuggestionsData[category] };
        }
        return mockSuggestionsData;
      }
      throw err;
    }
  }

  /**
   * 5a. Approve Suggestion
   * POST /suggestions/{id}/approve (no body)
   */
  public async approveSuggestion(id: number | string): Promise<{ success?: boolean; message?: string }> {
    const endpoint = `${this.baseUrl}/suggestions/${id}/approve`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) {
        const errorMsg = await this.parseError(res);
        throw new Error(errorMsg);
      }

      try {
        return await res.json();
      } catch {
        return { success: true };
      }
    } catch (err: any) {
      if (this.useMockFallback && (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('NetworkError'))) {
        return { success: true };
      }
      throw err;
    }
  }

  /**
   * 5b. Dismiss Suggestion
   * POST /suggestions/{id}/dismiss (no body)
   */
  public async dismissSuggestion(id: number | string): Promise<{ success?: boolean; message?: string }> {
    const endpoint = `${this.baseUrl}/suggestions/${id}/dismiss`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) {
        const errorMsg = await this.parseError(res);
        throw new Error(errorMsg);
      }

      try {
        return await res.json();
      } catch {
        return { success: true };
      }
    } catch (err: any) {
      if (this.useMockFallback && (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('NetworkError'))) {
        return { success: true };
      }
      throw err;
    }
  }

  /**
   * 6a. Upload CSV
   * POST /upload-csv
   * Multipart/form-data:
   *   file: File
   *   business_id: string
   *   data_type: "transactions" | "inventory"
   */
  public async uploadCsv(
    businessId: number,
    file: File,
    dataType: 'transactions' | 'inventory'
  ): Promise<{ message?: string; rows_processed?: number; status?: string }> {
    const endpoint = `${this.baseUrl}/upload-csv`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('business_id', businessId.toString());
    formData.append('data_type', dataType);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorMsg = await this.parseError(res);
        throw new Error(errorMsg);
      }

      return await res.json();
    } catch (err: any) {
      if (this.useMockFallback && (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('NetworkError'))) {
        // Simulate successful upload in fallback
        await new Promise(resolve => setTimeout(resolve, 800));
        mockDataStatus.last_upload_at = new Date().toISOString();
        mockDataStatus.row_count += 120;
        mockDataStatus.is_demo_data = false;
        return { message: `Successfully processed ${dataType} CSV (${file.name})`, rows_processed: 120 };
      }
      throw err;
    }
  }

  /**
   * 6b. Data Status
   * GET /data-status?business_id={id}
   */
  public async getDataStatus(businessId: number): Promise<DataStatusResponse> {
    const endpoint = `${this.baseUrl}/data-status?business_id=${businessId}`;
    try {
      const res = await fetch(endpoint, {
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) {
        const errorMsg = await this.parseError(res);
        throw new Error(errorMsg);
      }

      return await res.json();
    } catch (err: any) {
      if (this.useMockFallback && (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('NetworkError'))) {
        return { ...mockDataStatus, business_id: businessId };
      }
      throw err;
    }
  }

  /**
   * 7. Chatbot Ask
   * POST /chatbot/ask
   * Body: { "business_id": <id>, "question": "<string>" }
   * Response: { "answer": "<string>" }
   */
  public async askChatbot(businessId: number, question: string): Promise<{ answer: string }> {
    const endpoint = `${this.baseUrl}/chatbot/ask`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          business_id: businessId,
          question: question,
        }),
      });

      if (!res.ok) {
        const errorMsg = await this.parseError(res);
        throw new Error(errorMsg);
      }

      return await res.json();
    } catch (err: any) {
      if (this.useMockFallback && (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('NetworkError'))) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const q = question.toLowerCase();
        if (q.includes('cash') || q.includes('balance') || q.includes('position')) {
          return { answer: 'Based on your latest transaction records, your current cash position stands at ₹18,45,000 with an average monthly burn rate of ₹3,20,000. Your cash runway is approximately 5.7 months.' };
        } else if (q.includes('stock') || q.includes('inventory') || q.includes('reorder')) {
          return { answer: 'You currently have 3 flagged inventory items requiring attention. Specifically, "Premium Cotton Twill Fabric 40s" and "Dye Pigment Reactive Royal Navy" are projected to stock out within 7-8 days.' };
        } else if (q.includes('tax') || q.includes('gst')) {
          return { answer: 'Your GSTR-3B return is due before the 20th of this month. Filing on time will enable you to claim ₹85,000 in input tax credits.' };
        } else {
          return { answer: `Analyzing your MSME records for "${question}": Your financial indicators show positive momentum with ₹14.2L recent revenue against ₹12.5L prior period (+13.6%), and stable operational cash flow.` };
        }
      }
      throw err;
    }
  }
}

export const apiClient = new ApiClient();
