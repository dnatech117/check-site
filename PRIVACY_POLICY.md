# Privacy Policy for SiteCheck — Website Health Checker

**Last Updated:** October 25, 2026  
**Developer:** DNATech ([https://github.com/dnatech117/check-site](https://github.com/dnatech117/check-site))  
**Product:** SiteCheck Chrome Extension

---

## 1. Overview and Commitment to Privacy

DNATech ("we", "our", or "us") is dedicated to protecting your privacy. **SiteCheck — Website Health Checker** is designed from the ground up as a **client-side, local-first utility**. 

We do **not** collect, sell, monetize, transmit, or store your personal data, browsing history, or website audit reports on any external servers. All diagnostics and audits are conducted locally inside your browser.

---

## 2. Information We Handle and How It Is Used

### 2.1 Web Page Content (Local DOM Inspection)
When you open SiteCheck on an active browser tab, the extension temporarily reads the Document Object Model (DOM) of that specific page to perform technical audits:
- **Metadata**: Title tag, meta description, canonical URL, robots indexing directives, OpenGraph, and Twitter tags.
- **Heading Structure**: `H1`–`H6` tag hierarchy and semantic outline.
- **Images and Media**: Image source paths, `alt` text presence, and natural vs. rendered dimensions.
- **Hyperlinks**: Anchor text, destination URLs, internal/external categorization, and `target` attributes.
- **CMS Indicators**: Publicly exposed WordPress meta tags, asset paths, and plugin signatures.

> **Important**: This inspection occurs entirely in-memory on your local machine. No page content, HTML, or code is ever transmitted to DNATech or any third party.

### 2.2 Local Storage (`chrome.storage.local`)
SiteCheck uses Chrome's built-in `chrome.storage.local` API exclusively to save:
1. **User Preferences**: Your custom SEO threshold limits (e.g., minimum and maximum title lengths, link test limits, auto-audit toggle).
2. **Audit History Log**: Prior audit results (URLs, health scores, timestamp, and issue lists) so you can review previous scans and observe progress over time.

This data remains strictly on your local device and is never synced to external cloud databases.

---

## 3. Chrome Web Store Permissions Explained

In compliance with the Chrome Web Store Minimal Permissions Policy, SiteCheck requests only the essential permissions required to deliver its core functionality:

| Permission | Purpose |
| :--- | :--- |
| `activeTab` | Grants temporary access to inspect the DOM of the active website **only when you explicitly click** the SiteCheck extension icon. It does not provide continuous or background browsing tracking. |
| `scripting` | Allows the extension to inject the lightweight audit script and visual element highlighter into the active tab upon user request. |
| `storage` | Enables saving your audit history and configuration settings locally on your computer via `chrome.storage.local`. |

SiteCheck **does not** request broad `<all_urls>` host permissions, identity permissions, cookie permissions, or browsing history access.

---

## 4. Third-Party Services and Analytics

- **No Analytics / Telemetry**: SiteCheck does not bundle Google Analytics, Mixpanel, or any tracking SDKs.
- **No Remote Code Execution**: All JavaScript and styles are packaged locally within the extension bundle in strict compliance with Chrome Manifest V3 regulations.
- **No Third-Party Data Sharing**: We do not sell, rent, or trade your data to advertisers, data brokers, or third parties.

---

## 5. User Data Control and Deletion

You maintain complete ownership and control over your audit history and data:
- **Clear History**: You can delete individual audit records or clear your entire audit log at any time directly inside the extension by clicking **"Clear Logs"** in the History modal.
- **Uninstalling**: Uninstalling SiteCheck from Google Chrome immediately removes all locally stored extension data and preferences from your browser.

---

## 6. Children's Online Privacy Protection

SiteCheck is a professional developer and webmaster tool. We do not knowingly collect or solicit personal information from children under the age of 13.

---

## 7. Changes to This Privacy Policy

We may update this Privacy Policy periodically to reflect new extension capabilities or regulatory requirements. Any modifications will be posted to our official GitHub repository with an updated revision date.

---

## 8. Contact Us

If you have any questions, feedback, or concerns regarding this Privacy Policy or your data, please contact us:
- **Project Repository**: [https://github.com/dnatech117/check-site](https://github.com/dnatech117/check-site)
- **Organization**: DNATech
