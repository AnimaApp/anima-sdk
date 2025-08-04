import { arrayBufferToBase64 } from "./utils";
import type {
  AnimaSDKResult,
  GetCodeParams,
  GetCodeFromWebsiteParams,
  GetLink2CodeParams,
  StreamCodgenMessage,
  ProgressMessage,
} from "@animaapp/anima-sdk";
import { CodegenError } from "@animaapp/anima-sdk";
import { EventSource } from "eventsource";
import { useImmer } from "use-immer";

// How many times can we tolerate transient errors before terminating the request
const MAX_RETRIES_AFTER_ERROR = 10;

type LocalAssetsStorage =
  | { strategy: "local"; path: string }
  | { strategy: "local"; filePath: string; referencePath: string };

export type UseAnimaParams =
  | (Omit<GetCodeParams, "assetsStorage"> & {
      assetsStorage?: GetCodeParams["assetsStorage"] | LocalAssetsStorage;
    })
  | (Omit<GetCodeFromWebsiteParams, "assetsStorage"> & {
      assetsStorage?:
        | GetCodeFromWebsiteParams["assetsStorage"]
        | LocalAssetsStorage;
    })
  | (Omit<GetLink2CodeParams, "assetsStorage"> & {
      assetsStorage?: GetLink2CodeParams["assetsStorage"] | LocalAssetsStorage;
      /** @deprecated Use GetCodeFromWebsiteParams instead. This will be removed in a future version. */
    });

type Status = "idle" | "pending" | "success" | "aborted" | "error";

type TaskStatus = "pending" | "running" | "finished";

type CodegenStatus = {
  status: Status;
  error: CodegenError | null;
  result: AnimaSDKResult | null;
  progressMessages: ProgressMessage[];
  tasks: {
    fetchDesign: { status: TaskStatus };
    codeGeneration: { status: TaskStatus; progress: number };
    uploadAssets: { status: TaskStatus };
  };
};

const defaultProgress: CodegenStatus = {
  status: "idle",
  error: null,
  result: null,
  progressMessages: [],
  tasks: {
    fetchDesign: { status: "pending" },
    codeGeneration: { status: "pending", progress: 0 },
    uploadAssets: { status: "pending" },
  },
};

type StreamMessageByType<T extends StreamCodgenMessage["type"]> = Extract<
  StreamCodgenMessage,
  { type: T }
>;

