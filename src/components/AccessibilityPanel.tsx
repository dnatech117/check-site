import React from 'react';
import { Eye, CheckCircle2, AlertTriangle, XCircle, Type, MousePointerClick, FileInput, Globe2 } from 'lucide-react';
import { AccessibilityDetails } from '../types/audit';

interface AccessibilityPanelProps {
  accessibility?: AccessibilityDetails;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({ accessibility }) => {
  if (!accessibility) {
    return (
      <div className="card-premium p-4 rounded-xl text-center text-xs text-zinc-400">
        No accessibility telemetry recorded.
      </div>
    );
  }

  const {
    htmlLang,
    isLangValid,
    contrastIssues,
    touchTargetIssues,
    formIssues,
    hasSkipLink,
    hasViewportZoomDisabled,
  } = accessibility;

  return (
    <div className="space-y-3 font-sans text-xs">
      {/* Overview Matrix Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-xl bg-[#0F0F12] border border-white/[0.08] space-y-1">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Globe2 className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium">Document Language</span>
          </div>
          <span className={`text-sm font-bold font-mono block ${
            isLangValid ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {isLangValid ? `lang="${htmlLang}"` : 'Missing / Invalid'}
          </span>
          <p className="text-[10px] text-zinc-500">
            {isLangValid ? 'Screen reader pronunciation enabled' : 'Assistive voice synthesis impaired'}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-[#0F0F12] border border-white/[0.08] space-y-1">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium">Pinch-to-Zoom</span>
          </div>
          <span className={`text-sm font-bold block ${
            !hasViewportZoomDisabled ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {!hasViewportZoomDisabled ? 'Accessible' : 'Disabled (Blocked)'}
          </span>
          <p className="text-[10px] text-zinc-500">
            {!hasViewportZoomDisabled ? 'Visually impaired users can zoom' : 'user-scalable=no in viewport meta'}
          </p>
        </div>
      </div>

      {/* WCAG 2.2 Contrast Ratio Analysis */}
      <div className="p-3 rounded-xl bg-[#0F0F12] border border-white/[0.08] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-zinc-400" />
            <h4 className="font-semibold text-zinc-200">Color Contrast Engine (WCAG 2.2 AA)</h4>
          </div>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
            contrastIssues.length === 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
          }`}>
            {contrastIssues.length === 0 ? 'ALL PASS' : `${contrastIssues.length} FAILING`}
          </span>
        </div>

        {contrastIssues.length === 0 ? (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-300 text-[11px]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>All inspected text elements satisfy the minimum 4.5:1 (or 3:1 large text) contrast ratio.</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {contrastIssues.map((issue, idx) => (
              <div
                key={idx}
                className="p-2 rounded-lg bg-black/40 border border-white/[0.04] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-zinc-300 truncate max-w-[200px]">
                    {issue.selector}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-mono">
                    <span className="text-rose-400 font-bold">{issue.contrastRatio}:1</span>
                    <span className="text-zinc-500">/ {issue.requiredRatio}:1 min</span>
                  </div>
                </div>

                {/* Swatches Visualizer */}
                <div className="flex items-center gap-2">
                  <div
                    className="px-2 py-0.5 rounded text-[10px] font-medium border border-white/10"
                    style={{ color: issue.textColor, backgroundColor: issue.backgroundColor }}
                  >
                    Sample: "{issue.text}"
                  </div>
                  <span className="text-[9px] text-zinc-500 font-mono">
                    FG: {issue.textColor} on BG: {issue.backgroundColor}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Touch Target Sizing (< 24x24 px) */}
      <div className="p-3 rounded-xl bg-[#0F0F12] border border-white/[0.08] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MousePointerClick className="w-3.5 h-3.5 text-zinc-400" />
            <h4 className="font-semibold text-zinc-200">Touch Target Size (WCAG 2.5.8)</h4>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            {touchTargetIssues.length === 0 ? 'Compliant' : `${touchTargetIssues.length} Small Elements`}
          </span>
        </div>

        {touchTargetIssues.length === 0 ? (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-300 text-[11px]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Interactive buttons and anchors meet the minimum 24×24px touch bounding box.</span>
          </div>
        ) : (
          <div className="space-y-1">
            {touchTargetIssues.slice(0, 5).map((target, idx) => (
              <div key={idx} className="p-1.5 rounded bg-black/40 border border-white/[0.04] flex items-center justify-between">
                <span className="font-mono text-[10px] text-zinc-300 truncate max-w-[220px]">
                  {target.selector} {target.text ? `("${target.text}")` : ''}
                </span>
                <span className="text-[10px] font-mono text-amber-400 font-semibold">
                  {target.width}×{target.height}px (&lt; 24px)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Accessible Labels */}
      {formIssues.length > 0 && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
          <FileInput className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-300 block">
              {formIssues.length} Unlabeled Form Inputs
            </span>
            <p className="text-[10px] text-zinc-300 leading-tight mt-0.5">
              Input elements lack associated &lt;label&gt; tags, aria-label, or title attributes, making forms impossible for screen reader users to navigate.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
