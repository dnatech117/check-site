import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  ListTree, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Globe, 
  FileText,
  Search,
  Loader2,
  Shield,
  Zap,
  FileCode,
  Eye,
  Cpu
} from 'lucide-react';

import { AuditReport, AuditSettings, IssueSeverity, AuditCategory } from '../types/audit';
import { requestAudit } from '../lib/messaging';
import { 
  getSettings, 
  saveSettings, 
  getAuditHistory, 
  saveAuditReport, 
  deleteReportById, 
  clearAuditHistory 
} from '../lib/storage';
import { MOCK_AUDIT_REPORT } from '../lib/mockData';

import { Header } from '../components/Header';
import { ScoreGauge } from '../components/ScoreGauge';
import { AuditSummaryCards } from '../components/AuditSummaryCards';
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
import { AuditHistoryModal } from '../components/AuditHistoryModal';
import { SettingsModal } from '../components/SettingsModal';

type ActiveTab = 'overview' | 'issues' | 'security' | 'vitals' | 'schema' | 'a11y' | 'tech' | 'meta' | 'headings' | 'links' | 'images' | 'wordpress';

export const App: React.FC = () => {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingStep, setLoadingStep] = useState<string>('Initializing audit...');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Modals & Settings
  const [settings, setSettings] = useState<AuditSettings | null>(null);
  const [history, setHistory] = useState<AuditReport[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Issues filtering
  const [selectedSeverity, setSelectedSeverity] = useState<IssueSeverity | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<AuditCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Initial load
  useEffect(() => {
    async function init() {
      const currentSettings = await getSettings();
      setSettings(currentSettings);

      const pastHistory = await getAuditHistory();
      setHistory(pastHistory);

      if (currentSettings.autoAuditOnOpen) {
        runAudit(currentSettings);
      } else if (pastHistory.length > 0) {
        setReport(pastHistory[0]);
        setIsLoading(false);
      } else {
        setReport(MOCK_AUDIT_REPORT);
        setIsLoading(false);
      }
    }

    init();
  }, []);

  const runAudit = async (currentSettings?: AuditSettings) => {
    setIsLoading(true);
    setError(null);
    setLoadingStep('Inspecting DOM & metadata...');

    const timers: number[] = [];

    try {
      timers.push(window.setTimeout(() => setLoadingStep('Analyzing headings & document outline...'), 140));
      timers.push(window.setTimeout(() => setLoadingStep('Evaluating images, links & assets...'), 280));
      timers.push(window.setTimeout(() => setLoadingStep('Detecting CMS signatures & telemetry...'), 420));

      const result = await requestAudit(currentSettings || settings || undefined);
      setReport(result);
      await saveAuditReport(result);

      const updatedHistory = await getAuditHistory();
      setHistory(updatedHistory);
    } catch (err: any) {
      console.warn('[SiteCheck] Audit error:', err);
      setError(err?.message || 'Failed to complete website audit.');
    } finally {
      timers.forEach(t => clearTimeout(t));
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (newSettings: AuditSettings) => {
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleDeleteHistory = async (id: string) => {
    await deleteReportById(id);
    const updated = await getAuditHistory();
    setHistory(updated);
  };

  const handleClearHistory = async () => {
    await clearAuditHistory();
    setHistory([]);
  };

  // Filter issues
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

  return (
    <div className="w-[420px] min-h-[580px] max-h-[600px] flex flex-col bg-black text-white font-sans select-none overflow-hidden">
      {/* Brand Header */}
      <Header
        report={report}
        isLoading={isLoading}
        onRefresh={() => runAudit()}
        onOpenHistory={() => setShowHistoryModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
            <div className="space-y-1">
              <h3 className="font-semibold text-xs text-zinc-200">Analyzing Page DOM</h3>
              <p className="text-[11px] text-zinc-500 font-mono">
                {loadingStep}
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-xs text-zinc-200">Audit Unavailable</h4>
              <p className="text-[11px] text-zinc-400 max-w-xs">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setReport(MOCK_AUDIT_REPORT);
              }}
              className="px-3 py-1.5 rounded-md bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors"
            >
              Load Demo Data
            </button>
          </div>
        ) : report ? (
          <>
            {/* Segmented Control Navigation */}
            <div className="px-3 pt-2.5 pb-2 border-b border-white/[0.08] bg-[#0A0A0C]">
              <nav className="flex items-center gap-1 p-0.5 rounded-lg bg-[#141417] border border-white/[0.08] overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'overview'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Overview
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('issues')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    activeTab === 'issues'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>Issues</span>
                  <span className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                    activeTab === 'issues' ? 'bg-black/10 text-black' : 'bg-black/40 text-zinc-300'
                  }`}>
                    {report.issues.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 relative ${
                    activeTab === 'security'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  <span>Security</span>
                  {report.security?.leakedSecrets && report.security.leakedSecrets.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping absolute top-1 right-1" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('vitals')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                    activeTab === 'vitals'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>Vitals</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('schema')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                    activeTab === 'schema'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <FileCode className="w-3 h-3" />
                  <span>Schema</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('a11y')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                    activeTab === 'a11y'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>A11y</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('tech')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                    activeTab === 'tech'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Cpu className="w-3 h-3" />
                  <span>Tech</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('meta')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                    activeTab === 'meta'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>Meta</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('headings')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                    activeTab === 'headings'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <ListTree className="w-3 h-3" />
                  <span>Outline</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('links')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                    activeTab === 'links'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>Links</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('images')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                    activeTab === 'images'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>Images</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('wordpress')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                    activeTab === 'wordpress'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>WP</span>
                  {report.wordpress.isWordPress && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </button>
              </nav>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {activeTab === 'overview' && (
                <div className="space-y-3">
                  {/* Score & Category Summary */}
                  <div className="card-premium p-3 rounded-xl flex items-center justify-between gap-3">
                    <ScoreGauge score={report.score} size={88} strokeWidth={6.5} />
                    <div className="flex-1">
                      <AuditSummaryCards
                        summary={report.summary}
                        selectedSeverity={selectedSeverity}
                        onSelectSeverity={(sev) => {
                          setSelectedSeverity(sev);
                          setActiveTab('issues');
                        }}
                      />
                    </div>
                  </div>

                  {/* High Priority Remediation Items */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs px-0.5">
                      <span className="font-semibold text-zinc-300">
                        Priority Items ({report.issues.filter(i => i.severity !== 'good').length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('issues')}
                        className="text-[11px] text-zinc-400 hover:text-white transition-colors"
                      >
                        View All
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {report.issues
                        .filter((i) => i.severity === 'critical' || i.severity === 'warning')
                        .slice(0, 4)
                        .map((issue) => (
                          <IssueItem key={issue.id} issue={issue} />
                        ))}
                    </div>
                  </div>

                  {/* Telemetry Bar */}
                  <div className="card-premium p-2.5 rounded-xl grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-1.5 rounded bg-black/40 border border-white/[0.04]">
                      <span className="text-[10px] text-zinc-500 block">TTFB / Load</span>
                      <span className="font-mono font-medium text-white tabular-nums">
                        {report.performance.loadTimeMs ? `${report.performance.loadTimeMs}ms` : '< 1s'}
                      </span>
                    </div>

                    <div className="p-1.5 rounded bg-black/40 border border-white/[0.04]">
                      <span className="text-[10px] text-zinc-500 block">DOM Nodes</span>
                      <span className="font-mono font-medium text-white tabular-nums">
                        {report.performance.domNodesCount}
                      </span>
                    </div>

                    <div className="p-1.5 rounded bg-black/40 border border-white/[0.04]">
                      <span className="text-[10px] text-zinc-500 block">Platform</span>
                      <span className="font-medium text-white truncate block">
                        {report.wordpress.isWordPress ? 'WordPress' : 'Custom'}
                      </span>
                    </div>
                  </div>

                  {/* Hardcore Diagnostics Quick Strip */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-zinc-300 px-0.5 block">
                      Hardcore Diagnostics
                    </span>
                    <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setActiveTab('security')}
                        className="p-2 rounded-xl bg-[#0F0F12] border border-white/[0.08] hover:border-white/20 transition-all text-left group"
                      >
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform" />
                          <span className="font-semibold text-zinc-200">Security</span>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-400 block truncate mt-1">
                          {report.security?.leakedSecrets?.length ? `${report.security.leakedSecrets.length} LEAKS!` : 'Headers OK'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('vitals')}
                        className="p-2 rounded-xl bg-[#0F0F12] border border-white/[0.08] hover:border-white/20 transition-all text-left group"
                      >
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400 group-hover:scale-110 transition-transform" />
                          <span className="font-semibold text-zinc-200">Vitals</span>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-400 block truncate mt-1">
                          {report.vitals?.lcp.hasLazyLoading ? 'LCP Risk' : 'CLS & LCP'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('schema')}
                        className="p-2 rounded-xl bg-[#0F0F12] border border-white/[0.08] hover:border-white/20 transition-all text-left group"
                      >
                        <div className="flex items-center gap-1">
                          <FileCode className="w-3 h-3 text-indigo-400 group-hover:scale-110 transition-transform" />
                          <span className="font-semibold text-zinc-200">Schema</span>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-400 block truncate mt-1">
                          {report.schema?.totalSchemas ? `${report.schema.totalSchemas} JSON-LD` : '0 Schemas'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('a11y')}
                        className="p-2 rounded-xl bg-[#0F0F12] border border-white/[0.08] hover:border-white/20 transition-all text-left group"
                      >
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-sky-400 group-hover:scale-110 transition-transform" />
                          <span className="font-semibold text-zinc-200">WCAG</span>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-400 block truncate mt-1">
                          {report.accessibility?.contrastIssues?.length ? `${report.accessibility.contrastIssues.length} Fails` : 'Compliant'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'issues' && (
                <div className="space-y-2.5">
                  {/* Filters Header */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Search issues or fixes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-[#0C0C0E] border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.3]"
                      />
                    </div>

                    {/* Severity Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedSeverity('all')}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          selectedSeverity === 'all'
                            ? 'bg-white text-black font-semibold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        All ({report.issues.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSeverity('critical')}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          selectedSeverity === 'critical'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Critical ({report.summary.critical})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSeverity('warning')}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          selectedSeverity === 'warning'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Warning ({report.summary.warning})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSeverity('good')}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          selectedSeverity === 'good'
                            ? 'bg-white text-black font-semibold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Passed ({report.summary.good})
                      </button>
                    </div>
                  </div>

                  {/* Issues List */}
                  <div className="space-y-1.5">
                    {filteredIssues.length === 0 ? (
                      <div className="p-8 text-center text-xs text-zinc-500 card-premium rounded-lg">
                        No issues found matching criteria.
                      </div>
                    ) : (
                      filteredIssues.map((issue) => (
                        <IssueItem key={issue.id} issue={issue} />
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <SecurityPanel security={report.security} />
              )}

              {activeTab === 'vitals' && (
                <WebVitalsPanel vitals={report.vitals} />
              )}

              {activeTab === 'schema' && (
                <SchemaValidatorPanel schema={report.schema} />
              )}

              {activeTab === 'a11y' && (
                <AccessibilityPanel accessibility={report.accessibility} />
              )}

              {activeTab === 'tech' && (
                <TechStackPanel techStack={report.techStack} />
              )}

              {activeTab === 'meta' && <MetaInspector meta={report.meta} />}

              {activeTab === 'headings' && (
                <HeadingsOutline headings={report.headings} />
              )}

              {activeTab === 'links' && <LinksTable links={report.links} />}

              {activeTab === 'images' && (
                <ImagesInspector images={report.images} />
              )}

              {activeTab === 'wordpress' && (
                <WordPressPanel
                  wordpress={report.wordpress}
                  isHttps={report.url.startsWith('https:')}
                />
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* History Modal */}
      <AuditHistoryModal
        isOpen={showHistoryModal}
        history={history}
        currentReportId={report?.id}
        onClose={() => setShowHistoryModal(false)}
        onSelectReport={(selected) => setReport(selected)}
        onDeleteReport={handleDeleteHistory}
        onClearHistory={handleClearHistory}
      />

      {/* Settings Modal */}
      {settings && (
        <SettingsModal
          isOpen={showSettingsModal}
          settings={settings}
          onClose={() => setShowSettingsModal(false)}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  );
};
