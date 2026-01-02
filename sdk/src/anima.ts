/* eslint-disable @typescript-eslint/no-explicit-any */
import { GetFileResponse } from "@figma/rest-api-spec";
import { gzip } from "pako";
import { CodegenError, CodegenRouteErrorReason } from "./errors";
import { validateSettings } from "./settings";
import {
  AnimaSDKResult,
  AttachToGenerationJobParams,
  GetCodeFromWebsiteHandler,
  GetCodeFromWebsiteParams,
  GetCodeFromPromptHandler,
  GetCodeFromPromptParams,
  GetCodeHandler,
  GetCodeParams,
  GetLink2CodeParams,
  SSEGetCodeFromWebsiteMessage,
  SSEGetCodeFromPromptMessage,
  SSEGetCodeFromFigmaMessage,
} from "./types";
import { isNodeCodegenCompatible } from "./utils/isNodeCodegenCompatible";
import { FigmaRestApi } from "./FigmaRestApi";

const JOB_TYPE_CONVERSION_MAP: Record<string, string> = {
  codegen: "f2c",
};

export type Auth =
  | { token: string; teamId: string } // for Anima user, it's mandatory to have an associated team
  | { token: string; userId?: string }; // for users from a 3rd-party integrations, they may have optionally a user id

export class Anima {
  #auth?: Auth;
  #apiBaseAddress: string;
  #figmaRestApi: FigmaRestApi;

  constructor({
    auth,
    apiBaseAddress = "https://public-api.animaapp.com",
    figmaRestApi = new FigmaRestApi(),
  }: {
    auth?: Auth;
    apiBaseAddress?: string;
    path?: string;
    figmaRestApi?: FigmaRestApi;
  } = {}) {
    this.#apiBaseAddress = apiBaseAddress;
    this.#figmaRestApi = figmaRestApi;

    if (auth) {
      this.auth = auth;
    }
  }

  protected hasAuth() {
    return !!this.#auth;
  }

  set auth(auth: Auth) {
    this.#auth = auth;
  }

  protected get headers() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.#auth) {
      headers["Authorization"] = `Bearer ${this.#auth.token}`;

