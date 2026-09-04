import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { apiClient } from '../api/client';
import { ShieldCheck, ArrowRight, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

export const OnboardingScreen: React.FC = () => {
  const { setBusiness, showNotification } = useApp();
  const [businessName, setBusinessName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent, isDemo = false) => {
    if (e) e.preventDefault();
    const targetName = isDemo ? 'Demo Business' : businessName.trim();
    if (!targetName) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.authStart(targetName);
      if (response && typeof response.business_id === 'number') {
        setBusiness(response.business_id, targetName);
        showNotification(`Welcome to VANTAGE, ${targetName}!`, 'success');
      } else {
        throw new Error('Invalid response received from auth service.');
      }
    } catch (err: any) {
      console.error('Onboarding auth error:', err);
      setError(err.message || 'Failed to initialize MSME account. Please check your backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#3d3358] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle decorative background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-white/20 relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#3d3358] text-white flex items-center justify-center mx-auto mb-4 shadow-sm border border-purple-300/30">
            <div className="w-5 h-5 border-2 border-white rounded-xs" />
          </div>
          
          {/* VANTAGE Wordmark (Geometric Balance Serif Italic) */}
          <h1
            className="text-4xl font-serif tracking-tighter italic text-[#3d3358]"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            VANTAGE
          </h1>
          
          {/* Tagline */}
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-1.5">
            The Financial Immune System for India's MSMEs
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">{error}</p>
              <p className="mt-1 text-slate-600">Tip: Click "Use demo data instead" to test immediately with simulated financial data.</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-5">
          <div>
            <label htmlFor="businessName" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Business Name
            </label>
            <input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Apex Textiles Pvt Ltd"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-[#e8e5f0]/40 border border-[#d6d0e6] rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3d3358] focus:border-transparent transition-all text-sm font-medium"
              autoFocus
            />
          </div>

          {/* Primary Button */}
          <button
            type="submit"
            disabled={!businessName.trim() || isLoading}
            className="w-full py-3.5 px-4 bg-[#3d3358] hover:bg-[#2e2644] active:bg-[#231b35] text-white font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Initializing Diagnostics...</span>
              </>
            ) : (
              <>
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <span className="relative px-3 bg-white text-xs text-slate-400 font-medium uppercase">
            Quick Exploration
          </span>
        </div>

        {/* Secondary visible button for Demo Data */}
        <button
          type="button"
          onClick={() => handleSubmit(undefined, true)}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-[#e8e5f0] hover:bg-[#dedae8] active:bg-[#d4cfdf] text-[#3d3358] font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm border border-[#d6d0e6] cursor-pointer shadow-xs"
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Use demo data instead</span>
        </button>

        {/* Micro footer note */}
        <p className="text-[11px] text-center text-slate-500 mt-6 leading-relaxed">
          Connects automatically to your local FastAPI backend on port 8000. In-memory session initialized upon start.
        </p>
      </div>
    </div>
  );
};
