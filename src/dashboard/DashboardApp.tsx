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
  ArrowRight,
  RefreshCw,
  Loader2,
  Shield,
  Zap,
  Eye,
  Cpu
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
import { SecurityPanel } from '../components/SecurityPanel';
import { WebVitalsPanel } from '../components/WebVitalsPanel';
import { SchemaValidatorPanel } from '../components/SchemaValidatorPanel';
import { AccessibilityPanel } from '../components/AccessibilityPanel';
import { TechStackPanel } from '../components/TechStackPanel';

type DashboardTab = 'issues' | 'security' | 'vitals' | 'schema' | 'a11y' | 'tech' | 'meta' | 'headings' | 'links' | 'images' | 'wordpress' | 'history';

export const DashboardApp: React.FC = () => {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [history, setHistory] = useState<AuditReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>('issues');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<IssueSeverity | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<AuditCategory | 'all'>('all');

  const [inputUrl, setInputUrl] = useState('');
  const [urlAuditLoading, setUrlAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

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

  const handleAuditUrl = async (targetUrlToAudit?: string) => {
    const url = (targetUrlToAudit || inputUrl).trim();
    if (!url) return;

    setUrlAuditLoading(true);
    setAuditError(null);
    try {
      const newReport = await requestAudit(undefined, url);
      setReport(newReport);
      await saveAuditReport(newReport);
      const updatedHistory = await getAuditHistory();
      setHistory(updatedHistory);
    } catch (err: any) {
      setAuditError(err?.message || `Failed to audit ${url}`);
    } finally {
      setUrlAuditLoading(false);
    }
  };

  const handleReAudit = async () => {
    setIsLoading(true);
    try {
      const newReport = await requestAudit(undefined, report?.url);
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

      {/* Live Website Auditor Bar */}
      <div className="bg-[#0E0E12] border-b border-white/[0.08] px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAuditUrl();
            }}
            className="flex-1 w-full flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Globe className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Enter any live website URL to audit (e.g. https://wordpress.org or yourdomain.com)..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-black border border-white/[0.12] text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={urlAuditLoading || !inputUrl.trim()}
              className="px-4 py-2 rounded-lg bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-colors shrink-0 disabled:opacity-40 flex items-center gap-1.5 shadow-sm"
            >
              {urlAuditLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Auditing...</span>
                </>
              ) : (
                <>
                  <span>Audit Website</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick example chips */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 overflow-x-auto w-full md:w-auto shrink-0">
            <span className="text-[11px] text-zinc-500">Try live:</span>
            {['wordpress.org', 'wikipedia.org', 'github.com'].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setInputUrl(`https://${example}`);
                  handleAuditUrl(`https://${example}`);
                }}
                className="px-2 py-0.5 rounded bg-zinc-900 border border-white/[0.08] text-[11px] font-mono text-zinc-300 hover:text-white hover:border-white/[0.2] transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {auditError && (
          <div className="max-w-7xl mx-auto mt-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span>⚠️ {auditError}</span>
          </div>
        )}
      </div>

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
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 relative ${
              activeTab === 'security'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Security</span>
            {report.security?.leakedSecrets && report.security.leakedSecrets.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vitals')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'vitals'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Core Web Vitals</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'schema'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Schema.org</span>
            {report.schema && (
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-black/40 text-zinc-300">
                {report.schema.totalSchemas}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('a11y')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'a11y'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>WCAG A11y</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tech')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'tech'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Tech Stack</span>
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

        {activeTab === 'security' && (
          <div className="max-w-4xl mx-auto">
            <SecurityPanel security={report.security} />
          </div>
        )}

        {activeTab === 'vitals' && (
          <div className="max-w-4xl mx-auto">
            <WebVitalsPanel vitals={report.vitals} />
          </div>
        )}

        {activeTab === 'schema' && (
          <div className="max-w-4xl mx-auto">
            <SchemaValidatorPanel schema={report.schema} />
          </div>
        )}

        {activeTab === 'a11y' && (
          <div className="max-w-4xl mx-auto">
            <AccessibilityPanel accessibility={report.accessibility} />
          </div>
        )}

        {activeTab === 'tech' && (
          <div className="max-w-4xl mx-auto">
            <TechStackPanel techStack={report.techStack} />
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
