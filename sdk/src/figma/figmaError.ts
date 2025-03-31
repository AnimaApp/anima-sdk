import type { CodegenErrorReason } from "../errors";

const figmaTokenIssueErrorMessage = "Figma Token Issue";
export class FigmaTokenIssue extends Error {
  fileKey: string;
  reason: string;

  constructor({
    fileKey,
    reason,
    cause,
  }: {
    fileKey: string;
    reason: string;
    cause?: unknown;
  }) {
    super(figmaTokenIssueErrorMessage);

    this.fileKey = fileKey;
    this.reason = reason;
    this.cause = cause;
  }
}

const rateLimitExceededErrorMessage = "Rate Limit Exceeded";
export class RateLimitExceeded extends Error {
  fileKey: string;

  constructor({ fileKey, cause }: { fileKey: string; cause?: unknown }) {
    super(rateLimitExceededErrorMessage);

    this.fileKey = fileKey;
    this.cause = cause;
  }
}

// Not Found
const notFoundErrorMessage = "Not Found";
export class NotFound extends Error {
  fileKey: string;

  constructor({ fileKey, cause }: { fileKey: string; cause?: unknown }) {
    super(notFoundErrorMessage);

    this.fileKey = fileKey;
    this.cause = cause;
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

// TODO: It should be replaced with FetchError from HTTP Client
export type FigmaApiError = {
  cause: { message?: string; body: { err: string; status: number } };
};

export const wrapFigmaApiError = (
  error: FigmaApiError,
  fileKey: string
): Error => {
  const isFetchError = error?.cause?.message === "Fetch Error";
  if (isFetchError) {
    const { err, status } = error.cause.body;

    if (status === 403) {
      return new FigmaTokenIssue({
        fileKey,
        reason: err,
        cause: error,
      });
    }

    if (status === 429) {
      return new RateLimitExceeded({ fileKey, cause: error });
    }

    if (status === 404) {
      return new NotFound({ fileKey, cause: error });
    }
  }

  return new UnknownFigmaApiException({ fileKey, cause: error });
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
