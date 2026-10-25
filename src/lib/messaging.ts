import { AuditReport, AuditSettings } from '../types/audit';
import { MOCK_AUDIT_REPORT } from './mockData';

export const isExtension = typeof chrome !== 'undefined' && Boolean(chrome.tabs && chrome.runtime?.id);

export async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  if (!isExtension) return null;
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] || null;
}

export async function requestAudit(settings?: Partial<AuditSettings>): Promise<AuditReport> {
  if (!isExtension) {
    // Simulated browser development mode
    await new Promise(r => setTimeout(r, 650));
    return {
      ...MOCK_AUDIT_REPORT,
      id: `audit-${Date.now()}`,
      timestamp: Date.now(),
    };
  }

  const tab = await getActiveTab();
  if (!tab || !tab.id) {
    throw new Error('No active browser tab found to audit.');
  }

  if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://') || tab.url?.startsWith('edge://') || tab.url?.startsWith('about:')) {
    throw new Error('Chrome extension cannot inspect internal browser pages (chrome://). Please navigate to an active HTTP/HTTPS website.');
  }

  try {
    // Try sending message directly to existing content script
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'RUN_AUDIT',
      options: settings
    });

    if (response?.report) {
      return response.report;
    }
  } catch (_e) {
    // Content script not yet injected into this tab, inject dynamically
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      // Small delay for script registration
      await new Promise(r => setTimeout(r, 150));

      const retryResponse = await chrome.tabs.sendMessage(tab.id, {
        type: 'RUN_AUDIT',
        options: settings
      });

      if (retryResponse?.report) {
        return retryResponse.report;
      }
    } catch (injectError: any) {
      throw new Error(`Failed to inspect page: ${injectError?.message || 'Access denied'}`);
    }
  }

  throw new Error('Audit engine did not return a valid report.');
}

export async function highlightElementOnTab(selector: string): Promise<void> {
  if (!isExtension) {
    console.log('[Dev Mode] Highlight requested for selector:', selector);
    return;
  }

  const tab = await getActiveTab();
  if (tab?.id) {
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'HIGHLIGHT_ELEMENT',
        selector
      });
    } catch (err) {
      console.warn('Could not highlight element on page:', err);
    }
  }
}

export function openFullDashboard(): void {
  if (isExtension) {
    const dashboardUrl = chrome.runtime.getURL('dashboard.html');
    chrome.tabs.create({ url: dashboardUrl });
  } else {
    window.open('/dashboard.html', '_blank');
  }
}
