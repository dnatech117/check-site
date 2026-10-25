import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Printer, 
  FileSpreadsheet, 
  FileCode, 
  Clock, 
  ListTree, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw,
  Loader2
} from 'lucide-react';

import { AuditReport, IssueSeverity, AuditCategory } from '../types/audit';
import { getAuditHistory, saveAuditReport, clearAuditHistory } from '../lib/storage';
import { requestAudit } from '../lib/messaging';
import { MOCK_AUDIT_REPORT } from '../lib/mockData';
import { exportReportToCsv, exportReportToJson, triggerPrintReport } from '../lib/export';

import { ScoreGauge } from '../components/ScoreGauge';
import { IssueItem } from '../components/IssueItem';
import { HeadingsOutline } from '../components/HeadingsOutline';
import { LinksTable } from '../components/LinksTable';
import { ImagesInspector } from '../components/ImagesInspector';
import { WordPressPanel } from '../components/WordPressPanel';
import { MetaInspector } from '../components/MetaInspector';

export const DashboardApp: React.FC = () => {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [history, setHistory] = useState<AuditReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'issues' | 'meta' | 'headings' | 'links' | 'images' | 'wordpress' | 'history'>('issues');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<IssueSeverity | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<AuditCategory | 'all'>('all');

  useEffect(() => {
    async function load() {
      const pastHistory = await getAuditHistory();
      setHistory(pastHistory);

      if (pastHistory.length > 0) {
        setReport(pastHistory[0]);
      } else {
        setReport(MOCK_AUDIT_REPORT);
      }
      setIsLoading(false);
    }

    load();
  }, []);

  const handleReAudit = async () => {
    setIsLoading(true);
    try {
      const newReport = await requestAudit();
      setReport(newReport);
      await saveAuditReport(newReport);
      const updatedHistory = await getAuditHistory();
      setHistory(updatedHistory);
    } catch (err) {
      console.warn('Dashboard re-audit error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredIssues = report?.issues.filter((issue) => {
    if (selectedSeverity !== 'all' && issue.severity !== selectedSeverity) return false;
    if (selectedCategory !== 'all' && issue.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        issue.title.toLowerCase().includes(q) ||
        issue.description.toLowerCase().includes(q) ||
        issue.recommendation.toLowerCase().includes(q)
      );
    }
    return true;
  }) || [];

  const previousReport = history.find(h => h.id !== report?.id && h.domain === report?.domain);
  const scoreDiff = (report && previousReport) ? report.score - previousReport.score : null;

  if (isLoading || !report) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 text-white animate-spin mb-3" />
        <h2 className="text-sm font-semibold text-zinc-300">Loading SiteCheck Dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Top Enterprise Brand Header */}
      <header className="border-b border-white/[0.08] bg-[#0A0A0C] sticky top-0 z-30 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center overflow-hidden shrink-0 border border-white/[0.2]">
              <img src="/icons/logo.png" alt="SiteCheck" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-white">
                  SiteCheck — Website Health Auditor
                </h1>
                <span className="text-[10px] font-mono font-semibold tracking-wider text-zinc-300 bg-white/[0.06] px-1.5 py-0.2 rounded border border-white/[0.1]">
                  DNATech
                </span>
              </div>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5 font-mono">
                <Globe className="w-3.5 h-3.5 text-zinc-500" />
                <span className="truncate max-w-md text-zinc-300">{report.url}</span>
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleReAudit}
              className="px-3 py-1.5 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 text-xs transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Re-run Audit</span>
            </button>

            <button
              type="button"
              onClick={() => exportReportToCsv(report)}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/[0.1] text-xs font-medium text-zinc-200 transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-400" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={() => exportReportToJson(report)}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/[0.1] text-xs font-medium text-zinc-200 transition-colors flex items-center gap-1.5"
            >
              <FileCode className="w-3.5 h-3.5 text-zinc-400" />
              <span>JSON</span>
            </button>

            <button
              type="button"
              onClick={triggerPrintReport}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/[0.1] text-xs font-medium text-zinc-200 transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-400" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Overview Strip */}
      <section className="border-b border-white/[0.06] bg-gradient-to-b from-[#0A0A0C] to-black py-6 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Health Score Telemetry */}
          <div className="md:col-span-4 card-premium p-5 rounded-xl flex items-center gap-5">
            <ScoreGauge score={report.score} size={110} strokeWidth={8} />
            <div className="space-y-1 min-w-0">
              <span className="text-[10.5px] uppercase tracking-wider text-zinc-500 font-mono font-medium block">
                Health Score
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {report.score >= 90 ? 'Production Ready' : report.score >= 70 ? 'Minor Issues Detected' : 'Attention Required'}
              </h2>
              {scoreDiff !== null && (
                <div className="flex items-center gap-1 text-xs font-mono">
                  {scoreDiff >= 0 ? (
                    <span className="text-white flex items-center font-semibold">
                      <ArrowUpRight className="w-3.5 h-3.5 text-white" /> +{scoreDiff} pts
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center font-semibold">
                      <ArrowDownRight className="w-3.5 h-3.5" /> {scoreDiff} pts
                    </span>
                  )}
                  <span className="text-zinc-500 text-[11px]">vs prior audit</span>
                </div>
              )}
            </div>
          </div>

          {/* Metric Status Counters */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card-premium p-3.5 rounded-xl border-l-2 border-l-rose-500">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                Critical
              </span>
              <span className="text-2xl font-bold font-mono tabular-nums text-rose-400">
                {report.summary.critical}
              </span>
              <p className="text-[11px] text-zinc-400 mt-0.5">High priority fixes</p>
            </div>

            <div className="card-premium p-3.5 rounded-xl border-l-2 border-l-amber-500">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                Warnings
              </span>
              <span className="text-2xl font-bold font-mono tabular-nums text-amber-400">
                {report.summary.warning}
              </span>
              <p className="text-[11px] text-zinc-400 mt-0.5">Optimization items</p>
            </div>

            <div className="card-premium p-3.5 rounded-xl border-l-2 border-l-sky-500">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                Notices
              </span>
              <span className="text-2xl font-bold font-mono tabular-nums text-sky-400">
                {report.summary.notice}
              </span>
              <p className="text-[11px] text-zinc-400 mt-0.5">Best practice items</p>
            </div>

            <div className="card-premium p-3.5 rounded-xl border-l-2 border-l-white">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                Passed
              </span>
              <span className="text-2xl font-bold font-mono tabular-nums text-white">
                {report.summary.good}
              </span>
              <p className="text-[11px] text-zinc-400 mt-0.5">Healthy elements</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tabbed Container */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 border-b border-white/[0.08] pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('issues')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'issues'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>Issues</span>
            <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${
              activeTab === 'issues' ? 'bg-black/10 text-black' : 'bg-black/40 text-zinc-300'
            }`}>
              {report.issues.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('meta')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'meta'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>SEO & Metadata</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('headings')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'headings'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ListTree className="w-3.5 h-3.5" />
            <span>Outline ({report.headings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('links')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'links'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Link Health ({report.links.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('images')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'images'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Images ({report.images.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wordpress')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'wordpress'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>WordPress</span>
            {report.wordpress.isWordPress && (
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ml-auto ${
              activeTab === 'history'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>History ({history.length})</span>
          </button>
        </div>

        {/* Tab Content Display */}
        {activeTab === 'issues' && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Filter issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-[#0C0C0E] border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.3]"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setSelectedSeverity('all')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    selectedSeverity === 'all'
                      ? 'bg-white text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  All ({report.issues.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSeverity('critical')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    selectedSeverity === 'critical'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Critical ({report.summary.critical})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSeverity('warning')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    selectedSeverity === 'warning'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Warning ({report.summary.warning})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSeverity('good')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    selectedSeverity === 'good'
                      ? 'bg-white text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Passed ({report.summary.good})
                </button>
              </div>
            </div>

            {/* Issues List */}
            <div className="space-y-2">
              {filteredIssues.map((issue) => (
                <IssueItem key={issue.id} issue={issue} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'meta' && (
          <div className="max-w-4xl mx-auto">
            <MetaInspector meta={report.meta} />
          </div>
        )}

        {activeTab === 'headings' && (
          <div className="max-w-4xl mx-auto">
            <HeadingsOutline headings={report.headings} />
          </div>
        )}

        {activeTab === 'links' && (
          <div>
            <LinksTable links={report.links} />
          </div>
        )}

        {activeTab === 'images' && (
          <div>
            <ImagesInspector images={report.images} />
          </div>
        )}

        {activeTab === 'wordpress' && (
          <div className="max-w-4xl mx-auto">
            <WordPressPanel
              wordpress={report.wordpress}
              isHttps={report.url.startsWith('https:')}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <h3 className="font-semibold text-xs text-white">Saved Audit History</h3>
              <button
                type="button"
                onClick={async () => {
                  await clearAuditHistory();
                  setHistory([]);
                }}
                className="text-xs text-zinc-400 hover:text-rose-400"
              >
                Clear All Logs
              </button>
            </div>

            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="card-premium p-3.5 rounded-lg flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-xs text-white">{item.domain}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        item.score >= 90 ? 'badge-pass' : item.score >= 70 ? 'badge-warn' : 'badge-fail'
                      }`}>
                        Score: {item.score}/100
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {new Date(item.timestamp).toLocaleString()} • {item.issues.length} issues logged
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setReport(item);
                      setActiveTab('issues');
                    }}
                    className="px-3 py-1 rounded bg-white text-black font-semibold text-xs"
                  >
                    Load Report
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
