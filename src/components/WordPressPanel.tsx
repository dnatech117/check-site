import React from 'react';
import { WordPressDetails } from '../types/audit';
import { Globe, ShieldCheck, AlertCircle, Layers, Server, Code } from 'lucide-react';

interface WordPressPanelProps {
  wordpress: WordPressDetails;
  isHttps: boolean;
}

export const WordPressPanel: React.FC<WordPressPanelProps> = ({ wordpress, isHttps }) => {
  if (!wordpress.isWordPress) {
    return (
      <div className="p-8 text-center card-premium rounded-lg space-y-1.5">
        <Globe className="w-6 h-6 mx-auto text-zinc-500 mb-1" />
        <h4 className="text-xs font-semibold text-zinc-200">Non-WordPress Platform</h4>
        <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
          No WordPress asset paths (/wp-content/), generator tags, or REST endpoints were detected on this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 text-xs">
      {/* WordPress Header Card */}
      <div className="card-premium p-3 rounded-lg flex items-center justify-between border-l-2 border-l-purple-500">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs font-mono">
            WP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-zinc-100">WordPress Detected</span>
              {wordpress.version && (
                <span className="text-[9.5px] font-mono bg-black/40 text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/30">
                  v{wordpress.version}
                </span>
              )}
            </div>
            <span className="text-[11px] text-zinc-400">
              {wordpress.theme ? `Theme: "${wordpress.theme}"` : 'Custom or child theme'}
            </span>
          </div>
        </div>

        <span className="text-[9.5px] uppercase font-mono tracking-wider px-2 py-0.5 rounded badge-pass">
          Active CMS
        </span>
      </div>

      {/* Detected Plugins */}
      <div className="card-premium p-3 rounded-lg space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
          <Layers className="w-3.5 h-3.5 text-zinc-400" />
          <span>Active Plugins & Components ({wordpress.plugins.length})</span>
        </div>

        {wordpress.plugins.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {wordpress.plugins.map((plugin) => (
              <span
                key={plugin}
                className="text-[11px] font-medium bg-black/40 text-zinc-300 border border-white/[0.08] px-2 py-0.5 rounded flex items-center gap-1.5"
              >
                <span className="w-1 h-1 rounded-full bg-purple-400" />
                {plugin}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-zinc-500 italic">
            No public plugin signatures detected in DOM.
          </p>
        )}
      </div>

      {/* Hardening Checklist */}
      <div className="card-premium p-3 rounded-lg space-y-2">
        <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
          WordPress Hardening Checks
        </span>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/[0.04]">
            <span className="text-zinc-400">Generator Tag</span>
            {wordpress.generator ? (
              <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Exposed ({wordpress.generator})
              </span>
            ) : (
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Protected / Hidden
              </span>
            )}
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/[0.04]">
            <span className="text-zinc-400">REST API Endpoint</span>
            <span className="text-[10px] text-zinc-300 font-mono flex items-center gap-1">
              <Server className="w-3 h-3 text-zinc-500" /> {wordpress.hasRestApi ? 'Available (/wp-json/)' : 'Filtered'}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/[0.04]">
            <span className="text-zinc-400">Transport Security</span>
            {isHttps ? (
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> SSL Active
              </span>
            ) : (
              <span className="text-[10px] text-rose-400 font-mono flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Insecure HTTP
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
