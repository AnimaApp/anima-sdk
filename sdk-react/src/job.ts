import {
  AnimaSDKResult,
  CodegenError,
  GetCodeFromWebsiteParams,
  GetCodeParams,
  GetLink2CodeParams,
  ProgressMessage,
  StreamCodgenMessage,
} from "@animaapp/anima-sdk";
import { EventSource } from "eventsource";
import { arrayBufferToBase64 } from "./utils";

type Status = "idle" | "pending" | "success" | "aborted" | "error";

type TaskStatus = "pending" | "running" | "finished";

export type CodegenState = {
  status: Status;
  error: CodegenError | null;
  result: AnimaSDKResult | null;
  progressMessages: ProgressMessage[];
  tasks: {
    fetchDesign: { status: TaskStatus };
    codeGeneration: { status: TaskStatus; progress: number };
    uploadAssets: { status: TaskStatus };
  };
  jobSessionId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jobStatus: Record<string, any>;
};

export const initialProgress: CodegenState = {
  status: "idle",
  error: null,
  result: null,
  progressMessages: [],
  tasks: {
    fetchDesign: { status: "pending" },
    codeGeneration: { status: "pending", progress: 0 },
    uploadAssets: { status: "pending" },
  },
  jobSessionId: null,
  jobStatus: {},
};

type StreamMessageByType<T extends StreamCodgenMessage["type"]> = Extract<
  StreamCodgenMessage,
  { type: T }
>;

const MAX_RETRIES_AFTER_ERROR = 10; // How many times can we tolerate transient errors before terminating the request

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

