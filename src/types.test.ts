import { describe, it, expect } from "vitest";
import { isAllowedRedirect, AUTH_REDIRECT_ROUTES } from "./types";

describe("types", () => {
  describe("isAllowedRedirect", () => {
    it("returns true only for allowed redirect routes", () => {
      expect(isAllowedRedirect("/")).toBe(true);
      expect(isAllowedRedirect("/meal-plan")).toBe(true);
      expect(isAllowedRedirect("/shopping-list")).toBe(true);
    });

    it("returns false for null and undefined", () => {
      expect(isAllowedRedirect(null)).toBe(false);
      expect(isAllowedRedirect(undefined)).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isAllowedRedirect("")).toBe(false);
    });

    it("returns false for path that is not in allowlist", () => {
      expect(isAllowedRedirect("/login")).toBe(false);
      expect(isAllowedRedirect("/admin")).toBe(false);
      expect(isAllowedRedirect("https://evil.com")).toBe(false);
      expect(isAllowedRedirect("/meal-plan/extra")).toBe(false);
      expect(isAllowedRedirect("//")).toBe(false);
    });

    it("returns false for path with query or hash (exact match)", () => {
      expect(isAllowedRedirect("/?foo=1")).toBe(false);
      expect(isAllowedRedirect("/meal-plan#section")).toBe(false);
    });

    it("allowed routes match AUTH_REDIRECT_ROUTES", () => {
      for (const route of AUTH_REDIRECT_ROUTES) {
        expect(isAllowedRedirect(route)).toBe(true);
      }
    });
  });
});
