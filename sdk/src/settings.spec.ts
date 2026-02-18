import { describe, expect, it } from "vitest";
import { validateSettings } from "./settings";

describe("# validateSettings", () => {
  describe("react framework", () => {
    it("accepts valid react settings with required fields", () => {
      const settings = {
        framework: "react",
        styling: "tailwind",
      };

      const result = validateSettings(settings);

      expect(result.framework).toBe("react");
      expect(result.styling).toBe("tailwind");
    });

    it("accepts all optional react fields", () => {
      const settings = {
        framework: "react",
        styling: "plain_css",
        language: "typescript",
        model: "gpt-4",
        uiLibrary: "shadcn",
        responsivePages: [{ name: "Home", framesId: ["frame-1", "frame-2"] }],
        enableUILibraryTheming: true,
        enableCompactStructure: false,
        enableDisplayScreenModelId: true,
        enableGeneratePackageLock: true,
        enableAnimationsPreset: false,
        enableAutoSplit: true,
        autoSplitThreshold: 5,
        url: "https://example.com",
        codegenSettings: { key: "value" },
        designSystemId: "ds-123",
        disableMarkedForExport: false,
        enableDisplayDataId: true,
        enableDisplayDataName: true,
      };

      const result = validateSettings(settings);

      expect(result.framework).toBe("react");
      expect(result.uiLibrary).toBe("shadcn");
      expect(result.language).toBe("typescript");
      expect(result.autoSplitThreshold).toBe(5);
      expect(result.url).toBe("https://example.com");
      expect(result.designSystemId).toBe("ds-123");
    });

    it("defaults allowAutoSelectFirstNode to true", () => {
      const settings = {
        framework: "react",
        styling: "inline_styles",
      };

      const result = validateSettings(settings);

      expect(result.allowAutoSelectFirstNode).toBe(true);
    });

    it.each(["plain_css", "tailwind", "inline_styles"] as const)(
      "accepts styling: %s",
      (styling) => {
        const result = validateSettings({ framework: "react", styling });
        expect(result.styling).toBe(styling);
      }
    );

    it.each(["mui", "antd", "radix", "shadcn", "clean_react", "custom_design_system"] as const)(
      "accepts uiLibrary: %s",
      (uiLibrary) => {
        const result = validateSettings({ framework: "react", styling: "tailwind", uiLibrary });
        expect(result.uiLibrary).toBe(uiLibrary);
      }
    );
  });

  describe("html framework", () => {
    it("accepts valid html settings with required fields", () => {
      const settings = {
        framework: "html",
        styling: "plain_css",
      };

      const result = validateSettings(settings);

      expect(result.framework).toBe("html");
      expect(result.styling).toBe("plain_css");
    });

    it("accepts html with enableTranslation", () => {
      const settings = {
        framework: "html",
        styling: "tailwind",
        enableTranslation: true,
      };

      const result = validateSettings(settings);

      expect(result.enableTranslation).toBe(true);
    });

    it.each(["plain_css", "inline_styles", "tailwind"] as const)(
      "accepts styling: %s for html",
      (styling) => {
        const result = validateSettings({ framework: "html", styling });
        expect(result.styling).toBe(styling);
      }
    );
  });

  describe("shared optional fields", () => {
    it.each(["typescript", "javascript"] as const)(
      "accepts language: %s",
      (language) => {
        const result = validateSettings({ framework: "react", styling: "tailwind", language });
        expect(result.language).toBe(language);
      }
    );
  });

  describe("validation errors", () => {
    it("rejects missing framework", () => {
      expect(() => validateSettings({ styling: "tailwind" })).toThrow(
        "Invalid codegen settings"
      );
    });

    it("rejects missing styling", () => {
      expect(() => validateSettings({ framework: "react" })).toThrow(
        "Invalid codegen settings"
      );
    });

    it("rejects invalid framework value", () => {
      expect(() =>
        validateSettings({ framework: "vue", styling: "tailwind" })
      ).toThrow("Invalid codegen settings");
    });

    it("rejects invalid styling value for react", () => {
      expect(() =>
        validateSettings({ framework: "react", styling: "scss" })
      ).toThrow("Invalid codegen settings");
    });

    it("rejects invalid uiLibrary value", () => {
      expect(() =>
        validateSettings({
          framework: "react",
          styling: "tailwind",
          uiLibrary: "bootstrap",
        })
      ).toThrow("Invalid codegen settings");
    });

    it("rejects invalid url format", () => {
      expect(() =>
        validateSettings({
          framework: "react",
          styling: "tailwind",
          url: "not-a-url",
        })
      ).toThrow("Invalid codegen settings");
    });

    it("rejects completely empty object", () => {
      expect(() => validateSettings({})).toThrow("Invalid codegen settings");
    });

    it("rejects non-object input", () => {
      expect(() => validateSettings("string")).toThrow(
        "Invalid codegen settings"
      );
    });

    it("rejects null input", () => {
      expect(() => validateSettings(null)).toThrow("Invalid codegen settings");
    });

    it("attaches zod error as cause", () => {
      try {
        validateSettings({});
        expect.fail("should have thrown");
      } catch (e: unknown) {
        expect((e as Error).cause).toBeDefined();
      }
    });
  });
});
