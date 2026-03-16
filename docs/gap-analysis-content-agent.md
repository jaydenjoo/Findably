# Gap Analysis: Content Agent Data Mismatch

> **Purpose**: Map available Layer1Data fields to buildCrawlSummary usage, identify what content agent receives vs. what its systemPrompt promises, and recommend enrichments for Task 5.2
> **Date**: 2026-03-15
> **Status**: Analysis Complete — Ready for Task 5.2 Implementation

---

## 1. Layer1Data Fields Inventory

### Complete Layer1Data Interface Structure

```typescript
export interface Layer1Data {
  meta: {
    title: string | null
    description: string | null
    canonical: string | null
    charset: string | null
    viewport: string | null
    og: Record<string, string>
    robots_meta: string | null
  }
  headings: {
    h1: string[]
    h2: string[]
    h3: string[]
    h4: string[]
    h5: string[]
    h6: string[]
  }
  schema_markup: unknown[]
  links: {
    internal: number
    external: number
    broken: Array<{ url: string; status: number }>
  }
  images: {
    total: number
    without_alt: number
    large_images: Array<{ src: string; size_kb: number }>
  }
  page_size_bytes: number
  load_time_ms: number
  html_lang: string | null
}
```

### Field Usage Matrix

| Field                   | Data Type              | buildCrawlSummary Usage | Section         | Format                            | Notes                                                      |
| ----------------------- | ---------------------- | ----------------------- | --------------- | --------------------------------- | ---------------------------------------------------------- |
| **meta.title**          | string \| null         | ✅ USED                 | HTML 메타데이터 | Literal value or "N/A"            | Critical SEO field                                         |
| **meta.description**    | string \| null         | ✅ USED                 | HTML 메타데이터 | Literal value or "N/A"            | Critical SEO field                                         |
| **meta.canonical**      | string \| null         | ✅ USED                 | HTML 메타데이터 | Literal value or "N/A"            | Canonicalization signal                                    |
| **meta.charset**        | string \| null         | ❌ OMITTED              | —               | —                                 | Available but unused                                       |
| **meta.viewport**       | string \| null         | ❌ OMITTED              | —               | —                                 | Available but unused                                       |
| **meta.og**             | Record<string, string> | ❌ OMITTED              | —               | —                                 | Available but unused; potentially rich for content preview |
| **meta.robots_meta**    | string \| null         | ❌ OMITTED              | —               | —                                 | Available but unused                                       |
| **headings.h1**         | string[]               | ✅ USED                 | HTML 메타데이터 | Array joined with ", "            | Full text preserved                                        |
| **headings.h2**         | string[]               | ⚠️ LENGTH ONLY          | HTML 메타데이터 | `.length` count only              | Full text omitted                                          |
| **headings.h3**         | string[]               | ❌ OMITTED              | —               | —                                 | Structure signal omitted                                   |
| **headings.h4**         | string[]               | ❌ OMITTED              | —               | —                                 | Structure signal omitted                                   |
| **headings.h5**         | string[]               | ❌ OMITTED              | —               | —                                 | Structure signal omitted                                   |
| **headings.h6**         | string[]               | ❌ OMITTED              | —               | —                                 | Structure signal omitted                                   |
| **schema_markup**       | unknown[]              | ⚠️ EXISTENCE FLAG       | HTML 메타데이터 | Y/N flag (length > 0 ? 'Y' : 'N') | Detailed structure omitted                                 |
| **links.internal**      | number                 | ✅ USED                 | HTML 메타데이터 | Count                             | Connectivity metric                                        |
| **links.external**      | number                 | ✅ USED                 | HTML 메타데이터 | Count                             | Connectivity metric                                        |
| **links.broken**        | Array<{url, status}>   | ⚠️ COUNT ONLY           | HTML 메타데이터 | `.length` count only              | Specific URLs/targets omitted                              |
| **images.total**        | number                 | ✅ USED                 | HTML 메타데이터 | Count in "N/M" format             | Visual content signal                                      |
| **images.without_alt**  | number                 | ✅ USED                 | HTML 메타데이터 | Count in "N/M" format             | Accessibility signal                                       |
| **images.large_images** | Array<{src, size_kb}>  | ❌ OMITTED              | —               | —                                 | Available but unused; could signal optimization            |
| **page_size_bytes**     | number                 | ✅ USED                 | HTML 메타데이터 | Converted to KB, rounded          | Performance metric                                         |
| **load_time_ms**        | number                 | ✅ USED                 | HTML 메타데이터 | Literal value in ms               | Performance metric                                         |
| **html_lang**           | string \| null         | ✅ USED                 | HTML 메타데이터 | Literal value or "N/A"            | Content language signal                                    |

