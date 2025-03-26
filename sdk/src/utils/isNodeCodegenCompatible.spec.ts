/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";
import { isNodeCodegenCompatible } from "./isNodeCodegenCompatible";
import design from "../../tests/design/design";

describe(".isNodeCodegenCompatible", () => {
  // valid cases
  describe("when the given node id is a frame", () => {
    it("returns the given node node", () => {
      const result = isNodeCodegenCompatible(design, "1:2");

      expect(result.isValid).toBe(true);
      expect((result as any).node.id).toBe("1:2");
    });
  });

  describe("when the given node id is a page with a single valid children", () => {
    it("returns isValid as false and the proper reason", () => {
      const result = isNodeCodegenCompatible(design, "162:21");

      expect(result.isValid).toBe(true);
      expect((result as any).node.id).toBe("162:23");
      expect((result as any).note).toBe(
        "Selected node is a page with a single valid children - returning it instead"
      );
    });
  });

  // invalid cases
  describe("when the given node id does not exist", () => {
    it("returns isValid as false and the proper reason", () => {
      const result = isNodeCodegenCompatible(design, "non-existent-id");

      expect(result.isValid).toBe(false);
      expect((result as any).reason).toBe("There is no node with the given id");
    });
  });

  describe("when the given node id is not compatible with code generation", () => {
    it("returns isValid as false and the proper reason", () => {
      const result = isNodeCodegenCompatible(design, "14:5");

      expect(result.isValid).toBe(false);
      expect((result as any).reason).toBe(
        "Selected node type is not supported"
      );
    });
  });

  describe("when the given node id is a page with multiple valid children", () => {
    it("returns isValid as false and the proper reason", () => {
      const result = isNodeCodegenCompatible(design, "0:1");

      expect(result.isValid).toBe(false);
      expect((result as any).reason).toBe(
        "Selected node is a page with multiple children"
      );
    });
  });
});
