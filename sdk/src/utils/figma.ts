export const isValidFigmaUrl = (
  figmaLink: string
): [hasCorrectPrefix: boolean, fileKey: string, nodeId: string] => {
  if (!figmaLink) {
    return [false, "", ""];
  }

  try {
    const url = new URL(figmaLink);
    const path = url.pathname;

    if (
      url.origin !== "https://www.figma.com" &&
      url.origin !== "https://embed.figma.com"
    ) {
      return [false, "", ""];
    }

    const reconstructedUrl = url.toString();
    if (figmaLink !== reconstructedUrl) {
      return [false, "", ""];
    }

    const nodeId = (url.searchParams.get("node-id") ?? "").replace(/-/g, ":");
    const fileKey = path.split("/")[2];
    const hasCorrectPrefix =
      (path.startsWith("/file/") &&
        url.searchParams.get("type") !== "whiteboard") ||
      path.startsWith("/design/") ||
      path.startsWith("/proto/");

    return [hasCorrectPrefix && fileKey.length === 22, fileKey, nodeId];
  } catch {
    return [false, "", ""];
  }
};

export const formatToFigmaLink = ({
  fileKey,
  nodeId,
  duplicate,
}: {
  fileKey: string;
  nodeId?: string;
  duplicate?: boolean;
}) => {
  const url = new URL("https://www.figma.com");
  url.pathname = `design/${fileKey}`;

  if (duplicate) {
    // The path to duplicate a file is `/design/{fileKey}/{fileName}/duplicate`.
    // The `fileName` is not used, so we can use a dummy value.
    url.pathname = `${url.pathname}/dummy/duplicate`;
  }

  if (nodeId) {
    url.searchParams.set("node-id", nodeId.replace(":", "-"));
  }

  return url;
};

export class ResponseError extends Error {
  response: Response;

  constructor(message: string, res: Response) {
    super(message);
    this.response = res;
  }
}
