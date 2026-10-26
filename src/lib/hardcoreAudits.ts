import {
  AuditIssue,
  SecurityDetails,
  SecurityHeaderCheck,
  LeakedSecretItem,
  WebVitalsDetails,
  LcpDiagnostic,
  ClsRiskItem,
  SchemaDetails,
  SchemaItem,
  AccessibilityDetails,
  ContrastIssueItem,
  TouchTargetIssueItem,
  FormAccessibilityItem,
  TechStackDetails,
  TechStackItem,
} from '../types/audit';

// ----------------------------------------------------
// 1. Color Contrast & WCAG Luminance Math
// ----------------------------------------------------
function parseColorToRgb(colorStr: string): [number, number, number] | null {
  if (!colorStr) return null;
  // Handle rgb(r, g, b) / rgba(r, g, b, a)
  const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    return [parseInt(rgbMatch[1], 10), parseInt(rgbMatch[2], 10), parseInt(rgbMatch[3], 10)];
  }
  // Handle hex (#fff, #ffffff)
  if (colorStr.startsWith('#')) {
    let hex = colorStr.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    if (hex.length >= 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return [r, g, b];
    }
  }
  return null;
}

function calculateRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map(val => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function calculateContrastRatio(foreground: string, background: string): number {
  const fgRgb = parseColorToRgb(foreground);
  const bgRgb = parseColorToRgb(background);
  if (!fgRgb || !bgRgb) return 21; // Default pass if unparseable

  const l1 = calculateRelativeLuminance(fgRgb[0], fgRgb[1], fgRgb[2]);
  const l2 = calculateRelativeLuminance(bgRgb[0], bgRgb[1], bgRgb[2]);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 10) / 10;
}

// ----------------------------------------------------
// 2. Secret & Leaked API Keys Scanner
// ----------------------------------------------------
const SECRET_PATTERNS: Array<{
  type: string;
  regex: RegExp;
  severity: 'critical' | 'warning';
  description: string;
}> = [
  {
    type: 'AWS Access Key',
    regex: /\b(AKIA[0-9A-Z]{16})\b/g,
    severity: 'critical',
    description: 'Active AWS Access Key ID detected. Anyone with this key can access connected AWS infrastructure.',
  },
  {
    type: 'Stripe Secret Key',
    regex: /\b(sk_live_[0-9a-zA-Z]{24,})\b/g,
    severity: 'critical',
    description: 'Live Stripe Secret API Key leaked in frontend code. Exposes financial charges and customer data.',
  },
  {
    type: 'GitHub Personal Token',
    regex: /\b(ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82})\b/g,
    severity: 'critical',
    description: 'GitHub Personal Access Token found. Grants unauthorized git commit or repository reading access.',
  },
  {
    type: 'OpenAI Secret Key',
    regex: /\b(sk-[a-zA-Z0-9]{20,T3BlbkFJ[a-zA-Z0-9]{20,}|sk-proj-[a-zA-Z0-9_\-]{40,})\b/g,
    severity: 'critical',
    description: 'OpenAI API key detected in client code. Can lead to account balance draining and unauthorized inference.',
  },
  {
    type: 'Google / Firebase API Key',
    regex: /\b(AIza[0-9A-Za-z\-_]{35})\b/g,
    severity: 'warning',
    description: 'Google Cloud or Firebase Web API key exposed. Verify API key restrictions in Google Cloud Console.',
  },
  {
    type: 'Slack Bot / Webhook Token',
    regex: /\b(xox[baprs]-[0-9a-zA-Z]{10,48})\b/g,
    severity: 'critical',
    description: 'Slack token discovered. Allows unauthorized message posting or workspace reading.',
  },
  {
    type: 'Private RSA / SSH Key',
    regex: /-----BEGIN (?:RSA|EC|OPENSSH|DSA)? PRIVATE KEY-----[\s\S]*?-----END/g,
    severity: 'critical',
    description: 'Raw cryptographic private key embedded in source code!',
  },
];

export function scanForLeakedSecrets(html: string): LeakedSecretItem[] {
  const secrets: LeakedSecretItem[] = [];
  const seenMatches = new Set<string>();

  for (const item of SECRET_PATTERNS) {
    const matches = Array.from(html.matchAll(item.regex));
    for (const match of matches) {
      const full = match[1] || match[0];
      if (seenMatches.has(full)) continue;
      seenMatches.add(full);

      // Mask secret for secure display
      const preview = full.length > 10
        ? `${full.substring(0, 6)}...${full.substring(full.length - 4)}`
        : '***SECRET***';

      secrets.push({
        id: `secret-${secrets.length + 1}`,
        type: item.type,
        preview,
        location: 'Embedded Script / HTML Source',
        severity: item.severity,
      });

      if (secrets.length >= 10) break; // Avoid memory explosion
    }
  }

  return secrets;
}

