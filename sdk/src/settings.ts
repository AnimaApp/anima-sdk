import { z } from "zod";

const F2CCodegenSettingsSchema = z
  .object({
    timeoutMs: z.number().int().positive().max(300_000).optional(),
  })
  .catchall(z.unknown());

const CodegenSettingsSchema = z
  .object({
    language: z.enum(["typescript", "javascript"]).optional(),
    disableMarkedForExport: z.boolean().optional(),
    allowAutoSelectFirstNode: z.boolean().optional().default(true),
    enableDisplayDataId: z.boolean().optional(),
    enableDisplayDataName: z.boolean().optional(),
    enableDisplayDataVariant: z.boolean().optional(),
    codegenSettings: F2CCodegenSettingsSchema.optional(),
  })
  .and(
    z.union([
      z.object({
        framework: z.literal("react"),
        model: z.string().optional(),
        styling: z.enum(["plain_css", "tailwind", "inline_styles"]),
        uiLibrary: z
          .enum(["mui", "antd", "radix", "shadcn", "clean_react", "custom_design_system"])
          .optional(),
        responsivePages: z
          .array(
            z.object({
              name: z.string(),
              framesId: z.array(z.string()),
            })
          )
          .optional(),
        enableUILibraryTheming: z.boolean().optional(),
        enableCompactStructure: z.boolean().optional(),
        enableDisplayScreenModelId: z.boolean().optional(),
        enableGeneratePackageLock: z.boolean().optional(),
        enableAnimationsPreset: z.boolean().optional(),

        enableAutoSplit: z.boolean().optional(),
        autoSplitThreshold: z.number().optional(),
        url: z.string().url().optional(),
        designSystemId: z.string().optional(),
      }),
      z.object({
        framework: z.literal("html"),
        styling: z.enum(["plain_css", "inline_styles", "tailwind"]),
        enableTranslation: z.boolean().optional(),
      }),
    ])
  );

export type BaseSettings = {
  codegenSettings?: Record<string, unknown>;
};

export type F2CCodegenSettings = Record<string, unknown> & {
  timeoutMs?: number;
};

export type L2CCodegenSettings = Record<string, unknown> & {
  maxDomNodes?: number;
  maxScrollHeight?: number;
  timeoutMs?: number;
};

// We don't use the z.infer method here because the types returned by zod aren't ergonic
export type CodegenSettings = {
  codegenSettings?: F2CCodegenSettings;
  language?: "typescript" | "javascript";
  model?: string;
  framework: "react" | "html";
  styling: "plain_css" | "tailwind" | "inline_styles";
  uiLibrary?: "mui" | "antd" | "radix" | "shadcn" | "clean_react" | "custom_design_system";
  responsivePages?: Array<{
    name: string;
    framesId: string[];
  }>;
  enableTranslation?: boolean;
  enableUILibraryTheming?: boolean;
  enableCompactStructure?: boolean;
  enableAutoSplit?: boolean;
  autoSplitThreshold?: number;
  disableMarkedForExport?: boolean;
  allowAutoSelectFirstNode?: boolean;
  enableDisplayScreenModelId?: boolean;
  enableGeneratePackageLock?: boolean;
  enableAnimationsPreset?: boolean;
  enableDisplayDataId?: boolean;
  enableDisplayDataName?: boolean;
  enableDisplayDataVariant?: boolean;
  url?: string;
  prompt?: string;
  images?: Array<{ url: string }>;
  designSystemId?: string;
};

export const validateSettings = (obj: unknown): CodegenSettings => {
  const parsedObj = CodegenSettingsSchema.safeParse(obj);

  if (parsedObj.success === false) {
    const error = new Error("Invalid codegen settings");
    error.cause = parsedObj.error;
    throw error;
  }

  return parsedObj.data;
};
