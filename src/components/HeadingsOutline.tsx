import React from 'react';
import { HeadingItem } from '../types/audit';
import { Eye, AlertTriangle, ListTree } from 'lucide-react';
import { highlightElementOnTab } from '../lib/messaging';

interface HeadingsOutlineProps {
  headings: HeadingItem[];
}

export const HeadingsOutline: React.FC<HeadingsOutlineProps> = ({ headings }) => {
  if (headings.length === 0) {
    return (
      <div className="p-8 text-center card-premium rounded-lg text-zinc-500">
        <ListTree className="w-6 h-6 mx-auto mb-2 opacity-40 text-zinc-400" />
        <p className="text-xs font-medium">No heading tags (H1–H6) detected on page.</p>
      </div>
    );
  }

  const getLevelBadge = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-zinc-800 text-zinc-100 border-zinc-600 font-semibold';
      case 2:
        return 'bg-zinc-800/80 text-zinc-300 border-zinc-700';
      case 3:
        return 'bg-zinc-900 text-zinc-400 border-zinc-800';
      default:
        return 'bg-zinc-900/60 text-zinc-500 border-zinc-800/60';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 pb-0.5">
        <span>Document Hierarchy ({headings.length} tags)</span>
        <span className="text-zinc-500">Click Eye to locate</span>
      </div>

      <div className="card-premium rounded-lg divide-y divide-white/[0.05] overflow-hidden">
        {headings.map((h) => {
          const paddingLeft = `${(h.level - 1) * 14 + 10}px`;

          return (
            <div
              key={h.id}
              style={{ paddingLeft }}
              className={`py-2 pr-2.5 flex items-center justify-between gap-2 hover:bg-white/[0.02] transition-colors ${
                h.isSkippedHierarchy ? 'bg-amber-500/[0.03]' : ''
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded border shrink-0 ${getLevelBadge(
                    h.level
                  )}`}
                >
                  H{h.level}
                </span>

                <span className="text-xs text-zinc-200 font-medium truncate">
                  {h.text}
                </span>

                {h.isSkippedHierarchy && (
                  <span
                    title="Skipped hierarchy level"
                    className="flex items-center gap-1 text-[9px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 rounded shrink-0"
                  >
                    <AlertTriangle className="w-2.5 h-2.5" />
                    Level Skipped
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => highlightElementOnTab(h.selector)}
                className="p-1 rounded text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800 transition-colors shrink-0"
                title="Highlight heading on page"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
