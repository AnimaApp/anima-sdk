import type {
  GetCodeFromFigmaErrorReason,
  GetCodeFromWebsiteErrorReason,
  GetCodeFromPromptErrorReason,
} from "./errors";
import type { CodegenSettings, BaseSettings } from "./settings";

export type AnimaFiles = Record<
  string,
  {
    content: string;
    isBinary: boolean;
  }
>;

export type ProgressMessage = {
  id: string;
  title: string;
  body: string;
  attachments?: {
    images?: string[];
  };
};

export type BaseResult = {
  sessionId: string;
  figmaFileName?: string;
  figmaSelectedFrameName?: string;
  tokenUsage: number;
};

export type AnimaSDKResult = BaseResult & {
  files: AnimaFiles;
  assets?: Array<{ name: string; url: string }>;
};

export type CodegenResult = BaseResult & {
  files: Record<string, { code: string; type: "code" }>;
};

export type AssetsStorage =
  | { strategy: "host" }
  | { strategy: "external"; url: string };

export type TrackingInfos = {
  externalId: string;
};

export type GetCodeParams = {
  fileKey: string;
  figmaToken?: string;
  nodesId: string[];
  assetsStorage?: AssetsStorage;
  settings: CodegenSettings;
  tracking?: TrackingInfos;
  webhookUrl?: string;
};

