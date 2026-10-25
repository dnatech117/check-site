import React, { useState } from 'react';
import { ImageItem } from '../types/audit';
import { Eye, AlertTriangle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { highlightElementOnTab } from '../lib/messaging';

interface ImagesInspectorProps {
  images: ImageItem[];
}

export const ImagesInspector: React.FC<ImagesInspectorProps> = ({ images }) => {
  const [filter, setFilter] = useState<'all' | 'missing-alt' | 'broken'>('all');

  const filtered = images.filter((img) => {
    if (filter === 'missing-alt') return !img.hasAlt;
    if (filter === 'broken') return img.isBroken;
    return true;
  });

  const missingAltCount = images.filter(i => !i.hasAlt).length;
  const brokenCount = images.filter(i => i.isBroken).length;

  if (images.length === 0) {
    return (
      <div className="p-8 text-center card-premium rounded-lg text-zinc-500">
        <ImageIcon className="w-6 h-6 mx-auto mb-2 opacity-40 text-zinc-400" />
        <p className="text-xs font-medium">No images detected on this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors ${
            filter === 'all'
              ? 'bg-zinc-800 text-white border border-white/[0.1]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          All ({images.length})
        </button>

        {missingAltCount > 0 && (
          <button
            type="button"
            onClick={() => setFilter('missing-alt')}
            className={`px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              filter === 'missing-alt'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Missing Alt ({missingAltCount})
          </button>
        )}

        {brokenCount > 0 && (
          <button
            type="button"
            onClick={() => setFilter('broken')}
            className={`px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              filter === 'broken'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            Broken ({brokenCount})
          </button>
        )}
      </div>

      {/* Images List */}
      <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-0.5">
        {filtered.map((img) => (
          <div
            key={img.id}
            className={`card-premium p-2.5 rounded-lg border flex items-start gap-3 transition-colors ${
              img.isBroken
                ? 'border-rose-500/40 bg-rose-500/[0.04]'
                : !img.hasAlt
                ? 'border-amber-500/30 bg-amber-500/[0.03]'
                : ''
            }`}
          >
            {/* Thumbnail Box */}
            <div className="w-12 h-12 rounded bg-black/40 border border-white/[0.08] flex items-center justify-center shrink-0 overflow-hidden relative">
              {img.isBroken ? (
                <div className="flex flex-col items-center justify-center text-rose-400 p-1 text-center">
                  <AlertCircle className="w-4 h-4 mb-0.5" />
                  <span className="text-[7.5px] font-mono uppercase">Broken</span>
                </div>
              ) : img.src ? (
                <img
                  src={img.src}
                  alt={img.alt || ''}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <ImageIcon className="w-4 h-4 text-zinc-500" />
              )}
            </div>

            {/* Image Details */}
            <div className="min-w-0 flex-1 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                {img.isBroken ? (
                  <span className="text-[9px] font-mono uppercase font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.2 rounded">
                    Broken
                  </span>
                ) : !img.hasAlt ? (
                  <span className="text-[9px] font-mono uppercase font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    Missing Alt
                  </span>
                ) : (
                  <span className="text-[9px] font-mono uppercase font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                    Alt OK
                  </span>
                )}

                <span className="text-[9.5px] font-mono text-zinc-400 bg-black/40 px-1.5 py-0.2 rounded border border-white/[0.06]">
                  {img.naturalWidth && img.naturalHeight
                    ? `${img.naturalWidth}×${img.naturalHeight}px`
                    : `${img.width || 0}×${img.height || 0}px`}
                </span>
              </div>

              {img.hasAlt ? (
                <p className="text-[11.5px] text-zinc-200 line-clamp-1">
                  "{img.alt}"
                </p>
              ) : (
                <p className="text-[11px] text-amber-300/80">
                  No alt description defined
                </p>
              )}

              <p className="text-[10px] font-mono text-zinc-500 truncate break-all">
                {img.src || '[No source URL]'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => highlightElementOnTab(img.selector)}
              className="p-1 rounded text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800 transition-colors shrink-0"
              title="Highlight image on page"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
