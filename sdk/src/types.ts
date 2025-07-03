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
};

export type GetCodeHandler =
  | ((message: SSECodgenMessage) => void)
  | {
    onQueueing?: () => void;
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

// TODO: `SSECodgenMessage` and `SSECodgenMessageErrorPayload` should be imported from `anima-public-api`
export type SSECodgenMessage =
  | { type: "queueing" }
  | { type: "start"; sessionId: string }
  | { type: "pre_codegen"; message: string }
  | {
    type: "figma_metadata";
    figmaFileName: string;
    figmaSelectedFrameName: string;
  }
  | { type: "generating_code"; payload: GeneratingCodePayload }
  | { type: "codegen_completed" }
  | { type: "assets_uploaded" }
  | {
    type: "assets_list";
    payload: { assets: Array<{ name: string; url: string }> };
  }
  | { type: "aborted" }
  | { type: "error"; payload: SSECodgenMessageErrorPayload }
  | { type: "done"; payload: { sessionId: string; tokenUsage: number } };


export type SSECodgenMessageErrorPayload = {
  errorName: string;
  task?: string;
  reason: CodegenErrorReason;
};

export type SSECodegenMessageErrorPayload = {
  errorName: string;
  task?: string;
  reason: CodegenErrorReason;
  sentryTraceId?: string;
};

export type GetCodeFromWebsiteParams = {
  url: string;
  assetsStorage?: AssetsStorage;
  settings: GetCodeFromWebsiteSettings;
  tracking?: TrackingInfos;
};

export type GetCodeFromWebsiteHandler =
  | ((message: SSEGetCodeFromWebsiteMessage) => void)
  | {
    onQueueing?: () => void;
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

export type GetCodeFromWebsiteSettings = {
  language?: "typescript";
  framework: "react" | "html";
  styling:
  | "tailwind"
  | "inline_styles";
  uiLibrary?: "shadcn";
};

export type SSEGetCodeFromWebsiteMessage =
  | { type: 'queueing' }
  | { type: 'start'; sessionId: string }
  | { type: 'generating_code'; payload: GeneratingCodePayload }
  | { type: 'generation_completed' }
  | { type: 'assets_uploaded' }
  | { type: 'assets_list'; payload: { assets: Array<{ name: string; url: string }> } }
  | { type: 'aborted' }
  | { type: 'error'; payload: SSECodegenMessageErrorPayload }
  | { type: 'done'; payload: { sessionId: string; tokenUsage: number } };


/**
 * @deprecated This type is deprecated and will be removed soon.
 */
export type L2CParamsUrlInput = {
  type: 'url';
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