---

## 2. buildCrawlSummary Output Structure

### 9-Section Markdown Architecture

**Source**: `src/features/diagnosis-paid/services/run-diagnosis-paid.ts`, lines 296-413

#### Section 1: HTML 메타데이터 (HTML Metadata)

```
### HTML 메타데이터
- Title: [meta.title ?? 'N/A']
- Description: [meta.description ?? 'N/A']
- Canonical: [meta.canonical ?? 'N/A']
- H1: [headings.h1.join(', ') || 'N/A']
- H2 개수: [headings.h2.length]
- 내부 링크: [links.internal]개
- 외부 링크: [links.external]개
- 깨진 링크: [links.broken.length]개
- 이미지(alt 없음): [images.without_alt]/[images.total]개
- Schema: [schema_markup.length > 0 ? 'Y' : 'N']
- 페이지 크기: [Math.round(page_size_bytes / 1024)]KB
- 로딩 시간: [load_time_ms]ms
- 언어: [html_lang ?? 'N/A']
```

#### Sections 2-9: Others

- **robots.txt 정보**: From robots_txt_data (separate field)
- **sitemap.xml 정보**: From sitemap_data (separate field)
- **llms.txt 정보**: From llms_txt_data (separate field)
- **PageSpeed Insights**: From layer2 (PageSpeed API results)
- **CrUX 데이터**: From layer2 (CrUX API results)
- **SSL/TLS 검증**: From layer3 (SSL Labs data)
- **보안 헤더**: From layer3 (Mozilla Observatory data)
- **모바일 최적화**: From mobile_data (separate field)

---

## 3. Content Agent SystemPrompt vs. Actual Data

### SystemPrompt Promise

**Source**: `src/features/diagnosis-paid/services/run-diagnosis-paid.ts`, line 281

```
focusMap: {
  content: {
    systemPrompt: `당신은 콘텐츠 전문가입니다. 다음 데이터를 분석하여 콘텐츠 품질, 구조, 전문성 관점에서 분석해주세요.`,
    // Translation: "You are a content expert. Analyze the following data from the perspective of content quality, structure, and expertise."
  }
}
```

### Promised Analysis Dimensions

1. **콘텐츠 품질 (Content Quality)**: Prose clarity, writing effectiveness, message clarity
2. **구조 (Structure)**: Organization, logical flow, information hierarchy, coherence
3. **전문성 (Expertise)**: Authority signals, depth of coverage, factual accuracy, credibility indicators

### Actual Data Received by Content Agent

**Markdown Input to Claude API**:

```
### HTML 메타데이터
- Title: [text]
- Description: [text]
- Canonical: [URL or N/A]
- H1: [text]
- H2 개수: [count]
- 내부 링크: [count]개
- 외부 링크: [count]개
- 깨진 링크: [count]개
- 이미지(alt 없음): [count]/[total]개
- Schema: Y/N
- 페이지 크기: [KB]
- 로딩 시간: [ms]
- 언어: [lang code or N/A]
```

**Data Categories Available**:

1. **Actual Text**: title (1 field), description (1 field), h1 (1 array of heading texts) = **3 text samples total**
2. **Structural Counts**: h2.length, links (internal/external/broken counts), image counts = **Counts only, no actual text**
3. **Metadata Flags**: Schema existence (Y/N), language code = **Flags, no detail**
4. **Performance Metrics**: page_size_bytes, load_time_ms = **Not content quality signals**

