import { describe, it, expect } from "vitest";
import { matchUrl } from "../utils/storage";

describe("matchUrl", () => {
  describe("contains mode", () => {
    it("matches when URL contains the pattern", () => {
      expect(matchUrl("https://api.example.com/v1/users", "/v1/users", "contains")).toBe(true);
    });

    it("does not match when URL does not contain the pattern", () => {
      expect(matchUrl("https://api.example.com/v1/users", "/v2/orders", "contains")).toBe(false);
    });

    it("matches partial domain", () => {
      expect(matchUrl("https://api.production.com/data", "api.production.com", "contains")).toBe(
        true,
      );
    });
  });

  describe("exact mode", () => {
    it("matches when URL is exactly the same", () => {
      expect(
        matchUrl("https://api.example.com/v1/users", "https://api.example.com/v1/users", "exact"),
      ).toBe(true);
    });

    it("does not match when URL differs", () => {
      expect(
        matchUrl("https://api.example.com/v1/users", "https://api.example.com/v1/orders", "exact"),
      ).toBe(false);
    });
  });

  describe("regex mode", () => {
    it("matches with regex pattern", () => {
      expect(matchUrl("https://api.example.com/v1/users/123", "/v\\d+/users/\\d+", "regex")).toBe(
        true,
      );
    });

    it("does not match when regex does not match", () => {
      expect(matchUrl("https://api.example.com/v1/orders", "/v\\d+/users/\\d+", "regex")).toBe(
        false,
      );
    });

    it("returns false for invalid regex", () => {
      expect(matchUrl("https://example.com", "[invalid(", "regex")).toBe(false);
    });
  });
});
