import { CodegenError } from "./errors";
import { validateSettings } from "./settings";
import {
  AnimaFiles,
  AnimaSDKResult,
  GetCodeHandler,
  GetCodeParams,
  SSECodgenMessage,
} from "./types";
import { convertCodegenFilesToAnimaFiles } from "./codegenToAnimaFiles";
export type Auth =
  | { token: string; teamId: string } // for Anima user, it's mandatory to have an associated team
  | { token: string; userId?: string }; // for users from a 3rd-party client (e.g., Bolt) they may have optionally a user id

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

      if ("userId" in this.#auth && this.#auth.userId) {
        headers["X-User-Id"] = this.#auth.userId;
      }
    }

    return headers;
  }

  async generateCode(params: GetCodeParams, handler: GetCodeHandler = {}) {
    if (this.hasAuth() === false) {
      throw new Error('It needs to set "auth" before calling this method.');
    }

    const result: Partial<AnimaSDKResult> = {};
    const settings = validateSettings(params.settings);

    const response = await fetch(`${this.#apiBaseAddress}/v1/codegen`, {
      method: "POST",
      headers: {
        ...this.headers,
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        fileKey: params.fileKey,
        figmaToken: params.figmaToken,
        nodesId: params.nodesId,
        language: settings.language,
        model: settings.model,
        framework: settings.framework,
        styling: settings.styling,
        uiLibrary: settings.uiLibrary,
        enableTranslation: settings.enableTranslation,
        enableUILibraryTheming: settings.enableUILibraryTheming,
      }),
    });

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.message || `HTTP error! status: ${response.status}`;
      } catch {
        errorMessage = `HTTP error! status: ${response.status}`;
      }
      throw new CodegenError({
        name: "HTTP Error",
        reason: errorMessage,
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
            let data: SSECodgenMessage;
            try {
              data = JSON.parse(line.slice(6));
            } catch {
              // ignore malformed JSON
              continue;
            }

            switch (data.type) {
              case "start": {
                result.sessionId = data.sessionId;
                typeof handler === "function"
                  ? handler(data)
                  : handler.onStart?.({ sessionId: data.sessionId });
                break;
              }

              case "pre_codegen": {
                typeof handler === "function"
                  ? handler(data)
                  : handler.onPreCodegen?.({ message: data.message });
                break;
              }

              case "assets_uploaded": {
                typeof handler === "function"
                  ? handler(data)
                  : handler.onAssetsUploaded?.();
                break;
              }

              case "figma_metadata": {
                result.figmaFileName = data.figmaFileName;
                result.figmaSelectedFrameName = data.figmaSelectedFrameName;

                typeof handler === "function"
                  ? handler(data)
                  : handler.onFigmaMetadata?.({
                    figmaFileName: data.figmaFileName,
                    figmaSelectedFrameName: data.figmaSelectedFrameName,
                  });
                break;
              }

              case "generating_code": {
                const codegenFiles = data.payload.files as Record<
                  string,
                  { code: string; type: "code" }
                >;

                const files = convertCodegenFilesToAnimaFiles(codegenFiles);
                
                if (data.payload.status === "success") {
                  result.files = files;
                }

                typeof handler === "function"
                  ? handler(data)
                  : handler.onGeneratingCode?.({
                    status: data.payload.status,
                    progress: data.payload.progress,
                    files,
                  });
                break;
              }

              case "codegen_completed": {
                typeof handler === "function"
                  ? handler(data)
                  : handler.onCodegenCompleted?.();
                break;
              }

              case "error": {
                // not sure if we want to throw on "stream" errors
                throw new CodegenError({
                  name: data.payload.errorName,
                  reason: data.payload.reason,
                });
              }

              case "done": {
                if (!result.files) {
                  // not sure if we want to throw on "logical" errors
                  // I think we should throw only on "HTTP" errors
                  throw new CodegenError({
                    name: "Invalid response",
                    reason: "No files found",
                  });
                }
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
}
