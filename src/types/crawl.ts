/**
 * Crawl Webhook Request Type
 * Contract between Next.js and n8n for triggering crawl operations
 */
export interface CrawlWebhookRequest {
  company_id: number;
  url: string;
  industry: string;
  company_size: string;
}

/**
 * Meta Tags extracted from HTML
 */
export interface MetaTags {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonical?: string;
  robots?: string;
  charset?: string;
  viewport?: string;
  keywords?: string;
  author?: string;
}

/**
 * Heading element with hierarchy
 */
export interface Heading {
  level: 1 | 2 | 3;
  text: string;
}

/**
 * Link element with classification
 */
export interface Link {
  href: string;
  text: string;
  isInternal: boolean;
  isBroken?: boolean;
}

/**
 * Image element with metadata
 */
export interface Image {
  src: string;
  alt?: string;
  hasWidth?: boolean;
  hasHeight?: boolean;
}

/**
 * Schema.org markup item
 */
export interface SchemaMarkupItem {
  type: string;
  properties: Record<string, unknown>;
}

/**
 * Core Web Vitals metrics
 */
export interface CoreWebVitals {
  lcp?: number; // Largest Contentful Paint (ms)
  fid?: number; // First Input Delay (ms)
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint (ms)
  ttfb?: number; // Time to First Byte (ms)
}

/**
 * Performance metrics from PageSpeed Insights API
 */
export interface PerformanceMetrics {
  mobile: {
    score: number; // 0-100
    cwv: CoreWebVitals;
  };
  desktop: {
    score: number; // 0-100
    cwv: CoreWebVitals;
  };
}

/**
 * Sitemap information
 */
export interface SitemapInfo {
  urlCount: number;
  lastModified?: string;
}

/**
 * Crawl result status
 */
export type CrawlStatus = 'success' | 'failed_timeout' | 'failed_network' | 'failed_invalid_url';

/**
 * Complete crawl result stored in database
 */
export interface CrawlResult {
  companyId: number;
  crawledAt: Date;
  status: CrawlStatus;
  rawHtml?: string;
  htmlTruncated?: boolean;
  metaTags?: MetaTags;
  headings?: Heading[];
  schemaMarkup?: SchemaMarkupItem[];
  performanceMetrics?: PerformanceMetrics;
  robotsTxt?: string;
  sitemapInfo?: SitemapInfo;
  detectedCms?: string;
  isLatest: boolean;
}

/**
 * n8n workflow node response contract
 */
export interface N8nWorkflowResponse {
  success: boolean;
  crawlResultId?: number;
  status: CrawlStatus;
  errorMessage?: string;
  errorCode?: string;
  metadata?: {
    executionTime: number;
    htmlLength: number;
    schemaCount: number;
  };
}
