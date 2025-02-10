import type { CodegenErrorReason } from "./errors";
import type { CodegenSettings } from "./settings";

export type AnimaFiles = Record<
  string,
  {
    content: string;
    isBinary: boolean;
  }
>;

export type BaseResult = {
  sessionId: string;
  figmaFileName: string;
  figmaSelectedFrameName: string;
};

export type AnimaSDKResult = BaseResult & {
  files: AnimaFiles;
};

export type CodegenResult = BaseResult & {
  files: Record<string, { code: string; type: "code" }>;
};

export type GetCodeParams = {
  fileKey: string;
  figmaToken: string;
  nodesId: string[];
  settings: CodegenSettings;
};

export type GetCodeHandler =
  | ((message: SSECodgenMessage) => void)
  | {
      onStart?: ({ sessionId }: { sessionId: string }) => void;
      onPreCodegen?: ({ message }: { message: string }) => void;
      onAssetsUploaded?: () => void;
      onFigmaMetadata?: ({
        figmaFileName,
        figmaSelectedFrameName,
      }: {
        figmaFileName: string;
        figmaSelectedFrameName: string;
      }) => void;
      onGeneratingCode?: ({
        status,
        progress,
        files,
      }: {
        status: "success" | "running" | "failure";
        progress: number;
        files: AnimaFiles;
      }) => void;
      onCodegenCompleted?: () => void;
    };

// TODO: `SSECodgenMessage` and `SSECodgenMessageErrorPayload` should be imported from `anima-public-api`
export type SSECodgenMessage =
  | { type: "start"; sessionId: string }
  | { type: "pre_codegen"; message: string }
  | {
      type: "figma_metadata";
      figmaFileName: string;
      figmaSelectedFrameName: string;
    }
  | { type: "generating_code"; payload: any }
  | { type: "codegen_completed" }
  | { type: "assets_uploaded" }
  | { type: "aborted" }
  | { type: "error"; payload: SSECodgenMessageErrorPayload }
  | { type: "done" };
export type SSECodgenMessageErrorPayload = {
  errorName: string;
  task?: string;
  reason: CodegenErrorReason;
};
