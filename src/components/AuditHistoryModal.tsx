import React from 'react';
import { AuditReport } from '../types/audit';
import { X, Clock, Trash2, ArrowRight } from 'lucide-react';

interface AuditHistoryModalProps {
  isOpen: boolean;
  history: AuditReport[];
  currentReportId?: string;
  onClose: () => void;
  onSelectReport: (report: AuditReport) => void;
  onDeleteReport: (id: string) => void;
  onClearHistory: () => void;
}

export const AuditHistoryModal: React.FC<AuditHistoryModalProps> = ({
  isOpen,
  history,
  currentReportId,
  onClose,
  onSelectReport,
  onDeleteReport,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'badge-pass';
    if (score >= 70) return 'badge-warn';
    return 'badge-fail';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="card-elevated w-full max-w-sm rounded-xl p-4 space-y-3 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <h3 className="font-semibold text-xs text-zinc-100">Audit History Log</h3>
            <span className="text-[10px] bg-black/40 text-zinc-400 px-1.5 py-0.2 rounded font-mono">
              {history.length}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* List of past audits */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
          {history.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500">
              No previous audit records logged.
            </div>
          ) : (
            history.map((item) => {
              const isCurrent = item.id === currentReportId;

              return (
                <div
                  key={item.id}
                  className={`p-2 rounded-lg border transition-all flex items-center justify-between gap-2.5 text-xs ${
                    isCurrent
                      ? 'bg-zinc-800/80 border-white/[0.15]'
                      : 'bg-[#111622] border-white/[0.06] hover:border-white/[0.1]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded ${getScoreBadge(item.score)}`}>
                        {item.score}/100
                      </span>
                      <span className="font-medium text-xs text-zinc-200 truncate">
                        {item.domain}
                      </span>
                    </div>

                    <div className="text-[10px] text-zinc-500 font-mono">
                      <span>{formatDate(item.timestamp)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectReport(item);
                        onClose();
                      }}
                      className="px-2 py-0.5 rounded text-[10.5px] font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-white/[0.08] transition-colors flex items-center gap-1"
                      title="Load report"
                    >
                      <span>Load</span>
                      <ArrowRight className="w-2.5 h-2.5 text-zinc-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteReport(item.id)}
                      className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onClearHistory}
              className="text-zinc-500 hover:text-rose-400 transition-colors text-[10.5px]"
            >
              Clear Logs
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
