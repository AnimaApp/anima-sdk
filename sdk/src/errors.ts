/**
 * Codegen errors from the worker
 */
export type CodegenErrorReason =
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
  | "Missing Authorization header"
  | "Invalid Authorization header"
  | "Missing teamId"
  | "Internal server error"
  | "Forbidden, no team access"
  | "Requested Usage Exceeds Limit"
  | "Not all frames id from responsive pages are mentioned on the nodes id list"
  | "Too many screens to import"
  | "Invalid Anima token";

/**
 * Errors from the SDK
 */
export type SDKErrorReason =
  | "Invalid body payload"
  | "No code generated"
  | "Connection closed before the 'done' message"
  | "Response body is null";

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
    reason: CodegenErrorReason | CodegenRouteErrorReason | SDKErrorReason;
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
