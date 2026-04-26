/**
 * Discriminated-union response wrapper used by every server action.
 *
 * - Success path always carries a typed `data`.
 * - Error path returns an opaque, client-safe `code` + message; raw
 *   exceptions are never serialised (would leak stack traces / SQL).
 */
export type ActionError =
  | { code: "UNAUTHORIZED"; message: string }
  | { code: "VALIDATION"; message: string; issues?: { path: string; message: string }[] }
  | { code: "NOT_FOUND"; message: string }
  | { code: "RATE_LIMITED"; message: string }
  | { code: "INTERNAL"; message: string };

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: ActionError };

import { logger } from "./logger";
import { UnauthorizedError } from "./auth";
import { ValidationError } from "./validation";

export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function fail(error: ActionError): ActionResult<never> {
  return { success: false, error };
}

/**
 * Wrap a server-action body so that errors are mapped to client-safe
 * shapes and logged server-side with a request-correlatable id.
 */
export async function action<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      logger.warn({ action: name }, "Unauthorized server action");
      return fail({ code: "UNAUTHORIZED", message: "You must be signed in." });
    }
    if (err instanceof ValidationError) {
      logger.warn({ action: name, issues: err.issues }, "Validation error");
      return fail({
        code: "VALIDATION",
        message: "Invalid input",
        issues: err.issues,
      });
    }
    logger.error(
      { action: name, err: err instanceof Error ? err.message : err },
      "Server action failed",
    );
    return fail({ code: "INTERNAL", message: "Something went wrong." });
  }
}
