import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { apiClient } from '../api/client';
import { DataStatusResponse } from '../types';
import { formatDate } from '../utils/formatters';
import { Header } from '../components/common/Header';
import { LoadingSpinner, CardSkeleton } from '../components/common/LoadingSpinner';
import { ErrorDisplay } from '../components/common/ErrorDisplay';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Database,
  Layers,
  Sparkles,
  Info,
  Clock,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';

interface UploadZoneProps {
  label: string;
  dataType: 'transactions' | 'inventory';
  description: string;
  onUpload: (file: File, dataType: 'transactions' | 'inventory') => Promise<void>;
  isUploading: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({
  label,
  dataType,
  description,
  onUpload,
  isUploading,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [zoneError, setZoneError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setZoneError('Please select a valid .csv file.');
      return;
    }
    setZoneError(null);
    setSelectedFile(file);
    try {
      await onUpload(file, dataType);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setZoneError(err.message || 'CSV upload failed.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#d6d0e6] flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#e8e5f0] text-[#3d3358] flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-[#3d3358]">{label}</h4>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-4 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-150 ${
            isDragOver
              ? 'border-[#3d3358] bg-[#e8e5f0]/60 scale-[1.01]'
              : 'border-[#d6d0e6] bg-[#fbfafc] hover:bg-[#f2f0f7] hover:border-[#3d3358]/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => {
              if (e.target.files && e.dataTransfer?.files?.[0] || e.target.files?.[0]) {
                handleFile(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 bg-white rounded-full shadow-2xs border border-slate-200 text-[#3d3358]">
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-[#3d3358]" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>

            <div className="text-sm font-semibold text-slate-800">
              {isUploading ? (
                <span>Parsing & ingestion in progress...</span>
              ) : (
                <span>
                  Drag & drop CSV or <span className="text-[#3d3358] underline">browse</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Accepts standard .csv format</p>
          </div>
        </div>

        {/* Error Detail Display (Shows exact 400 error detail message from backend API) */}
        {zoneError && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-semibold block">CSV Validation Error:</strong>
              <p className="mt-0.5 leading-relaxed">{zoneError}</p>
            </div>
          </div>
        )}
      </div>

      <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100">
        <span>Target: <code>{dataType}</code></span>
        <span>Payload: <code>multipart/form-data</code></span>
      </div>
    </div>
  );
};

export const UpdateDataScreen: React.FC = () => {
  const { business_id, showNotification } = useApp();
  const [dataStatus, setDataStatus] = useState<DataStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeUploadType, setActiveUploadType] = useState<string | null>(null);

  const fetchStatus = useCallback(async (refresh = false) => {
    if (!business_id) return;
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const status = await apiClient.getDataStatus(business_id);
      setDataStatus(status);
    } catch (err: any) {
      console.error('Data status fetch error:', err);
      setError(err.message || 'Failed to fetch data ingestion status.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [business_id]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleUpload = async (file: File, dataType: 'transactions' | 'inventory') => {
    if (!business_id) return;
    setActiveUploadType(dataType);

    try {
      const res = await apiClient.uploadCsv(business_id, file, dataType);
      showNotification(
        res.message || `Successfully ingested ${dataType} dataset (${file.name})!`,
        'success'
      );
      // Refetch /data-status on successful upload
      await fetchStatus(true);
    } catch (err: any) {
      console.error(`Upload error for ${dataType}:`, err);
      // Re-throw so the zone can render the exact detail message
      throw err;
    } finally {
      setActiveUploadType(null);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-[#e8e5f0]/60 pb-20 md:pb-12">
      <Header
        title="Update Data"
        subtitle="Ingest financial ledgers & SKU inventory spreadsheets"
        onRefresh={() => fetchStatus(true)}
        isRefreshing={isRefreshing}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            <CardSkeleton rows={3} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CardSkeleton rows={4} />
              <CardSkeleton rows={4} />
            </div>
          </div>
        ) : error ? (
          <ErrorDisplay
            title="Failed to retrieve data status"
            message={error}
            onRetry={() => fetchStatus(false)}
            isRetrying={isLoading}
          />
        ) : (
          <>
            {/* STATUS SUMMARY BAR */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#d6d0e6]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#3d3358] text-white flex items-center justify-center shadow-xs">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                      Telemetry Data Status
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <h3 className="text-xl font-extrabold text-[#3d3358]">
                        {dataStatus?.row_count !== undefined ? `${dataStatus.row_count.toLocaleString()} rows on file` : '0 rows on file'}
                      </h3>
                      {dataStatus?.is_demo_data && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>Currently using demo data</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 bg-[#e8e5f0]/50 px-3.5 py-2 rounded-xl border border-[#d6d0e6]">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>
                    Last updated:{' '}
                    <strong className="font-semibold text-slate-700">
                      {dataStatus?.last_upload_at ? formatDate(dataStatus.last_upload_at, true) : 'Never'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* TWO UPLOAD ZONES: Transaction Data & Inventory Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Zone 1: Transaction Data */}
              <UploadZone
                label="Transaction Data"
                dataType="transactions"
                description="Upload bank statements, sales receipts, expense vouchers, or tally exports."
                onUpload={handleUpload}
                isUploading={activeUploadType === 'transactions'}
              />

              {/* Zone 2: Inventory Data */}
              <UploadZone
                label="Inventory Data"
                dataType="inventory"
                description="Upload current SKU listings, warehouse stock levels, and safety reorder thresholds."
                onUpload={handleUpload}
                isUploading={activeUploadType === 'inventory'}
              />
            </div>

            {/* Formatting Guidelines / Instructions */}
            <div className="bg-[#fbfafc] border border-[#d6d0e6] rounded-2xl p-6 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#3d3358] text-sm mb-1">
                <Info className="w-4 h-4" />
                <span>CSV Upload Guidelines</span>
              </div>
              <p>
                • <strong>Transaction CSV format:</strong> Recommended headers: <code>date, description, amount, type (credit/debit), balance</code>.
              </p>
              <p>
                • <strong>Inventory CSV format:</strong> Recommended headers: <code>sku_code, product_name, current_stock, reorder_point, daily_consumption</code>.
              </p>
              <p>
                • Ingestion updates forecast calculations and suggestions instantly across all dashboard views.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
