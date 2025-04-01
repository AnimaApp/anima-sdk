import { describe, expect, it } from "vitest";
import { isValidFigmaUrl, formatToFigmaLink } from "./figma";

describe("# figma", () => {
  describe(".isValidFigmaUrl", () => {
    describe("when the URL is malformed", () => {
      it("returns [false, '', ''] for empty input", () => {
        const result = isValidFigmaUrl("");

        expect(result).toEqual([false, "", ""]);
      });

      it("returns [false, '', ''] for non-Figma URLs", () => {
        const result = isValidFigmaUrl("https://example.com");

        expect(result).toEqual([false, "", ""]);
      });

      it("returns [false, '', ''] for Figma URLs with text before", () => {
        const validFileKey = "5d0u9PmD4GtB5fdX57pTtK";
        const result = isValidFigmaUrl(
          `some text https://www.figma.com/file/${validFileKey}?node-id=1-2`
        );

        expect(result).toEqual([false, "", ""]);
      });

      it("returns [false, '', ''] for Figma URLs with text after", () => {
        const validFileKey = "5d0u9PmD4GtB5fdX57pTtK";
        const result = isValidFigmaUrl(
          `https://www.figma.com/file/${validFileKey}?node-id=1-2 some text`
        );

        expect(result).toEqual([false, "", ""]);
      });
    });

    describe("when the URL is a valid Figma link", () => {
      it("returns [true, fileKey, ''] for Figma URLs with no node id", () => {
        const validFileKey = "5d0u9PmD4GtB5fdX57pTtK";
        const result = isValidFigmaUrl(
          `https://www.figma.com/file/${validFileKey}`
        );

        expect(result).toStrictEqual([true, validFileKey, ""]);
      });

      it("returns [true, fileKey, nodeId] for Figma URLs with only a node id", () => {
        const validFileKey = "5d0u9PmD4GtB5fdX57pTtK";
        const result = isValidFigmaUrl(
          `https://www.figma.com/file/${validFileKey}?node-id=1-2`
        );

        expect(result).toStrictEqual([true, validFileKey, "1:2"]);
      });

      it("returns [true, fileKey, nodeId] for Figma URLs with the design name and a node id", () => {
        const validFileKey = "5d0u9PmD4GtB5fdX57pTtK";
        const result = isValidFigmaUrl(
          `https://www.figma.com/file/${validFileKey}/Untitled?node-id=1-2`
        );

        expect(result).toStrictEqual([true, validFileKey, "1:2"]);
      });

      it("returns [true, fileKey, nodeId] for Figma URLs with the design name, a node id, and timestamp", () => {
        const validFileKey = "5d0u9PmD4GtB5fdX57pTtK";
        const result = isValidFigmaUrl(
          `https://www.figma.com/file/${validFileKey}/Untitled?node-id=1-2&t=ZTF3vjgiCx7ijjcc-11`
        );

        expect(result).toStrictEqual([true, validFileKey, "1:2"]);
      });
    });
  });

  describe(".formatToFigmaLink", () => {
    it("generates a link with file key and node id", () => {
      const url = formatToFigmaLink({
        fileKey: "file-key",
        nodeId: "1:2",
      });

      expect(url.href).toBe(
        "https://www.figma.com/design/file-key?node-id=1-2"
      );
    });

    describe('when the "duplicate" flag is enabled', () => {
      it("generates a link including the '/duplicated' path", () => {
        const url = formatToFigmaLink({
          fileKey: "file-key",
          nodeId: "1:2",
          duplicate: true,
        });

        expect(url.href).toBe(
          "https://www.figma.com/design/file-key/duplicate?node-id=1-2"
        );
      });
    });
  });
});
