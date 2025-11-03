import type {
  GetFileResponse,
  GetImageFillsResponse,
  GetImagesResponse,
  GetMeResponse,
} from "@figma/rest-api-spec";
import deepcopy from "deepcopy";
import {
  FigmaTokenIssue,
  InvalidFigmaAccessTokenError,
  MissingFigmaToken,
  NotFound,
  RateLimitExceeded,
  RequestTooLarge,
  UnknownFigmaApiException,
} from "./errors";

type FigmaRestApiConstructor = {
  fetch?: typeof window.fetch;
  baseAddress?: string;
  defaultOptions?: Omit<Options, "abortSignal">;
};

export type FigmaPlanTier =
  | "enterprise"
  | "org"
  | "pro"
  | "starter"
  | "student";
export type FigmaRateLimitType = "low" | "high";

export type Options = {
  token?: string;
  abortSignal?: AbortSignal;
  onRateLimited?: (headers: {
    retryAfter: number;
    figmaPlanTier: FigmaPlanTier;
    figmaRateLimitType: FigmaRateLimitType;
  }) => Promise<boolean>;
};

class FigmaRestApi {
  #baseAddress: string;
  #fetch: typeof window.fetch;
  #nextOptions: Options;
  #defaultOptions: Options;

  constructor({
    fetch = globalThis.fetch.bind(globalThis),
    baseAddress = "https://api.figma.com/",
    defaultOptions = {},
  }: FigmaRestApiConstructor = {}) {
    this.#baseAddress = baseAddress;
    this.#fetch = fetch;
    this.#defaultOptions = defaultOptions;
    this.#nextOptions = this.#defaultOptions;

    if (defaultOptions.token) {
      this.#ensureValidToken(defaultOptions.token);
    }
  }

