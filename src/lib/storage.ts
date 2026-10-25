import { AuditReport, AuditSettings } from '../types/audit';

export const DEFAULT_SETTINGS: AuditSettings = {
  autoAuditOnOpen: true,
  checkBrokenLinks: true,
  maxLinksToCheck: 25,
  minTitleLength: 30,
  maxTitleLength: 60,
  minDescLength: 70,
  maxDescLength: 160,
  darkMode: true,
};

const isExtensionEnv = typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);

export async function getSettings(): Promise<AuditSettings> {
  if (isExtensionEnv) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['sitecheck_settings'], (result) => {
        resolve({ ...DEFAULT_SETTINGS, ...(result.sitecheck_settings || {}) });
      });
    });
  }

  const stored = localStorage.getItem('sitecheck_settings');
  return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
}

export async function saveSettings(settings: AuditSettings): Promise<void> {
  if (isExtensionEnv) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ sitecheck_settings: settings }, () => resolve());
    });
  }

  localStorage.setItem('sitecheck_settings', JSON.stringify(settings));
}

export async function getAuditHistory(): Promise<AuditReport[]> {
  if (isExtensionEnv) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['sitecheck_history'], (result) => {
        resolve(result.sitecheck_history || []);
      });
    });
  }

  const stored = localStorage.getItem('sitecheck_history');
  return stored ? JSON.parse(stored) : [];
}

export async function saveAuditReport(report: AuditReport): Promise<void> {
  const currentHistory = await getAuditHistory();
  const updated = [report, ...currentHistory.filter(h => h.id !== report.id)].slice(0, 50);

  if (isExtensionEnv) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ sitecheck_history: updated }, () => {
        try {
          chrome.runtime.sendMessage({ type: 'SAVE_AUDIT_REPORT', report }, () => {
            if (chrome.runtime.lastError) {
              // Background worker might be idle; ignore harmless port error
            }
          });
        } catch {
          // Extension context might be invalid
        }
        resolve();
      });
    });
  }

  localStorage.setItem('sitecheck_history', JSON.stringify(updated));
}

export async function clearAuditHistory(): Promise<void> {
  if (isExtensionEnv) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ sitecheck_history: [] }, () => resolve());
    });
  }

  localStorage.removeItem('sitecheck_history');
}

export async function deleteReportById(id: string): Promise<void> {
  const current = await getAuditHistory();
  const updated = current.filter(r => r.id !== id);

  if (isExtensionEnv) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ sitecheck_history: updated }, () => resolve());
    });
  }

  localStorage.setItem('sitecheck_history', JSON.stringify(updated));
}