const getAssetsLocalStrategyParams = (
  localAssetsStorage: LocalAssetsStorage
) => {
  if ("path" in localAssetsStorage) {
    return {
      filePath: localAssetsStorage.path.replace(/^\//, ""),
      referencePath:
        localAssetsStorage.path === "/" ? "" : localAssetsStorage.path, // Workaround to avoid duplicated slashes in the URL. Ideally, the fix should be done in Codegen.
    };
  }

  return {
    filePath: localAssetsStorage.filePath.replace(/^\//, ""),
    referencePath:
      localAssetsStorage.referencePath === "/"
        ? ""
        : localAssetsStorage.referencePath,
  };
};

export const useAnimaCodegen = ({
  url,
  method = "POST",
}: {
  url: string;
  method?: string;
}) => {
  const [status, updateStatus] = useImmer<CodegenStatus>(defaultProgress);

  const getCode = async <T extends UseAnimaParams = UseAnimaParams>(
    params: T
  ) => {
    updateStatus((draft) => {
      draft.status = "pending";
      draft.error = null;
      draft.result = null;
      draft.tasks = defaultProgress.tasks;
    });

    const initialParams = structuredClone(params);

    if (params.assetsStorage?.strategy === "local") {
      const { referencePath } = getAssetsLocalStrategyParams(
        params.assetsStorage
      );

      params.assetsStorage = {
        strategy: "external",
        url: referencePath,
      };
    }

    // TODO: We have two workarounds here because of limitations on the `eventsource` package:
    // 1. We need to use the `fetch` function from the `EventSource` constructor to send the request with the correct method and body (https://github.com/EventSource/eventsource/issues/316#issuecomment-2525315835).
    // 2. We need to store the last fetch response to handle errors to read its body response, since it isn't expoted by the package (https://github.com/EventSource/eventsource/blob/8aa7057bccd7fb819372a3b2c1292e7b53424d52/src/EventSource.ts#L348-L376)
    // We might need to use other library, or do it from our self, to improve the code quality.
    let lastFetchResponse: ReturnType<typeof fetch>;
    const es = new EventSource(url, {
      fetch: (url, init) => {
        lastFetchResponse = fetch(url, {
          ...init,
          method,
          body: JSON.stringify(params),
        });

        return lastFetchResponse;
      },
    });

    const promise = new Promise<{
      result: AnimaSDKResult | null;
      error: CodegenError | null;
    }>((resolve) => {
      const result: Partial<AnimaSDKResult> = {};

      // Add specific event listeners
      es.addEventListener("start", (event) => {
        const message = JSON.parse(event.data) as StreamMessageByType<"start">;
        result.sessionId = message.sessionId;

        updateStatus((draft) => {
          draft.tasks.fetchDesign.status = "running";
        });
      });

      es.addEventListener("pre_codegen", (event) => {
        const message = JSON.parse(
          event.data
        ) as StreamMessageByType<"pre_codegen">;
        if (message.message === "Anima model built") {
          updateStatus((draft) => {
            draft.tasks.fetchDesign.status = "finished";
            draft.tasks.codeGeneration.status = "running";
            draft.tasks.uploadAssets.status = "running";
          });
        }
      });

      es.addEventListener("figma_metadata", (e) => {
        const message = JSON.parse(
          e.data
        ) as StreamMessageByType<"figma_metadata">;
        result.figmaFileName = message.figmaFileName;
        result.figmaSelectedFrameName = message.figmaSelectedFrameName;
      });

      es.addEventListener("aborted", () => {
        const error = new CodegenError({ name: "Aborted", reason: "Unknown" });

        updateStatus((draft) => {
          draft.status = "aborted";
          (draft.result = null), (draft.error = error);
        });

        resolve({
          result: null,
          error,
        });
      });

      es.addEventListener("generating_code", (event) => {
        const message = JSON.parse(
          event.data
        ) as StreamMessageByType<"generating_code">;
        if (message.payload.status === "success") {
          result.files = message.payload.files;
        }

        updateStatus((draft) => {
          draft.tasks.codeGeneration.progress = message.payload.progress;
          draft.tasks.codeGeneration.status = "running";
        });
      });

      es.addEventListener("progress_messages_updated", (event) => {
        const message = JSON.parse(
          event.data
        ) as StreamMessageByType<"progress_messages_updated">;

        updateStatus((draft) => {
          draft.progressMessages = message.payload.progressMessages;
        });
      });

      es.addEventListener("codegen_completed", () => {
        updateStatus((draft) => {
          draft.tasks.codeGeneration.status = "finished";
        });
      });

      es.addEventListener("generation_completed", () => {
        updateStatus((draft) => {
          draft.tasks.codeGeneration.status = "finished";
        });
      });

      es.addEventListener("assets_uploaded", () => {
        updateStatus((draft) => {
          draft.tasks.uploadAssets.status = "finished";
        });
      });

      es.addEventListener("assets_list", (event) => {
        const message = JSON.parse(
          event.data
        ) as StreamMessageByType<"assets_list">;

        result.assets = message.payload.assets;
      });

      let errorCount = 0;

      // TODO: For some reason, we receive errors even after the `done` event is triggered.
      es.addEventListener("error", async (error: ErrorEvent | MessageEvent) => {
        console.warn(
          `Experienced error during code generation (attempt ${errorCount + 1} / ${MAX_RETRIES_AFTER_ERROR})`,
          error,
        );

        let errorPayload: StreamMessageByType<"error"> | undefined;
        let errorStatusCode: number | undefined;

        // If true, then there's no point into keeping the event handler alive for retries.
        let isUnrecoverableError = false;

        try {
          if (error instanceof MessageEvent) {
            errorPayload = JSON.parse(error.data);
          } else {
            const response = await lastFetchResponse;
            errorStatusCode = response.status;
            try {
              errorPayload = await response.json();
            } catch {}
          }

          if (
            errorPayload?.payload?.name === "Task Crashed" ||
            errorStatusCode === 429
          ) {
            isUnrecoverableError = true;
          }
        } catch {}

        const codegenError = new CodegenError({
          name: errorPayload?.payload.name ?? "Unknown error",
          reason: errorPayload?.payload.message ?? "Unknown",
          status: errorPayload?.payload.status,
          detail: errorPayload?.payload.detail,
        });

        errorCount++;

        // It could happen that transient network errors cause the "error" event to be triggered temporarily.
        // In these cases, we ignore the error and retry the request, unless it's an unrecoverable error.
        let shouldTerminateRequest = false;
        if (errorCount > MAX_RETRIES_AFTER_ERROR) {
          console.error("Experienced too many errors, terminating request");
          shouldTerminateRequest = true;
        } else if (isUnrecoverableError) {
          console.error("Experienced unrecoverable error, terminating request");
          shouldTerminateRequest = true;
        }

        if (shouldTerminateRequest) {
          updateStatus((draft) => {
            draft.status = "error";
            draft.error = codegenError;
          });

          resolve({
            result: null,
            error: codegenError,
          });
        }
      });

      es.addEventListener("done", (event) => {
        const message = JSON.parse(event.data) as StreamMessageByType<"done">;
        result.tokenUsage = message.payload.tokenUsage;
        result.sessionId = message.payload.sessionId;

        updateStatus((draft) => {
          draft.status = "success";
          draft.result = result as AnimaSDKResult;
        });

        resolve({ result: result as AnimaSDKResult, error: null });
      });
    });

    try {
      const { result: r, error } = await promise;

      const result = structuredClone(r);

      // Ideally, we should download the assets within the `assets_uploaded` event handler, since it'll improve the performance.
      // But for some reason, it doesn't work. So, we download the assets here.
      if (
        initialParams.assetsStorage?.strategy === "local" &&
        result?.assets?.length
      ) {
        const { filePath } = getAssetsLocalStrategyParams(
          initialParams.assetsStorage
        );

        const downloadAssetsPromises = result.assets.map(async (asset) => {
          const response = await fetch(asset.url);
          const buffer = await response.arrayBuffer();
          return {
            assetName: asset.name,
            base64: arrayBufferToBase64(buffer),
          };
        });

        const assets = await Promise.allSettled(downloadAssetsPromises);
        for (const assetPromise of assets) {
          const assetsList: Record<string, string> = {};
          if (assetPromise.status === "fulfilled") {
            const { assetName, base64 } = assetPromise.value;

            assetsList[assetName] = base64;

            const assetPath = filePath ? `${filePath}/${assetName}` : assetName;
            result.files[assetPath] = {
              content: base64,
              isBinary: true,
            };
          }
        }
      }

      if (error) {
        return { result: null, error };
      }

      return { result, error };
    } finally {
      es.close();
    }
  };

  return {
    getCode,
    status: status.status,
    progressMessages: status.progressMessages,
    tasks: status.tasks,
    error: status.error,
    result: status.result,
  };
};
