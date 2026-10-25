# SiteCheck — Website Health Checker & SEO Auditor
> **A Product by DNATech** · Chrome Extension (Manifest V3) + Standalone Intelligence Dashboard

[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript-61DAFB.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Bundler-Vite%205-646CFF.svg)](https://vitejs.dev/)

SiteCheck is an all-in-one website maintenance, broken link, image accessibility, heading hierarchy, and WordPress health auditor built specifically for developers, webmasters, and agency teams. With one click in the Chrome toolbar, SiteCheck inspects the active web page and computes a comprehensive 0–100 Health Score with actionable remediation steps.

---

## 🚀 Key Features

### 1. 🔍 Comprehensive Page Health & SEO Audit
- **Title Tag Analysis**: Validates presence and monitors optimal character limits (30–60 characters).
- **Meta Description Gauge**: Identifies missing descriptions and flags short (<70) or truncated (>160) content.
- **Canonical URL Audit**: Ensures canonical links are defined, absolute, and self-referencing to prevent duplicate content.
- **Robots Directives**: Warns against accidental `noindex` or `nofollow` tags on production pages.
- **Social Open Graph & Twitter Cards**: Inspects `og:title`, `og:description`, `og:image`, and renders a live social card preview.

### 2. 🌲 Heading Architecture & Hierarchy Tree
- Extracts the document's heading structure (`H1` through `H6`).
- Identifies **missing primary `H1` tags**, multiple `H1` occurrences, or empty heading tags.
- Detects **skipped heading hierarchy** (e.g., jumping from `H1` directly to `H3` without an `H2`).
- **Interactive Highlighting**: Click the Eye icon on any heading to smoothly scroll and highlight the element directly on the active webpage with a glowing neon indicator.

### 3. 🖼️ Image Accessibility & Media Inspector
- Detects missing `alt` attributes violating WCAG 2.1 accessibility standards.
- Flags **broken images** (`naturalWidth === 0` or failed HTTP requests).
- Displays natural vs. rendered pixel dimensions to help prevent Cumulative Layout Shift (CLS).
- Visual thumbnail preview with direct element locator.

### 4. 🔗 Link Health & Broken Link Scanner
- Scans all internal and external hyperlinks on the page.
- Identifies links with generic or empty anchor text (e.g., "click here", "read more").
- Flags external links with `target="_blank"` missing `rel="noopener noreferrer"` (reverse tab-nabbing security vulnerability).
- Asynchronous status pinging via extension service worker to identify HTTP 404 Not Found errors.

### 5. 🛡️ WordPress Intelligence & Security Hardening
- Automatic detection of WordPress core asset paths (`/wp-content/`, `/wp-includes/`, `/wp-json/`).
- Discovers exposed WordPress version numbers in public `<meta name="generator">` tags.
- Detects active theme signatures and common plugins (Elementor, WooCommerce, Yoast SEO, Rank Math, Contact Form 7, WP Rocket, Divi, etc.).
- WordPress hardening checklist with recommendations to conceal generator tags.

### 6. 📊 Reports, History & Multi-Format Exports
- **CSV Export**: Downloads a clean, RFC 4180-compliant spreadsheet of all issues, selectors, severity, and recommendations.
- **JSON Export**: Exports raw audit telemetry and metadata for automated CI/CD integration.
- **Print / PDF View**: Clean, formatted print layout for client deliverables.
- **Audit History**: Automatically saves reports in `chrome.storage.local` with timestamps and domain history.

---

## 📦 How to Load in Google Chrome

1. Build the production extension bundle:
   ```bash
   npm run build
   ```
   *(This outputs the compiled extension to the `dist/` directory).*

2. Open Google Chrome and navigate to:
   ```
   chrome://extensions/
   ```

3. In the top-right corner, enable **Developer mode** toggle.

4. Click the **Load unpacked** button in the top-left toolbar.

5. Select the **`dist`** folder inside this project directory (`byd/dist`).

6. The **SiteCheck — Website Health Checker** icon will appear in your Chrome toolbar! Pin it for quick access.

---

## 💻 Local Development & Preview Mode

You can also run SiteCheck in standalone web preview mode with live reload:

```bash
# Start Vite development server
npm run dev
```

- Open **`http://localhost:5173/`** to view and test the Toolbar Popup interface with simulated audits.
- Open **`http://localhost:5173/dashboard.html`** to explore the Full-Screen Intelligence Dashboard.

---

## 🛠️ Architecture & Folder Structure

```
byd/
├── dist/                          # Production Chrome Extension build
│   ├── manifest.json              # Chrome Manifest V3 declaration
│   ├── popup.html                 # Toolbar popup HTML
│   ├── dashboard.html             # Full tab report HTML
│   ├── background.js              # Service worker (link checks & badges)
│   ├── content.js                 # Content script (DOM inspection & highlight)
│   └── assets/                    # Bundled scripts & Tailwind CSS
├── public/
│   ├── manifest.json              # Source extension manifest
│   └── icons/                     # 16px, 48px, 128px and logo assets
├── src/
│   ├── background/
│   │   └── service-worker.ts      # Extension background worker & link status ping
│   ├── content/
│   │   └── audit.ts               # Content script DOM inspection engine
│   ├── components/
│   │   ├── Header.tsx             # Brand header with export & settings controls
│   │   ├── ScoreGauge.tsx         # Circular SVG health telemetry dial
│   │   ├── AuditSummaryCards.tsx  # Critical/Warning/Notice/Passed filter pills
│   │   ├── IssueItem.tsx          # Collapsible issue card with page highlighter
│   │   ├── HeadingsOutline.tsx    # H1-H6 semantic tree viewer
│   │   ├── LinksTable.tsx         # Hyperlink health, search, & status table
│   │   ├── ImagesInspector.tsx    # Media thumbnail grid & alt text validator
│   │   ├── WordPressPanel.tsx     # CMS version, theme, & plugin intelligence
│   │   ├── MetaInspector.tsx      # Title & description length bars + OG preview
│   │   ├── AuditHistoryModal.tsx  # Timeline log of past domain audits
│   │   └── SettingsModal.tsx      # Custom threshold configuration modal
│   ├── dashboard/
│   │   ├── DashboardApp.tsx       # Full-screen report analytics view
│   │   └── main.tsx               # Dashboard entry point
│   ├── popup/
│   │   ├── App.tsx                # Main toolbar popup application
│   │   └── main.tsx               # Popup entry point
│   ├── lib/
│   │   ├── export.ts              # CSV, JSON, and Print export helpers
│   │   ├── messaging.ts           # chrome.tabs & chrome.scripting communications
│   │   ├── mockData.ts            # Realistic simulation data for dev mode
│   │   └── storage.ts             # chrome.storage.local persistence with fallback
│   ├── types/
│   │   └── audit.ts               # Core TypeScript definitions & schemas
│   └── index.css                  # Tailwind directives & glassmorphic styling
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🔒 Permissions, Privacy & Terms

SiteCheck requires only minimal, user-initiated permissions in its `manifest.json`:
- `activeTab`: To inspect the DOM of only the current page when you open the popup.
- `scripting`: To inject the audit analyzer and highlighter dynamically into the active tab.
- `storage`: To persist audit history and custom user thresholds locally on your device in `chrome.storage.local`.

*SiteCheck sends zero tracking telemetry to external servers. All diagnostics run locally on your machine.*

- **Official Privacy Policy**: [PRIVACY_POLICY.md](file:///c:/Users/DELL/Desktop/byd/PRIVACY_POLICY.md) (or view online at [privacy.html](file:///c:/Users/DELL/Desktop/byd/privacy.html))
- **Terms of Service**: [TERMS.md](file:///c:/Users/DELL/Desktop/byd/TERMS.md)

---
*Created with ❤️ by DNATech*