---

## 4. Critical Data Gaps Preventing Full Analysis

### Gap 1: Missing Actual Content Text

**Problem**: Agent cannot evaluate prose quality, clarity, or writing effectiveness

- Has: Title (1 short string), Description (1 short string), H1 (1 heading)
- Lacks: Body paragraph text, actual H2-H6 content, call-to-action text, conclusion text
- **Impact**: Cannot assess readability, tone, persuasiveness, factual depth

### Gap 2: Missing Detailed Structure Analysis

**Problem**: Agent sees only heading count, not actual structure

- Has: `h2.length` = 5 (just a number)
- Lacks: Actual H2 texts (`headings.h2` array), H3-H6 structure hierarchy, section-to-paragraph nesting
- **Impact**: Cannot assess whether structure logically supports content flow

### Gap 3: Missing Detailed Schema Analysis

**Problem**: Agent sees only "Schema exists: Y/N"

- Has: `schema_markup.length > 0 ? 'Y' : 'N'`
- Lacks: Actual `schema_markup` array content (JSON-LD structure, types, properties)
- **Impact**: Cannot assess schema correctness, completeness, relevance to content

### Gap 4: Missing Image Content Analysis

**Problem**: Agent sees only counts and can't assess visual quality

- Has: `without_alt / total` count (e.g., "2/10")
- Lacks: Actual alt text samples, image descriptions, visual content relevance
- **Impact**: Cannot assess whether images support content claims or whether alt text is descriptive

### Gap 5: Missing Readability Metrics

**Problem**: Agent has no signals for content readability

- Has: Page size (KB), load time (ms)
- Lacks: Sentence/paragraph length, word frequency, flesch-kincaid score, keyword density
- **Impact**: Cannot assess whether content is accessible to target audience

### Gap 6: Missing Content Freshness/Authority Signals

**Problem**: Agent cannot assess expertise or currency

- Has: OG tags are available in Layer1Data.meta.og but not passed to agent
- Lacks: Publication date, last updated date, author information, source citations
- **Impact**: Cannot assess expertise, currency, or authority

---

## 5. What Content Agent Can Evaluate with Current Data

### ✅ Possible Analyses (Limited)

1. **Title Quality**: Check length, presence of brand/keyword balance, clarity
   - Data: `meta.title` (available in markdown)
2. **Meta Description Quality**: Check length, call-to-action presence, keyword inclusion
   - Data: `meta.description` (available in markdown)
3. **H1 Presence & Quality**: Check if H1 exists, matches page intent, not duplicated
   - Data: `headings.h1[0]` (available in markdown)
4. **Basic Structure Existence**: Check if H2+ exists (shows some organization)
   - Data: `h2.length` count (available but limited)
5. **Link Strategy**: Assess balance of internal/external links as connectivity signal
   - Data: `links.internal`, `links.external`, `links.broken.length` (available in markdown)
6. **Image Strategy**: Assess whether site is visually rich and accessible
   - Data: `images.total`, `images.without_alt` (available in markdown)
7. **Schema Markup Adoption**: Check if structured data is present
   - Data: `schema_markup.length > 0 ? 'Y' : 'N'` (available but minimal)

### ❌ Impossible Analyses (Data Missing)

1. Content narrative quality (missing actual body text)
2. Section-by-section organization (missing H2-H6 texts)
3. Keyword optimization (missing content text for frequency analysis)
4. Readability level (missing reading metrics)
5. Factual accuracy (missing content text)
6. Expertise signals (missing author/date/citations)
7. Visual-content alignment (missing image descriptions)
8. Technical depth (missing detailed schema structure)
9. Prose tone consistency (missing prose samples)
10. Call-to-action effectiveness (missing actual CTA text)

---

## 6. Reusable Scoring Patterns from Existing Code

### Pattern 1: Guard Function + Evaluation Function (from content.ts)

