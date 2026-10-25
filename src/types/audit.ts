export type AuditCategory = 
  | 'meta' 
  | 'headings' 
  | 'images' 
  | 'links' 
  | 'wordpress' 
  | 'security' 
  | 'performance';

export type IssueSeverity = 'critical' | 'warning' | 'notice' | 'good';

export interface AuditIssue {
  id: string;
  category: AuditCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  recommendation: string;
  selector?: string;
  context?: string;
  scoreImpact: number;
}

export interface MetaDetails {
  title: string | null;
  titleLength: number;
  description: string | null;
  descriptionLength: number;
  canonical: string | null;
  isCanonicalSelfReferencing: boolean;
  robots: string | null;
  viewport: string | null;
  charset: string | null;
  og: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
  };
  twitter: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
  };
}

export interface HeadingItem {
  id: string;
  level: number;
  text: string;
  selector: string;
  isSkippedHierarchy?: boolean;
}

export interface ImageItem {
  id: string;
  src: string;
  alt: string | null;
  hasAlt: boolean;
  isBroken: boolean;
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
  selector: string;
}

export interface LinkItem {
  id: string;
  href: string;
  text: string;
  isExternal: boolean;
  target?: string | null;
  rel?: string | null;
  status?: number | 'error' | 'ok' | 'checking' | 'cors';
  statusText?: string;
  selector: string;
}

export interface WordPressDetails {
  isWordPress: boolean;
  version?: string;
  theme?: string;
  plugins: string[];
  hasRestApi: boolean;
  generator?: string;
  signatures: string[];
}

export interface PerformanceMetrics {
  loadTimeMs: number;
  domContentLoadedMs: number;
  ttfbMs: number;
  domNodesCount: number;
  pageSizeEstimateKb: number;
}

export interface AuditSummary {
  total: number;
  critical: number;
  warning: number;
  notice: number;
  good: number;
}

export interface AuditReport {
  id: string;
  url: string;
  domain: string;
  timestamp: number;
  score: number;
  summary: AuditSummary;
  issues: AuditIssue[];
  meta: MetaDetails;
  headings: HeadingItem[];
  images: ImageItem[];
  links: LinkItem[];
  wordpress: WordPressDetails;
  performance: PerformanceMetrics;
}

export interface AuditSettings {
  autoAuditOnOpen: boolean;
  checkBrokenLinks: boolean;
  maxLinksToCheck: number;
  minTitleLength: number;
  maxTitleLength: number;
  minDescLength: number;
  maxDescLength: number;
  darkMode: boolean;
}

export type ExtensionMessage =
  | { type: 'RUN_AUDIT'; options?: Partial<AuditSettings> }
  | { type: 'AUDIT_COMPLETE'; report: AuditReport }
  | { type: 'HIGHLIGHT_ELEMENT'; selector: string }
  | { type: 'CHECK_LINK_STATUS'; url: string }
  | { type: 'CHECK_LINK_STATUS_RESULT'; url: string; status: number | 'error' | 'cors'; statusText?: string }
  | { type: 'GET_ACTIVE_TAB_INFO' };
