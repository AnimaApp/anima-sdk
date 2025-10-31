import {
  isFigmaTokenIssue,
  isNotFound,
  isRateLimitExceeded,
  isRequestTooLarge,
} from "../errors";

export type FigmaApiErrorType =
  | "FigmaTokenIssue"
  | "RateLimitExceeded"
  | "NotFound"
  | "UnknownFigmaApiException"
  | "RequestTooLarge";

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

  if (isRequestTooLarge(error)) {
    return "RequestTooLarge";
  }

  return "UnknownFigmaApiException";
};