const subscribeToJobStream = ({
  es,
  lastFetchResponse,
  stateUpdated,
}: {
  es: EventSource;
  lastFetchResponse: ReturnType<typeof fetch> | undefined;
  stateUpdated: (state: CodegenState) => void;
}) => {
  const state = structuredClone(initialProgress);
  state.status = "pending";
  stateUpdated({ ...state });

  return new Promise<{
    result: AnimaSDKResult | null;
    error: CodegenError | null;
  }>((resolve, reject) => {
    const result: Partial<AnimaSDKResult> = {};

    // Add specific event listeners
    es.addEventListener("start", (event) => {
      const message = JSON.parse(event.data) as StreamMessageByType<"start">;
      result.sessionId = message.sessionId;

      state.tasks.fetchDesign.status = "running";
      state.jobSessionId = message.sessionId;
      stateUpdated({ ...state });
    });

    es.addEventListener("queueing", (event) => {
      const message = JSON.parse(event.data) as StreamMessageByType<"queueing">;

      state.jobSessionId = message.payload.sessionId;
      stateUpdated({ ...state });
    });

    es.addEventListener("pre_codegen", (event) => {
      const message = JSON.parse(
        event.data
      ) as StreamMessageByType<"pre_codegen">;
      if (message.message === "Anima model built") {
        state.tasks.fetchDesign.status = "finished";
        state.tasks.codeGeneration.status = "running";
        state.tasks.uploadAssets.status = "running";
        stateUpdated({ ...state });
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

      state.status = "aborted";
      state.result = null;
      state.error = error;
      stateUpdated({ ...state });

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

      state.tasks.codeGeneration.progress = message.payload.progress;
      state.tasks.codeGeneration.status = "running";
      stateUpdated({ ...state });
    });

    es.addEventListener("progress_messages_updated", (event) => {
      const message = JSON.parse(
        event.data
      ) as StreamMessageByType<"progress_messages_updated">;

      state.progressMessages = message.payload.progressMessages;
      stateUpdated({ ...state });
    });

    es.addEventListener("job_status_updated", (event) => {
      const message = JSON.parse(
        event.data
      ) as StreamMessageByType<"job_status_updated">;

      state.jobStatus = message.payload.jobStatus;
      stateUpdated({ ...state });
    });

    es.addEventListener("codegen_completed", () => {
      state.tasks.codeGeneration.status = "finished";
      stateUpdated({ ...state });
    });

    es.addEventListener("generation_completed", () => {
      state.tasks.codeGeneration.status = "finished";
      stateUpdated({ ...state });
    });

    es.addEventListener("assets_uploaded", () => {
      state.tasks.uploadAssets.status = "finished";
      stateUpdated({ ...state });
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
      if (!lastFetchResponse) {
        return;
      }

      // Check if the fetch is ok.
      // If it is't, then the request failed before creating the job and we should terminate the request.
      const response = await lastFetchResponse;
      if (!response.ok) {
        let errorMessage = "";
        try {
          errorMessage = await response.text();
          const errorPayloadJson = JSON.parse(errorMessage);
          if (errorPayloadJson?.payload?.message) {
            errorMessage = errorPayloadJson.payload.message;
          }
        } catch {}

        reject(
          new CodegenError({
            name: "Request failed",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            reason: errorMessage as any,
            status: response.status,
          })
        );
        es.close();

        return;
      }

      console.warn(
        `Experienced error during code generation (attempt ${errorCount + 1} / ${MAX_RETRIES_AFTER_ERROR})`,
        error
      );

      let errorPayload: StreamMessageByType<"error"> | undefined;

      // If true, then there's no point into keeping the event handler alive for retries.
      let isUnrecoverableError = false;

      if (error instanceof MessageEvent) {
        try {
          errorPayload = JSON.parse(error.data);
        } catch {}
      }

      if (
        errorPayload?.payload?.name === "Task Crashed" ||
        errorPayload?.payload?.name === "TimeoutError" ||
        errorPayload?.payload?.name === "Error" ||
        errorPayload?.payload?.name === "Unknown error"
      ) {
        isUnrecoverableError = true;
      }

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
        state.status = "error";
        state.error = codegenError;
        stateUpdated({ ...state });

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

      state.status = "success";
      state.result = result as AnimaSDKResult;
      stateUpdated({ ...state });

      resolve({ result: result as AnimaSDKResult, error: null });
    });
  });
};

export const createJob = async <T extends UseAnimaParams = UseAnimaParams>(
  url: string,
  method: string,
  params: T,
  stateUpdated: (state: CodegenState) => void
) => {
  const initialParams = structuredClone(params);

  if (params.assetsStorage?.strategy === "local") {
    const { referencePath } = getAssetsLocalStrategyParams(
      params.assetsStorage
    );
    params.assetsStorage = { strategy: "external", url: referencePath };
  }

  // TODO: We have two workarounds here because of limitations on the `eventsource` package:
  // 1. We need to use the `fetch` function from the `EventSource` constructor to send the request with the correct method and body (https://github.com/EventSource/eventsource/issues/316#issuecomment-2525315835).
  // 2. We need to store the last fetch response to handle errors to read its body response, since it isn't expoted by the package (https://github.com/EventSource/eventsource/blob/8aa7057bccd7fb819372a3b2c1292e7b53424d52/src/EventSource.ts#L348-L376)
  // We might need to use other library, or do it from our self, to improve the code quality.
  let lastFetchResponse: ReturnType<typeof fetch> | undefined;
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

  try {
    const { result: r, error } = await subscribeToJobStream({
      es,
      lastFetchResponse,
      stateUpdated,
    });

    if (error) {
      return { result: null, error };
    }

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

    return { result, error: null };
  } finally {
    es.close();
  }
};

export const attachJob = async <T extends UseAnimaParams = UseAnimaParams>(
  url: string,
  params: T,
  stateUpdated: (state: CodegenState) => void
) => {
  let lastFetchResponse: ReturnType<typeof fetch> | undefined;
  const es = new EventSource(url, {
    fetch: (url, init) => {
      lastFetchResponse = fetch(url, {
        ...init,
        method: "POST",
        body: JSON.stringify(params),
      });
      return lastFetchResponse;
    },
  });

  try {
    const { result: r, error } = await subscribeToJobStream({
      es,
      lastFetchResponse,
      stateUpdated,
    });
    if (error) {
      return { result: null, error };
    }

    const result = structuredClone(r);
    return { result, error: null };
  } finally {
    es.close();
  }
};
