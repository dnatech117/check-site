import React from 'react';
import { Zap, AlertCircle, CheckCircle2, AlertTriangle, Layers, FastForward, Image as ImageIcon } from 'lucide-react';
import { WebVitalsDetails } from '../types/audit';

interface WebVitalsPanelProps {
  vitals?: WebVitalsDetails;
}

export const WebVitalsPanel: React.FC<WebVitalsPanelProps> = ({ vitals }) => {
  if (!vitals) {
    return (
      <div className="card-premium p-4 rounded-xl text-center text-xs text-zinc-400">
        No Web Vitals telemetry recorded.
      </div>
    );
  }

  const { lcp, clsRisks, renderBlockingScripts, missingPreconnects } = vitals;

  return (
    <div className="space-y-3 font-sans text-xs">
      {/* LCP Diagnostics Hero Card */}
      <div className="p-3 rounded-xl bg-[#0F0F12] border border-white/[0.08] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <h4 className="font-semibold text-zinc-200">Largest Contentful Paint (LCP) Candidate</h4>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">
            {lcp.candidateTag?.toUpperCase() || 'HERO ELEMENT'}
          </span>
        </div>

        {lcp.candidateSrc ? (
          <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04] space-y-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-zinc-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="font-mono text-[11px] text-zinc-300 truncate block">
                  {lcp.candidateSelector || 'Hero Image'}
                </span>
                <span className="text-[10px] text-zinc-500 truncate block">
                  {lcp.candidateSrc}
                </span>
              </div>
            </div>

            {/* Diagnostics Indicators */}
            <div className="grid grid-cols-3 gap-1.5 pt-1 text-center text-[10px]">
              <div className={`p-1.5 rounded border ${
                lcp.hasLazyLoading
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}>
                <span className="block text-[9px] text-zinc-500 uppercase font-bold">Lazy Load</span>
                <span className="font-semibold">
                  {lcp.hasLazyLoading ? 'ANTI-PATTERN' : 'Eager (Good)'}
                </span>
              </div>

              <div className={`p-1.5 rounded border ${
                lcp.hasFetchPriorityHigh
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                <span className="block text-[9px] text-zinc-500 uppercase font-bold">Priority</span>
                <span className="font-semibold">
                  {lcp.hasFetchPriorityHigh ? 'HIGH' : 'Normal / Low'}
                </span>
              </div>

              <div className={`p-1.5 rounded border ${
                lcp.isModernFormat
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                <span className="block text-[9px] text-zinc-500 uppercase font-bold">Asset Type</span>
                <span className="font-semibold">
                  {lcp.isModernFormat ? 'AVIF / WebP' : 'Legacy PNG/JPG'}
                </span>
              </div>
            </div>

            {lcp.hasLazyLoading && (
              <p className="text-[10px] text-rose-300/90 leading-tight pt-1">
                Recommendation: Remove loading="lazy" from hero elements to prevent browser render deferral.
              </p>
            )}
          </div>
        ) : (
          <div className="p-2 rounded-lg bg-black/40 text-[11px] text-zinc-400">
            No prominent image detected in above-the-fold viewport. Text block is likely primary LCP candidate.
          </div>
        )}
      </div>

      {/* CLS Risk Matrix */}
      <div className="p-3 rounded-xl bg-[#0F0F12] border border-white/[0.08] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <h4 className="font-semibold text-zinc-200">Cumulative Layout Shift (CLS) Predictor</h4>
          </div>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
            clsRisks.length === 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
          }`}>
            {clsRisks.length} Unsized Media
          </span>
        </div>

        {clsRisks.length === 0 ? (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-300 text-[11px]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>All media elements have explicit width & height attributes or CSS aspect-ratio.</span>
          </div>
        ) : (
          <div className="space-y-1 max-h-36 overflow-y-auto no-scrollbar">
            {clsRisks.slice(0, 6).map((risk, idx) => (
              <div key={idx} className="p-1.5 rounded bg-black/40 border border-white/[0.04] flex items-center justify-between">
                <span className="font-mono text-[10px] text-zinc-300 truncate max-w-[240px]">
                  {risk.selector}
                </span>
                <span className="text-[9px] text-amber-400 font-semibold uppercase">
                  Missing Dimensions
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Render Blocking & CDN Preconnects */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-xl bg-[#0F0F12] border border-white/[0.08] space-y-1">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <FastForward className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium">Render Blocking</span>
          </div>
          <span className={`text-sm font-bold font-mono block ${
            renderBlockingScripts === 0 ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {renderBlockingScripts} Scripts
          </span>
          <p className="text-[10px] text-zinc-500">
            {renderBlockingScripts === 0 ? 'Optimal non-blocking execution' : 'Synchronous scripts in <head>'}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-[#0F0F12] border border-white/[0.08] space-y-1">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Zap className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium">Preconnect CDNs</span>
          </div>
          <span className={`text-sm font-bold font-mono block ${
            missingPreconnects.length === 0 ? 'text-emerald-400' : 'text-zinc-300'
          }`}>
            {missingPreconnects.length === 0 ? 'Optimized' : `${missingPreconnects.length} Missing`}
          </span>
          <p className="text-[10px] text-zinc-500">
            {missingPreconnects.length === 0 ? 'All origins preconnected' : missingPreconnects[0]}
          </p>
        </div>
      </div>
    </div>
  );
};
