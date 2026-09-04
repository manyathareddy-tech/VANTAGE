import React from 'react';

/**
 * Format currency in Indian Rupees (INR)
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format ISO datetime string or date string to readable human-friendly date
 * E.g. "12 Sep 2026" or "01 Sep 2026, 04:30 PM"
 */
export function formatDate(dateString: string | null | undefined, includeTime = false): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
    };
    return new Intl.DateTimeFormat('en-IN', options).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Format percentage
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  return `${value.toFixed(1)}%`;
}

/**
 * Highlight referenced numbers inside a suggestion's text string
 */
export function renderHighlightedText(text: string, referencedNumbers: number[] = []): React.ReactNode {
  if (!referencedNumbers || referencedNumbers.length === 0) {
    return text;
  }

  // Create pattern for all numbers to highlight
  // Sort numbers by length descending so longer numbers match before prefixes
  const sortedNumbers = [...referencedNumbers].sort((a, b) => b.toString().length - a.toString().length);
  
  // Build a regex matching either raw numbers or formatted variations (e.g. 10000 or 10,000)
  const escaped = sortedNumbers.map(n => {
    const str = n.toString();
    // Also match possible formatted Indian notation or decimal
    return `${str}|${new Intl.NumberFormat('en-IN').format(n)}`;
  }).join('|');

  if (!escaped) return text;

  try {
    const regex = new RegExp(`(\\b(?:${escaped})\\b|₹?\\s*(?:${escaped}))`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      // Check if part matches any referenced number
      const isMatch = sortedNumbers.some(num => {
        const numStr = num.toString();
        const formatted = new Intl.NumberFormat('en-IN').format(num);
        return part.includes(numStr) || part.includes(formatted);
      });

      if (isMatch) {
        return (
          <span
            key={index}
            className="font-bold text-[#3d3358] bg-[#d5cfeb] px-1.5 py-0.5 rounded text-sm inline-block shadow-xs border border-[#b8aecf]"
            title="Verified financial metric"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  } catch {
    return text;
  }
}

/**
 * Returns color classes for status colors: green, amber, red
 */
export function getStatusTheme(status: 'green' | 'amber' | 'red' | string) {
  switch (status?.toLowerCase()) {
    case 'green':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-500',
        accent: 'bg-emerald-500',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        cardBorder: 'border-l-4 border-l-emerald-500',
        dot: 'bg-emerald-500',
        iconColor: 'text-emerald-600',
      };
    case 'amber':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-500',
        accent: 'bg-amber-500',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        cardBorder: 'border-l-4 border-l-amber-500',
        dot: 'bg-amber-500',
        iconColor: 'text-amber-600',
      };
    case 'red':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-800',
        border: 'border-rose-500',
        accent: 'bg-rose-500',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        cardBorder: 'border-l-4 border-l-rose-500',
        dot: 'bg-rose-500',
        iconColor: 'text-rose-600',
      };
    default:
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-800',
        border: 'border-slate-400',
        accent: 'bg-slate-500',
        badge: 'bg-slate-100 text-slate-800 border-slate-300',
        cardBorder: 'border-l-4 border-l-slate-400',
        dot: 'bg-slate-400',
        iconColor: 'text-slate-500',
      };
  }
}

/**
 * Returns confidence badge styles: high=green, medium=amber, low=grey
 */
export function getConfidenceBadgeStyle(badge: string) {
  const normalized = badge?.toLowerCase() || '';
  if (normalized.includes('high') || normalized === 'green') {
    return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  } else if (normalized.includes('med') || normalized === 'amber') {
    return 'bg-amber-100 text-amber-800 border-amber-300';
  } else {
    return 'bg-slate-200 text-slate-700 border-slate-300';
  }
}
