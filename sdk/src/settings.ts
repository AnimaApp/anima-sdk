import { z } from "zod";

const CodegenSettingsSchema = z
  .object({
    language: z.enum(["typescript", "javascript"]).optional(),
    disableMarkedForExport: z.boolean().optional(),
    allowAutoSelectFirstNode: z.boolean().optional().default(true),
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
        enableAutoSplit: z.boolean().optional(),
        autoSplitThreshold: z.number().optional(),
      }),
      z.object({
        framework: z.literal("html"),
        styling: z.enum(["plain_css", "inline_styles", "tailwind"]),
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
