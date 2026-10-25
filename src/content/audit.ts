import { 
  AuditReport, 
  AuditIssue, 
  MetaDetails, 
  HeadingItem, 
  ImageItem, 
  LinkItem, 
  WordPressDetails, 
  PerformanceMetrics,
  AuditSettings,
  ExtensionMessage 
} from '../types/audit';

function generateSelector(el: Element): string {
  if (el.id) return `#${CSS.escape(el.id)}`;
  if (el.tagName.toLowerCase() === 'body') return 'body';
  if (el.tagName.toLowerCase() === 'html') return 'html';
  
  let selector = el.tagName.toLowerCase();
  if (el.className && typeof el.className === 'string') {
    const classes = el.className.trim().split(/\s+/).filter(Boolean);
    if (classes.length > 0) {
      selector += `.${CSS.escape(classes[0])}`;
    }
  }

  const parent = el.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children).filter(c => c.tagName === el.tagName);
    if (siblings.length > 1) {
      const index = siblings.indexOf(el) + 1;
      selector += `:nth-of-type(${index})`;
    }
  }

  return selector;
}

export function performSiteAudit(customSettings?: Partial<AuditSettings>): AuditReport {
  const issues: AuditIssue[] = [];
  const minTitle = customSettings?.minTitleLength ?? 30;
  const maxTitle = customSettings?.maxTitleLength ?? 60;
  const minDesc = customSettings?.minDescLength ?? 70;
  const maxDesc = customSettings?.maxDescLength ?? 160;

  const currentUrl = window.location.href;
  const domain = window.location.hostname;

  // 1. Meta & Title Details
  const titleEl = document.querySelector('title');
  const rawTitle = document.title ? document.title.trim() : (titleEl?.textContent?.trim() || null);
  const titleLength = rawTitle ? rawTitle.length : 0;

  const descMeta = document.querySelector('meta[name="description" i]') as HTMLMetaElement | null;
  const rawDesc = descMeta?.content?.trim() || null;
  const descLength = rawDesc ? rawDesc.length : 0;

  const canonicalLink = document.querySelector('link[rel="canonical" i]') as HTMLLinkElement | null;
  const canonicalHref = canonicalLink?.href || null;
  const isCanonicalSelf = canonicalHref ? (canonicalHref.replace(/\/$/, '') === currentUrl.replace(/\/$/, '')) : false;

  const robotsMeta = document.querySelector('meta[name="robots" i]') as HTMLMetaElement | null;
  const robotsContent = robotsMeta?.content?.toLowerCase() || null;

  const viewportMeta = document.querySelector('meta[name="viewport" i]') as HTMLMetaElement | null;
  const charsetMeta = document.querySelector('meta[charset i]') || document.querySelector('meta[http-equiv="Content-Type" i]');

  const ogTitle = document.querySelector('meta[property="og:title" i]')?.getAttribute('content') || undefined;
  const ogDesc = document.querySelector('meta[property="og:description" i]')?.getAttribute('content') || undefined;
  const ogImage = document.querySelector('meta[property="og:image" i]')?.getAttribute('content') || undefined;
  const ogUrl = document.querySelector('meta[property="og:url" i]')?.getAttribute('content') || undefined;
  const ogType = document.querySelector('meta[property="og:type" i]')?.getAttribute('content') || undefined;

  const twitterCard = document.querySelector('meta[name="twitter:card" i]')?.getAttribute('content') || undefined;
  const twitterTitle = document.querySelector('meta[name="twitter:title" i]')?.getAttribute('content') || undefined;
  const twitterDesc = document.querySelector('meta[name="twitter:description" i]')?.getAttribute('content') || undefined;
  const twitterImage = document.querySelector('meta[name="twitter:image" i]')?.getAttribute('content') || undefined;

  const metaDetails: MetaDetails = {
    title: rawTitle,
    titleLength,
    description: rawDesc,
    descriptionLength: descLength,
    canonical: canonicalHref,
    isCanonicalSelfReferencing: isCanonicalSelf,
    robots: robotsContent,
    viewport: viewportMeta?.getAttribute('content') || null,
    charset: charsetMeta ? (charsetMeta.getAttribute('charset') || charsetMeta.getAttribute('content')) : null,
    og: {
      title: ogTitle,
      description: ogDesc,
      image: ogImage,
      url: ogUrl,
      type: ogType
    },
    twitter: {
      card: twitterCard,
      title: twitterTitle,
      description: twitterDesc,
      image: twitterImage
    }
  };

  // Meta Audit Checks
  if (!rawTitle) {
    issues.push({
      id: 'missing-title',
      category: 'meta',
      severity: 'critical',
      title: 'Missing <title> Tag',
      description: 'The page has no title element, which is critical for search engines and user bookmarks.',
      recommendation: `Add a unique, descriptive <title> tag between ${minTitle} and ${maxTitle} characters.`,
      scoreImpact: 15
    });
  } else if (titleLength < minTitle) {
    issues.push({
      id: 'short-title',
      category: 'meta',
      severity: 'warning',
      title: 'Page Title is Too Short',
      description: `Current title has ${titleLength} characters. Short titles provide inadequate context for search queries.`,
      recommendation: `Expand title to ${minTitle}–${maxTitle} characters with primary keywords.`,
      context: `"${rawTitle}"`,
      scoreImpact: 4
    });
  } else if (titleLength > maxTitle) {
    issues.push({
      id: 'long-title',
      category: 'meta',
      severity: 'warning',
      title: 'Page Title Exceeds Recommended Length',
      description: `Current title has ${titleLength} characters and may be truncated on search engine result pages (SERPs).`,
      recommendation: `Condense title to under ${maxTitle} characters.`,
      context: `"${rawTitle}"`,
      scoreImpact: 3
    });
  } else {
    issues.push({
      id: 'optimal-title',
      category: 'meta',
      severity: 'good',
      title: 'Optimal Title Length',
      description: `Title is well-optimized at ${titleLength} characters.`,
      recommendation: 'Keep this title format consistent across similar pages.',
      context: `"${rawTitle}"`,
      scoreImpact: 0
    });
  }

  if (!rawDesc) {
    issues.push({
      id: 'missing-meta-desc',
      category: 'meta',
      severity: 'warning',
      title: 'Missing Meta Description',
      description: 'The page has no meta description. Search engines will generate snippets automatically, often with suboptimal click-through rates.',
      recommendation: `Add <meta name="description" content="..."> with ${minDesc}–${maxDesc} characters.`,
      scoreImpact: 8
    });
  } else if (descLength < minDesc) {
    issues.push({
      id: 'short-meta-desc',
      category: 'meta',
      severity: 'warning',
      title: 'Meta Description is Too Short',
      description: `Current description is only ${descLength} characters.`,
      recommendation: `Expand description to ${minDesc}–${maxDesc} characters to provide an informative summary.`,
      context: `"${rawDesc}"`,
      scoreImpact: 3
    });
  } else if (descLength > maxDesc) {
    issues.push({
      id: 'long-meta-desc',
      category: 'meta',
      severity: 'warning',
      title: 'Meta Description Exceeds Length Limit',
      description: `Current description is ${descLength} characters and will likely be cut off on Google.`,
      recommendation: `Trim description to under ${maxDesc} characters.`,
      context: `"${rawDesc}"`,
      scoreImpact: 3
    });
  } else {
    issues.push({
      id: 'optimal-meta-desc',
      category: 'meta',
      severity: 'good',
      title: 'Optimal Meta Description',
      description: `Meta description is well-balanced at ${descLength} characters.`,
      recommendation: 'Ensure it contains clear value propositions and calls to action.',
      context: `"${rawDesc}"`,
      scoreImpact: 0
    });
  }

  if (!canonicalHref) {
    issues.push({
      id: 'missing-canonical',
      category: 'meta',
      severity: 'warning',
      title: 'Missing Canonical Tag',
      description: 'No canonical URL is defined, increasing the risk of duplicate content indexing across parameters or www/non-www.',
      recommendation: `Add <link rel="canonical" href="${currentUrl.split('?')[0]}"> to specify the authoritative URL.`,
      scoreImpact: 5
    });
  } else {
    issues.push({
      id: 'canonical-present',
      category: 'meta',
      severity: 'good',
      title: 'Canonical Tag Present',
      description: `Canonical URL correctly specified: ${canonicalHref}`,
      recommendation: 'Verify that parameter tracking or sorting URLs also point to this canonical URL.',
      scoreImpact: 0
    });
  }

  if (robotsContent && (robotsContent.includes('noindex') || robotsContent.includes('none'))) {
    issues.push({
      id: 'robots-noindex',
      category: 'meta',
      severity: 'critical',
      title: 'Page Has "noindex" Directive',
      description: `Robots meta tag contains "${robotsContent}", preventing search engines from indexing this page!`,
      recommendation: 'Remove the noindex directive if this page is intended for public search traffic.',
      context: robotsContent,
      scoreImpact: 20
    });
  }

  if (!viewportMeta) {
    issues.push({
      id: 'missing-viewport',
      category: 'meta',
      severity: 'critical',
      title: 'Missing Viewport Meta Tag',
      description: 'The page lacks a responsive viewport configuration, causing poor mobile rendering and mobile usability penalties.',
      recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> in the <head>.',
      scoreImpact: 12
    });
  }

  if (!ogTitle || !ogImage) {
    issues.push({
      id: 'incomplete-opengraph',
      category: 'meta',
      severity: 'notice',
      title: 'Incomplete Open Graph (Social Preview) Tags',
      description: 'Missing og:title or og:image tags for rich preview cards when shared on LinkedIn, Facebook, Slack, or WhatsApp.',
      recommendation: 'Provide og:title, og:description, and high-resolution og:image (1200x630px).',
      scoreImpact: 2
    });
  }

  // 2. Headings & Structure Audit
  const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')) as HTMLElement[];
  const headings: HeadingItem[] = [];
  const h1List: HTMLElement[] = [];
  let prevLevel = 0;

  headingElements.forEach((el, index) => {
    const level = parseInt(el.tagName.substring(1), 10);
    const text = el.innerText.trim();
    const selector = generateSelector(el);
    let isSkipped = false;

    if (prevLevel > 0 && level > prevLevel + 1) {
      isSkipped = true;
    }
    prevLevel = level;

    if (level === 1) {
      h1List.push(el);
    }

    headings.push({
      id: `heading-${index}`,
      level,
      text: text || '[Empty Heading]',
      selector,
      isSkippedHierarchy: isSkipped
    });
  });

  if (h1List.length === 0) {
    issues.push({
      id: 'missing-h1',
      category: 'headings',
      severity: 'critical',
      title: 'Missing <h1> Heading',
      description: 'Every web page should have a primary H1 heading to establish topic relevance for accessibility and search engines.',
      recommendation: 'Add a single, descriptive <h1> element representing the page subject.',
      scoreImpact: 12
    });
  } else if (h1List.length > 1) {
    issues.push({
      id: 'multiple-h1',
      category: 'headings',
      severity: 'warning',
      title: `Multiple <h1> Headings Found (${h1List.length})`,
      description: 'Having multiple H1 headings can dilute document hierarchy and confuse screen readers.',
      recommendation: 'Use one H1 for the page title, and structure sub-sections using H2 and H3.',
      context: h1List.map(h => `"${h.innerText.trim().slice(0, 40)}..."`).join(', '),
      scoreImpact: 5
    });
  } else {
    const h1Text = h1List[0].innerText.trim();
    if (!h1Text) {
      issues.push({
        id: 'empty-h1',
        category: 'headings',
        severity: 'critical',
        title: 'Primary <h1> Heading is Empty',
        description: 'The <h1> element exists in the DOM but contains no readable text.',
        recommendation: 'Populate the <h1> with the primary page title.',
        scoreImpact: 10
      });
    } else {
      issues.push({
        id: 'valid-h1',
        category: 'headings',
        severity: 'good',
        title: 'Primary <h1> Heading Structured Correctly',
        description: `Found 1 distinct H1: "${h1Text.slice(0, 60)}"`,
        recommendation: 'Maintain hierarchy with H2 subheadings beneath it.',
        context: h1Text,
        scoreImpact: 0
      });
    }
  }

  const skippedHeadings = headings.filter(h => h.isSkippedHierarchy);
  if (skippedHeadings.length > 0) {
    issues.push({
      id: 'skipped-heading-hierarchy',
      category: 'headings',
      severity: 'warning',
      title: `Skipped Heading Hierarchy Detected (${skippedHeadings.length})`,
      description: 'Heading levels were skipped (e.g. jumping from H1 directly to H3 without an intervening H2).',
      recommendation: 'Maintain sequential heading levels (H1 -> H2 -> H3) for semantic outline integrity and accessibility.',
      context: `First occurrence: Level ${skippedHeadings[0].level} "${skippedHeadings[0].text.slice(0, 30)}"`,
      scoreImpact: 3
    });
  }

  // 3. Images & Media Audit
  const imgElements = Array.from(document.querySelectorAll('img')) as HTMLImageElement[];
  const images: ImageItem[] = [];
  let missingAltCount = 0;
  let brokenImgCount = 0;

  imgElements.forEach((img, idx) => {
    const hasAlt = img.hasAttribute('alt');
    const altText = img.getAttribute('alt');
    const isBroken = (img.complete && img.naturalWidth === 0 && Boolean(img.src)) || (!img.src && !img.dataset.src);
    const selector = generateSelector(img);

    if (!hasAlt) {
      missingAltCount++;
    }
    if (isBroken) {
      brokenImgCount++;
    }

    images.push({
      id: `img-${idx}`,
      src: img.src || img.dataset.src || '',
      alt: altText,
      hasAlt,
      isBroken,
      width: img.width,
      height: img.height,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      selector
    });
  });

  if (brokenImgCount > 0) {
    issues.push({
      id: 'broken-images',
      category: 'images',
      severity: 'critical',
      title: `${brokenImgCount} Broken Image${brokenImgCount > 1 ? 's' : ''} Detected`,
      description: 'Images failed to load, leading to broken layout, missing media, and poor UX.',
      recommendation: 'Fix image source URLs, check file paths or hosting availability.',
      context: `${brokenImgCount} of ${imgElements.length} images failed`,
      scoreImpact: 14
    });
  }

  if (missingAltCount > 0) {
    issues.push({
      id: 'missing-alt-tags',
      category: 'images',
      severity: 'warning',
      title: `${missingAltCount} Image${missingAltCount > 1 ? 's' : ''} Missing alt Attribute`,
      description: 'Images lack alt attributes, failing WCAG 2.1 accessibility requirements and image SEO.',
      recommendation: 'Add descriptive alt text for informative images or empty alt="" for decorative images.',
      context: `${missingAltCount} of ${imgElements.length} images missing alt`,
      scoreImpact: Math.min(12, missingAltCount * 2)
    });
  } else if (imgElements.length > 0) {
    issues.push({
      id: 'all-images-alt',
      category: 'images',
      severity: 'good',
      title: 'All Images Have Alt Attributes',
      description: `All ${imgElements.length} detected images contain an alt attribute.`,
      recommendation: 'Continue maintaining accurate, contextual descriptions.',
      scoreImpact: 0
    });
  }

  // 4. Links & Navigation Audit
  const linkElements = Array.from(document.querySelectorAll('a[href]')) as HTMLAnchorElement[];
  const links: LinkItem[] = [];
  let genericAnchorCount = 0;
  let insecureTargetBlankCount = 0;
  const genericWords = ['click here', 'here', 'read more', 'more', 'link', 'learn more', 'view', 'go'];

  linkElements.forEach((a, idx) => {
    const rawHref = a.getAttribute('href') || '';
    const href = a.href;
    const text = (a.innerText || a.textContent || '').trim();
    const isExternal = href.startsWith('http') && !href.includes(domain);
    const target = a.getAttribute('target');
    const rel = a.getAttribute('rel');
    const selector = generateSelector(a);

    const lowerText = text.toLowerCase();
    if (text.length === 0 || genericWords.includes(lowerText)) {
      genericAnchorCount++;
    }

    if (target === '_blank' && (!rel || !rel.includes('noopener'))) {
      insecureTargetBlankCount++;
    }

    links.push({
      id: `link-${idx}`,
      href,
      text: text || '[No Text / Icon]',
      isExternal,
      target,
      rel,
      selector
    });
  });

  if (genericAnchorCount > 0) {
    issues.push({
      id: 'generic-anchor-text',
      category: 'links',
      severity: 'notice',
      title: `${genericAnchorCount} Link${genericAnchorCount > 1 ? 's' : ''} with Generic or Empty Anchor Text`,
      description: 'Links with generic anchor text like "click here" or empty icons harm accessibility and keyword context.',
      recommendation: 'Replace generic labels with specific destination descriptions (e.g. "View WordPress pricing guide").',
      context: `${genericAnchorCount} instances found`,
      scoreImpact: 3
    });
  }

  if (insecureTargetBlankCount > 0) {
    issues.push({
      id: 'insecure-target-blank',
      category: 'security',
      severity: 'warning',
      title: `${insecureTargetBlankCount} Target="_blank" Link${insecureTargetBlankCount > 1 ? 's' : ''} Missing rel="noopener"`,
      description: 'Links with target="_blank" without rel="noopener" expose the window.opener API, a known reverse tab-nabbing security vulnerability.',
      recommendation: 'Add rel="noopener noreferrer" to all external links opening in a new tab.',
      scoreImpact: 4
    });
  }

  // 5. WordPress & CMS Detection
  const pageHtml = document.documentElement.outerHTML;
  const generatorMeta = document.querySelector('meta[name="generator" i]')?.getAttribute('content') || undefined;
  const signatures: string[] = [];
  const detectedPlugins: string[] = [];

  let isWordPress = false;
  let wpVersion: string | undefined;

  if (generatorMeta && generatorMeta.toLowerCase().includes('wordpress')) {
    isWordPress = true;
    signatures.push(`Generator tag: ${generatorMeta}`);
    const match = generatorMeta.match(/WordPress\s+([\d.]+)/i);
    if (match) wpVersion = match[1];
  }

  if (pageHtml.includes('/wp-content/') || pageHtml.includes('/wp-includes/')) {
    isWordPress = true;
    signatures.push('WordPress asset paths (/wp-content/ or /wp-includes/) detected');
  }

  const wpJsonLink = document.querySelector('link[rel="https://api.w.org/" i]') as HTMLLinkElement | null;
  const hasRestApi = Boolean(wpJsonLink);
  if (hasRestApi) {
    isWordPress = true;
    signatures.push(`WordPress REST API endpoint found: ${wpJsonLink?.href}`);
  }

  // Common WordPress theme & plugin detector
  const themeMatch = pageHtml.match(/\/wp-content\/themes\/([a-zA-Z0-9_-]+)\//i);
  const detectedTheme = themeMatch ? themeMatch[1] : undefined;

  const pluginTests = [
    { name: 'Elementor', test: () => pageHtml.includes('elementor') || document.querySelector('.elementor') },
    { name: 'WooCommerce', test: () => pageHtml.includes('woocommerce') || document.querySelector('.woocommerce') },
    { name: 'Yoast SEO', test: () => pageHtml.includes('yoast-schema-graph') },
    { name: 'Rank Math SEO', test: () => pageHtml.includes('rank-math') },
    { name: 'Contact Form 7', test: () => pageHtml.includes('wpcf7') },
    { name: 'W3 Total Cache / WP Rocket', test: () => pageHtml.includes('w3tc') || pageHtml.includes('wp-rocket') },
    { name: 'Gutenberg Blocks', test: () => pageHtml.includes('wp-block-') },
    { name: 'Divi Builder', test: () => pageHtml.includes('et_builder') || pageHtml.includes('et_pb_') },
  ];

  pluginTests.forEach(p => {
    if (p.test()) {
      detectedPlugins.push(p.name);
    }
  });

  const wordpressDetails: WordPressDetails = {
    isWordPress,
    version: wpVersion,
    theme: detectedTheme,
    plugins: detectedPlugins,
    hasRestApi,
    generator: generatorMeta,
    signatures
  };

  if (isWordPress) {
    if (generatorMeta) {
      issues.push({
        id: 'wp-generator-exposed',
        category: 'wordpress',
        severity: 'notice',
        title: 'WordPress Generator Tag Exposed',
        description: `Your exact CMS version is publicly visible in the <head>: "${generatorMeta}". Attackers can scan this for known version vulnerabilities.`,
        recommendation: 'Remove the WordPress version tag in functions.php via remove_action("wp_head", "wp_generator").',
        context: generatorMeta,
        scoreImpact: 2
      });
    }

    issues.push({
      id: 'wp-detected',
      category: 'wordpress',
      severity: 'good',
      title: 'WordPress Installation Verified',
      description: `Detected WordPress site${detectedTheme ? ` running theme "${detectedTheme}"` : ''} with ${detectedPlugins.length} active plugin signatures.`,
      recommendation: 'Keep all core files, themes, and plugins updated regularly.',
      context: detectedPlugins.length > 0 ? `Plugins: ${detectedPlugins.join(', ')}` : undefined,
      scoreImpact: 0
    });
  }

  // 6. Security (HTTPS & Mixed Content)
  const isHttps = window.location.protocol === 'https:';
  if (!isHttps) {
    issues.push({
      id: 'insecure-http',
      category: 'security',
      severity: 'critical',
      title: 'Site Not Served Over HTTPS',
      description: 'The page is loaded using unencrypted HTTP, exposing user traffic and triggering browser security warnings.',
      recommendation: 'Install an SSL certificate and configure 301 redirects to HTTPS.',
      scoreImpact: 20
    });
  } else {
    // Check for mixed content
    const insecureResources = Array.from(document.querySelectorAll('img[src^="http:"], script[src^="http:"], link[href^="http:"]'));
    if (insecureResources.length > 0) {
      issues.push({
        id: 'mixed-content',
        category: 'security',
        severity: 'critical',
        title: `${insecureResources.length} Mixed Content Resources Found`,
        description: 'Page is HTTPS, but requests insecure HTTP assets (images, stylesheets, or scripts).',
        recommendation: 'Update all asset URLs to use https:// or protocol-relative paths.',
        scoreImpact: 10
      });
    } else {
      issues.push({
        id: 'secure-https',
        category: 'security',
        severity: 'good',
        title: 'Secure HTTPS Encryption Active',
        description: 'Page is encrypted via SSL/TLS and no mixed-content elements were detected.',
        recommendation: 'Ensure HSTS headers are enabled for maximum transport security.',
        scoreImpact: 0
      });
    }
  }

  // 7. Performance & DOM Metrics
  const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const loadTimeMs = navTiming ? Math.round(navTiming.loadEventEnd - navTiming.startTime) : 0;
  const domContentLoadedMs = navTiming ? Math.round(navTiming.domContentLoadedEventEnd - navTiming.startTime) : 0;
  const ttfbMs = navTiming ? Math.round(navTiming.responseStart - navTiming.requestStart) : 0;
  const domNodesCount = document.getElementsByTagName('*').length;
  const pageSizeEstimateKb = Math.round(new Blob([pageHtml]).size / 1024);

  const performanceMetrics: PerformanceMetrics = {
    loadTimeMs,
    domContentLoadedMs,
    ttfbMs,
    domNodesCount,
    pageSizeEstimateKb
  };

  if (ttfbMs > 800) {
    issues.push({
      id: 'slow-ttfb',
      category: 'performance',
      severity: 'warning',
      title: `High Time to First Byte (${ttfbMs}ms)`,
      description: 'Server took over 800ms to respond with the initial byte. Typical causes are database bottlenecks or slow hosting.',
      recommendation: 'Enable page caching (Redis, WP Rocket, Varnish) and consider a CDN.',
      context: `${ttfbMs}ms`,
      scoreImpact: 5
    });
  }

  if (domNodesCount > 1500) {
    issues.push({
      id: 'excessive-dom-size',
      category: 'performance',
      severity: 'warning',
      title: `Excessive DOM Size (${domNodesCount} nodes)`,
      description: 'Lighthouse recommends fewer than 800 nodes and maximum 1,400. Deeply nested DOM trees increase memory usage and style calculation times.',
      recommendation: 'Simplify nested containers, lazy-load offscreen components, and avoid redundant wrapper divs.',
      context: `${domNodesCount} nodes`,
      scoreImpact: 4
    });
  }

  // Calculate overall Health Score (0 - 100)
  let totalDeductions = issues.reduce((acc, issue) => acc + issue.scoreImpact, 0);
  const score = Math.max(0, Math.min(100, 100 - totalDeductions));

  const summary = {
    total: issues.length,
    critical: issues.filter(i => i.severity === 'critical').length,
    warning: issues.filter(i => i.severity === 'warning').length,
    notice: issues.filter(i => i.severity === 'notice').length,
    good: issues.filter(i => i.severity === 'good').length,
  };

  return {
    id: `audit-${Date.now()}`,
    url: currentUrl,
    domain,
    timestamp: Date.now(),
    score,
    summary,
    issues,
    meta: metaDetails,
    headings,
    images,
    links,
    wordpress: wordpressDetails,
    performance: performanceMetrics
  };
}

// Highlight DOM Element function
function highlightElement(selector: string) {
  try {
    const el = document.querySelector(selector);
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Remove any previous highlight
    const prevHighlight = document.getElementById('sitecheck-highlight-overlay');
    if (prevHighlight) prevHighlight.remove();

    const rect = el.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.id = 'sitecheck-highlight-overlay';
    overlay.style.position = 'absolute';
    overlay.style.top = `${rect.top + window.scrollY}px`;
    overlay.style.left = `${rect.left + window.scrollX}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.border = '3px solid #10B981';
    overlay.style.borderRadius = '6px';
    overlay.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.6), inset 0 0 15px rgba(16, 185, 129, 0.2)';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '9999999';
    overlay.style.transition = 'all 0.3s ease-out';
    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 400);
    }, 3500);
  } catch (err) {
    console.error('[SiteCheck] Failed to highlight element:', err);
  }
}

// Extension message listener
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === 'RUN_AUDIT') {
      try {
        const report = performSiteAudit(message.options);
        sendResponse({ success: true, report });
      } catch (err: any) {
        sendResponse({ success: false, error: err.message });
      }
      return true;
    }

    if (message.type === 'HIGHLIGHT_ELEMENT' && message.selector) {
      highlightElement(message.selector);
      sendResponse({ success: true });
      return true;
    }
  });
}