**Location**: `src/features/diagnosis-free/rules/content.ts`

**Structure**:

```typescript
{
  id: 'rule-id',
  category: 'content',
  name: 'Rule Name',
  maxPoints: 15,
  severity: 'critical' | 'warning' | 'info',
  quickWinEligible: true | false,
  isEvaluable: (data: CrawlData) => boolean,  // Guard function
  evaluate: (data: CrawlData) => {            // Evaluation function
    passed: boolean
    message: string
  }
}
```

**Why Applicable**: Task 5.2 content analysis agent needs to evaluate multiple dimensions (quality, structure, expertise). This pattern separates:

- **Guard**: "Can we evaluate this dimension with available data?"
- **Evaluate**: "If evaluable, what is the assessment?"

**Example Rule (cont-03: meta description exists)**:

```typescript
{
  id: 'cont-03',
  category: 'content',
  name: 'meta description 존재',
  maxPoints: 15,
  severity: 'critical',
  quickWinEligible: true,
  isEvaluable: hasLayer1,  // Guard: requires Layer1Data
  evaluate: (data) => {
    const desc = data.layer1!.meta.description
    if (desc && desc.trim().length > 0) {
      return { passed: true, message: 'meta description 설정됨' }
    }
    return {
      passed: false,
      message: 'meta description이 없습니다. 검색 결과 클릭률이 낮아집니다.',
    }
  },
}
```

**Application for Task 5.2**:

- Guard for "prose quality" dimension: Check if actual body text is extracted
- Guard for "expertise assessment" dimension: Check if author/date metadata is available
- Each dimension becomes evaluable/skipped based on data availability

### Pattern 2: Weighted Signal Aggregation with Hard Caps (from ai-citation-helpers.ts)

**Location**: `src/features/diagnosis-paid/rules/ai-citation-helpers.ts`, lines 124-178

**Structure**:

```typescript
function calculatePlatformScore(
  data: CrawlData,
  platform: AIPlatform
): PlatformCitationScore {
  // 1. Calculate multiple signals independently
  const botAccess = calculateBotAccessScore(data, platform) // 0-100
  const contentDiscoverability = calculateContentDiscoverabilityScore(data) // 0-100
  const trustSignals = calculateTrustSignalsScore(data) // 0-100

  // 2. Create signal object for transparency
  const signals: AICitationSignals = {
    botAccess,
    contentDiscoverability,
    trustSignals,
  }

  // 3. Weighted aggregation
  let score =
    (botAccess * AI_CITATION_SIGNAL_WEIGHTS.botAccess +
      contentDiscoverability *
        AI_CITATION_SIGNAL_WEIGHTS.contentDiscoverability +
      trustSignals * AI_CITATION_SIGNAL_WEIGHTS.trustSignals) /
    100

  // 4. Apply hard caps for critical factors
  const blocked = botAccess === 0
  if (blocked) {
    score = 0 // Hard cap: if bot blocked, no score possible
  }

  if (!data.layer2?.safe_browsing?.is_safe) {
    score = Math.min(score, AI_CITATION_THRESHOLDS.UNSAFE_HARD_CAP) // Hard cap: max 25
  }

  if (!data.layer3?.ssl?.valid) {
    score = Math.min(score, AI_CITATION_THRESHOLDS.SSL_INVALID_HARD_CAP) // Hard cap: max 40
  }

  return {
    platform,
    platformLabel: AI_PLATFORM_LABELS[platform],
    score: Math.round(score),
    blocked,
    signals,
  }
}
```

**Why Applicable**: Task 5.2 content analysis needs multiple dimensions (quality, structure, expertise) with different weights and critical thresholds:

**Adaptation for Task 5.2**:

