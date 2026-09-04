import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import {
  Building2,
  Landmark,
  UploadCloud,
  LogOut,
  ShieldCheck,
  Server,
  Info,
  Check,
  Sparkles,
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const {
    business_id,
    business_name,
    clearBusiness,
    setActiveTab,
    apiBaseUrl,
    setApiBaseUrl,
    useMockFallback,
    setUseMockFallback,
    showNotification,
  } = useApp();

  const [customUrl, setCustomUrl] = useState(apiBaseUrl);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveEndpoint = (e: React.FormEvent) => {
    e.preventDefault();
    setApiBaseUrl(customUrl.trim());
    setIsSaved(true);
    showNotification('Backend endpoint updated successfully.', 'success');
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="flex-1 min-h-screen bg-[#e8e5f0]/60 pb-20 md:pb-12">
      <Header
        title="Settings"
        subtitle="MSME entity details & platform preferences"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Business Profile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#d6d0e6] space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-[#3d3358] text-white flex items-center justify-center font-bold shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#3d3358]">MSME Profile</h3>
              <p className="text-xs text-slate-500">Active session organization credentials</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[#fbfafc] rounded-xl border border-[#d6d0e6]">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Business Name
              </label>
              <span className="text-base font-extrabold text-slate-900 block">
                {business_name || 'N/A'}
              </span>
            </div>

            <div className="p-4 bg-[#fbfafc] rounded-xl border border-[#d6d0e6]">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Business ID (Read-Only)
              </label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-extrabold text-[#3d3358]">
                  #{business_id ?? 'None'}
                </span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                  VERIFIED
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Banking Integration Card */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#d6d0e6] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e8e5f0] text-[#3d3358] flex items-center justify-center font-bold">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#3d3358]">Open Banking / AA Protocol</h3>
                <p className="text-xs text-slate-500">Direct Account Aggregator bank statement integration</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Direct linkage with ICICI, HDFC, SBI, and Axis Bank via RBI Account Aggregator framework will automate daily cash reconciliations without manual CSV exports.
          </p>

          {/* Greyed-out, disabled button: "Connect bank (coming soon)" as explicitly requested */}
          <div>
            <button
              disabled
              className="px-5 py-2.5 bg-slate-200 text-slate-400 font-semibold rounded-xl text-xs sm:text-sm cursor-not-allowed border border-slate-300 flex items-center gap-2"
            >
              <Landmark className="w-4 h-4" />
              <span>Connect bank (coming soon)</span>
            </button>
          </div>
        </div>

        {/* Data Source Configuration */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#d6d0e6] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e8e5f0] text-[#3d3358] flex items-center justify-center font-bold">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#3d3358]">Data Sources & Spreadsheets</h3>
              <p className="text-xs text-slate-500">Manage transaction ledgers and SKU records</p>
            </div>
          </div>

          <p className="text-xs text-slate-600">
            Need to update your data files, replace previous uploads, or check the number of active ingested rows?
          </p>

          {/* Link/Button to navigate to the Update Data screen */}
          <div>
            <button
              onClick={() => setActiveTab('update_data')}
              className="px-5 py-2.5 bg-[#3d3358] hover:bg-[#2e2644] text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Go to Update Data</span>
            </button>
          </div>
        </div>

        {/* Backend Endpoint Settings */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#d6d0e6] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e8e5f0] text-[#3d3358] flex items-center justify-center font-bold">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#3d3358]">FastAPI Backend Configuration</h3>
              <p className="text-xs text-slate-500">Configure target API host & simulation fallback</p>
            </div>
          </div>

          <form onSubmit={handleSaveEndpoint} className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                Backend Endpoint URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="http://127.0.0.1:8000"
                  className="flex-1 px-4 py-2.5 bg-[#e8e5f0]/40 border border-[#d6d0e6] rounded-xl text-slate-900 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3d3358]"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#3d3358] hover:bg-[#2d2642] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5"
                >
                  {isSaved ? <Check className="w-4 h-4 text-emerald-400" /> : null}
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <input
                  id="mockFallbackToggle"
                  type="checkbox"
                  checked={useMockFallback}
                  onChange={(e) => setUseMockFallback(e.target.checked)}
                  className="w-4 h-4 text-[#3d3358] rounded border-slate-300 focus:ring-[#3d3358] cursor-pointer"
                />
                <label htmlFor="mockFallbackToggle" className="cursor-pointer font-medium">
                  Enable high-fidelity demo fallback if backend is unreachable
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* Switch Business / Reset in-memory session */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800">Switch Business / Reset Session</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Clear current in-memory credentials and return to the Onboarding screen.
            </p>
          </div>

          <button
            onClick={() => {
              clearBusiness();
              showNotification('Signed out of current MSME session.', 'info');
            }}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-xs transition-colors border border-rose-200 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Switch Business</span>
          </button>
        </div>
      </div>
    </div>
  );
};
