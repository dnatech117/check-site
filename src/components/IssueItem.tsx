import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  Copy, 
  Check 
} from 'lucide-react';
import { AuditIssue } from '../types/audit';
import { highlightElementOnTab } from '../lib/messaging';

interface IssueItemProps {
  issue: AuditIssue;
}

export const IssueItem: React.FC<IssueItemProps> = ({ issue }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const getSeverityBadge = () => {
    switch (issue.severity) {
      case 'critical':
        return {
          dot: 'bg-rose-500',
          badge: 'badge-fail',
          borderAccent: 'border-l-rose-500',
        };
      case 'warning':
        return {
          dot: 'bg-amber-500',
          badge: 'badge-warn',
          borderAccent: 'border-l-amber-500',
        };
      case 'notice':
        return {
          dot: 'bg-blue-500',
          badge: 'badge-info',
          borderAccent: 'border-l-blue-500',
        };
      case 'good':
      default:
        return {
          dot: 'bg-emerald-500',
          badge: 'badge-pass',
          borderAccent: 'border-l-emerald-500',
        };
    }
  };

  const config = getSeverityBadge();

  const handleCopyRecommendation = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(`${issue.title}: ${issue.recommendation}`).catch(() => {});
      }
    } catch {
      // Ignore clipboard permission issues
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleHighlight = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (issue.selector) {
      highlightElementOnTab(issue.selector);
    }
  };

  return (
    <div
      className={`card-premium rounded-lg border-l-2 ${config.borderAccent} overflow-hidden mb-2 text-xs`}
    >
      {/* Header bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3 cursor-pointer flex items-start justify-between gap-3 select-none hover:bg-white/[0.02]"
      >
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${config.dot}`} />
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              <span className="font-medium text-xs text-zinc-100 leading-snug">
                {issue.title}
              </span>
              <span className={`text-[9px] uppercase font-mono tracking-wider px-1.5 py-0.2 rounded ${config.badge}`}>
                {issue.severity}
              </span>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/60 px-1.5 py-0.2 rounded border border-white/[0.06]">
                {issue.category}
              </span>
            </div>
            <p className="text-[11.5px] text-zinc-400 line-clamp-1 leading-normal">
              {issue.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {issue.scoreImpact > 0 && (
            <span className="text-[10px] font-mono text-rose-400/90 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
              -{issue.scoreImpact}
            </span>
          )}
          <button
            type="button"
            className="p-1 text-zinc-500 hover:text-zinc-300 rounded transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Remediation Drawer */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-2 border-t border-white/[0.06] bg-[#0E131E]/80 space-y-2.5 text-xs">
          {issue.context && (
            <div className="p-2 rounded bg-black/40 border border-white/[0.06] font-mono text-[10.5px] text-zinc-300 break-all">
              <span className="text-zinc-500 select-none block text-[9.5px] uppercase font-sans font-medium mb-0.5">
                Observed Context:
              </span>
              {issue.context}
            </div>
          )}

          <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.08] text-zinc-300">
            <span className="font-semibold text-zinc-200 block text-[11px] mb-0.5">
              Action Plan:
            </span>
            <p className="leading-relaxed text-[11px] text-zinc-300">{issue.recommendation}</p>
          </div>

          <div className="flex items-center justify-between pt-1">
            {issue.selector ? (
              <button
                type="button"
                onClick={handleHighlight}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition-colors"
                title="Locate element on page"
              >
                <Eye className="w-3.5 h-3.5" />
                Highlight on Page
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={handleCopyRecommendation}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-white/[0.08] transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-zinc-400" />
                  <span>Copy Fix</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
