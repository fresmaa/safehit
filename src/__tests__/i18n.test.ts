import { describe, it, expect } from "vitest";
import { t, setLanguage, getLanguage } from "../utils/i18n";

describe("i18n", () => {
  it("returns English translations by default", () => {
    expect(t("title")).toBe("PRODUCTION ENVIRONMENT");
    expect(t("buttonProceed")).toBe("PROCEED WITH ACTION");
    expect(t("buttonCancel")).toBe("Cancel and Abort");
  });

  it("switches to Indonesian", () => {
    setLanguage("id");
    expect(getLanguage()).toBe("id");
    expect(t("title")).toBe("LINGKUNGAN PRODUKSI");
    expect(t("buttonProceed")).toBe("LANJUTKAN EKSEKUSI");
    expect(t("buttonCancel")).toBe("Batalkan");
  });

  it("switches back to English", () => {
    setLanguage("en");
    expect(getLanguage()).toBe("en");
    expect(t("title")).toBe("PRODUCTION ENVIRONMENT");
  });

  it("ignores invalid language", () => {
    setLanguage("en");
    setLanguage("xx" as any);
    expect(getLanguage()).toBe("en");
  });
});
