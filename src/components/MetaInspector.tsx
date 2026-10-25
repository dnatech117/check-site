import React from 'react';
import { MetaDetails } from '../types/audit';
import { Share2, Globe, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

interface MetaInspectorProps {
  meta: MetaDetails;
}

export const MetaInspector: React.FC<MetaInspectorProps> = ({ meta }) => {
  const isTitleOptimal = meta.titleLength >= 30 && meta.titleLength <= 60;
  const isDescOptimal = meta.descriptionLength >= 70 && meta.descriptionLength <= 160;

  return (
    <div className="space-y-3 text-xs">
      {/* Title & Description Metrics */}
      <div className="card-premium p-3 rounded-lg space-y-3">
        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-zinc-200">Page Title</span>
            <div className="flex items-center gap-1.5 text-[10.5px] font-mono">
              <span className={isTitleOptimal ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {meta.titleLength}
              </span>
              <span className="text-zinc-500">/ 60 chars</span>
            </div>
          </div>

          <div className="p-2 rounded bg-black/40 border border-white/[0.06] text-xs text-zinc-200 break-words font-sans">
            {meta.title || <span className="text-rose-400 italic">No &lt;title&gt; specified</span>}
          </div>

          {/* Slim progress bar */}
          <div className="w-full bg-zinc-800 h-1 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                !meta.title
                  ? 'bg-rose-500 w-0'
                  : isTitleOptimal
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, (meta.titleLength / 60) * 100)}%` }}
            />
          </div>
        </div>

        {/* Description */}
        <div className="pt-2 border-t border-white/[0.06]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-zinc-200">Meta Description</span>
            <div className="flex items-center gap-1.5 text-[10.5px] font-mono">
              <span className={isDescOptimal ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {meta.descriptionLength}
              </span>
              <span className="text-zinc-500">/ 160 chars</span>
            </div>
          </div>

          <div className="p-2 rounded bg-black/40 border border-white/[0.06] text-xs text-zinc-300 break-words leading-relaxed font-sans">
            {meta.description || (
              <span className="text-amber-400/80 italic">No meta description defined</span>
            )}
          </div>

          {/* Slim progress bar */}
          <div className="w-full bg-zinc-800 h-1 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                !meta.description
                  ? 'bg-amber-500 w-0'
                  : isDescOptimal
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, (meta.descriptionLength / 160) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Google SERP Simulator */}
      <div className="card-premium p-3 rounded-lg space-y-2">
        <span className="text-xs font-semibold text-zinc-200 block">
          Search Snippet Simulation (SERP)
        </span>

        <div className="p-3 rounded-lg bg-[#202124] border border-[#3c4043] font-sans space-y-1">
          <div className="text-[11px] text-[#bdc1c6] font-mono truncate">
            {meta.canonical || 'https://yourwebsite.com/page'}
          </div>
          <div className="text-sm text-[#8ab4f8] font-normal hover:underline cursor-pointer truncate">
            {meta.title || 'Untitled Web Page'}
          </div>
          <div className="text-xs text-[#bdc1c6] line-clamp-2 leading-relaxed">
            {meta.description || 'No description available for search result snippet.'}
          </div>
        </div>
      </div>

      {/* Technical Tags */}
      <div className="card-premium p-3 rounded-lg space-y-2">
        <span className="text-xs font-semibold text-zinc-200 block">Technical Indexing</span>

        <div className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/[0.04]">
            <span className="text-zinc-400">Canonical Tag</span>
            <span className="font-mono text-[10.5px] text-zinc-300 truncate max-w-[200px]">
              {meta.canonical || <span className="text-amber-400">Missing</span>}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/[0.04]">
            <span className="text-zinc-400">Robots Directive</span>
            <span className="font-mono text-[10.5px] text-zinc-300">
              {meta.robots ? (
                meta.robots.includes('noindex') ? (
                  <span className="text-rose-400 font-bold">{meta.robots}</span>
                ) : (
                  <span className="text-emerald-400">{meta.robots}</span>
                )
              ) : (
                <span className="text-zinc-400">index, follow</span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/[0.04]">
            <span className="text-zinc-400">Viewport Meta</span>
            <span className="text-[10.5px]">
              {meta.viewport ? (
                <span className="text-emerald-400 font-mono">Configured</span>
              ) : (
                <span className="text-rose-400 font-mono">Missing</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
