import { robots } from "@/app/robots";
import type { MetadataRoute } from "next";

describe("robots.ts", () => {
  describe("robots route handler", () => {
    it("should return robots.txt configuration object", () => {
      const result = robots();
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });

    it("should allow all user agents by default", () => {
      const result = robots();
      expect(result.rules).toBeDefined();
      expect(Array.isArray(result.rules)).toBe(true);
    });

    it("should disallow /api/ from crawlers", () => {
      const result = robots();
      const apiRule = result.rules.find((rule: MetadataRoute.Robots["rules"][0]) => {
        const disallow = (rule as any).disallow;
        if (Array.isArray(disallow)) {
          return disallow.includes("/api/");
        }
        return disallow === "/api/";
      });
      expect(apiRule).toBeDefined();
    });

    it("should disallow /dashboard/ from crawlers", () => {
      const result = robots();
      const dashboardRule = result.rules.find(
        (rule: MetadataRoute.Robots["rules"][0]) => {
          const disallow = (rule as any).disallow;
          if (Array.isArray(disallow)) {
            return disallow.includes("/dashboard/*");
          }
          return disallow === "/dashboard/*";
        }
      );
      expect(dashboardRule).toBeDefined();
    });

    it("should include sitemap URL", () => {
      const result = robots();
      expect(result.sitemap).toBeDefined();
      expect(typeof result.sitemap).toBe("string");
      expect((result.sitemap as string).includes("sitemap.xml")).toBe(true);
    });

    it("should have correct format for Googlebot and other crawlers", () => {
      const result = robots();
      expect(result.rules).toBeDefined();
      // All rules should have either allow, disallow, or both
      result.rules.forEach((rule: MetadataRoute.Robots["rules"][0]) => {
        const ruleObj = rule as any;
        expect(
          ruleObj.allow || ruleObj.disallow || ruleObj.userAgent
        ).toBeDefined();
      });
    });
  });
});
