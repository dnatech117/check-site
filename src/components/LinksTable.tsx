import React, { useState } from 'react';
import { LinkItem } from '../types/audit';
import { Search, ExternalLink, Link as LinkIcon, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { highlightElementOnTab } from '../lib/messaging';

interface LinksTableProps {
  links: LinkItem[];
}

export const LinksTable: React.FC<LinksTableProps> = ({ links }) => {
  const [filterType, setFilterType] = useState<'all' | 'internal' | 'external' | 'broken'>('all');
  const [search, setSearch] = useState('');

  const isBroken = (s: number | string | undefined) => s === 'error' || (typeof s === 'number' && s >= 400);

  const filtered = links.filter((link) => {
    if (filterType === 'internal' && link.isExternal) return false;
    if (filterType === 'external' && !link.isExternal) return false;
    if (filterType === 'broken' && !isBroken(link.status)) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return link.text.toLowerCase().includes(q) || link.href.toLowerCase().includes(q);
    }
    return true;
  });

  const brokenCount = links.filter(l => isBroken(l.status)).length;
  const externalCount = links.filter(l => l.isExternal).length;
  const internalCount = links.length - externalCount;

  return (
    <div className="space-y-2.5">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search links..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-[#0E131E] border border-white/[0.08] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors ${
              filterType === 'all'
                ? 'bg-zinc-800 text-white border border-white/[0.1]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All ({links.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('internal')}
            className={`px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors ${
              filterType === 'internal'
                ? 'bg-zinc-800 text-white border border-white/[0.1]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Internal ({internalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('external')}
            className={`px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors ${
              filterType === 'external'
                ? 'bg-zinc-800 text-white border border-white/[0.1]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            External ({externalCount})
          </button>
          {brokenCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterType('broken')}
              className={`px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                filterType === 'broken'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-rose-400 hover:bg-rose-500/10'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              Broken ({brokenCount})
            </button>
          )}
        </div>
      </div>

      {/* Links List */}
      <div className="card-premium rounded-lg divide-y divide-white/[0.05] overflow-hidden max-h-[380px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500">
            No links match your filter criteria.
          </div>
        ) : (
          filtered.map((link) => (
            <div
              key={link.id}
              className="p-2.5 hover:bg-white/[0.02] transition-colors flex items-start justify-between gap-2.5 text-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  <span className="font-medium text-xs text-zinc-200 truncate max-w-full">
                    {link.text}
                  </span>
                  {link.isExternal ? (
                    <span className="text-[9.5px] font-mono text-zinc-400 bg-zinc-800/60 px-1.5 py-0.2 rounded border border-white/[0.06] flex items-center gap-0.5">
                      <ExternalLink className="w-2.5 h-2.5" /> External
                    </span>
                  ) : (
                    <span className="text-[9.5px] font-mono text-zinc-400 bg-zinc-800/60 px-1.5 py-0.2 rounded border border-white/[0.06] flex items-center gap-0.5">
                      <LinkIcon className="w-2.5 h-2.5" /> Internal
                    </span>
                  )}
                  {isBroken(link.status) ? (
                    <span className="text-[9.5px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20 flex items-center gap-0.5">
                      <AlertCircle className="w-2.5 h-2.5" /> {link.status === 'error' ? 'Error' : link.status}
                    </span>
                  ) : link.status === 200 || link.status === 'ok' ? (
                    <span className="text-[9.5px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 flex items-center gap-0.5">
                      <CheckCircle className="w-2.5 h-2.5" /> 200
                    </span>
                  ) : null}
                </div>

                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-mono text-zinc-400 hover:text-zinc-200 hover:underline break-all block"
                >
                  {link.href}
                </a>

                {link.target === '_blank' && (!link.rel || !link.rel.includes('noopener')) && (
                  <span className="inline-block mt-1 text-[9.5px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded">
                    target="_blank" missing rel="noopener"
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => highlightElementOnTab(link.selector)}
                className="p-1 rounded text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800 transition-colors shrink-0 mt-0.5"
                title="Highlight link on page"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
