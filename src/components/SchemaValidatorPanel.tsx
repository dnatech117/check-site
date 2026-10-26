import React, { useState } from 'react';
import { FileCode, CheckCircle2, AlertTriangle, XCircle, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { SchemaDetails, SchemaItem } from '../types/audit';

interface SchemaValidatorPanelProps {
  schema?: SchemaDetails;
}

export const SchemaValidatorPanel: React.FC<SchemaValidatorPanelProps> = ({ schema }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!schema || schema.totalSchemas === 0) {
    return (
      <div className="card-premium p-4 rounded-xl text-center space-y-2">
        <FileCode className="w-6 h-6 text-zinc-500 mx-auto" />
        <h4 className="text-xs font-semibold text-zinc-200">No Structured Data (JSON-LD) Detected</h4>
        <p className="text-[11px] text-zinc-400 max-w-xs mx-auto leading-relaxed">
          The page lacks Schema.org structured data. Search engines like Google rely on JSON-LD to display rich search results (rich snippets, star ratings, breadcrumbs, search boxes).
        </p>
      </div>
    );
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-3 font-sans text-xs">
      {/* Header Summary */}
      <div className="p-3 rounded-xl bg-[#0F0F12] border border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
            <FileCode className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-semibold text-white">Schema.org JSON-LD Entities</h4>
            <span className="text-[10px] text-zinc-400">
              {schema.validCount} Valid · {schema.invalidCount} Issues
            </span>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-black font-semibold">
          {schema.totalSchemas} {schema.totalSchemas === 1 ? 'SCHEMA' : 'SCHEMAS'}
        </span>
      </div>

      {/* Schema Items List */}
      <div className="space-y-2">
        {schema.items.map((item) => {
          const isExpanded = expandedId === item.id;
          const isCopied = copiedId === item.id;

          return (
            <div
              key={item.id}
              className="rounded-xl bg-[#0F0F12] border border-white/[0.08] overflow-hidden transition-all"
            >
              {/* Item Header */}
              <div
                onClick={() => toggleExpand(item.id)}
                className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {item.isValidJson && item.errors.length === 0 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white truncate text-xs">
                        {item.type}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-500 bg-white/[0.04] px-1 py-0.2 rounded">
                        {item.propertiesCount} props
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 truncate block">
                      {item.context}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-zinc-400">
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </div>
              </div>

              {/* Warnings / Errors */}
              {item.warnings.length > 0 && (
                <div className="px-3 pb-2 space-y-1">
                  {item.warnings.map((warn, wIdx) => (
                    <div key={wIdx} className="text-[10px] text-amber-300/90 flex items-start gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                      <span>{warn}</span>
                    </div>
                  ))}
                </div>
              )}

              {item.errors.length > 0 && (
                <div className="px-3 pb-2 space-y-1">
                  {item.errors.map((err, eIdx) => (
                    <div key={eIdx} className="text-[10px] text-rose-300/90 flex items-start gap-1.5">
                      <XCircle className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Collapsible JSON Viewer */}
              {isExpanded && (
                <div className="border-t border-white/[0.06] bg-black/60 p-2.5 space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span>Raw JSON-LD Snippet</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(item.rawJson, item.id);
                      }}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="font-mono text-[10px] text-zinc-300 overflow-x-auto p-2 rounded bg-black border border-white/[0.04] max-h-48 leading-relaxed no-scrollbar select-text">
                    {item.rawJson}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
