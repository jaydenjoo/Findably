# n8n Findably Crawling Workflow Documentation

> **Purpose**: Complete n8n workflow design for automated website crawling, parsing, and data storage in Supabase
>
> **Version**: 1.0
> **Last Updated**: 2026-03-11
> **Status**: Design Document (Ready for Implementation)

---

## Overview

The Findably n8n crawling workflow is a fully-automated pipeline that:
1. Receives a webhook trigger with company URL
2. Crawls the website using Playwright (headless browser)
3. Parses HTML, extracts meta tags, headings, and links
4. Parses Schema.org markup (JSON-LD and Microdata)
5. Fetches robots.txt and sitemap.xml
6. Calls Google PageSpeed Insights API for performance metrics
7. Detects CMS platform
8. Stores all results in Supabase PostgreSQL database

**Total execution time**: ~30-60 seconds per URL (depending on site size and API latency)

---

## Workflow Architecture

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Next.js Frontend (Onboarding)                               │
│ → Server Action triggerCrawling()                           │
│ → POST { company_id, url, industry, company_size }          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ n8n Webhook Trigger Node   │
        │ /webhook/findably-crawl    │
        └────────┬───────────────────┘
                 │
        ┌────────▼─────────────────────┐
        │ Set Variables (Normalize)    │
        │ - Extract fields             │
        │ - Validate URL format        │
        └────────┬─────────────────────┘
                 │
        ┌────────▼──────────────────────┐
        │ HTTP: Fetch URL with Playwright│
        │ - Open headless browser       │
        │ - Wait 3 seconds              │
        │ - Capture full HTML           │
        └────────┬──────────────────────┘
                 │
        ┌────────▼──────────────────────┐
        │ Error Handler (Network/Timeout)│
        │ - 404, Connection Refused,    │
        │ - Timeout > 300s              │
        └────────┬──────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼ (Success)              ▼ (Failure)
  [Continue]            [Store Error → Supabase]
    │                         │
    ├─ Code: Parse HTML       │
    ├─ Code: Parse Schema     │
    ├─ HTTP: Fetch robots.txt │
    ├─ HTTP: Fetch sitemap    │
    ├─ HTTP: PageSpeed API    │
    ├─ Code: Detect CMS       │
    ├─ Code: Aggregate Data   │
    │                         │
    ├─────────────────────────┤
    │                         │
    └────┬───────────────────┬┘
         │                   │
         ▼                   ▼
    [Insert to Supabase] [Update Status]
```

---

## Workflow Nodes (Detailed)

### 1. Webhook Trigger Node

**Type**: Webhook
**Configuration**:
- Method: POST
- Path: `/webhook/findably-crawl`
- Full URL: `https://YOUR_N8N_INSTANCE/webhook/findably-crawl`

**Input (Request Body)**:
```json
{
  "company_id": 123,
  "url": "https://example.com",
  "industry": "ecommerce",
  "company_size": "small"
}
```

**Output**: Passes all JSON fields downstream

