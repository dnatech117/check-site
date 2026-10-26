export type AuditCategory = 
  | 'meta' 
  | 'headings' 
  | 'images' 
  | 'links' 
  | 'wordpress' 
  | 'security' 
  | 'performance'
  | 'vitals'
  | 'schema'
  | 'accessibility'
  | 'tech';

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

export interface SecurityHeaderCheck {
  name: string;
  value?: string | null;
  status: 'enforced' | 'missing' | 'weak';
  details: string;
}

export interface LeakedSecretItem {
  id: string;
  type: string;
  preview: string;
  location: string;
  severity: 'critical' | 'warning';
}

export interface SecurityDetails {
  isHttps: boolean;
  mixedContentCount: number;
  headers: SecurityHeaderCheck[];
  leakedSecrets: LeakedSecretItem[];
  sensitivePathsFound: string[];
  unsafeBlankLinksCount: number;
}

export interface LcpDiagnostic {
  candidateSelector?: string;
  candidateTag?: string;
  candidateSrc?: string;
  hasLazyLoading: boolean;
  hasFetchPriorityHigh: boolean;
  isModernFormat: boolean;
}

export interface ClsRiskItem {
  selector: string;
  tag: string;
  src?: string;
  reason: string;
}

export interface WebVitalsDetails {
  lcp: LcpDiagnostic;
  clsRisks: ClsRiskItem[];
  renderBlockingScripts: number;
  renderBlockingStylesheets: number;
  missingPreconnects: string[];
}

export interface SchemaItem {
  id: string;
  type: string;
  context: string;
  rawJson: string;
  isValidJson: boolean;
  errors: string[];
  warnings: string[];
  propertiesCount: number;
}

export interface SchemaDetails {
  totalSchemas: number;
  validCount: number;
  invalidCount: number;
  items: SchemaItem[];
}

export interface ContrastIssueItem {
  selector: string;
  text: string;
  textColor: string;
  backgroundColor: string;
  contrastRatio: number;
  requiredRatio: number;
  isLargeText: boolean;
  passesAA: boolean;
}

export interface TouchTargetIssueItem {
  selector: string;
  tag: string;
  text: string;
  width: number;
  height: number;
}

export interface FormAccessibilityItem {
  selector: string;
  tag: string;
  type?: string;
  missingLabel: boolean;
}

export interface AccessibilityDetails {
  htmlLang: string | null;
  isLangValid: boolean;
  contrastIssues: ContrastIssueItem[];
  touchTargetIssues: TouchTargetIssueItem[];
  formIssues: FormAccessibilityItem[];
  hasSkipLink: boolean;
  hasViewportZoomDisabled: boolean;
}

export interface TechStackItem {
  name: string;
  category: 'Framework' | 'CMS' | 'CDN' | 'Analytics' | 'Library' | 'Hosting';
  version?: string;
  confidence: 'high' | 'medium';
}

export interface TechStackDetails {
  items: TechStackItem[];
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
  security?: SecurityDetails;
  vitals?: WebVitalsDetails;
  schema?: SchemaDetails;
  accessibility?: AccessibilityDetails;
  techStack?: TechStackDetails;
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