      if ("teamId" in this.#auth) {
        headers["X-Team-Id"] = this.#auth.teamId;
      }
    }

    return headers;
  }

  async #checkGivenNodeIsValid(
    design: GetFileResponse,
    nodesId: string[],
    options: {
      allowAutoSelectFirstNode: boolean;
    }
  ) {
    const isCompatibleResults = nodesId.map((nodeId) =>
      isNodeCodegenCompatible(design, nodeId, options)
    );

    const error = isCompatibleResults.find(
      (isCompatible) => !isCompatible.isValid
    );

    if (error) {
      throw new CodegenError({
        name: "Task Crashed",
        reason: error.reason,
      });
    }
  }

  /**
   * Generic method to handle API requests and stream processing for code generation flows.
   *
   * @param endpoint - The API endpoint to call
   * @param requestJson - The JSON to send
   * @param handler - The handler for processing messages
   * @param messageType - The type of messages being processed (for TypeScript type safety)
   * @returns The result of the generation process
   */
  async #processGenerationRequest<
    T extends
      | SSEGetCodeFromFigmaMessage
      | SSEGetCodeFromWebsiteMessage
      | SSEGetCodeFromPromptMessage,
  >(
    method: "GET" | "POST",
    endpoint: string,
    requestJson: object,
    handler: ((message: T) => void) | Record<string, any>,
    messageType?: "codegen" | "l2c" | "p2c",
    signal?: AbortSignal
  ): Promise<AnimaSDKResult> {
    if (this.hasAuth() === false) {
      throw new Error('It needs to set "auth" before calling this method.');
    }

    const result: Partial<AnimaSDKResult> = {};
    const init: RequestInit = {
      method,
      headers: {
        ...this.headers,
        Accept: "text/event-stream",
      },
      signal,
    };
    if (method === "POST") {
      const requestBody = gzip(JSON.stringify(requestJson));
      init.body = requestBody;
      init.headers = {
        ...(init.headers as HeadersInit),
        "Content-Encoding": "gzip",
        "Content-Type": "application/json",
      };
    }

    const response = await fetch(`${this.#apiBaseAddress}${endpoint}`, init);

    if (!response.ok) {
      const errorText = await response.text();

      let errorObj = undefined;
      try {
        errorObj = JSON.parse(errorText);
      } catch {}

      if (errorObj?.error?.name === "ZodError") {
        console.log(
          "Zod validation error:",
          JSON.stringify(errorObj.error.issues, null, 2)
        );
        throw new CodegenError({
          name: "HTTP error from Anima API",
          reason: "Invalid body payload",
          detail: errorObj.error.issues,
          status: response.status,
        });
      }

      if (typeof errorObj === "object") {
        throw new CodegenError({
          name: `Error "${errorObj}"`,
          reason: "Unknown",
          status: response.status,
        });
      }

      throw new CodegenError({
        name: "HTTP error from Anima API",
        reason: errorText as CodegenRouteErrorReason,
        status: response.status,
      });
    }

    if (!response.body) {
      throw new CodegenError({
        name: "Stream Error",
        reason: "Response body is null",
        status: response.status,
      });
    }

    const jobType = response.headers.get("x-anima-job-type");
    const normalizedJobType =
      jobType && JOB_TYPE_CONVERSION_MAP[jobType]
        ? JOB_TYPE_CONVERSION_MAP[jobType]
        : jobType;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");

        // Process all complete lines
        buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

        for (const line of lines) {
          if (!line.trim() || line.startsWith(":")) continue;

          if (line.startsWith("data: ")) {
            let data: T;
            try {
              data = JSON.parse(line.slice(6));
            } catch {
              // ignore malformed JSON
              continue;
            }

            switch (data.type) {
              case "queueing": {
                typeof handler === "function"
                  ? handler(data)
                  : handler.onQueueing?.({
                      sessionId: (data as any).sessionId,
                    });
                break;
              }
              case "start": {
                result.sessionId = (data as any).sessionId;
                typeof handler === "function"
                  ? handler(data)
                  : handler.onStart?.({ sessionId: (data as any).sessionId });
                break;
              }

              case "pre_codegen": {
                if (messageType === "codegen") {
                  typeof handler === "function"
                    ? handler(data)
                    : handler.onPreCodegen?.({
                        message: (data as any).message,
                      });
                }
                break;
              }

              case "assets_uploaded": {
                typeof handler === "function"
                  ? handler(data)
                  : handler.onAssetsUploaded?.();
                break;
              }

              case "assets_list": {
                result.assets = (data as any).payload.assets;

                typeof handler === "function"
                  ? handler(data)
                  : handler.onAssetsList?.((data as any).payload);
                break;
              }

              case "figma_metadata": {
                if (messageType === "codegen") {
                  result.figmaFileName = (data as any).figmaFileName;
                  result.figmaSelectedFrameName = (
                    data as any
                  ).figmaSelectedFrameName;

                  typeof handler === "function"
                    ? handler(data)
                    : handler.onFigmaMetadata?.({
                        figmaFileName: (data as any).figmaFileName,
                        figmaSelectedFrameName: (data as any)
                          .figmaSelectedFrameName,
                      });
                }
                break;
              }

              case "generating_code": {
                if ((data as any).payload.status === "success") {
                  result.files = (data as any).payload.files;
                }

                typeof handler === "function"
                  ? handler(data)
                  : handler.onGeneratingCode?.({
                      status: (data as any).payload.status,
                      progress: (data as any).payload.progress,
                      files: (data as any).payload.files,
                    });
                break;
              }

              case "progress_messages_updated": {
                typeof handler === "function"
                  ? handler({
                      ...data,
                      payload: { ...data.payload, jobType: normalizedJobType },
                    })
                  : handler.onProgressMessagesUpdated?.(
                      data.payload.progressMessages
                    );
                break;
              }

              case "job_status_updated": {
                typeof handler === "function"
                  ? handler({
                      ...data,
                      payload: { ...data.payload, jobType: normalizedJobType },
                    })
                  : handler.onJobStatusUpdated?.(data.payload.jobStatus);
                break;
              }

              case "codegen_completed":
              case "generation_completed": {
                typeof handler === "function"
                  ? handler(data)
                  : handler.onCodegenCompleted?.();
                break;
              }

              case "error": {
                throw new CodegenError({
                  name: (data as any).payload.errorName,
                  reason: (data as any).payload.reason,
                });
              }

              case "done": {
                result.tokenUsage = (data as any).payload.tokenUsage;
                result.sessionId = (data as any).payload.sessionId;
                return result as AnimaSDKResult;
              }
            }
          }
        }
      }
    } finally {
      reader.cancel();
    }

    throw new CodegenError({
      name: "Connection",
      reason: "Connection closed before the 'done' message",
      status: 500,
    });
  }

  async generateCode(
    params: GetCodeParams,
    handler: GetCodeHandler = {},
    signal?: AbortSignal
  ) {
    let design: GetFileResponse | undefined;
    try {
      design = await this.#figmaRestApi
        .withOptions({ token: params.figmaToken, abortSignal: signal })
        .getFile({
          fileKey: params.fileKey,
        });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // The caller aborted the request, no need to fall through
        throw error;
      }

      // ignore any errors when trying to get the figma file to retry later in the backend
    }

    const settings = validateSettings(params.settings);

    if (design) {
      await this.#checkGivenNodeIsValid(design, params.nodesId, {
        allowAutoSelectFirstNode: settings.allowAutoSelectFirstNode ?? true,
      });
    }

    let tracking = params.tracking;
    if (this.#auth && "userId" in this.#auth && this.#auth.userId) {
      if (!tracking?.externalId) {
        tracking = { externalId: this.#auth.userId };
      }
    }

    const requestJson = {
      tracking,
      fileKey: params.fileKey,
      figmaToken: params.figmaToken,
      nodesId: params.nodesId,
      figmaRateLimitMaxWait: params.figmaRateLimitMaxWait,
      assetsStorage: params.assetsStorage,
      language: settings.language,
      model: settings.model,
      framework: settings.framework,
      styling: settings.styling,
      uiLibrary: settings.uiLibrary,
      enableTranslation: settings.enableTranslation,
      enableUILibraryTheming: settings.enableUILibraryTheming,
      enableCompactStructure: settings.enableCompactStructure,
      enableAutoSplit: settings.enableAutoSplit,
      autoSplitThreshold: settings.autoSplitThreshold,
      disableMarkedForExport: settings.disableMarkedForExport,
      allowAutoSelectFirstNode: settings.allowAutoSelectFirstNode,
      enableDisplayScreenModelId: settings.enableDisplayScreenModelId,
      enableGeneratePackageLock: settings.enableGeneratePackageLock,
      enableAnimationsPreset: settings.enableAnimationsPreset,
      enableDisplayDataId: settings.enableDisplayDataId,
      enableDisplayDataName: settings.enableDisplayDataName,
      codegenSettings: settings.codegenSettings,
      webhookUrl: params.webhookUrl,
      prompt: params.prompt,
      images: params.images,
      // @ts-expect-error: We don't need to expose this parameter to GetCodeParams
      createSession: params.createSession,
    };

    return this.#processGenerationRequest<SSEGetCodeFromFigmaMessage>(
      "POST",
      "/v1/codegen",
      requestJson,
      handler,
      "codegen",
      signal
    );
  }

  async generateCodeFromWebsite(
    params: GetCodeFromWebsiteParams,
    handler: GetCodeFromWebsiteHandler = {},
    signal?: AbortSignal
  ) {
    let tracking = params.tracking;
    if (this.#auth && "userId" in this.#auth && this.#auth.userId) {
      if (!tracking?.externalId) {
        tracking = { externalId: this.#auth.userId };
      }
    }

    let input;
    if (params.mhtmlUrl) {
      input = {
        type: "hosted-mhtml",
        mhtmlUrl: params.mhtmlUrl,
        url: params.url,
      };
    } else if (params.mhtml) {
      input = {
        type: "mhtml",
        mhtml: params.mhtml,
        url: params.url,
      };
    } else if (params.url) {
      input = {
        type: "url",
        url: params.url,
      };
    } else {
      throw new Error("Either 'url', 'mhtml' or 'mhtmlUrl' must be provided");
    }

    let engine: "react-v2" | undefined = undefined;
    if (params.experimental_useNewReactEngine) {
      engine = "react-v2";
    }

    const requestJson = {
      tracking,
      assetsStorage: params.assetsStorage,
      prompt: params.prompt,
      images: params.images,
      params: {
        input,
        conventions: {
          framework: params.settings.framework,
          language: params.settings.language,
          styling: params.settings.styling,
        },
        assetsStorage: {
          type: "bundled",
        },
        engine,
      },
    };

    return this.#processGenerationRequest<SSEGetCodeFromWebsiteMessage>(
      "POST",
      "/v1/l2c",
      requestJson,
      handler,
      "l2c",
      signal
    );
  }

  /**
   * Generates code from a text prompt using AI.
   *
   * This method sends a prompt to the Anima API and generates code based on the description provided.
   * It supports real-time streaming of the generation process through Server-Sent Events (SSE).
   *
   * @param params - The parameters for code generation
   * @param params.prompt - The text prompt describing what code to generate
   * @param params.settings - Code generation settings (framework, language, styling, etc.)
   * @param params.assetsStorage - Optional asset storage configuration
   * @param params.tracking - Optional tracking information
   * @param params.webhookUrl - Optional webhook URL for completion notification
   * @param handler - Event handler for processing SSE messages during generation
   * @param signal - Optional AbortSignal to cancel the request
   * @returns Promise resolving to AnimaSDKResult with generated files and metadata
   *
   * @example
   * ```typescript
   * const result = await anima.generateCodeFromPrompt({
   *   prompt: "Create a login form with email and password fields",
   *   settings: {
   *     framework: "react",
   *     language: "typescript",
   *     styling: "tailwind"
   *   }
   * }, {
   *   onStart: ({ sessionId }) => console.log("Started:", sessionId),
   *   onGeneratingCode: ({ progress }) => console.log("Progress:", progress),
   *   onCodegenCompleted: () => console.log("Generation completed!")
   * });
   * ```
   */
  async generateCodeFromPrompt(
    params: GetCodeFromPromptParams,
    handler: GetCodeFromPromptHandler = {},
    signal?: AbortSignal
  ) {
    let tracking = params.tracking;
    if (this.#auth && "userId" in this.#auth && this.#auth.userId) {
      if (!tracking?.externalId) {
        tracking = { externalId: this.#auth.userId };
      }
    }

    const requestJson = {
      tracking,
      assetsStorage: params.assetsStorage,
      params: {
        prompt: params.prompt,
        images: params.images,
        conventions: {
          language: params.settings.language,
          framework: params.settings.framework,
          styling: params.settings.styling,
          uiLibrary: params.settings.uiLibrary,
        },
        ...(params.settings.codegenSettings ?? {}),
      },
      webhookUrl: params.webhookUrl,
    };

    return this.#processGenerationRequest<SSEGetCodeFromPromptMessage>(
      "POST",
      "/v1/p2c",
      requestJson,
      handler,
      "p2c",
      signal
    );
  }

  /**
   * @deprecated This method will be removed soon, please use `generateCodeFromWebsite` instead.
   */
  async generateLink2Code(
    params: GetLink2CodeParams,
    handler: GetCodeFromWebsiteHandler = {},
    signal?: AbortSignal
  ) {
    let tracking = params.tracking;
    if (this.#auth && "userId" in this.#auth && this.#auth.userId) {
      if (!tracking?.externalId) {
        tracking = { externalId: this.#auth.userId };
      }
    }

    const requestJson = {
      tracking,
      assetsStorage: params.assetsStorage,
      params: params.params,
    };

    return this.#processGenerationRequest<SSEGetCodeFromWebsiteMessage>(
      "POST",
      "/v1/l2c",
      requestJson,
      handler,
      "l2c",
      signal
    );
  }

  async attachToGenerationJob<
    T extends
      | SSEGetCodeFromFigmaMessage
      | SSEGetCodeFromWebsiteMessage
      | SSEGetCodeFromPromptMessage,
  >(
    params: AttachToGenerationJobParams,
    handler: ((message: T) => void) | Record<string, any> = {},
    signal?: AbortSignal
  ) {
    const requestJson = {};
    const messageType = undefined;
    return this.#processGenerationRequest<T>(
      "GET",
      `/v1/jobs/${params.sessionId}`,
      requestJson,
      handler,
      messageType,
      signal
    );
  }
}
