/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */
// @ts-nocheck - MetadataRoute types require complex assertion patterns
import { describe, it, expect } from 'vitest';
import { sitemap } from "@/app/sitemap";
import type { MetadataRoute } from "next";

describe("sitemap.ts", () => {
  describe("sitemap route handler", () => {
    it("should return array of sitemap entries", async () => {
      const result = await sitemap();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should include root path", async () => {
      const result = await sitemap();
      const rootEntry = result.find((entry: MetadataRoute.Sitemap[0]) =>
        entry.url?.endsWith("/")
      );
      expect(rootEntry).toBeDefined();
      expect((rootEntry as any)?.priority).toBe(1);
    });

    it("should include signup page", async () => {
      const result = await sitemap();
      const signupEntry = result.find(
        (entry: MetadataRoute.Sitemap[0]) => entry.url?.includes("/signup")
      );
      expect(signupEntry).toBeDefined();
    });

    it("should include login page", async () => {
      const result = await sitemap();
      const loginEntry = result.find(
        (entry: MetadataRoute.Sitemap[0]) => entry.url?.includes("/login")
      );
      expect(loginEntry).toBeDefined();
    });

    it("should NOT include authenticated routes", async () => {
      const result = await sitemap();
      const dashboardEntry = result.find(
        (entry: MetadataRoute.Sitemap[0]) =>
          entry.url?.includes("/dashboard")
      );
      const onboardingEntry = result.find(
        (entry: MetadataRoute.Sitemap[0]) =>
          entry.url?.includes("/onboarding")
      );
      expect(dashboardEntry).toBeUndefined();
      expect(onboardingEntry).toBeUndefined();
    });

    it("should include lastModified for entries", async () => {
      const result = await sitemap();
      result.forEach((entry: MetadataRoute.Sitemap[0]) => {
        // At least some entries should have lastModified
        if (entry.url?.endsWith("/")) {
          expect((entry as any).lastModified).toBeDefined();
        }
      });
    });

    it("should include changeFrequency for entries", async () => {
      const result = await sitemap();
      const rootEntry = result.find((entry: MetadataRoute.Sitemap[0]) =>
        entry.url?.endsWith("/")
      );
      expect((rootEntry as any)?.changeFrequency).toBeDefined();
    });

    it("should have valid URLs", async () => {
      const result = await sitemap();
      result.forEach((entry: MetadataRoute.Sitemap[0]) => {
        // Sitemap URLs should be absolute URLs including the domain
        expect(entry.url).toBeDefined();
        expect(typeof entry.url).toBe("string");
        expect(entry.url.length).toBeGreaterThan(0);
      });
    });

    it("should have proper priority values", async () => {
      const result = await sitemap();
      result.forEach((entry: MetadataRoute.Sitemap[0]) => {
        const priority = (entry as any).priority;
        if (priority !== undefined) {
          expect(priority).toBeGreaterThanOrEqual(0);
          expect(priority).toBeLessThanOrEqual(1);
        }
      });
    });
  });
});
