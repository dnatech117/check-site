import React, { useState } from 'react';
import { 
  RefreshCw, 
  Clock, 
  Sliders, 
  Download, 
  Maximize2, 
  Globe, 
  FileSpreadsheet, 
  FileCode, 
  Printer, 
  Check
} from 'lucide-react';
import { AuditReport } from '../types/audit';
import { exportReportToCsv, exportReportToJson, triggerPrintReport } from '../lib/export';
import { openFullDashboard } from '../lib/messaging';

interface HeaderProps {
  report: AuditReport | null;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  isDashboard?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  report,
  isLoading,
  onRefresh,
  onOpenHistory,
  onOpenSettings,
  isDashboard = false,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleExportCsv = () => {
    if (!report) return;
    exportReportToCsv(report);
    setShowExportMenu(false);
    triggerNotice('CSV Exported');
  };

  const handleExportJson = () => {
    if (!report) return;
    exportReportToJson(report);
    setShowExportMenu(false);
    triggerNotice('JSON Exported');
  };

  const handlePrint = () => {
    setShowExportMenu(false);
    triggerPrintReport();
  };

  const triggerNotice = (msg: string) => {
    setExportNotice(msg);
    setTimeout(() => setExportNotice(null), 2000);
  };

  return (
    <header className="px-3.5 py-2.5 border-b border-white/[0.08] bg-[#0A0A0C] sticky top-0 z-30">
      <div className="flex items-center justify-between gap-3">
        {/* Brand & Active Domain */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 shadow-sm border border-white/[0.2] overflow-hidden">
            <img
              src="/icons/logo.png"
              alt="SiteCheck"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-white tracking-tight">
                SiteCheck
              </span>
              <span className="text-[9px] font-mono tracking-wider font-semibold text-zinc-300 bg-white/[0.06] px-1.5 py-0.2 rounded border border-white/[0.1]">
                DNATech
              </span>
            </div>

            {report && (
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 truncate max-w-[210px]">
                <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                <span className="truncate font-mono text-[10.5px] text-zinc-300">
                  {report.domain}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Re-Audit Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className={`p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-all ${
              isLoading ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            title="Re-run Page Audit"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-white' : ''}`} />
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              disabled={!report || isLoading}
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-all disabled:opacity-30"
              title="Export Report"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1.5 w-36 bg-[#141417] rounded-lg border border-white/[0.1] shadow-xl py-1 z-40 text-xs animate-fade-in divide-y divide-white/[0.06]">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="w-full px-3 py-1.5 text-left text-zinc-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Download CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="w-full px-3 py-1.5 text-left text-zinc-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2"
                >
                  <FileCode className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Download JSON</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full px-3 py-1.5 text-left text-zinc-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2"
                >
                  <Printer className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Print / PDF</span>
                </button>
              </div>
            )}
          </div>

          {/* Audit History */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-all"
            title="Audit History"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-all"
            title="Settings & Thresholds"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Expand to Dashboard Tab */}
          {!isDashboard && (
            <button
              type="button"
              onClick={openFullDashboard}
              className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-all ml-0.5"
              title="Expand to Full Tab"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {exportNotice && (
        <div className="absolute left-1/2 transform -translate-x-1/2 top-12 bg-white text-black font-semibold text-[11px] px-3 py-0.5 rounded-full shadow-lg flex items-center gap-1.5 z-50">
          <Check className="w-3 h-3 text-black" />
          <span>{exportNotice}</span>
        </div>
      )}
    </header>
  );
};
