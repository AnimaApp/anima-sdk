import type { CodegenErrorReason } from "../errors";

const figmaTokenIssueErrorMessage = "Figma Token Issue";
export class FigmaTokenIssue extends Error {
  fileKey: string;
  reason: string;

  constructor({ fileKey, reason }: { fileKey: string; reason: string }) {
    super(figmaTokenIssueErrorMessage);

    this.fileKey = fileKey;
    this.reason = reason;
  }
}

const rateLimitExceededErrorMessage = "Rate Limit Exceeded";
export class RateLimitExceeded extends Error {
  fileKey: string;

  constructor({ fileKey }: { fileKey: string }) {
    super(rateLimitExceededErrorMessage);

    this.fileKey = fileKey;
  }
}

// Not Found
const notFoundErrorMessage = "Not Found";
export class NotFound extends Error {
  fileKey: string;

  constructor({ fileKey }: { fileKey: string }) {
    super(notFoundErrorMessage);

    this.fileKey = fileKey;
  }
}
export const isNotFound = (error: Error) => {
  return error.message === notFoundErrorMessage;
};

// Unknown Exception
const unknownFigmaApiExceptionMessage = "Unknown Figma API Exception";
export class UnknownFigmaApiException extends Error {
  fileKey: string;

  constructor({ fileKey, cause }: { fileKey: string; cause: unknown }) {
    super(unknownFigmaApiExceptionMessage);

    this.name = "UnknownFigmaApiException";
    this.fileKey = fileKey;
    this.cause = cause;
  }
}
export const isUnknownFigmaApiException = (error: Error) => {
  return error.message === unknownFigmaApiExceptionMessage;
};

export const isRateLimitExceeded = (error: Error) => {
  return error.message === rateLimitExceededErrorMessage;
};

export const isFigmaTokenIssue = (error: Error) => {
  const figmaTokenCodegenErrors: CodegenErrorReason[] = [
    "Invalid Figma token",
    "Figma token expired",
  ];

  return [figmaTokenIssueErrorMessage, ...figmaTokenCodegenErrors].includes(
    error.message
  );
};

export type FigmaApiError = {
  cause?: { body?: { status?: number; reason?: string } };
  body?: { status?: number; reason?: string };
};

export const handleFigmaApiError = (error: FigmaApiError, fileKey: string) => {
  const err = error?.cause?.body || error.body;

  if (err?.status === 403) {
    throw new FigmaTokenIssue({
      fileKey,
      reason: (error?.cause?.body?.reason || error.body?.reason || "Access denied").toString(),
    });
  }

  if (err?.status === 429) {
    throw new RateLimitExceeded({ fileKey });
  }

  if (err?.status === 404) {
    throw new NotFound({ fileKey });
  }

  throw new UnknownFigmaApiException({ fileKey, cause: error });
};

export type FigmaApiErrorType =
  | "FigmaTokenIssue"
  | "RateLimitExceeded"
  | "NotFound"
  | "UnknownFigmaApiException";

export const getFigmaApiErrorType = (error: Error): FigmaApiErrorType => {
  if (isNotFound(error)) {
    return "NotFound";
  }

  if (isRateLimitExceeded(error)) {
    return "RateLimitExceeded";
  }

  if (isFigmaTokenIssue(error)) {
    return "FigmaTokenIssue";
  }

  return "UnknownFigmaApiException";
};