// ----------------------------------------------------
// 3. Security Headers Evaluation
// ----------------------------------------------------
export function evaluateSecurityHeaders(
  headerMap: Record<string, string | null>,
  html: string
): { headers: SecurityHeaderCheck[]; issues: AuditIssue[] } {
  const issues: AuditIssue[] = [];
  const checks: SecurityHeaderCheck[] = [];

  // Content-Security-Policy (CSP)
  const cspHeader = headerMap['content-security-policy'] || null;
  const cspMetaMatch = html.match(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*content=["']([^"']+)["']/i);
  const cspValue = cspHeader || (cspMetaMatch ? cspMetaMatch[1] : null);

  if (cspValue) {
    const isWeak = cspValue.includes("'unsafe-inline'") || cspValue.includes("'unsafe-eval'") || cspValue.includes('*');
    checks.push({
      name: 'Content-Security-Policy',
      value: cspValue.length > 80 ? cspValue.substring(0, 77) + '...' : cspValue,
      status: isWeak ? 'weak' : 'enforced',
      details: isWeak ? 'CSP present but allows unsafe-inline, unsafe-eval or wildcard domains.' : 'Strong Content-Security-Policy is active.',
    });
    if (isWeak) {
      issues.push({
        id: 'sec-weak-csp',
        category: 'security',
        severity: 'warning',
        title: 'Weak Content Security Policy (CSP)',
        description: 'CSP directive includes "unsafe-inline" or wildcard origins, weakening XSS defense.',
        recommendation: 'Use cryptographic nonces (nonce-*) or hashes (sha256-*) instead of "unsafe-inline".',
        context: cspValue.substring(0, 100),
        scoreImpact: 3,
      });
    } else {
      issues.push({
        id: 'sec-strong-csp',
        category: 'security',
        severity: 'good',
        title: 'Strict Content-Security-Policy Active',
        description: 'Site restricts resource loading origins against cross-site scripting (XSS).',
        recommendation: 'Periodically monitor CSP report-uri/report-to endpoints for violations.',
        scoreImpact: 0,
      });
    }
  } else {
    checks.push({
      name: 'Content-Security-Policy',
      value: null,
      status: 'missing',
      details: 'Missing CSP header. Browser cannot restrict malicious script injections.',
    });
    issues.push({
      id: 'sec-missing-csp',
      category: 'security',
      severity: 'warning',
      title: 'Missing Content-Security-Policy (CSP)',
      description: 'No Content-Security-Policy header or meta tag found, leaving the site vulnerable to cross-site scripting (XSS).',
      recommendation: "Add a Content-Security-Policy response header with default-src 'self'.",
      scoreImpact: 5,
    });
  }

  // Strict-Transport-Security (HSTS)
  const hsts = headerMap['strict-transport-security'] || null;
  if (hsts) {
    const hasSubdomains = hsts.includes('includeSubDomains');
    checks.push({
      name: 'Strict-Transport-Security (HSTS)',
      value: hsts,
      status: 'enforced',
      details: `Enforced HTTPS transport${hasSubdomains ? ' (with includeSubDomains)' : ''}.`,
    });
    issues.push({
      id: 'sec-hsts-ok',
      category: 'security',
      severity: 'good',
      title: 'Strict-Transport-Security (HSTS) Active',
      description: 'Forces modern browsers to only connect via secure HTTPS.',
      recommendation: 'Consider adding preload directive for HSTS preload list inclusion.',
      scoreImpact: 0,
    });
  } else {
    checks.push({
      name: 'Strict-Transport-Security (HSTS)',
      value: null,
      status: 'missing',
      details: 'Missing HSTS header. Users could be vulnerable to SSL stripping attacks.',
    });
    issues.push({
      id: 'sec-missing-hsts',
      category: 'security',
      severity: 'warning',
      title: 'Missing HSTS Header',
      description: 'HTTP Strict Transport Security is not configured. Browsers may downgrade to insecure HTTP.',
      recommendation: 'Add header: Strict-Transport-Security: max-age=31536000; includeSubDomains.',
      scoreImpact: 4,
    });
  }

  // X-Frame-Options (Clickjacking)
  const xfo = headerMap['x-frame-options'] || null;
  if (xfo) {
    checks.push({
      name: 'X-Frame-Options',
      value: xfo,
      status: 'enforced',
      details: `Framing restricted via ${xfo}.`,
    });
  } else if (!cspValue?.includes('frame-ancestors')) {
    checks.push({
      name: 'X-Frame-Options',
      value: null,
      status: 'missing',
      details: 'Missing X-Frame-Options and frame-ancestors. Site may be framed in clickjacking attacks.',
    });
    issues.push({
      id: 'sec-clickjacking',
      category: 'security',
      severity: 'warning',
      title: 'Potential Clickjacking Vulnerability',
      description: 'Missing X-Frame-Options or CSP frame-ancestors. Malicious sites can embed this page in an iframe to trick users.',
      recommendation: 'Set X-Frame-Options: SAMEORIGIN or DENY, or CSP frame-ancestors directive.',
      scoreImpact: 4,
    });
  }

  // X-Content-Type-Options (MIME Sniffing)
  const xcto = headerMap['x-content-type-options'] || null;
  if (xcto && xcto.toLowerCase().includes('nosniff')) {
    checks.push({
      name: 'X-Content-Type-Options',
      value: 'nosniff',
      status: 'enforced',
      details: 'MIME type sniffing disabled.',
    });
  } else {
    checks.push({
      name: 'X-Content-Type-Options',
      value: null,
      status: 'missing',
      details: 'Missing nosniff flag. Browsers may interpret non-script assets as executable scripts.',
    });
    issues.push({
      id: 'sec-missing-nosniff',
      category: 'security',
      severity: 'notice',
      title: 'Missing X-Content-Type-Options: nosniff',
      description: 'Without this header, older browsers might execute files based on content rather than MIME type.',
      recommendation: 'Add header: X-Content-Type-Options: nosniff.',
      scoreImpact: 1,
    });
  }

  // Referrer-Policy
  const refPol = headerMap['referrer-policy'] || null;
  const refMetaMatch = html.match(/<meta[^>]*name=["']referrer["'][^>]*content=["']([^"']+)["']/i);
  const refValue = refPol || (refMetaMatch ? refMetaMatch[1] : null);
  if (refValue) {
    checks.push({
      name: 'Referrer-Policy',
      value: refValue,
      status: 'enforced',
      details: `Active policy: ${refValue}.`,
    });
  } else {
    checks.push({
      name: 'Referrer-Policy',
      value: null,
      status: 'missing',
      details: 'Default browser referrer policy applies. Sensitive URL query parameters might leak.',
    });
    issues.push({
      id: 'sec-missing-referrer-policy',
      category: 'security',
      severity: 'notice',
      title: 'Missing Explicit Referrer-Policy',
      description: 'No explicit Referrer-Policy defined. Outbound links may expose internal URL query parameters.',
      recommendation: 'Add Referrer-Policy: strict-origin-when-cross-origin.',
      scoreImpact: 1,
    });
  }

  // Permissions-Policy
  const permPol = headerMap['permissions-policy'] || null;
  checks.push({
    name: 'Permissions-Policy',
    value: permPol,
    status: permPol ? 'enforced' : 'missing',
    details: permPol ? 'Browser device features restricted.' : 'Permissions-Policy not configured.',
  });

  return { headers: checks, issues };
}

// ----------------------------------------------------
// 4. Core Web Vitals Diagnostics (LCP, CLS, Blocking)
// ----------------------------------------------------
export function evaluateWebVitals(
  doc: Document | null,
  html: string
): { vitals: WebVitalsDetails; issues: AuditIssue[] } {
  const issues: AuditIssue[] = [];
  const clsRisks: ClsRiskItem[] = [];

  // LCP Hero Image Candidate
  let candidateSelector: string | undefined;
  let candidateTag: string | undefined;
  let candidateSrc: string | undefined;
  let hasLazyLoading = false;
  let hasFetchPriorityHigh = false;
  let isModernFormat = true;

  if (doc) {
    // Look for hero image / prominent image in first section or header
    const candidateImg = (doc.querySelector('header img, .hero img, [class*="hero"] img, [class*="banner"] img, main img, article img') ||
      doc.querySelector('img')) as HTMLImageElement | null;

    if (candidateImg) {
      candidateSelector = candidateImg.id ? `#${candidateImg.id}` : candidateImg.className ? `img.${candidateImg.className.split(' ')[0]}` : 'img';
      candidateTag = 'img';
      candidateSrc = candidateImg.getAttribute('src') || candidateImg.src;
      hasLazyLoading = candidateImg.getAttribute('loading')?.toLowerCase() === 'lazy';
      hasFetchPriorityHigh = candidateImg.getAttribute('fetchpriority')?.toLowerCase() === 'high';
      
      const srcLower = (candidateSrc || '').toLowerCase();
      isModernFormat = srcLower.includes('.webp') || srcLower.includes('.avif') || srcLower.includes('data:image/svg');

      if (hasLazyLoading) {
        issues.push({
          id: 'vitals-lcp-lazy',
          category: 'vitals',
          severity: 'critical',
          title: 'LCP Anti-Pattern: Hero Image is Lazy-Loaded',
          description: 'The primary candidate Largest Contentful Paint (LCP) image has loading="lazy". This delays image discovery and degrades Core Web Vitals.',
          recommendation: 'Remove loading="lazy" from the hero image and add fetchpriority="high".',
          context: candidateSrc ? candidateSrc.substring(0, 80) : undefined,
          selector: candidateSelector,
          scoreImpact: 8,
        });
      } else if (!hasFetchPriorityHigh) {
        issues.push({
          id: 'vitals-lcp-priority',
          category: 'vitals',
          severity: 'notice',
          title: 'Hero Image Missing fetchpriority="high"',
          description: 'Assigning fetchpriority="high" to your primary LCP hero image signals the browser to fetch it immediately.',
          recommendation: 'Add fetchpriority="high" to the primary above-the-fold image.',
          selector: candidateSelector,
          scoreImpact: 1,
        });
      }

      if (!isModernFormat && candidateSrc && (srcLower.includes('.png') || srcLower.includes('.jpg') || srcLower.includes('.jpeg'))) {
        issues.push({
          id: 'vitals-modern-formats',
          category: 'vitals',
          severity: 'warning',
          title: 'Hero Image Uses Legacy Format (JPEG/PNG)',
          description: 'Hero image uses legacy uncompressed JPEG/PNG instead of next-gen WebP or AVIF formats.',
          recommendation: 'Convert images to AVIF or WebP to achieve 30%–50% smaller file sizes without quality loss.',
          context: candidateSrc.substring(0, 80),
          selector: candidateSelector,
          scoreImpact: 3,
        });
      }
    }

    // CLS Risks: Missing width/height on images and iframes
    const mediaElements = Array.from(doc.querySelectorAll('img, iframe'));
    for (const el of mediaElements) {
      const hasWidth = el.hasAttribute('width') || (el as HTMLElement).style.width || (el as HTMLElement).style.aspectRatio;
      const hasHeight = el.hasAttribute('height') || (el as HTMLElement).style.height || (el as HTMLElement).style.aspectRatio;

      if (!hasWidth || !hasHeight) {
        const tag = el.tagName.toLowerCase();
        const src = el.getAttribute('src') || undefined;
        const selector = el.id ? `#${el.id}` : `${tag}${src ? `[src*="${src.split('/').pop()?.split('?')[0] || ''}"]` : ''}`;
        
        clsRisks.push({
          selector,
          tag,
          src,
          reason: `Missing explicit width or height attributes causing layout shift`,
        });
      }
    }
  } else {
    // HTML regex fallback
    const imgMatches = Array.from(html.matchAll(/<img\s+([^>]+)>/gi));
    if (imgMatches.length > 0) {
      const firstImgAttributes = imgMatches[0][1];
      hasLazyLoading = /loading=["']lazy["']/i.test(firstImgAttributes);
      hasFetchPriorityHigh = /fetchpriority=["']high["']/i.test(firstImgAttributes);
      const srcMatch = firstImgAttributes.match(/src=["']([^"']+)["']/i);
      candidateSrc = srcMatch ? srcMatch[1] : undefined;
      candidateTag = 'img';
      candidateSelector = 'img:first-of-type';

      if (hasLazyLoading) {
        issues.push({
          id: 'vitals-lcp-lazy',
          category: 'vitals',
          severity: 'critical',
          title: 'LCP Anti-Pattern: Hero Image is Lazy-Loaded',
          description: 'The primary candidate Largest Contentful Paint (LCP) image has loading="lazy". This delays image discovery.',
          recommendation: 'Remove loading="lazy" from the hero image and add fetchpriority="high".',
          scoreImpact: 8,
        });
      }
    }
  }

  if (clsRisks.length > 0) {
    issues.push({
      id: 'vitals-cls-dimensions',
      category: 'vitals',
      severity: clsRisks.length > 3 ? 'warning' : 'notice',
      title: `${clsRisks.length} Elements Missing Width/Height (CLS Risk)`,
      description: 'Images and iframes without explicit width and height attributes cause Cumulative Layout Shift (CLS) as content loads.',
      recommendation: 'Specify width and height attributes or CSS aspect-ratio on all media elements.',
      context: `${clsRisks.length} media elements affected`,
      scoreImpact: Math.min(8, clsRisks.length * 2),
    });
  }

  // Render Blocking Scripts & Stylesheets
  const renderBlockingScriptMatches = Array.from(html.matchAll(/<head[\s\S]*?<\/head>/i))[0]?.[0] || '';
  const syncScripts = Array.from(renderBlockingScriptMatches.matchAll(/<script(?![^>]*(?:async|defer|type=["']module["']))[^>]+src=["'][^"']+["'][^>]*>/gi));
  const renderBlockingScriptsCount = syncScripts.length;

  if (renderBlockingScriptsCount > 0) {
    issues.push({
      id: 'vitals-render-blocking-scripts',
      category: 'vitals',
      severity: 'warning',
      title: `${renderBlockingScriptsCount} Render-Blocking Scripts in <head>`,
      description: 'Synchronous scripts in the document <head> freeze the HTML parser until downloaded and executed.',
      recommendation: 'Add defer or async attributes, or use type="module" for modern non-blocking loading.',
      scoreImpact: Math.min(6, renderBlockingScriptsCount * 2),
    });
  }

  // Preconnect analysis
  const missingPreconnects: string[] = [];
  const externalDomains = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net'];
  for (const domain of externalDomains) {
    if (html.includes(domain)) {
      const hasPreconnect = new RegExp(`<link[^>]*rel=["']preconnect["'][^>]*href=["'][^"']*${domain}`, 'i').test(html);
      if (!hasPreconnect) {
        missingPreconnects.push(domain);
      }
    }
  }

  if (missingPreconnects.length > 0) {
    issues.push({
      id: 'vitals-missing-preconnect',
      category: 'vitals',
      severity: 'notice',
      title: `Missing Preconnect for Third-Party CDNs (${missingPreconnects.length})`,
      description: `Assets are fetched from ${missingPreconnects.join(', ')} without early DNS/TLS preconnection.`,
      recommendation: `Add <link rel="preconnect" href="https://${missingPreconnects[0]}" crossorigin> to <head>.`,
      scoreImpact: 1,
    });
  }

  const lcp: LcpDiagnostic = {
    candidateSelector,
    candidateTag,
    candidateSrc,
    hasLazyLoading,
    hasFetchPriorityHigh,
    isModernFormat,
  };

  return {
    vitals: {
      lcp,
      clsRisks,
      renderBlockingScripts: renderBlockingScriptsCount,
      renderBlockingStylesheets: 0,
      missingPreconnects,
    },
    issues,
  };
}

// ----------------------------------------------------
// 5. Schema.org / JSON-LD Deep Validator
// ----------------------------------------------------
export function evaluateSchemaOrg(
  doc: Document | null,
  html: string
): { schema: SchemaDetails; issues: AuditIssue[] } {
  const issues: AuditIssue[] = [];
  const schemaItems: SchemaItem[] = [];

  let scriptContents: string[] = [];

  if (doc) {
    const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
    scriptContents = scripts.map(s => s.textContent?.trim() || '');
  } else {
    const matches = Array.from(html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
    scriptContents = matches.map(m => m[1]?.trim() || '');
  }

  if (scriptContents.length === 0) {
    issues.push({
      id: 'schema-missing',
      category: 'schema',
      severity: 'warning',
      title: 'No Structured Data (Schema.org / JSON-LD) Detected',
      description: 'The page lacks JSON-LD structured data. Search engines cannot generate rich snippets (breadcrumbs, FAQs, organization details).',
      recommendation: 'Add schema.org JSON-LD structured data (e.g., WebSite, Organization, or Article schema).',
      scoreImpact: 4,
    });
  } else {
    for (let i = 0; i < scriptContents.length; i++) {
      const raw = scriptContents[i];
      if (!raw) continue;

      let parsed: any = null;
      let isValidJson = false;
      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        parsed = JSON.parse(raw);
        isValidJson = true;
      } catch (err: any) {
        errors.push(`Malformed JSON syntax: ${err.message}`);
      }

      let type = 'Unknown';
      let context = 'None';
      let propertiesCount = 0;

      if (parsed) {
        const root = Array.isArray(parsed) ? parsed[0] : (parsed['@graph'] ? parsed['@graph'][0] : parsed);
        type = root?.['@type'] || (Array.isArray(parsed) ? 'Array' : 'Object');
        context = root?.['@context'] || parsed?.['@context'] || 'None';

        if (!context.includes('schema.org')) {
          warnings.push('Missing or invalid @context. Expected "https://schema.org".');
        }

        if (root && typeof root === 'object') {
          propertiesCount = Object.keys(root).length;
          // Check common schema requirements
          if (type === 'Article' || type === 'BlogPosting') {
            if (!root.headline) warnings.push('Article schema recommended property "headline" is missing.');
            if (!root.author) warnings.push('Article schema recommended property "author" is missing.');
            if (!root.datePublished) warnings.push('Article schema recommended property "datePublished" is missing.');
          } else if (type === 'Organization' || type === 'WebSite') {
            if (!root.name) warnings.push(`${type} schema recommended property "name" is missing.`);
            if (!root.url) warnings.push(`${type} schema recommended property "url" is missing.`);
          }
        }
      }

      schemaItems.push({
        id: `schema-${i + 1}`,
        type,
        context,
        rawJson: raw,
        isValidJson,
        errors,
        warnings,
        propertiesCount,
      });

      if (!isValidJson) {
        issues.push({
          id: `schema-syntax-error-${i}`,
          category: 'schema',
          severity: 'critical',
          title: `Syntax Error in JSON-LD Schema #${i + 1}`,
          description: `Search engines failed to parse this structured data: ${errors.join(', ')}`,
          recommendation: 'Fix JSON formatting syntax (quotes, trailing commas, braces).',
          scoreImpact: 5,
        });
      } else if (warnings.length > 0) {
        issues.push({
          id: `schema-warning-${i}`,
          category: 'schema',
          severity: 'notice',
          title: `Schema "${type}" Missing Recommended Properties`,
          description: warnings.join(' '),
          recommendation: 'Add the missing recommended fields for maximum rich search appearance.',
          scoreImpact: 1,
        });
      }
    }

    if (schemaItems.some(s => s.isValidJson && s.errors.length === 0)) {
      issues.push({
        id: 'schema-valid-found',
        category: 'schema',
        severity: 'good',
        title: `Valid Schema.org Structured Data (${schemaItems.length} schemas)`,
        description: `Successfully validated JSON-LD schema definitions: ${schemaItems.map(s => s.type).join(', ')}.`,
        recommendation: 'Test with Google Rich Results Test for preview verification.',
        scoreImpact: 0,
      });
    }
  }

  const validCount = schemaItems.filter(s => s.isValidJson && s.errors.length === 0).length;
  const invalidCount = schemaItems.filter(s => !s.isValidJson || s.errors.length > 0).length;

  return {
    schema: {
      totalSchemas: schemaItems.length,
      validCount,
      invalidCount,
      items: schemaItems,
    },
    issues,
  };
}

// ----------------------------------------------------
// 6. WCAG 2.2 Accessibility & Contrast Audit
// ----------------------------------------------------
export function evaluateAccessibility(
  doc: Document | null,
  html: string
): { accessibility: AccessibilityDetails; issues: AuditIssue[] } {
  const issues: AuditIssue[] = [];
  const contrastIssues: ContrastIssueItem[] = [];
  const touchTargetIssues: TouchTargetIssueItem[] = [];
  const formIssues: FormAccessibilityItem[] = [];

  // 1. HTML lang attribute
  let htmlLang: string | null = null;
  if (doc) {
    htmlLang = doc.documentElement.getAttribute('lang');
  } else {
    const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
    htmlLang = langMatch ? langMatch[1] : null;
  }

  const isLangValid = Boolean(htmlLang && htmlLang.trim().length >= 2);

  if (!isLangValid) {
    issues.push({
      id: 'a11y-missing-lang',
      category: 'accessibility',
      severity: 'critical',
      title: 'Missing or Invalid <html lang="..."> Attribute',
      description: 'Screen readers require the document language attribute to pronounce words and synthesize speech accurately.',
      recommendation: 'Add lang="en" (or your appropriate language code) to the <html> tag.',
      scoreImpact: 6,
    });
  } else {
    issues.push({
      id: 'a11y-lang-ok',
      category: 'accessibility',
      severity: 'good',
      title: `Valid Document Language Declared ("${htmlLang}")`,
      description: 'Document specifies a valid IETF BCP 47 language code for assistive technologies.',
      recommendation: 'Ensure multi-language subsections declare local lang attributes.',
      scoreImpact: 0,
    });
  }

  // 2. Viewport zoom disabled check
  const viewportMatch = html.match(/<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']+)["']/i);
  const viewportContent = viewportMatch ? viewportMatch[1] : '';
  const hasViewportZoomDisabled = /user-scalable\s*=\s*no/i.test(viewportContent) || /maximum-scale\s*=\s*1(?:\.0)?\b/i.test(viewportContent);

  if (hasViewportZoomDisabled) {
    issues.push({
      id: 'a11y-zoom-disabled',
      category: 'accessibility',
      severity: 'critical',
      title: 'Pinch-to-Zoom Disabled in Viewport Meta',
      description: 'Viewport meta tag contains user-scalable=no or maximum-scale=1. This prevents visually impaired users from magnifying page text.',
      recommendation: 'Allow user zooming: remove user-scalable=no and maximum-scale=1 from the viewport meta tag.',
      scoreImpact: 8,
    });
  }

  // 3. Skip link check
  const hasSkipLink = /<a[^>]+href=["']#(?:main|content|main-content)["'][^>]*>/i.test(html) ||
                      html.toLowerCase().includes('skip to content') ||
                      html.toLowerCase().includes('skip to main content');

  if (!hasSkipLink) {
    issues.push({
      id: 'a11y-skip-link',
      category: 'accessibility',
      severity: 'notice',
      title: 'Missing "Skip to Main Content" Bypass Link',
      description: 'Keyboard and screen reader users must tab through the entire navigation bar before reaching main content.',
      recommendation: 'Add a visually hidden, keyboard-focusable skip link at the top of the body: <a href="#main" class="skip-link">Skip to content</a>.',
      scoreImpact: 2,
    });
  }

  // 4. Form inputs missing labels
  if (doc) {
    const inputs = Array.from(doc.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select'));
    for (const input of inputs) {
      const id = input.getAttribute('id');
      const hasAssociatedLabel = id ? Boolean(doc.querySelector(`label[for="${id}"]`)) : false;
      const hasParentLabel = Boolean(input.closest('label'));
      const hasAriaLabel = Boolean(input.getAttribute('aria-label') || input.getAttribute('aria-labelledby'));
      const hasTitle = Boolean(input.getAttribute('title'));

      if (!hasAssociatedLabel && !hasParentLabel && !hasAriaLabel && !hasTitle) {
        const selector = id ? `#${id}` : `input[name="${input.getAttribute('name') || ''}"]`;
        formIssues.push({
          selector,
          tag: input.tagName.toLowerCase(),
          type: input.getAttribute('type') || undefined,
          missingLabel: true,
        });
      }
    }

    if (formIssues.length > 0) {
      issues.push({
        id: 'a11y-missing-form-labels',
        category: 'accessibility',
        severity: 'critical',
        title: `${formIssues.length} Form Inputs Missing Accessible Labels`,
        description: 'Interactive form fields must have an associated <label>, aria-label, or aria-labelledby for screen reader identification.',
        recommendation: 'Add <label for="inputId"> or aria-label="..." to each input element.',
        scoreImpact: Math.min(10, formIssues.length * 3),
      });
    }

    // 5. Live DOM Color Contrast & Touch Target Check (Running in browser extension context)
    try {
      // Check visible text elements
      const sampleTextEls = Array.from(doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, a, button, span')).slice(0, 40);
      for (const el of sampleTextEls) {
        const text = el.textContent?.trim();
        if (!text || text.length < 3) continue;

        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

        const fg = style.color;
        let bg = style.backgroundColor;

        // Traverse up if background is transparent
        let parent: HTMLElement | null = el.parentElement;
        while ((!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') && parent) {
          bg = window.getComputedStyle(parent).backgroundColor;
          parent = parent.parentElement;
        }
        if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
          bg = 'rgb(255, 255, 255)'; // Assume white default background
        }

        const fontSize = parseFloat(style.fontSize) || 16;
        const fontWeight = parseInt(style.fontWeight, 10) || 400;
        const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
        const requiredRatio = isLargeText ? 3.0 : 4.5;

        const ratio = calculateContrastRatio(fg, bg);
        const passesAA = ratio >= requiredRatio;

        if (!passesAA && contrastIssues.length < 8) {
          const selector = el.id ? `#${el.id}` : el.className ? `${el.tagName.toLowerCase()}.${el.className.split(' ')[0]}` : el.tagName.toLowerCase();
          contrastIssues.push({
            selector,
            text: text.length > 40 ? text.substring(0, 37) + '...' : text,
            textColor: fg,
            backgroundColor: bg,
            contrastRatio: ratio,
            requiredRatio,
            isLargeText,
            passesAA: false,
          });
        }
      }

      // Check Touch Targets (< 24x24 px WCAG 2.2 AA)
      const interactiveEls = Array.from(doc.querySelectorAll('a, button, input[type="button"], input[type="submit"]')).slice(0, 30);
      for (const el of interactiveEls) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && (rect.width < 24 || rect.height < 24)) {
          const tag = el.tagName.toLowerCase();
          const selector = el.id ? `#${el.id}` : `${tag}.${el.className.split(' ')[0] || ''}`;
          touchTargetIssues.push({
            selector,
            tag,
            text: el.textContent?.trim().substring(0, 25) || '',
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        }
      }
    } catch {
      // getComputedStyle may not be available in synthetic headless environments
    }

    if (contrastIssues.length > 0) {
      issues.push({
        id: 'a11y-contrast-failures',
        category: 'accessibility',
        severity: 'warning',
        title: `${contrastIssues.length} Elements Fail WCAG 2.2 Contrast Ratio (< 4.5:1)`,
        description: 'Text colors lack sufficient contrast against their background, making content difficult or impossible to read.',
        recommendation: 'Increase text color darkness or adjust background brightness to meet minimum 4.5:1 contrast.',
        scoreImpact: Math.min(8, contrastIssues.length * 2),
      });
    }

    if (touchTargetIssues.length > 0) {
      issues.push({
        id: 'a11y-touch-targets',
        category: 'accessibility',
        severity: 'notice',
        title: `${touchTargetIssues.length} Interactive Elements Smaller Than 24x24px`,
        description: 'Buttons and links smaller than 24x24px violate WCAG 2.2 Success Criterion 2.5.8 (Target Size).',
        recommendation: 'Add padding or set min-width and min-height to at least 24px (preferably 44px for mobile devices).',
        scoreImpact: Math.min(4, touchTargetIssues.length),
      });
    }
  }

  return {
    accessibility: {
      htmlLang,
      isLangValid,
      contrastIssues,
      touchTargetIssues,
      formIssues,
      hasSkipLink,
      hasViewportZoomDisabled,
    },
    issues,
  };
}

// ----------------------------------------------------
// 7. Extended Tech Stack & Framework Detective
// ----------------------------------------------------
export function detectTechStack(
  doc: Document | null,
  html: string,
  headers?: Record<string, string | null>
): TechStackDetails {
  const items: TechStackItem[] = [];
  const seen = new Set<string>();

  const add = (name: string, category: TechStackItem['category'], confidence: 'high' | 'medium' = 'high', version?: string) => {
    if (seen.has(name)) return;
    seen.add(name);
    items.push({ name, category, confidence, version });
  };

  const htmlLower = html.toLowerCase();

  // Frameworks
  if (html.includes('__NEXT_DATA__') || html.includes('/_next/')) add('Next.js', 'Framework');
  if (html.includes('data-reactroot') || html.includes('_reactListening') || html.includes('react-dom')) add('React', 'Framework');
  if (html.includes('data-v-') || html.includes('__vue_app__') || html.includes('vue.global')) add('Vue.js', 'Framework');
  if (html.includes('__NUXT__') || html.includes('/_nuxt/')) add('Nuxt', 'Framework');
  if (html.includes('ng-version') || html.includes('ng-app')) add('Angular', 'Framework');
  if (html.includes('svelte-') || html.includes('__svelte')) add('Svelte', 'Framework');
  if (html.includes('astro-') || html.includes('astro-island')) add('Astro', 'Framework');
  if (html.includes('__remixContext')) add('Remix', 'Framework');
  if (html.includes('___gatsby')) add('Gatsby', 'Framework');

  // CMS & Platforms
  if (htmlLower.includes('wp-content') || htmlLower.includes('wp-includes')) add('WordPress', 'CMS');
  if (html.includes('cdn.shopify.com') || html.includes('Shopify.theme')) add('Shopify', 'CMS');
  if (html.includes('data-wf-page') || html.includes('webflow.com')) add('Webflow', 'CMS');
  if (htmlLower.includes('squarespace.com') || htmlLower.includes('static1.squarespace.com')) add('Squarespace', 'CMS');
  if (htmlLower.includes('wix.com') || htmlLower.includes('wixsite.com')) add('Wix', 'CMS');
  if (htmlLower.includes('ghost-portal') || htmlLower.includes('ghost.org')) add('Ghost', 'CMS');

  // CDN & Cloud Infrastructure
  const serverHeader = (headers?.['server'] || '').toLowerCase();
  const cfRay = headers?.['cf-ray'] || headers?.['cf-cache-status'];
  if (cfRay || serverHeader.includes('cloudflare') || html.includes('cdnjs.cloudflare.com')) add('Cloudflare', 'CDN');
  if (headers?.['x-vercel-id'] || serverHeader.includes('vercel')) add('Vercel', 'Hosting');
  if (headers?.['x-amz-cf-id'] || html.includes('cloudfront.net')) add('AWS CloudFront', 'CDN');
  if (headers?.['x-fastly-request-id'] || serverHeader.includes('fastly')) add('Fastly', 'CDN');
  if (headers?.['x-nf-request-id'] || serverHeader.includes('netlify')) add('Netlify', 'Hosting');

  // Analytics & Marketing Telemetry
  if (html.includes('googletagmanager.com/gtm.js') || html.includes('GTM-')) add('Google Tag Manager', 'Analytics');
  if (html.includes('google-analytics.com/analytics.js') || html.includes('gtag(') || /G-[A-Z0-9]+/i.test(html)) add('Google Analytics 4', 'Analytics');
  if (html.includes('connect.facebook.net') || html.includes('fbq(')) add('Meta Pixel', 'Analytics');
  if (html.includes('hotjar-') || html.includes('static.hotjar.com')) add('Hotjar', 'Analytics');
  if (html.includes('analytics.tiktok.com') || html.includes('ttq.load')) add('TikTok Pixel', 'Analytics');
  if (html.includes('cdn.segment.com/analytics.js')) add('Segment', 'Analytics');

  // Styling / CSS Libraries
  if (html.includes('class="') && (html.includes('flex flex-col') || html.includes('bg-') || html.includes('text-zinc-') || html.includes('grid-cols-'))) {
    add('Tailwind CSS', 'Library');
  }
  if (htmlLower.includes('bootstrap.min.css') || htmlLower.includes('bootstrap.bundle')) add('Bootstrap', 'Library');
  if (htmlLower.includes('fontawesome') || htmlLower.includes('fa-solid') || htmlLower.includes('fa-brands')) add('FontAwesome', 'Library');

  return { items };
}
