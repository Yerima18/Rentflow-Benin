import assert from "node:assert/strict";
import test from "node:test";
import {
  formatXof,
  isPaymentMonth,
  isPaymentStatus,
  MAX_XOF_AMOUNT,
  parseXofAmount,
} from "./money";

test("accepts positive whole XOF amounts as form strings or JSON numbers", () => {
  assert.equal(parseXofAmount("75000"), 75_000);
  assert.equal(parseXofAmount(75_000), 75_000);
  assert.equal(parseXofAmount(String(MAX_XOF_AMOUNT)), MAX_XOF_AMOUNT);
});

test("rejects malformed, fractional, non-finite, non-positive, and out-of-range amounts", () => {
  for (const value of ["", "  ", "75abc", "1,000", "1.5", "1e3", 1.5, 0, -1, NaN, Infinity, MAX_XOF_AMOUNT + 1, null, {}]) {
    assert.equal(parseXofAmount(value), null, `expected ${String(value)} to be rejected`);
  }
});

test("validates payment statuses and calendar months", () => {
  assert.equal(isPaymentStatus("PAID"), true);
  assert.equal(isPaymentStatus("PENDING"), true);
  assert.equal(isPaymentStatus("OVERDUE"), true);
  assert.equal(isPaymentStatus("paid"), false);
  assert.equal(isPaymentStatus("CANCELLED"), false);

  assert.equal(isPaymentMonth("2026-10"), true);
  assert.equal(isPaymentMonth("0000-01"), false);
  assert.equal(isPaymentMonth("2026-00"), false);
  assert.equal(isPaymentMonth("2026-13"), false);
  assert.equal(isPaymentMonth("2026-1"), false);
  assert.equal(isPaymentMonth("2026-10-01"), false);
});

test("formats XOF consistently with an explicit locale and FCFA suffix", () => {
  assert.equal(formatXof(75_000, "en"), "75,000 FCFA");
  assert.match(formatXof(75_000, "fr"), /^75[\u00a0\u202f ]000 FCFA$/);
  assert.equal(formatXof(-1_000, "en"), "-1,000 FCFA");
});