**Notes**:
- URL must include protocol (http:// or https://)
- No authentication required (n8n webhook is public by default; set basic auth in n8n settings if needed)

---

### 2. Set Variables Node (Normalize Inputs)

**Type**: Set (n8n native node)

**Purpose**: Extract and validate webhook input fields

**Configuration**:
```
Set the following fields:
  company_id = {{ $json.company_id }}
  url = {{ $json.url }}
  industry = {{ $json.industry }}
  company_size = {{ $json.company_size }}
```

**Output**: Same structure, ready for downstream nodes

---

### 3. Fetch URL with Playwright Node

**Type**: HTTP Request (or custom Playwright action)

**Alternative Implementations**:
- **Option A**: Use n8n's HTTP Request node to call a custom Playwright service
- **Option B**: Use n8n's Browser action (if available in your version)
- **Recommended**: HTTP Request to a Playwright-as-a-Service API (e.g., Bright Data, ScrapingBee)

**Configuration (using HTTP Request)**:

```javascript
// Method: POST
URL: https://api.your-playwright-service.com/capture-html
Headers:
  Authorization: Bearer {{ $env.PLAYWRIGHT_API_KEY }}
  Content-Type: application/json

Body (JSON):
{
  "url": "{{ $json.url }}",
  "waitTime": 3000,
  "fullPage": true,
  "timeout": 300000
}
```

**Expected Response**:
```json
{
  "html": "<html>...</html>",
  "statusCode": 200,
  "executionTime": 15000
}
```

**Error Handling**:
- If status code is 404: Pass to Error Handler with status `failed_network`
- If timeout > 300s: Pass to Error Handler with status `failed_timeout`
- If network error: Pass to Error Handler with status `failed_network`

**Fallback (No Service Available)**:
Use n8n's built-in Code node with a simple HTTP GET (without JS execution):
```javascript
// This is a simplified approach for MVP
// Will NOT render JavaScript-heavy SPAs

const http = require('http');
const https = require('https');
const url = require('url');

const parsedUrl = url.parse($json.url);
const protocol = parsedUrl.protocol === 'https:' ? https : http;

return new Promise((resolve, reject) => {
  protocol.get($json.url, { timeout: 300000 }, (res) => {
    let html = '';
    res.on('data', (chunk) => { html += chunk; });
    res.on('end', () => {
      resolve({ html, statusCode: res.statusCode, executionTime: 0 });
    });
  }).on('error', reject);
});
```

---

### 4. Error Handler Node (Network/Timeout)

**Type**: Try/Catch or Error Trigger

**Logic**:
```
IF (status code not in [200, 301, 302])
  THEN status = "failed_network"

IF (execution time > 300000 ms)
  THEN status = "failed_timeout"

IF (URL is invalid)
  THEN status = "failed_invalid_url"
```

**On Error**:
1. Set `crawl_status = "failed_*"`
2. Set `error_message = "<human-readable error>"`
3. Jump to "Insert to Supabase" node (skip parsing steps)

**On Success**:
1. Continue to HTML Parser node

---

### 5. Code Node: HTML Parser

**Type**: Code (JavaScript)

**Purpose**: Extract SEO elements from raw HTML

**Input**:
- `$json.html` — Raw HTML string
- `$json.url` — Website URL (for domain detection)

**Implementation** (using Cheerio library, pre-installed in n8n):

```javascript
const cheerio = require('cheerio');

const html = $json.html;
const url = $json.url;
const $ = cheerio.load(html);

// Extract meta tags
const metaTags = {
  title: $('title').text() || undefined,
  description: $('meta[name="description"]').attr('content'),
  ogTitle: $('meta[property="og:title"]').attr('content'),
  ogDescription: $('meta[property="og:description"]').attr('content'),
  ogImage: $('meta[property="og:image"]').attr('content'),
  ogType: $('meta[property="og:type"]').attr('content'),
  twitterTitle: $('meta[name="twitter:title"]').attr('content'),
  twitterDescription: $('meta[name="twitter:description"]').attr('content'),
  twitterImage: $('meta[name="twitter:image"]').attr('content'),
  canonical: $('link[rel="canonical"]').attr('href'),
  robots: $('meta[name="robots"]').attr('content'),
  charset: $('meta[charset]').attr('charset'),
  viewport: $('meta[name="viewport"]').attr('content'),
  keywords: $('meta[name="keywords"]').attr('content'),
  author: $('meta[name="author"]').attr('content'),
};

// Extract headings (h1-h3)
const headings = [];
$('h1, h2, h3').each((_, el) => {
  const text = $(el).text().trim();
  if (text) {
    headings.push({
      level: parseInt(el.name[1]),
      text: text,
    });
  }
});

// Extract links
const links = [];
const urlObj = new URL(url);
const baseDomain = urlObj.hostname;

$('a[href]').each((_, el) => {
  const href = $(el).attr('href');
  const text = $(el).text().trim();

  if (!href) return;

  // Determine if internal
  let isInternal = false;
  try {
    const linkUrl = new URL(href, url);
    isInternal = linkUrl.hostname === baseDomain;
  } catch (e) {
    // Relative URL
    isInternal = true;
  }

  links.push({
    href: href,
    text: text,
    isInternal: isInternal,
  });
});

// Extract images
const images = [];
$('img').each((_, el) => {
  images.push({
    src: $(el).attr('src'),
    alt: $(el).attr('alt'),
    hasWidth: $(el).attr('width') ? true : false,
    hasHeight: $(el).attr('height') ? true : false,
  });
});

// Detect character encoding
const charsetMeta = $('meta[charset]').attr('charset') ||
                     $('meta[http-equiv="Content-Type"]').attr('content');

return {
  metaTags: metaTags,
  headings: headings,
  links: links,
  images: images,
  charset: charsetMeta || 'UTF-8',
};
```

**Output**:
```json
{
  "metaTags": { "title": "...", "description": "..." },
  "headings": [{ "level": 1, "text": "..." }],
  "links": [{ "href": "...", "text": "...", "isInternal": true }],
  "images": [{ "src": "...", "alt": "...", "hasWidth": true }],
  "charset": "UTF-8"
}
```

---

### 6. Code Node: Schema.org Parser

**Type**: Code (JavaScript)

**Purpose**: Extract JSON-LD and Microdata from HTML

**Input**:
- `$json.html` — Raw HTML string

**Implementation**:

```javascript
const cheerio = require('cheerio');

const html = $json.html;
const $ = cheerio.load(html);
const schemaMarkups = [];

// Parse JSON-LD scripts
$('script[type="application/ld+json"]').each((_, el) => {
  try {
    const jsonld = JSON.parse($(el).html());

    // Handle both single object and array
    const items = Array.isArray(jsonld) ? jsonld : [jsonld];

    items.forEach(item => {
      if (item['@type']) {
        schemaMarkups.push({
          type: item['@type'],
          properties: item,
        });
      }
    });
  } catch (e) {
    // Malformed JSON-LD, skip
  }
});

// Parse Microdata (simplified)
$('[itemtype]').each((_, el) => {
  const $el = $(el);
  const itemtype = $el.attr('itemtype');
  const properties = {};

  $el.find('[itemprop]').each((_, propEl) => {
    const propName = $(propEl).attr('itemprop');
    const propValue = $(propEl).attr('content') || $(propEl).text();
    properties[propName] = propValue;
  });

  if (itemtype) {
    schemaMarkups.push({
      type: itemtype.split('/').pop(), // Extract last part of URL
      properties: properties,
    });
  }
});

return {
  schemaMarkup: schemaMarkups.length > 0 ? schemaMarkups : undefined,
  schemaCount: schemaMarkups.length,
};
```

**Output**:
```json
{
  "schemaMarkup": [
    {
      "type": "Organization",
      "properties": { "name": "...", "url": "...", "logo": "..." }
    }
  ],
  "schemaCount": 1
}
```

---

### 7. HTTP Request Node: Fetch robots.txt

**Type**: HTTP Request

**Configuration**:
```
Method: GET
URL: {{ $json.url.split('/').slice(0, 3).join('/') }}/robots.txt
Timeout: 30000 (30 seconds)
```

**On Success**: Store content in `robotsTxt`
**On Error** (404 or timeout): Set `robotsTxt = null` and continue (not critical)

**Output**:
```javascript
{
  "robotsTxt": "User-agent: *\nDisallow: /admin"
}
```

---

### 8. HTTP Request Node: Fetch sitemap.xml

**Type**: HTTP Request

**Configuration**:
```
Method: GET
URL: {{ $json.url.split('/').slice(0, 3).join('/') }}/sitemap.xml
Timeout: 30000 (30 seconds)
```

**On Success**: Parse XML and extract URL count
**On Error** (404 or timeout):
- Check robots.txt for Sitemap directive
- If not found, set `sitemapInfo = null`

**Implementation (Code Node instead)**:

```javascript
const xml2js = require('xml2js');
const http = require('http');
const https = require('https');

const sitemapUrl = $json.url.split('/').slice(0, 3).join('/') + '/sitemap.xml';
const protocol = sitemapUrl.startsWith('https') ? https : http;

return new Promise((resolve, reject) => {
  protocol.get(sitemapUrl, { timeout: 30000 }, (res) => {
    let xml = '';
    res.on('data', (chunk) => { xml += chunk; });
    res.on('end', () => {
      try {
        const parser = new xml2js.Parser();
        parser.parseString(xml, (err, result) => {
          if (err) return resolve({ sitemapInfo: null });

          const urls = result.urlset?.url || [];
          const lastmod = urls[0]?.lastmod?.[0] || undefined;

          resolve({
            sitemapInfo: {
              urlCount: urls.length,
              lastModified: lastmod,
            },
          });
        });
      } catch (e) {
        resolve({ sitemapInfo: null });
      }
    });
  }).on('error', () => {
    resolve({ sitemapInfo: null });
  });
});
```

---

### 9. HTTP Request Node: Google PageSpeed Insights API

**Type**: HTTP Request

**Configuration**:
```
Method: GET
URL: https://www.googleapis.com/pagespeedonline/v5/runPagespeed
Query Parameters:
  url: {{ $json.url }}
  key: {{ $env.GOOGLE_PAGESPEED_API_KEY }}
  category: performance,web_vitals
  strategy: mobile,desktop

Timeout: 60000 (60 seconds)
```

**On Success**: Extract scores and Core Web Vitals

**On Error** (API quota exceeded, invalid key): Set `performanceMetrics = null` and continue

**Implementation (Code Node to parse response)**:

```javascript
const apiResponse = $json; // From previous HTTP Request

if (!apiResponse.lighthouseResult) {
  return { performanceMetrics: null };
}

const parseScore = (result) => ({
  score: Math.round(result?.lighthouseResult?.categories?.performance?.score * 100) || 0,
  cwv: {
    lcp: result?.lighthouseResult?.audits?.['largest-contentful-paint']?.numericValue,
    fid: result?.lighthouseResult?.audits?.['first-input-delay']?.numericValue,
    cls: result?.lighthouseResult?.audits?.['cumulative-layout-shift']?.numericValue,
    fcp: result?.lighthouseResult?.audits?.['first-contentful-paint']?.numericValue,
    ttfb: result?.lighthouseResult?.audits?.['speed-index']?.numericValue,
  },
});

return {
  performanceMetrics: {
    mobile: parseScore(apiResponse), // Mobile request
    desktop: parseScore(apiResponse), // Desktop request (run twice or use runPagespeed's built-in)
  },
};
```

**Note**: Google PageSpeed API returns combined results. For separate mobile/desktop scores, call the endpoint twice (once with strategy=mobile, once with strategy=desktop).

---

### 10. Code Node: Detect CMS

**Type**: Code (JavaScript)

**Purpose**: Identify website CMS platform

**Input**:
- `$json.html` — Raw HTML string
- `$json.metaTags` — Extracted meta tags

**Implementation**:

```javascript
const cheerio = require('cheerio');
const html = $json.html;
const $ = cheerio.load(html);

const detectCMS = () => {
  // Check for generator meta tag
  const generator = $('meta[name="generator"]').attr('content') || '';

  const cmsSignatures = {
    'WordPress': [
      'wordpress',
      '/wp-content/',
      '/wp-includes/',
      'wp-json',
      'wp-emoji'
    ],
    'Shopify': [
      'shopify',
      'Shopify.shop',
      'cdn/shop/',
      'myshopify.com'
    ],
    'Wix': [
      'wix',
      'wix-container',
      '_wix',
      'wixCode'
    ],
    'Blogger': [
      'blogger',
      'blogspot.com'
    ],
    'Medium': [
      'medium',
      '/cdn-cgi/'
    ],
    'Drupal': [
      'drupal',
      '/sites/all/',
      '/modules/'
    ],
    '카페24': [
      'cafe24',
      'www.cafe24.com'
    ],
    '고도몰': [
      'godo',
      'godomall'
    ],
    '아임웹': [
      'imweb',
      'imweb.co.kr'
    ],
  };

  // First, check generator tag
  for (const [cms, keywords] of Object.entries(cmsSignatures)) {
    if (keywords.some(kw => generator.toLowerCase().includes(kw))) {
      return cms;
    }
  }

  // Then, check script sources and link hrefs
  const sourceCode = html.toLowerCase();
  for (const [cms, keywords] of Object.entries(cmsSignatures)) {
    if (keywords.some(kw => sourceCode.includes(kw))) {
      return cms;
    }
  }

  return null;
};

return {
  detectedCms: detectCMS(),
};
```

**Output**:
```json
{
  "detectedCms": "WordPress"
}
```

---

### 11. Code Node: Aggregate Results

**Type**: Code (JavaScript)

**Purpose**: Combine all parsed data into final crawl result

**Input**: Outputs from nodes 5-10

**Implementation**:

```javascript
const result = {
  company_id: $json.company_id,
  url: $json.url,
  crawled_at: new Date().toISOString(),
  status: 'success', // Will be overridden if any step failed

  // From HTML Parser
  meta_tags: $json.metaTags,
  headings: $json.headings,
  links: $json.links,
  images: $json.images,

  // From Schema Parser
  schema_markup: $json.schemaMarkup,

  // From robots.txt
  robots_txt: $json.robotsTxt,

  // From sitemap
  sitemap_info: $json.sitemapInfo,

  // From PageSpeed
  performance_metrics: $json.performanceMetrics,

  // From CMS Detection
  detected_cms: $json.detectedCms,

  // Metadata
  html_length: $json.html?.length || 0,
  html_truncated: ($json.html?.length || 0) > 5242880, // 5MB limit
};

// Truncate HTML if too large
if (result.html_truncated) {
  result.raw_html = ($json.html || '').substring(0, 5242880);
} else {
  result.raw_html = $json.html;
}

return result;
```

---

### 12. HTTP Request Node: Insert to Supabase

**Type**: HTTP Request (or Supabase connector if available)

**Configuration**:
```
Method: POST
URL: https://YOUR_SUPABASE_PROJECT.supabase.co/rest/v1/crawl_results
Headers:
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Content-Type: application/json
  Prefer: return=representation

Body (JSON):
{
  "company_id": {{ $json.company_id }},
  "crawled_at": "{{ $json.crawled_at }}",
  "status": "{{ $json.status }}",
  "raw_html": "{{ $json.raw_html }}",
  "html_truncated": {{ $json.html_truncated }},
  "meta_tags": {{ JSON.stringify($json.meta_tags) }},
  "headings": {{ JSON.stringify($json.headings) }},
  "schema_markup": {{ JSON.stringify($json.schema_markup) }},
  "performance_metrics": {{ JSON.stringify($json.performance_metrics) }},
  "robots_txt": "{{ $json.robots_txt }}",
  "sitemap_info": {{ JSON.stringify($json.sitemap_info) }},
  "detected_cms": "{{ $json.detected_cms }}",
  "is_latest": true
}
```

**On Success**: Return crawl_result_id to caller

**On Error**:
- Log error to Sentry
- Return error response

---

## Error Handling Strategy

### Error Scenarios

| Scenario | Status Code | Handling |
|----------|---|---|
| **Invalid URL** | 400 | Reject at webhook, return error |
| **Network timeout** | 504 | Set status = `failed_timeout` |
| **404 / Not found** | 404 | Set status = `failed_network` |
| **Connection refused** | ECONNREFUSED | Set status = `failed_network` |
| **robots.txt missing** | 404 | Continue (not critical) |
| **sitemap.xml missing** | 404 | Continue (not critical) |
| **PageSpeed API quota** | 429 | Set performance_metrics = null, continue |
| **Supabase insert fails** | 5xx | Log to Sentry, return error |

### Retry Logic

**Exponential Backoff Configuration**:
- Retry on: network errors, 5xx responses, timeouts
- Max retries: 3
- Delays: 10s, 30s, 60s
- After 3 failed retries: mark as `failed_network` and store error message

### Timeout Configuration

| Operation | Timeout |
|-----------|---------|
| Playwright crawl | 300s (5 minutes) |
| robots.txt fetch | 30s |
| sitemap.xml fetch | 30s |
| PageSpeed API | 60s |
| Supabase insert | 30s |

---

## Environment Variables

Configure the following in n8n:

```bash
# Supabase
SUPABASE_PROJECT_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google PageSpeed API
GOOGLE_PAGESPEED_API_KEY=AIzaSy...

# n8n Basic Auth (optional, for webhook security)
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=findably_webhook
N8N_BASIC_AUTH_PASSWORD=secure_random_password
```

---

## Webhook Security

### Option 1: Basic Authentication
Enable n8n built-in basic auth:
```
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=findably_webhook
N8N_BASIC_AUTH_PASSWORD={{ $env.N8N_WEBHOOK_PASSWORD }}
```

### Option 2: API Key Header
Add validation in webhook node:
```javascript
if ($headers['x-api-key'] !== $env.N8N_API_KEY) {
  throw new Error('Unauthorized');
}
```

### Option 3: IP Whitelist
Configure n8n firewall to allow only your Next.js server IP

---

## Testing

### Test Data

```json
{
  "company_id": 1,
  "url": "https://example.com",
  "industry": "ecommerce",
  "company_size": "small"
}
```

### Mock Responses

For development, mock PageSpeed API responses:
```javascript
// In Code node instead of real API call
return {
  performanceMetrics: {
    mobile: { score: 85, cwv: { lcp: 2500, fid: 100, cls: 0.1 } },
    desktop: { score: 92, cwv: { lcp: 1800, fid: 50, cls: 0.05 } },
  },
};
```

---

## Deployment

### Local Development
1. Start n8n: `docker run -d --name n8n -p 5678:5678 n8nio/n8n`
2. Access: http://localhost:5678
3. Create workflow from `docs/n8n-findably-crawl-workflow.json`

### Production (Railway)
1. Deploy n8n Docker image to Railway
2. Set environment variables in Railway dashboard
3. Configure webhook URL in Supabase environment
4. Enable HTTPS for webhook security

### Production (Fly.io)
1. Create `fly.toml` configuration
2. Deploy with `fly deploy`
3. Access via `https://findably-n8n.fly.dev`

---

## Performance Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| Crawl latency (p50) | <30s | HTML size <5MB |
| Crawl latency (p95) | <60s | Includes API calls |
| Success rate | >95% | Excludes invalid URLs |
| Error rate | <5% | Network/timeout errors |
| API cost | $0.10 per crawl | PageSpeed + Supabase + n8n |

---

## Future Enhancements

- [ ] Scheduled re-crawling (hourly/daily)
- [ ] JavaScript rendering detection (Chrome DevTools Protocol)
- [ ] Mobile screenshot capture
- [ ] Performance degradation alerts
- [ ] Multi-language content detection
- [ ] Structured data validation against schema.org specs
- [ ] Competitor analysis (crawl multiple URLs)

---

## References

- [Google PageSpeed Insights API Documentation](https://developers.google.com/speed/docs/insights/v5/get-started)
- [Schema.org Markup Reference](https://schema.org)
- [n8n Documentation](https://docs.n8n.io)
- [Cheerio HTML Parser](https://cheerio.js.org)