```typescript
function analyzeContentQuality(data: CrawlData): ContentQualityScore {
  // Signal 1: Structural signals (available from Layer1Data)
  const structureSignal = calculateStructureSignal(data) // 0-100

  // Signal 2: Metadata authority signals (available from Layer1Data)
  const authoritySignal = calculateAuthoritySignal(data) // 0-100

  // Signal 3: Textual quality signals (requires content extraction)
  const textualSignal = calculateTextualSignal(data) // 0-100, skipped if no content

  const signals = {
    structure: structureSignal,
    authority: authoritySignal,
    textual: textualSignal,
  }

  // Weighted aggregation
  let score =
    (structureSignal * 0.4 + authoritySignal * 0.3 + textualSignal * 0.3) / 100

  // Hard caps
  if (structureSignal < 20) {
    // No proper structure
    score = Math.min(score, 30) // Cap at 30 even if other signals high
  }

  return {
    score: Math.round(score),
    signals,
    recommendations: generateRecommendations(score),
  }
}
```

---

## 7. Recommendations for Task 5.2 Implementation

### Phase 1: Extend buildCrawlSummary (Data Enrichment)

**Priority**: HIGH — Immediate impact on content agent capability

1. **Include Full Heading Texts**: Pass `h2`, `h3`, `h4`, `h5`, `h6` arrays (not just counts)
   - Change: `H2 개수: ${h2.length}` → `H2: ${h2.join(', ')}` (with truncation for long texts)
   - Benefit: Agent can assess structure hierarchy and logical flow

2. **Include Detailed Schema Structure**: Pass `schema_markup` as formatted JSON (not just Y/N flag)
   - Change: `Schema: ${schema_markup.length > 0 ? 'Y' : 'N'}` → Extract schema types and key fields
   - Benefit: Agent can validate schema completeness and relevance

3. **Include Viewport & Charset Metadata**: Currently omitted but available
   - Add: `Viewport: ${viewport ?? 'N/A'}`, `Charset: ${charset ?? 'N/A'}`
   - Benefit: Accessibility and encoding signals for content delivery

4. **Include OG Tags Summary**: Currently in Layer1Data but not passed
   - Add: OG title, OG description, OG image (if present)
   - Benefit: Agent can assess content preview quality for social sharing

5. **Include Image Large Files with Context**: Currently omitted
   - Add: Count of images > 600KB and their impact on page size
   - Benefit: Visual content optimization assessment

### Phase 2: Add Content Text Extraction (New Data Collection)

**Priority**: HIGH — Required for prose quality evaluation
**Effort**: Moderate (extends Layer1 crawler)

1. **Extract First 2-3 H2 Section Content**: ~100 words per section after each H2
   - Purpose: Allow agent to assess prose quality, keyword balance, clarity
   - Implementation: In Playwright crawler, after extracting headings, extract following `<p>` tags until next heading

2. **Extract Readability Metrics**: Flesch-Kincaid, average sentence length, word frequency
   - Purpose: Assess content accessibility to target audience
   - Implementation: Use readability library on extracted content

3. **Extract and Sample Alt Texts**: First 5 image alt texts as examples
   - Purpose: Assess alt text quality and relevance
   - Implementation: In Playwright crawler, extract alt attributes from first 5 images

### Phase 3: Implement Content Quality Rules (New Rules File)

**Priority**: MEDIUM — After data enrichment
**Pattern**: Guard function + Evaluation function from content.ts

1. **Rule: content_structure_hierarchy** (Guard: H2+ texts available)
   - Evaluate: Do headings form logical hierarchy? No orphaned subheadings?
   - Points: 20

2. **Rule: content_prose_clarity** (Guard: Content text extracted)
   - Evaluate: Average sentence length < 20 words? Flesch-Kincaid grade < 10?
   - Points: 25

3. **Rule: content_keyword_distribution** (Guard: Content text + target keyword)
   - Evaluate: Target keyword appears in title, H1, H2, first 100 words?
   - Points: 15

4. **Rule: content_authority_signals** (Guard: Author/date metadata available)
   - Evaluate: Publication date present? Last updated date? Author attribution?
   - Points: 20

5. **Rule: content_schema_completeness** (Guard: Schema markup extracted)
   - Evaluate: Schema types relevant to content? Key properties populated?
   - Points: 20

