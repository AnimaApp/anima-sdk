import { z } from "zod";

const CodegenSettingsSchema = z
  .object({
    language: z.enum(["typescript", "javascript"]).optional(),
    disableMarkedForExport: z.boolean().optional(),
  })
  .and(
    z.union([
      z.object({
        framework: z.literal("react"),
        model: z.string().optional(),
        styling: z.enum([
          "plain_css",
          "css_modules",
          "styled_components",
          "tailwind",
          "sass",
          "scss",
          "inline_styles",
        ]),
        uiLibrary: z.enum(["mui", "antd", "radix", "shadcn"]).optional(),
        enableUILibraryTheming: z.boolean().optional(),
        enableCompactStructure: z.boolean().optional(),
        enableDisplayScreenModelId: z.boolean().optional(),
        enableGeneratePackageLock: z.boolean().optional(),
        enableAutoSplit: z.boolean().optional(),
        autoSplitThreshold: z.number().optional(),
      }),
      z.object({
        framework: z.literal("html"),
        styling: z.enum(["plain_css", "inline_styles"]),
        enableTranslation: z.boolean().optional(),
      }),
    ])
  );

// We don't use the z.infer method here because the types returned by zod aren't ergonic
export type CodegenSettings = {
  language?: "typescript" | "javascript";
  model?: string;
  framework: "react" | "html";
  styling:
    | "plain_css"
    | "css_modules"
    | "styled_components"
    | "tailwind"
    | "sass"
    | "scss"
    | "inline_styles";
  uiLibrary?: "mui" | "antd" | "radix" | "shadcn";
  enableTranslation?: boolean;
  enableUILibraryTheming?: boolean;
  enableCompactStructure?: boolean;
  enableAutoSplit?: boolean;
  autoSplitThreshold?: number;
  disableMarkedForExport?: boolean;
  enableDisplayScreenModelId?: boolean;
  enableGeneratePackageLock?: boolean;
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
