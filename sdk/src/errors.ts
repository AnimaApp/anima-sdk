/**
 * Errors from Anima API, common across multiple routes.
 */
export type CommonApiError =
  | "Missing Authorization header"
  | "Invalid Authorization header"
  | "Missing teamId"
  | "Internal server error"
  | "Forbidden, no team access"
  | "Requested Usage Exceeds Limit"
  | "Too many concurrent jobs"
  | "Invalid Anima token"
  | "Job not found";

/**
 * Codegen errors from the worker
 */
export type GetCodeFromFigmaErrorReason =
  | "Selected node type is not supported"
  | "Invisible group nodes are unsupported"
  | "Selected node is a page with multiple children"
  | "Selected node is a page with no valid children"
  | "There is no node with the given id"
  | "Invalid Figma token"
  | "Anima API connection error"
  | "Figma token expired"
  | "Invalid user token"
  | "Figma file not found"
  | "Figma rate limit exceeded"
  | "Figma selection too large"
  | "Invalid responsive page node type"
  | "Unknown";

/**
 * Codegen errors from the "/codegen" route
 */
export type CodegenRouteErrorReason =
  | "Not all frames id from responsive pages are mentioned on the nodes id list"
  | "Too many screens to import";

/**
 * Errors from the SDK
 */
export type SDKErrorReason =
  | "Invalid body payload"
  | "Connection closed before the 'done' message"
  | "Response body is null";

/**
 * Errors from the Website To Code Flow
 */
export type GetCodeFromWebsiteErrorReason = "Scraping is blocked" | "Unknown";

/**
 * Errors from the Prompt To Code Flow
 */
export type GetCodeFromPromptErrorReason =
  | "Invalid prompt"
  | "Generation failed"
  | "Unknown";

export class CodegenError extends Error {
  status?: number;
  detail?: unknown;

  constructor({
    name,
    reason,
    status,
    detail,
  }: {
    name: string;
    reason:
      | CommonApiError
      | GetCodeFromFigmaErrorReason
      | CodegenRouteErrorReason
      | SDKErrorReason
      | GetCodeFromWebsiteErrorReason
      | GetCodeFromPromptErrorReason;
    status?: number;
    detail?: unknown;
  }) {
    super();
    this.name = name;
    this.message = reason;
    this.detail = detail;
    this.status = status;
  }
}

/**
 * Figma REST API Errors
 */

export class MalformattedFigmaToken extends Error {
  constructor() {
    super("Malformatted Figma Token");
  }
}

export class MissingFigmaToken extends Error {
  constructor() {
    super("Missing Figma Token");
  }
}

export class NeedsReauthFigmaToken extends Error {
  constructor() {
    super("Needs Reauth Figma Token");
  }
}

export class ExpiredFigmaToken extends Error {
  constructor() {
    super("Expired Figma Token");
  }
}

export class FileNotExportable extends Error {
  constructor() {
    super("File Not Exportable");
  }
}

export class UnknownForbiddenFigmaError extends Error {
  reason: string | null;

  constructor({ reason }: { reason: string | null }) {
    super("Unknown Forbidden Figma Error");

    this.reason = reason;
  }
}

const notFoundErrorMessage = "Not Found";
export class NotFound extends Error {
  constructor({ cause }: { cause?: unknown }) {
    super(notFoundErrorMessage);

    this.cause = cause;
  }
}
export const isNotFound = (error: Error) => {
  return error.message === notFoundErrorMessage;
};

const unknownFigmaApiExceptionMessage = "Unknown Figma API Exception";
export class UnknownFigmaApiException extends Error {
  constructor({ cause }: { cause: unknown }) {
    super(unknownFigmaApiExceptionMessage);

    this.cause = cause;
  }
}
export const isUnknownFigmaApiException = (error: Error) => {
  return error.message === unknownFigmaApiExceptionMessage;
};

const rateLimitExceededErrorMessage = "Rate Limit Exceeded";
export class RateLimitExceeded extends Error {
  constructor({ cause }: { cause?: unknown }) {
    super(rateLimitExceededErrorMessage);

    this.cause = cause;
  }
}
export const isRateLimitExceeded = (error: Error) => {
  return error.message === rateLimitExceededErrorMessage;
};

const requestTooLargeMessage = "Request Too Large";
export class RequestTooLarge extends Error {
  constructor({ cause }: { cause?: unknown }) {
    super(requestTooLargeMessage);

    this.cause = cause;
  }
}
export const isRequestTooLarge = (error: Error) => {
  return error.message === requestTooLargeMessage;
};
