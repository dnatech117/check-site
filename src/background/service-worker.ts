import { AuditReport, AuditSettings } from '../types/audit';

const DEFAULT_SETTINGS: AuditSettings = {
  autoAuditOnOpen: true,
  checkBrokenLinks: true,
  maxLinksToCheck: 25,
  minTitleLength: 30,
  maxTitleLength: 60,
  minDescLength: 70,
  maxDescLength: 160,
  darkMode: true
};

// Initialize settings on install
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(['sitecheck_settings', 'sitecheck_history']);
  if (!data.sitecheck_settings) {
    await chrome.storage.local.set({ sitecheck_settings: DEFAULT_SETTINGS });
  }
  if (!data.sitecheck_history) {
    await chrome.storage.local.set({ sitecheck_history: [] });
  }
  console.log('[SiteCheck] Background Service Worker initialized.');
});

// Update extension icon badge with score
export function updateBadge(score: number, criticalCount: number) {
  let badgeColor = '#10B981'; // Green
  if (criticalCount > 0 || score < 70) {
    badgeColor = '#EF4444'; // Red
  } else if (score < 90) {
    badgeColor = '#F59E0B'; // Amber
  }

  chrome.action.setBadgeText({ text: `${score}` });
  chrome.action.setBadgeBackgroundColor({ color: badgeColor });
}

// Background message listener
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Check Link Status via background fetch
  if (message.type === 'CHECK_LINK_STATUS' && message.url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    fetch(message.url, {
      method: 'HEAD',
      signal: controller.signal
    })
      .then(res => {
        clearTimeout(timeoutId);
        sendResponse({
          url: message.url,
          status: res.status,
          statusText: res.statusText,
          ok: res.ok
        });
      })
      .catch(err => {
        clearTimeout(timeoutId);
        // Fallback with GET if HEAD is rejected by server
        fetch(message.url, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'Range': 'bytes=0-100' }
        })
          .then(res => {
            sendResponse({
              url: message.url,
              status: res.status,
              statusText: res.statusText,
              ok: res.ok
            });
          })
          .catch(fallbackErr => {
            sendResponse({
              url: message.url,
              status: 'error',
              statusText: fallbackErr.name === 'AbortError' ? 'Timeout' : 'Network/CORS Error',
              ok: false
            });
          });
      });

    return true; // Keep channel open for async response
  }

  // Save audit report to storage and update badge
  if (message.type === 'SAVE_AUDIT_REPORT' && message.report) {
    const report: AuditReport = message.report;
    updateBadge(report.score, report.summary.critical);

    chrome.storage.local.get(['sitecheck_history'], (result) => {
      const history: AuditReport[] = result.sitecheck_history || [];
      // Keep last 50 reports
      const updated = [report, ...history.filter(h => h.id !== report.id)].slice(0, 50);
      chrome.storage.local.set({ sitecheck_history: updated }, () => {
        sendResponse({ success: true, count: updated.length });
      });
    });

    return true;
  }
});
