import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  json,
  boolean,
  numeric,
  varchar,
  index,
} from "drizzle-orm/pg-core";

/**
 * Companies table
 * Represents user organizations
 */
export const companiesTable = pgTable(
  "companies",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(), // FK to Supabase Auth
    url: varchar("url", { length: 500 }).notNull().unique(),
    industry: varchar("industry", {
      enum: ["ecommerce", "blog", "saas", "local_business", "other"],
    }).notNull(),
    companySize: varchar("company_size", {
      enum: ["solo", "small", "medium"],
    }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("companies_user_id_idx").on(table.userId),
    urlIdx: index("companies_url_idx").on(table.url),
  }),
);

/**
 * Crawl results table
 * Stores raw HTML and parsed metadata from website crawling
 */
export const crawlResultsTable = pgTable(
  "crawl_results",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .references(() => companiesTable.id, { onDelete: "cascade" })
      .notNull(),
    crawledAt: timestamp("crawled_at").defaultNow().notNull(),
    status: varchar("status", {
      enum: [
        "success",
        "failed_timeout",
        "failed_network",
        "failed_invalid_url",
      ],
    }).notNull(),
    rawHtml: text("raw_html"), // max 5MB; truncate if exceeded
    htmlTruncated: boolean("html_truncated").default(false),
    metaTags: json("meta_tags"), // { title, description, og:*, twitter:* }
    headings: json("headings"), // [{ level: 1-3, text: string }]
    schemaMarkup: json("schema_markup"), // [{ @type, properties }]
    performanceMetrics: json("performance_metrics"), // { mobile: { score, cwv }, desktop: { score, cwv } }
    robotsTxt: text("robots_txt"),
    sitemapInfo: json("sitemap_info"), // { urlCount, lastModified }
    detectedCms: varchar("detected_cms", { length: 50 }),
    isLatest: boolean("is_latest").default(true),
  },
  (table) => ({
    companyIdIdx: index("crawl_results_company_id_idx").on(table.companyId),
    isLatestIdx: index("crawl_results_is_latest_idx").on(table.isLatest),
  }),
);

/**
 * Diagnoses table
 * Stores diagnostic results and scores
 */
export const diagnosesTable = pgTable(
  "diagnoses",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .references(() => companiesTable.id, { onDelete: "cascade" })
      .notNull(),
    crawlResultId: integer("crawl_result_id").references(
      () => crawlResultsTable.id,
      { onDelete: "set null" },
    ),
    diagnosedAt: timestamp("diagnosed_at").defaultNow().notNull(),
    seoScore: numeric("seo_score", { precision: 3, scale: 1 }),
    geoScore: numeric("geo_score", { precision: 3, scale: 1 }),
    performanceScore: numeric("performance_score", { precision: 3, scale: 1 }),
    aiScore: numeric("ai_score", { precision: 3, scale: 1 }),
    overallScore: numeric("overall_score", {
      precision: 3,
      scale: 1,
    }).notNull(),
    grade: varchar("grade", { enum: ["A", "B", "C", "D", "F"] }).notNull(),
    aiInsights: json("ai_insights"), // { problems: [], recommendations: [] }
    isLatest: boolean("is_latest").default(true),
  },
  (table) => ({
    companyIdIdx: index("diagnoses_company_id_idx").on(table.companyId),
    isLatestIdx: index("diagnoses_is_latest_idx").on(table.isLatest),
  }),
);

/**
 * Action items table
 * Stores actionable recommendations
 */
export const actionItemsTable = pgTable(
  "action_items",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .references(() => companiesTable.id, { onDelete: "cascade" })
      .notNull(),
    diagnosisId: integer("diagnosis_id")
      .references(() => diagnosesTable.id, { onDelete: "cascade" })
      .notNull(),
    itemType: varchar("item_type", {
      enum: ["quick_win", "standard", "long_term"],
    }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    priority: varchar("priority", {
      enum: ["high", "medium", "low"],
    }).notNull(),
    expectedImpactScore: numeric("expected_impact_score", {
      precision: 3,
      scale: 1,
    }),
    estimatedEffort: varchar("estimated_effort", {
      enum: ["<1h", "1-8h", ">8h"],
    }),
    completed: boolean("completed").default(false),
  },
  (table) => ({
    companyIdIdx: index("action_items_company_id_idx").on(table.companyId),
    diagnosisIdIdx: index("action_items_diagnosis_id_idx").on(
      table.diagnosisId,
    ),
  }),
);

/**
 * Generated assets table
 * Stores generated content (schema markup, meta tags, guides)
 */
export const generatedAssetsTable = pgTable(
  "generated_assets",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .references(() => companiesTable.id, { onDelete: "cascade" })
      .notNull(),
    diagnosisId: integer("diagnosis_id").references(() => diagnosesTable.id, {
      onDelete: "set null",
    }),
    assetType: varchar("asset_type", {
      enum: ["schema_markup", "meta_tags", "guide"],
    }).notNull(),
    content: json("content"), // Flexible schema based on type
    generatedAt: timestamp("generated_at").defaultNow().notNull(),
  },
  (table) => ({
    companyIdIdx: index("generated_assets_company_id_idx").on(table.companyId),
  }),
);

/**
 * API logs table
 * Stores request/response logs for monitoring and auditing
 */
export const apiLogsTable = pgTable(
  "api_logs",
  {
    id: serial("id").primaryKey(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    userId: text("user_id"), // nullable for public routes
    method: varchar("method", {
      enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
    }).notNull(),
    path: varchar("path", { length: 500 }).notNull(),
    statusCode: integer("status_code").notNull(),
    responseTimeMs: integer("response_time_ms").notNull(),
    userAgent: text("user_agent"),
    ip: varchar("ip", { length: 45 }), // IPv6 max length
    errorMessage: text("error_message"), // nullable if no error
  },
  (table) => ({
    timestampIdx: index("api_logs_timestamp_idx").on(table.timestamp),
    userIdIdx: index("api_logs_user_id_idx").on(table.userId),
  }),
);
