/* eslint-disable @typescript-eslint/no-explicit-any */
import { GetFileResponse } from "@figma/rest-api-spec";
import { CodegenError, CodegenRouteErrorReason } from "./errors";
import { getFigmaFile } from "./figma";
import { validateSettings } from "./settings";
import {
  AnimaSDKResult,
  GetCodeHandler,
  GetCodeParams,
  GetLink2CodeHandler,
  GetLink2CodeParams,
  SSECodgenMessage,
  SSEL2CMessage,
} from "./types";
import { isNodeCodegenCompatible } from "./utils/isNodeCodegenCompatible";

export type Auth =
  | { token: string; teamId: string } // for Anima user, it's mandatory to have an associated team
  | { token: string; userId?: string }; // for users from a 3rd-party integrations, they may have optionally a user id

export class Anima {
  #auth?: Auth;
  #apiBaseAddress: string;

  constructor({
    auth,
    apiBaseAddress = "https://public-api.animaapp.com",
  }: {
    auth?: Auth;
    apiBaseAddress?: string;
    path?: string;
  } = {}) {
    this.#apiBaseAddress = apiBaseAddress;

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
    fileKey: string,
    figmaToken: string,
    nodesId: string[]
  ) {
    let design: GetFileResponse;
    try {
      design = await getFigmaFile({
        fileKey,
        authToken: figmaToken,
        params: {
          geometry: "paths",
        },
      });
    } catch {
      // ignore all errors when trying to get the figma file to retry later in the backend
      return;
    }

    const isCompatibleResults = nodesId.map((nodeId) =>
      isNodeCodegenCompatible(design, nodeId)
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
   * Generic method to handle API requests and stream processing for both code generation and link2code.
   * 
   * @param endpoint - The API endpoint to call
   * @param requestBody - The request body to send
   * @param handler - The handler for processing messages
   * @param messageType - The type of messages being processed (for TypeScript type safety)
   * @returns The result of the generation process
   */
  async #processGenerationRequest<T extends SSECodgenMessage | SSEL2CMessage>(
    endpoint: string,
    requestBody: any,
    handler: ((message: T) => void) | Record<string, any>,
    messageType: 'codegen' | 'l2c'
  ): Promise<AnimaSDKResult> {
    if (this.hasAuth() === false) {
      throw new Error('It needs to set "auth" before calling this method.');
    }

    const result: Partial<AnimaSDKResult> = {};

    const response = await fetch(`${this.#apiBaseAddress}${endpoint}`, {
      method: "POST",
      headers: {
        ...this.headers,
        Accept: "text/event-stream",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();

      let errorObj = undefined;
      try {
        errorObj = JSON.parse(errorText);
      } catch { }

      if (errorObj?.error?.name === "ZodError") {
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
                  : handler.onQueueing?.();
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
                if (messageType === 'codegen') {
                  typeof handler === "function"
                    ? handler(data)
                    : handler.onPreCodegen?.({ message: (data as any).message });
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
                if (messageType === 'codegen') {
                  result.figmaFileName = (data as any).figmaFileName;
                  result.figmaSelectedFrameName = (data as any).figmaSelectedFrameName;

                  typeof handler === "function"
                    ? handler(data)
                    : handler.onFigmaMetadata?.({
                      figmaFileName: (data as any).figmaFileName,
                      figmaSelectedFrameName: (data as any).figmaSelectedFrameName,
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
                if (!result.files) {
                  throw new CodegenError({
                    name: "Invalid response",
                    reason: "No code generated",
                  });
                }

                result.tokenUsage = (data as any).payload.tokenUsage;
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

  async generateCode(params: GetCodeParams, handler: GetCodeHandler = {}) {
    if (params.figmaToken) {
      await this.#checkGivenNodeIsValid(
        params.fileKey,
        params.figmaToken,
        params.nodesId
      );
    }

    const settings = validateSettings(params.settings);

    let tracking = params.tracking;
    if (this.#auth && "userId" in this.#auth && this.#auth.userId) {
      if (!tracking?.externalId) {
        tracking = { externalId: this.#auth.userId };
      }
    }

    const requestBody = {
      tracking,
      fileKey: params.fileKey,
      figmaToken: params.figmaToken,
      nodesId: params.nodesId,
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
    };

    return this.#processGenerationRequest<SSECodgenMessage>(
      '/v1/codegen',
      requestBody,
      handler,
      'codegen'
    );
  }

  /**
   * @experimental
   * This API is experimental and may change or be removed in future releases.
   * Link2Code (l2c) flow.
   */
  async generateLink2Code(params: GetLink2CodeParams, handler: GetLink2CodeHandler = {}) {
    let tracking = params.tracking;
    if (this.#auth && "userId" in this.#auth && this.#auth.userId) {
      if (!tracking?.externalId) {
        tracking = { externalId: this.#auth.userId };
      }
    }

    const requestBody = {
      tracking,
      assetsStorage: params.assetsStorage,
      params: params.params,
    };

    return this.#processGenerationRequest<SSEL2CMessage>(
      '/v1/l2c',
      requestBody,
      handler,
      'l2c'
    );
  }
}
