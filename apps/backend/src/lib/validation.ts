/**
 * Shared field validators, so every endpoint treats long, blank, binary or
 * nonsensical input the same way. Bounds mirror the DB column types — a value
 * that passes here can always be stored (no Postgres overflow → 500).
 */
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { badRequest } from "./httpError.js";
import { LINE_RULES, TEXT_RULES, textProblem, type QualityOptions } from "./textQuality.js";

// Control characters. Multi-line text may keep \t \n \r; single-line fields may not.
const CONTROL_IN_TEXT = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const CONTROL_IN_LINE = /[\u0000-\u001F\u007F]/;
const INVALID_CHARS = "contains invalid characters";

/** Trim + Unicode NFC (so "é" typed two ways is one value), bounded, no control chars, quality-checked. */
function cleanString(max: number, control: RegExp, rules: QualityOptions | null) {
  return z.string().trim().normalize("NFC").max(max, `must be ${max} characters or fewer`)
    .superRefine((s, ctx) => {
      if (control.test(s)) {
        ctx.addIssue({ code: "custom", message: INVALID_CHARS });
        return;
      }
      const problem = rules && textProblem(s, rules);
      if (problem) ctx.addIssue({ code: "custom", message: problem });
    });
}

/** Required single-line string (titles etc.): trimmed, non-blank, no junk. */
export const line = (max: number) =>
  cleanString(max, CONTROL_IN_LINE, LINE_RULES).refine((s) => s.length > 0, "is required");

/** Free text (may be multi-line or empty): bounded, no binary characters, no junk. */
export const text = (max: number) => cleanString(max, CONTROL_IN_TEXT, TEXT_RULES);

const NAME_RULES: QualityOptions = { ...LINE_RULES, maxSymbolRatio: 1, gibberish: false };

/** A person's name in any script: letters with single spaces, apostrophes, periods or hyphens between them. */
export const personName = (max = 100) =>
  cleanString(max, CONTROL_IN_LINE, NAME_RULES)
    .refine((s) => s.length > 0, "is required")
    .refine((s) => /^[\p{L}\p{M}\u200C\u200D]+(?:[ .'’-]{1,2}[\p{L}\p{M}\u200C\u200D]+)*\.?$/u.test(s),
      "can only contain letters, spaces, apostrophes, periods and hyphens");

/** Company/organisation name: letters, digits and & . , ' - ( ) /  (brand names skip the gibberish check). */
export const orgName = (max = 100) =>
  cleanString(max, CONTROL_IN_LINE, { ...LINE_RULES, gibberish: false })
    .refine((s) => s.length > 0, "is required")
    .refine((s) => /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} &.,'’()\/-]*$/u.test(s),
      "can only contain letters, numbers, spaces and & . , ' - ( ) /");

/** Skill/tag/category label: letters, digits, spaces and + # . / & ( ) _ ' - (C++, C#, Node.js, UI/UX, R&D). */
export const tag = (max = 50) =>
  cleanString(max, CONTROL_IN_LINE, { ...LINE_RULES, maxRepeat: 3, maxSymbolRatio: 0.5, gibberish: false })
    .refine((s) => s.length > 0, "is required")
    .refine((s) => /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} +#.\/&()_'’-]*$/u.test(s),
      "can only contain letters, numbers, spaces and + # . / & ( ) _ ' -");

/** Short list of tags/skills. */
export const tagList = (maxItems: number, maxLen = 50) =>
  z.array(tag(maxLen)).max(maxItems, `at most ${maxItems} items`);

/** Absolute http(s) URL — blocks javascript:, data: and other schemes, spaces and hidden characters. */
export const httpUrl = (max = 500) =>
  cleanString(max, CONTROL_IN_LINE, null)
    .refine((s) => s.length > 0, "is required")
    .refine((s) => {
      if (/\s/.test(s) || textProblem(s, { ...LINE_RULES, maxRepeat: 30, maxSymbolRatio: 1, maxTokenLength: 500, gibberish: false })) return false;
      try {
        const u = new URL(s);
        return (u.protocol === "http:" || u.protocol === "https:") && !!u.hostname && !u.username && !u.password;
      } catch {
        return false;
      }
    }, "must be a valid http(s) URL");

/** Positive amount with at most 2 decimals that fits a Decimal(precision, 2) column. */
export const money = (max: number) =>
  z.coerce.number({ message: "must be a number" })
    .min(0.01, "must be at least 0.01")
    .max(max, `must be at most ${max}`)
    .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, "can have at most 2 decimal places");

/** TASKS.budget / SERVICE.price / PAYMENT.amount are Decimal(10,2). */
export const MONEY_10_2 = 99_999_999.99;
/** APPLICATION.hourly_rate is Decimal(8,2). */
export const MONEY_8_2 = 999_999.99;

/** Postgres INTEGER primary keys. */
export const id = () => z.coerce.number({ message: "must be a number" }).int().positive().max(2_147_483_647);

/** Calendar date that is today or later, and not absurdly far out (Postgres DATE overflows past year 294276). */
export const futureDate = () =>
  z.coerce.date({ message: "must be a valid date" }).refine((d) => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setUTCFullYear(limit.getUTCFullYear() + 10);
    return d >= today && d <= limit;
  }, "must be between today and 10 years from now");

/** Any date Postgres can store (for admin edits of historical rows). */
export const saneDate = () =>
  z.coerce.date({ message: "must be a valid date" })
    .refine((d) => d.getUTCFullYear() >= 1970 && d.getUTCFullYear() <= 9999, "must be a valid date");

const NUL = String.fromCharCode(0);
const POLLUTING_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/** Finds strings Postgres can't store (NUL) and keys that could pollute object prototypes. */
function unsafeInput(value: unknown, depth = 0): boolean {
  if (typeof value === "string") return value.includes(NUL);
  if (depth > 20 || value === null || typeof value !== "object") return false;
  return Object.entries(value).some(([key, v]) => POLLUTING_KEYS.has(key) || key.includes(NUL) || unsafeInput(v, depth + 1));
}

/**
 * Global guard for every request, including routes without a schema:
 * Postgres throws a 500 on U+0000, and "__proto__"/"constructor" keys are a
 * prototype-pollution vector if any code ever merges request objects.
 */
export function rejectUnsafeInput(req: Request, _res: Response, next: NextFunction): void {
  if (unsafeInput(req.body) || unsafeInput(req.query) || req.url.toLowerCase().includes("%00")) {
    next(badRequest("Request contains invalid characters"));
    return;
  }
  next();
}
