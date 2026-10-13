import { describe, expect, it } from "vitest";
import en from "../src/lib/i18n/en.json";
import fr from "../src/lib/i18n/fr.json";
import { formatMessage } from "../src/lib/i18n/formatMessage.ts";

function leafPaths(value, prefix = "") {
  return Object.entries(value).flatMap(([key, entry]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return entry && typeof entry === "object" ? leafPaths(entry, path) : [path];
  }).sort();
}

describe("English and French dictionaries", () => {
  it("keep the same translation keys with no empty copy", () => {
    expect(leafPaths(fr)).toEqual(leafPaths(en));
    for (const dictionary of [en, fr]) {
      for (const key of leafPaths(dictionary)) {
        const value = key.split(".").reduce((entry, part) => entry[part], dictionary);
        expect(typeof value, key).toBe("string");
        expect(value.trim(), key).not.toBe("");
      }
    }
  });

  it("fills dynamic labels without leaving untranslated placeholders", () => {
    expect(formatMessage(fr.dashboard.greeting, { name: "Amin" })).toBe("Bonjour, Amin !");
    expect(formatMessage(fr.tenants.unitLabel, { unit: "A1" })).toBe("Logement : A1");
    expect(formatMessage(fr.properties.unitAndTenantCount, { units: 12, tenants: 8 })).toBe("12 logements · 8 locataires");
  });
});
