import React from 'react';
import { ShieldCheck, ShieldAlert, KeyRound, AlertTriangle, Lock, ExternalLink, Copy, Check } from 'lucide-react';
import { SecurityDetails } from '../types/audit';

interface SecurityPanelProps {
  security?: SecurityDetails;
}

export const SecurityPanel: React.FC<SecurityPanelProps> = ({ security }) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!security) {
    return (
      <div className="card-premium p-4 rounded-xl text-center text-xs text-zinc-400">
        No security telemetry recorded for this page.
      </div>
    );
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const hasLeakedSecrets = security.leakedSecrets && security.leakedSecrets.length > 0;

  return (
    <div className="space-y-3 font-sans">
      {/* Critical Secret Leak Alert Box */}
      {hasLeakedSecrets && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 shadow-lg shadow-rose-950/30 space-y-2">
          <div className="flex items-center gap-2 text-rose-300">
            <KeyRound className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
            <h4 className="text-xs font-bold tracking-tight">
              CRITICAL: Hardcoded API Keys / Secrets Detected!
            </h4>
          </div>
          <p className="text-[11px] text-rose-200/90 leading-relaxed">
            Client source code contains exposed credentials. Anyone inspecting DevTools or page source can exploit these keys to access your backend or cloud accounts.
          </p>

          <div className="space-y-1.5 pt-1">
            {security.leakedSecrets.map((secret) => (
              <div
                key={secret.id}
                className="p-2 rounded-lg bg-black/60 border border-rose-500/30 flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-rose-400 block font-sans">
                    {secret.type}
                  </span>
                  <span className="text-zinc-200 select-all">{secret.preview}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(secret.preview, secret.id)}
                  className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                  title="Copy masked secret"
                >
                  {copiedId === secret.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Overview Cards */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-[#0F0F12] border border-white/[0.08] flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            security.isHttps ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block">Transport Layer</span>
            <span className={`font-semibold ${security.isHttps ? 'text-emerald-300' : 'text-rose-300'}`}>
              {security.isHttps ? 'HTTPS Secure' : 'Insecure HTTP'}
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#0F0F12] border border-white/[0.08] flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            security.mixedContentCount === 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block">Mixed Content</span>
            <span className={`font-semibold ${security.mixedContentCount === 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {security.mixedContentCount === 0 ? '0 Insecure Assets' : `${security.mixedContentCount} HTTP Assets`}
            </span>
          </div>
        </div>
      </div>

      {/* Security Headers Inspection Matrix */}
      <div className="p-3 rounded-xl bg-[#0F0F12] border border-white/[0.08] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />
            <h4 className="text-xs font-semibold text-zinc-200">HTTP Security Headers</h4>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">
            {security.headers.filter(h => h.status === 'enforced').length}/{security.headers.length} Enforced
          </span>
        </div>

        <div className="space-y-1.5">
          {security.headers.map((header) => {
            const isEnforced = header.status === 'enforced';
            const isWeak = header.status === 'weak';
            return (
              <div
                key={header.name}
                className="p-2 rounded-lg bg-black/40 border border-white/[0.04] flex items-start justify-between gap-2"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-white truncate block">
                      {header.name}
                    </span>
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.2 rounded font-mono ${
                        isEnforced
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isWeak
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {isEnforced ? 'ENFORCED' : isWeak ? 'WEAK' : 'MISSING'}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-tight">
                    {header.details}
                  </p>
                  {header.value && (
                    <div className="text-[9px] font-mono text-zinc-500 truncate pt-0.5">
                      Value: {header.value}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target Blank Vulnerability Warning */}
      {security.unsafeBlankLinksCount > 0 && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-300 block">
              {security.unsafeBlankLinksCount} Reverse Tab-Nabbing Links
            </span>
            <p className="text-[10px] text-zinc-300 leading-tight mt-0.5">
              External links with target="_blank" without rel="noopener noreferrer" allow target pages to hijack the opening tab through window.opener.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