export type GetCodeHandler =
  | ((message: SSEGetCodeFromFigmaMessage) => void)
  | {
      onQueueing?: ({ sessionId }: { sessionId: string }) => void;
      onStart?: ({ sessionId }: { sessionId: string }) => void;
      onPreCodegen?: ({ message }: { message: string }) => void;
      onAssetsUploaded?: () => void;
      onAssetsList?: ({
        assets,
      }: {
        assets: Array<{ name: string; url: string }>;
      }) => void;
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

export type GeneratingCodePayload = {
  status: "success" | "running" | "failure";
  progress: number;
  files: AnimaFiles;
};

export type GetCodeFromWebsiteParams = {
  url?: string;
  mhtml?: string;

  assetsStorage?: AssetsStorage;
  settings: GetCodeFromWebsiteSettings;
  tracking?: TrackingInfos;
  webhookUrl?: string;
};

export type GetCodeFromWebsiteHandler =
  | ((message: SSEGetCodeFromWebsiteMessage) => void)
  | {
      onQueueing?: ({ sessionId }: { sessionId: string }) => void;
      onStart?: ({ sessionId }: { sessionId: string }) => void;
      onAssetsUploaded?: () => void;
      onAssetsList?: ({
        assets,
      }: {
        assets: Array<{ name: string; url: string }>;
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

export type GetCodeFromWebsiteSettings = BaseSettings & {
  language?: "typescript";
  framework: "react" | "html";
  styling: "tailwind" | "inline_styles";
  uiLibrary?: "shadcn";
};

export type GetCodeFromPromptParams = {
  prompt: string;
  assetsStorage?: AssetsStorage;
  settings: GetCodeFromPromptSettings;
  tracking?: TrackingInfos;
  webhookUrl?: string;
};

export type GetCodeFromPromptHandler =
  | ((message: SSEGetCodeFromPromptMessage) => void)
  | {
      onQueueing?: ({ sessionId }: { sessionId: string }) => void;
      onStart?: ({ sessionId }: { sessionId: string }) => void;
      onAssetsUploaded?: () => void;
      onAssetsList?: ({
        assets,
      }: {
        assets: Array<{ name: string; url: string }>;
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

export type GetCodeFromPromptSettings = BaseSettings & {
  language?: "typescript";
  framework: "react" | "html";
  styling: "tailwind" | "inline_styles";
  uiLibrary?: "shadcn";
};

// SSE Messages

export type SSECommonMessage =
  | { type: "queueing"; payload: { sessionId: string } }
  | {
      type: "progress_messages_updated";
      payload: { progressMessages: ProgressMessage[] };
    }
  | {
      type: "job_status_updated";
      payload: { jobStatus: Record<string, any> };
    }
  | { type: "aborted" };

export type SSEErrorPayload<Reason> = {
  errorName: string;
  task?: string;
  reason: Reason;
  sentryTraceId?: string;
};

export type SSEGetCodeFromFigmaMessage =
  | SSECommonMessage
  | { type: "start"; sessionId: string }
  | {
      type: "figma_metadata";
      figmaFileName: string;
      figmaSelectedFrameName: string;
    }
  | { type: "pre_codegen"; message: string }
  | { type: "generating_code"; payload: GeneratingCodePayload }
  | { type: "codegen_completed" }
  | { type: "post_codegen"; message: string }
  | { type: "assets_uploaded" }
  | {
      type: "assets_list";
      payload: { assets: Array<{ name: string; url: string }> };
    }
  | { type: "error"; payload: SSEGetCodeFromFigmaMessageErrorPayload }
  | { type: "done"; payload: { sessionId: string; tokenUsage: number } };

export type SSEGetCodeFromFigmaMessageErrorPayload =
  SSEErrorPayload<GetCodeFromFigmaErrorReason>;

export type SSEGetCodeFromWebsiteMessage =
  | SSECommonMessage
  | { type: "start"; sessionId: string }
  | { type: "generating_code"; payload: GeneratingCodePayload }
  | { type: "generation_completed" }
  | { type: "post_codegen"; message: string }
  | { type: "assets_uploaded" }
  | {
      type: "assets_list";
      payload: { assets: Array<{ name: string; url: string }> };
    }
  | { type: "error"; payload: SSEGetCodeFromWebsiteMessageErrorPayload }
  | { type: "done"; payload: { sessionId: string; tokenUsage: number } };

export type SSEGetCodeFromWebsiteMessageErrorPayload =
  SSEErrorPayload<GetCodeFromWebsiteErrorReason>;

export type SSEGetCodeFromPromptMessage =
  | SSECommonMessage
  | { type: "start"; sessionId: string }
  | { type: "generation_completed" }
  | { type: "error"; payload: SSEGetCodeFromPromptMessageErrorPayload }
  | { type: "done"; payload: { sessionId: string; tokenUsage: number } };

export type SSEGetCodeFromPromptMessageErrorPayload =
  SSEErrorPayload<GetCodeFromPromptErrorReason>;

// Deprecated types

/**
 * @deprecated This type is deprecated and will be removed soon.
 */
export type SSECodegenMessage = SSEGetCodeFromFigmaMessage;

/**
 * @deprecated This type is deprecated and will be removed soon.
 */
export type CodegenErrorReason = GetCodeFromFigmaErrorReason;

/**
 * @deprecated This type is deprecated and will be removed soon.
 */
export type L2CParamsUrlInput = {
  type: "url";
  url: string;
};

/**
 * @deprecated This type is deprecated and will be removed soon.
 */
export type L2CParamsInput = L2CParamsUrlInput;

/**
 * @deprecated This type is deprecated and will be removed soon.
 */
export type L2CParamsFramework = 'html' | 'react';

/**
 * @deprecated This type is deprecated and will be removed soon.
 */
export type L2CParamsLanguage = 'typescript';

/**
 * @deprecated This type is deprecated and will be removed soon.
 */
export type L2CParamsStyling = 'tailwind' | 'inline-styles';

/**
 * @deprecated This type is deprecated and will be removed soon.
 */
export type L2CParamsHtmlConvention = {
  framework: 'html';
  styling: L2CParamsStyling;
};

/**
 * @deprecated This type is deprecated and will be removed soon.
 */
export type L2CParamsReactConvention = {
  framework: 'react';
  language: L2CParamsLanguage;
  styling: L2CParamsStyling;
  enableGeneratePackageLock?: boolean;
};

/**
 * @deprecated This type is deprecated and will be removed soon.
 */
export type L2CParamsConvention =
  | L2CParamsHtmlConvention
  | L2CParamsReactConvention;

/**
 * @deprecated This type is deprecated and will be removed soon.
 */
export type L2CParamsBundledAssetsStorage = {
  type: 'bundled';
  referencePath?: string;
  importMode?: 'watermarked' | 'original';
};

/**
 * @deprecated This type is deprecated and will be removed soon.
 */
export type L2CParamsAssetsStorage = L2CParamsBundledAssetsStorage;

/**
 * @deprecated This type is deprecated and will be removed soon.
 */
export type L2CParams = {
  input: L2CParamsInput;
  conventions: L2CParamsConvention;
  assetsStorage: L2CParamsAssetsStorage;
  viewports?: Array<'desktop' | 'tablet' | 'mobile'>;
};

/**
 * @deprecated This type is deprecated and will be removed soon.
 */
export type GetLink2CodeParams = {
  params: L2CParams;
  assetsStorage?: AssetsStorage;
  tracking?: TrackingInfos;
};

/**
 * @deprecated This type is deprecated and will be removed soon.
 */
export type GetLink2CodeHandler = GetCodeFromWebsiteHandler;

/**
 * @deprecated This type is deprecated and will be removed soon.
 */
export type SSEL2CMessage = SSEGetCodeFromWebsiteMessage;
