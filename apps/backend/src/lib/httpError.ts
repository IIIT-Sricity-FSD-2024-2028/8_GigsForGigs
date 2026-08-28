/**
 * A typed HTTP exception. errorHandler.ts is the only place that reads
 * .status/.details — every other layer just throws or `next()`s these.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown): HttpError =>
  new HttpError(400, message, details);

export const unauthorized = (message = "Unauthorized"): HttpError =>
  new HttpError(401, message);

export const forbidden = (message = "Forbidden"): HttpError =>
  new HttpError(403, message);

export const notFound = (message = "Not found"): HttpError =>
  new HttpError(404, message);

export const conflict = (message: string): HttpError => new HttpError(409, message);