### Phase 4: Integrate Content Agent with Weighted Signals

**Priority**: MEDIUM — After Phase 3
**Pattern**: Weighted signal aggregation from ai-citation-helpers.ts

Map content analysis into 3 signals:

- **structureSignal** (40% weight): Heading hierarchy, section balance, logical flow
- **authoritySignal** (30% weight): Author, publication date, citations, schema markup
- **textualSignal** (30% weight): Readability, keyword optimization, prose clarity

Implement hard caps:

- If structure score < 20 (no proper heading structure), cap overall score at 30
- If readability score > 12 (too complex for target audience), reduce textual signal

---

## 8. Implementation Dependencies & Timeline

### Blocker Analysis

| Phase | Blocker                                 | Resolution                                                       | Impact                                         |
| ----- | --------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------- |
| 1     | None — data already available in Layer1 | Update buildCrawlSummary to pass additional fields               | Content agent gets better metadata immediately |
| 2     | Playwright crawler needs enhancement    | Extend Layer1 extraction with content text + readability metrics | 2-3 day dev effort, test coverage              |
| 3     | None — rules file is standalone         | Create content-quality-helpers.ts + rules file                   | 2 day dev effort, follows proven pattern       |
| 4     | Phase 2 content data must be available  | Use Guard functions to skip unavailable signals                  | No blocker, graceful degradation               |

### Recommended Sequence

1. **Phase 1** (1 day): Extend buildCrawlSummary — Quick win, immediate agent improvement
2. **Phase 2** (2-3 days): Add content extraction to crawler — Prerequisite for prose analysis
3. **Phase 3** (2 days): Content quality rules — Follows established pattern, testable independently
4. **Phase 4** (1 day): Integrate weighted signals — Completes content quality module

**Total Estimated Effort**: 6-7 days including testing and documentation

---

## 9. Testing Strategy

### Unit Tests (by phase)

**Phase 1**: buildCrawlSummary extended output

- Input: Layer1Data with H2-H6 texts, OG tags, viewport
- Output: Markdown sections include all new fields
- Coverage: 100% (field extraction logic)

**Phase 2**: Content extraction functions

- Input: HTML content, heading positions
- Output: Extracted sections + readability metrics
- Coverage: Happy path + edge cases (very long content, no paragraphs after heading, special characters)

**Phase 3**: Content quality rules

- Input: CrawlData with Layer1 + content metrics
- Output: Rule results with passed/failed + message
- Coverage: Guard function (evaluable/unevaluable), evaluation logic for each rule

**Phase 4**: Weighted signal aggregation

- Input: Structure/authority/textual signal scores
- Output: Overall score + hard caps applied
- Coverage: Normal aggregation, each hard cap scenario

### Integration Tests

- End-to-end: URL input → crawl → extract content → analyze → generate content quality score
- Verify: Each rule evaluates correctly for real-world sites (good, poor, mixed quality samples)

### E2E Tests

- Content agent receives enriched data in markdown format
- Agent can reference H2-H6 structure in analysis
- Agent can comment on prose quality (if content extracted)
- Agent can assess schema completeness (if schema passed)

---

## References

- **Content Rules Pattern**: `/src/features/diagnosis-free/rules/content.ts` (lines 1-304)
- **AI Citation Scoring Pattern**: `/src/features/diagnosis-paid/rules/ai-citation-helpers.ts` (lines 124-178)
- **Diagnosis Engine**: `/src/features/diagnosis-free/engine.ts` (lines 77-134)
- **buildCrawlSummary Function**: `/src/features/diagnosis-paid/services/run-diagnosis-paid.ts` (lines 296-413)
- **System Prompt Configuration**: `/src/features/diagnosis-paid/services/run-diagnosis-paid.ts` (line 281)

---

**Next Steps**: Use this gap analysis to prioritize Phase 1 (quick data enrichment) for immediate content agent improvement while planning Phase 2-4 enhancements.
