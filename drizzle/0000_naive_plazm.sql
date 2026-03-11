CREATE TABLE "action_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"diagnosis_id" integer NOT NULL,
	"item_type" varchar NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"priority" varchar NOT NULL,
	"expected_impact_score" numeric(3, 1),
	"estimated_effort" varchar,
	"completed" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"url" varchar(500) NOT NULL,
	"industry" varchar NOT NULL,
	"company_size" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "companies_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "crawl_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"crawled_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar NOT NULL,
	"raw_html" text,
	"html_truncated" boolean DEFAULT false,
	"meta_tags" json,
	"headings" json,
	"schema_markup" json,
	"performance_metrics" json,
	"robots_txt" text,
	"sitemap_info" json,
	"detected_cms" varchar(50),
	"is_latest" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "diagnoses" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"crawl_result_id" integer,
	"diagnosed_at" timestamp DEFAULT now() NOT NULL,
	"seo_score" numeric(3, 1),
	"geo_score" numeric(3, 1),
	"performance_score" numeric(3, 1),
	"ai_score" numeric(3, 1),
	"overall_score" numeric(3, 1) NOT NULL,
	"grade" varchar NOT NULL,
	"ai_insights" json,
	"is_latest" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "generated_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"diagnosis_id" integer,
	"asset_type" varchar NOT NULL,
	"content" json,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_diagnosis_id_diagnoses_id_fk" FOREIGN KEY ("diagnosis_id") REFERENCES "public"."diagnoses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crawl_results" ADD CONSTRAINT "crawl_results_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_crawl_result_id_crawl_results_id_fk" FOREIGN KEY ("crawl_result_id") REFERENCES "public"."crawl_results"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_assets" ADD CONSTRAINT "generated_assets_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_assets" ADD CONSTRAINT "generated_assets_diagnosis_id_diagnoses_id_fk" FOREIGN KEY ("diagnosis_id") REFERENCES "public"."diagnoses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "action_items_company_id_idx" ON "action_items" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "action_items_diagnosis_id_idx" ON "action_items" USING btree ("diagnosis_id");--> statement-breakpoint
CREATE INDEX "companies_user_id_idx" ON "companies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "companies_url_idx" ON "companies" USING btree ("url");--> statement-breakpoint
CREATE INDEX "crawl_results_company_id_idx" ON "crawl_results" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "crawl_results_is_latest_idx" ON "crawl_results" USING btree ("is_latest");--> statement-breakpoint
CREATE INDEX "diagnoses_company_id_idx" ON "diagnoses" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "diagnoses_is_latest_idx" ON "diagnoses" USING btree ("is_latest");--> statement-breakpoint
CREATE INDEX "generated_assets_company_id_idx" ON "generated_assets" USING btree ("company_id");