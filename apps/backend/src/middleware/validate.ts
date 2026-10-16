import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { badRequest } from "../lib/httpError.js";

export type ValidationSource = "body" | "params" | "query";

declare module "express-serve-static-core" {
  interface Locals {
    validated?: Partial<Record<ValidationSource, unknown>>;
  }
}

/**
 * Validates req[source] against a zod schema and 400s with field errors on
 * failure. The parsed result is stashed on res.locals.validated rather than
 * overwriting req.query/req.params — Express 5 makes req.query a
 * getter-only accessor, so reassigning it directly throws at runtime.
 * Controllers read it back with getValidated().
 */
export function validate<T>(schema: ZodType<T>, source: ValidationSource = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(badRequest(humanMessage(result.error.issues[0]), result.error.flatten()));
      return;
    }
    res.locals.validated = { ...res.locals.validated, [source]: result.data };
    next();
  };
}

/** "budget" + "must be at most 5" -> "Budget must be at most 5"; "dueDate" -> "Due date". */
function humanMessage(issue: { path: PropertyKey[]; message: string } | undefined): string {
  if (!issue) return "Validation failed";
  const key = [...issue.path].reverse().find((p) => typeof p === "string");
  if (!key) return issue.message;
  const label = key.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  const capitalised = label.charAt(0).toUpperCase() + label.slice(1);
  // Messages that already name the field (e.g. "Password must be ...") are used as-is.
  return issue.message.toLowerCase().startsWith(label) ? issue.message : `${capitalised} ${issue.message}`;
}

export function getValidated<T>(res: Response, source: ValidationSource): T {
  return res.locals.validated?.[source] as T;
}
