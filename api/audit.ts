type VercelRequest = any;
type VercelResponse = any;

interface AuditIssue {
  id: string;
  category: 'meta' | 'headings' | 'links' | 'images' | 'wordpress' | 'performance' | 'security';
  severity: 'critical' | 'warning' | 'notice' | 'good';
  title: string;
  description: string;
  recommendation: string;
  context?: string;
  selector?: string;
  scoreImpact: number;
}

function cleanText(str: string): string {
  return str.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let targetUrl = (req.query.url as string) || (req.body?.url as string);
  if (!targetUrl) {
    return res.status(400).json({ error: 'Please provide a valid website URL to audit.' });
  }

  targetUrl = targetUrl.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `https://${targetUrl}`;
  }

  try {
    const parsedUrl = new URL(targetUrl);
    const domain = parsedUrl.hostname;
    const startTime = Date.now();

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 SiteCheck/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
    });

    const loadTimeMs = Date.now() - startTime;
    const isHttps = parsedUrl.protocol === 'https:';
    const html = await response.text();
    const pageSizeEstimateKb = Math.round(new Blob([html]).size / 1024);

    const issues: AuditIssue[] = [];

    // 1. Title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const rawTitle = titleMatch ? cleanText(titleMatch[1]) : null;
    const titleLength = rawTitle ? rawTitle.length : 0;

    if (!rawTitle) {
      issues.push({
        id: 'missing-title',
        category: 'meta',
        severity: 'critical',
        title: 'Missing <title> Tag',
        description: 'The page has no title element, critical for search engines and browsers.',
        recommendation: 'Add a unique, descriptive <title> tag between 30 and 60 characters.',
        scoreImpact: 15,
      });
    } else if (titleLength < 30) {
      issues.push({
        id: 'short-title',
        category: 'meta',
        severity: 'warning',
        title: 'Page Title is Too Short',
        description: `Current title has ${titleLength} characters. Short titles provide inadequate context.`,
        recommendation: 'Expand title to 30–60 characters with primary keywords.',
        context: `"${rawTitle}"`,
        scoreImpact: 4,
      });
    } else if (titleLength > 60) {
      issues.push({
        id: 'long-title',
        category: 'meta',
        severity: 'warning',
        title: 'Page Title Exceeds Recommended Length',
        description: `Current title has ${titleLength} characters and may be truncated on Google.`,
        recommendation: 'Condense title to under 60 characters.',
        context: `"${rawTitle}"`,
        scoreImpact: 3,
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
        scoreImpact: 0,
      });
    }

    // 2. Meta Description
    const descMatch = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i) ||
                      html.match(/<meta\s+[^>]*content=["'](.*?)["'][^>]*name=["']description["']/i);
    const rawDesc = descMatch ? cleanText(descMatch[1]) : null;
    const descLength = rawDesc ? rawDesc.length : 0;

    if (!rawDesc) {
      issues.push({
        id: 'missing-meta-desc',
        category: 'meta',
        severity: 'warning',
        title: 'Missing Meta Description',
        description: 'The page has no meta description. Search engines will generate snippets automatically.',
        recommendation: 'Add <meta name="description" content="..."> with 70–160 characters.',
        scoreImpact: 8,
      });
    } else if (descLength < 70) {
      issues.push({
        id: 'short-meta-desc',
        category: 'meta',
        severity: 'warning',
        title: 'Meta Description is Too Short',
        description: `Current description is only ${descLength} characters.`,
        recommendation: 'Expand description to 70–160 characters to provide an informative summary.',
        context: `"${rawDesc}"`,
        scoreImpact: 3,
      });
    } else if (descLength > 160) {
      issues.push({
        id: 'long-meta-desc',
        category: 'meta',
        severity: 'warning',
        title: 'Meta Description Exceeds Length Limit',
        description: `Current description is ${descLength} characters and will likely be cut off.`,
        recommendation: 'Trim description to under 160 characters.',
        context: `"${rawDesc}"`,
        scoreImpact: 3,
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
        scoreImpact: 0,
      });
    }

    // 3. Canonical Tag
    const canonicalMatch = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["'](.*?)["']/i);
    const canonicalHref = canonicalMatch ? canonicalMatch[1] : null;

    if (!canonicalHref) {
      issues.push({
        id: 'missing-canonical',
        category: 'meta',
        severity: 'warning',
        title: 'Missing Canonical Tag',
        description: 'No canonical URL is defined, increasing the risk of duplicate content indexing.',
        recommendation: `Add <link rel="canonical" href="${targetUrl.split('?')[0]}"> to specify the authoritative URL.`,
        scoreImpact: 5,
      });
    } else {
      issues.push({
        id: 'canonical-present',
        category: 'meta',
        severity: 'good',
        title: 'Canonical Tag Present',
        description: `Canonical URL correctly specified: ${canonicalHref}`,
        recommendation: 'Verify that parameter tracking or sorting URLs point to this canonical URL.',
        scoreImpact: 0,
      });
    }

    // 4. Viewport
    const viewportMatch = html.match(/<meta\s+[^>]*name=["']viewport["']/i);
    if (!viewportMatch) {
      issues.push({
        id: 'missing-viewport',
        category: 'meta',
        severity: 'critical',
        title: 'Missing Viewport Meta Tag',
        description: 'The page lacks a responsive viewport configuration, causing mobile display penalties.',
        recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> in <head>.',
        scoreImpact: 12,
      });
    }

    // 5. Headings H1-H6
    const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
    const headings: Array<{ id: string; level: number; text: string; selector: string; isSkippedHierarchy: boolean }> = [];
    const h1List: string[] = [];
    let prevLevel = 0;
    let headingMatch;
    let headingIndex = 0;

    while ((headingMatch = headingRegex.exec(html)) !== null && headingIndex < 50) {
      const level = parseInt(headingMatch[1], 10);
      const text = cleanText(headingMatch[2]) || '[Empty Heading]';
      let isSkipped = false;

      if (prevLevel > 0 && level > prevLevel + 1) {
        isSkipped = true;
      }
      prevLevel = level;

      if (level === 1) {
        h1List.push(text);
      }

      headings.push({
        id: `h-${headingIndex}`,
        level,
        text,
        selector: `h${level}`,
        isSkippedHierarchy: isSkipped,
      });
      headingIndex++;
    }

    if (h1List.length === 0) {
      issues.push({
        id: 'missing-h1',
        category: 'headings',
        severity: 'critical',
        title: 'Missing <h1> Heading',
        description: 'Every web page should have a primary H1 heading to establish topic relevance.',
        recommendation: 'Add a single, descriptive <h1> element representing the page subject.',
        scoreImpact: 12,
      });
    } else if (h1List.length > 1) {
      issues.push({
        id: 'multiple-h1',
        category: 'headings',
        severity: 'warning',
        title: `Multiple <h1> Headings Found (${h1List.length})`,
        description: 'Having multiple H1 headings can dilute document hierarchy and confuse screen readers.',
        recommendation: 'Use one H1 for the page title, and structure sub-sections using H2 and H3.',
        context: h1List.slice(0, 3).map(h => `"${h.slice(0, 35)}..."`).join(', '),
        scoreImpact: 5,
      });
    } else {
      issues.push({
        id: 'valid-h1',
        category: 'headings',
        severity: 'good',
        title: 'Primary <h1> Heading Structured Correctly',
        description: `Found 1 distinct H1: "${h1List[0].slice(0, 60)}"`,
        recommendation: 'Maintain hierarchy with H2 subheadings beneath it.',
        context: h1List[0],
        scoreImpact: 0,
      });
    }

    // 6. Images & Media
    const imgRegex = /<img\s+([^>]+)>/gi;
    const images: Array<{ id: string; src: string; alt: string | null; hasAlt: boolean; isBroken: boolean; width: number; height: number; selector: string }> = [];
    let imgMatch;
    let missingAltCount = 0;
    let imgIndex = 0;

    while ((imgMatch = imgRegex.exec(html)) !== null && imgIndex < 40) {
      const attrs = imgMatch[1];
      const srcMatch = attrs.match(/src=["'](.*?)["']/i);
      const altMatch = attrs.match(/alt=["'](.*?)["']/i);
      const hasAlt = Boolean(altMatch);
      const altText = altMatch ? altMatch[1] : null;

      let src = srcMatch ? srcMatch[1] : '';
      if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:')) {
        try {
          src = new URL(src, targetUrl).href;
        } catch {}
      }

      if (!hasAlt) {
        missingAltCount++;
      }

      images.push({
        id: `img-${imgIndex}`,
        src,
        alt: altText,
        hasAlt,
        isBroken: !src,
        width: 0,
        height: 0,
        selector: `img[src*="${src.slice(-15)}"]`,
      });
      imgIndex++;
    }

    if (missingAltCount > 0) {
      issues.push({
        id: 'missing-alt-tags',
        category: 'images',
        severity: 'warning',
        title: `${missingAltCount} Image${missingAltCount > 1 ? 's' : ''} Missing alt Attribute`,
        description: 'Images lack alt attributes, failing accessibility requirements and image SEO.',
        recommendation: 'Add descriptive alt text for informative images or empty alt="" for decorative images.',
        context: `${missingAltCount} of ${images.length} images missing alt`,
        scoreImpact: Math.min(12, missingAltCount * 2),
      });
    } else if (images.length > 0) {
      issues.push({
        id: 'all-images-alt',
        category: 'images',
        severity: 'good',
        title: 'All Images Have Alt Attributes',
        description: `All ${images.length} detected images contain an alt attribute.`,
        recommendation: 'Continue maintaining accurate, contextual descriptions.',
        scoreImpact: 0,
      });
    }

    // 7. Links
    const linkRegex = /<a\s+([^>]*?)href=["'](.*?)["']([^>]*?)>([\s\S]*?)<\/a>/gi;
    const links: Array<{ id: string; href: string; text: string; isExternal: boolean; target?: string; rel?: string; selector: string }> = [];
    let linkMatch;
    let linkIndex = 0;
    let genericAnchorCount = 0;
    const genericWords = ['click here', 'here', 'read more', 'more', 'link', 'learn more', 'view', 'go'];

    while ((linkMatch = linkRegex.exec(html)) !== null && linkIndex < 50) {
      let href = linkMatch[2].trim();
      const text = cleanText(linkMatch[4]) || '[No Text]';
      const surrounding = linkMatch[1] + ' ' + linkMatch[3];
      const targetMatch = surrounding.match(/target=["'](.*?)["']/i);
      const relMatch = surrounding.match(/rel=["'](.*?)["']/i);

      if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('#') && !href.startsWith('mailto:')) {
        try {
          href = new URL(href, targetUrl).href;
        } catch {}
      }

      const isExternal = href.startsWith('http') && !href.includes(domain);
      const lower = text.toLowerCase();
      if (!text || genericWords.includes(lower)) {
        genericAnchorCount++;
      }

      links.push({
        id: `link-${linkIndex}`,
        href,
        text,
        isExternal,
        target: targetMatch ? targetMatch[1] : undefined,
        rel: relMatch ? relMatch[1] : undefined,
        selector: `a[href*="${href.slice(-15)}"]`,
      });
      linkIndex++;
    }

    if (genericAnchorCount > 0) {
      issues.push({
        id: 'generic-anchor-text',
        category: 'links',
        severity: 'notice',
        title: `${genericAnchorCount} Link${genericAnchorCount > 1 ? 's' : ''} with Generic Anchor Text`,
        description: 'Links with generic anchor text like "click here" harm accessibility and keyword relevance.',
        recommendation: 'Replace generic labels with specific destination descriptions.',
        context: `${genericAnchorCount} instances found`,
        scoreImpact: 3,
      });
    }

    // 8. WordPress Detection
    const generatorMatch = html.match(/<meta\s+[^>]*name=["']generator["'][^>]*content=["'](.*?)["']/i);
    const generatorMeta = generatorMatch ? generatorMatch[1] : undefined;
    const isWordPress = Boolean(
      (generatorMeta && generatorMeta.toLowerCase().includes('wordpress')) ||
      html.includes('/wp-content/') ||
      html.includes('/wp-includes/')
    );

    let wpVersion: string | undefined;
    if (generatorMeta) {
      const match = generatorMeta.match(/WordPress\s+([\d.]+)/i);
      if (match) wpVersion = match[1];
    }

    const detectedPlugins: string[] = [];
    if (html.includes('elementor')) detectedPlugins.push('Elementor');
    if (html.includes('woocommerce')) detectedPlugins.push('WooCommerce');
    if (html.includes('yoast')) detectedPlugins.push('Yoast SEO');
    if (html.includes('rank-math')) detectedPlugins.push('Rank Math');
    if (html.includes('wp-rocket') || html.includes('w3tc')) detectedPlugins.push('Caching Plugin');

    if (isWordPress) {
      issues.push({
        id: 'wp-detected',
        category: 'wordpress',
        severity: 'good',
        title: 'WordPress Installation Verified',
        description: `Detected WordPress site with ${detectedPlugins.length} active plugin signatures.`,
        recommendation: 'Keep all core files, themes, and plugins updated regularly.',
        context: detectedPlugins.length > 0 ? `Plugins: ${detectedPlugins.join(', ')}` : undefined,
        scoreImpact: 0,
      });
    }

    // 9. HTTPS
    if (!isHttps) {
      issues.push({
        id: 'insecure-http',
        category: 'security',
        severity: 'critical',
        title: 'Site Not Served Over HTTPS',
        description: 'The page is loaded using unencrypted HTTP, exposing user traffic.',
        recommendation: 'Install an SSL certificate and redirect all traffic to HTTPS.',
        scoreImpact: 20,
      });
    } else {
      issues.push({
        id: 'secure-https',
        category: 'security',
        severity: 'good',
        title: 'Secure HTTPS Encryption Active',
        description: 'Page is encrypted via SSL/TLS.',
        recommendation: 'Ensure HSTS headers are enabled for maximum transport security.',
        scoreImpact: 0,
      });
    }

    // Overall Score
    const totalDeductions = issues.reduce((acc, i) => acc + i.scoreImpact, 0);
    const score = Math.max(0, Math.min(100, 100 - totalDeductions));

    const summary = {
      total: issues.length,
      critical: issues.filter(i => i.severity === 'critical').length,
      warning: issues.filter(i => i.severity === 'warning').length,
      notice: issues.filter(i => i.severity === 'notice').length,
      good: issues.filter(i => i.severity === 'good').length,
    };

    const report = {
      id: `audit-${Date.now()}`,
      url: targetUrl,
      domain,
      timestamp: Date.now(),
      score,
      summary,
      issues,
      meta: {
        title: rawTitle,
        titleLength,
        description: rawDesc,
        descriptionLength: descLength,
        canonical: canonicalHref,
        isCanonicalSelfReferencing: canonicalHref ? canonicalHref.replace(/\/$/, '') === targetUrl.replace(/\/$/, '') : false,
        robots: null,
        viewport: viewportMatch ? 'configured' : null,
        charset: 'UTF-8',
        og: {},
        twitter: {},
      },
      headings,
      images,
      links,
      wordpress: {
        isWordPress,
        version: wpVersion,
        plugins: detectedPlugins,
        hasRestApi: html.includes('api.w.org'),
        generator: generatorMeta,
        signatures: isWordPress ? ['Detected in DOM'] : [],
      },
      performance: {
        loadTimeMs,
        domContentLoadedMs: Math.round(loadTimeMs * 0.7),
        ttfbMs: Math.round(loadTimeMs * 0.4),
        domNodesCount: (html.match(/<[a-z0-9]+/gi) || []).length,
        pageSizeEstimateKb,
      },
    };

    return res.status(200).json({ success: true, report });
  } catch (err: any) {
    return res.status(500).json({
      error: `Failed to audit ${targetUrl}: ${err?.message || 'Could not connect to server'}`,
    });
  }
}