  updateDefaultOptions(options: Options) {
    if (options.token) {
      this.#ensureValidToken(options.token);
    }

    this.#defaultOptions = {
      ...this.#defaultOptions,
      ...options,
    };
    this.#nextOptions = this.#defaultOptions;
  }

  withOptions(options: Options) {
    this.#nextOptions = {
      ...this.#defaultOptions,
      ...this.#nextOptions,
      ...options,
    };

    return this;
  }

  #ensureValidToken(token: string) {
    if (!token.startsWith("figd_") && !token.startsWith("figu_")) {
      throw new InvalidFigmaAccessTokenError();
    }
  }

  getHeaders(token?: string) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const tokenInUse = token ?? this.#defaultOptions.token;
    if (tokenInUse?.startsWith("figd_")) {
      headers["X-FIGMA-TOKEN"] = tokenInUse;
    } else if (tokenInUse?.startsWith("figu_")) {
      headers["Authorization"] = `Bearer ${tokenInUse}`;
    } else {
      throw new MissingFigmaToken();
    }

    return headers;
  }

  async #doRequest(
    options: Options,
    request: () => Promise<Response>
  ): Promise<Response> {
    const response = await request();

    if (!response.ok) {
      const status = response.status;
      let responseText: string | null = null;
      try {
        responseText = await response.text();
      } catch {
        // ignore
      }

      if (status === 403) {
        throw new FigmaTokenIssue({
          cause: response,
        });
      } else if (status === 404) {
        throw new NotFound({ cause: response });
      } else if (status === 429) {
        const rawRetryAfter = response.headers.get("Retry-After");
        const retryAfter = rawRetryAfter ? Number(rawRetryAfter) : null;

        if (!retryAfter) {
          throw new RateLimitExceeded({
            cause: response,
          });
        }

        const shouldRetry = await options.onRateLimited?.({
          retryAfter,
          figmaPlanTier: response.headers.get(
            "X-Figma-Plan-Tier"
          ) as FigmaPlanTier,
          figmaRateLimitType: response.headers.get(
            "X-Figma-Rate-Limit-Type"
          ) as FigmaRateLimitType,
        });

        if (shouldRetry) {
          return new Promise((resolve, reject) => {
            const timeout = setTimeout(
              () => {
                if (options.abortSignal?.aborted) {
                  return;
                }

                this.#doRequest(options, request).then(resolve).catch(reject);
              },
              retryAfter * 1000 + 1000
            );

            options.abortSignal?.addEventListener("abort", () => {
              clearTimeout(timeout);
              reject(new Error("The operation was aborted."));
            });
          });
        }

        throw new RateLimitExceeded({ cause: response });
      } else if (
        status === 500 &&
        responseText?.includes("Request too large")
      ) {
        throw new RequestTooLarge({ cause: response });
      } else {
        throw new UnknownFigmaApiException({
          cause: response,
        });
      }
    }

    return response;
  }

  async #get<T>(url: string): Promise<T> {
    const nextOptions = deepcopy(this.#nextOptions);
    this.#nextOptions = deepcopy(this.#defaultOptions);

    const request = async () => {
      const response = await this.#fetch(`${this.#baseAddress}${url}`, {
        method: "GET",
        headers: this.getHeaders(nextOptions.token),
        signal: nextOptions.abortSignal,
      });

      return response;
    };

    const response = await this.#doRequest(nextOptions, request);

    const responseData = (await response.json()) as T;
    return responseData;
  }

  async getFile({
    fileKey,
    nodeIds = [],
    depth,
  }: {
    fileKey: string;
    nodeIds?: string[];
    depth?: number;
  }) {
    const urlSearchParams = new URLSearchParams({
      plugin_data: "857346721138427857",
      geometry: "paths",
    });

    if (nodeIds.length > 0) {
      urlSearchParams.append("ids", nodeIds.join(","));
    }

    if (depth) {
      urlSearchParams.append("depth", `${depth}`);
    }

    const searchQuery = urlSearchParams.toString();

    const url = `v1/files/${fileKey}?${searchQuery}`;
    const response = await this.#get<GetFileResponse>(url);

    return response;
  }

  async getNodeImages<As extends "links" | "arrayBuffer" = "arrayBuffer">({
    fileKey,
    nodeIds,
    scale = 1,
    as = "arrayBuffer" as As,
    format = "jpg",
  }: {
    fileKey: string;
    nodeIds: string[];
    scale?: number;
    as?: As;
    format?: "jpg" | "png" | "svg" | "pdf";
  }): Promise<
    As extends "arrayBuffer"
      ? Record<string, ArrayBuffer | null>
      : Record<string, string | null>
  > {
    const rawResponse = await this.#get<GetImagesResponse>(
      `v1/images/${fileKey}?ids=${nodeIds}&format=${format}&scale=${scale}`
    );

    const images = rawResponse.images;

    if (as === "links") {
      return images as As extends "arrayBuffer"
        ? Record<string, ArrayBuffer | null>
        : Record<string, string | null>;
    }

    const downloadImagePromises = nodeIds.map(async (nodeId) => {
      const imageUrl = images[nodeId];
      if (!imageUrl) {
        return null;
      }

      const fetchResponse = await this.#fetch(imageUrl);

      if (!fetchResponse.ok) {
        return null;
      }

      const imageBlob = await fetchResponse.arrayBuffer();
      return imageBlob;
    });

    const downloadedImages = await Promise.allSettled(downloadImagePromises);

    const result = nodeIds.reduce(
      (acc, nodeId, index) => {
        const settledResult = downloadedImages[index];
        if (settledResult.status === "fulfilled") {
          acc[nodeId] = settledResult.value;
        } else {
          acc[nodeId] = null;
        }
        return acc;
      },
      {} as Record<string, ArrayBuffer | null>
    );

    return result as As extends "arrayBuffer"
      ? Record<string, ArrayBuffer | null>
      : Record<string, string | null>;
  }

  async getImageFills({
    fileKey,
  }: {
    fileKey: string;
  }): Promise<Record<string, string>> {
    const url = `v1/files/${fileKey}/images`;
    const response = await this.#get<GetImageFillsResponse>(url);
    return response.meta?.images ?? {};
  }

  async getMe() {
    const url = `v1/me`;
    const response = await this.#get<GetMeResponse>(url);
    return response;
  }
}

export { FigmaRestApi };
