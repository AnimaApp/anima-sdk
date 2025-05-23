import type { GetFileResponse } from "@figma/rest-api-spec";
import { findChildrenNode, type FigmaNode } from "../figma";

const validNodeTypes: Set<FigmaNode["type"]> = new Set([
  "FRAME",
  "INSTANCE",
  "COMPONENT",
  "COMPONENT_SET",
  "GROUP",
]);

type ValidateNodeForCodegenResult =
  | {
      isValid: true;
      node: FigmaNode;
      note?: "Selected node is a page with a single valid children - returning it instead";
    }
  | {
      isValid: true;
      node: FigmaNode;
      note?: "Selected node is a page with multiple valid children - returning the first one instead";
    }
  | {
      isValid: false;
      reason: InvalidNodeForCodegenReason;
    };

type InvalidNodeForCodegenReason =
  | "Selected node is a page with multiple children"
  | "Selected node is a page with no valid children"
  | "There is no node with the given id"
  | "Selected node type is not supported";

/**
 * Check if the pair "design" + "node id" is valid for code generation.
 * May recommend a node that is not the one passed as argument.
 */
export const isNodeCodegenCompatible = (
  design: GetFileResponse,
  nodeId: string,
  options: {
    allowAutoSelectFirstNode: boolean;
  } = { allowAutoSelectFirstNode: true }
): ValidateNodeForCodegenResult => {
  const found = findChildrenNode(design.document, nodeId);

  // If no node found with the given id
  if (!found) {
    return {
      isValid: false,
      reason: "There is no node with the given id",
    };
  }

  // If the selected node is a page and has only one valid child node to generate code from, return that child node
  if (found.type === "CANVAS") {
    const validChildrenNodes = found.children.filter((child) =>
      validNodeTypes.has(child.type)
    );

    if (validChildrenNodes.length === 0) {
      return {
        isValid: false,
        reason: "Selected node is a page with no valid children",
      };
    }

    if (validChildrenNodes.length === 1) {
      return {
        isValid: true,
        node: validChildrenNodes[0],
        note: "Selected node is a page with a single valid children - returning it instead",
      };
    }

    if (options.allowAutoSelectFirstNode) {
      return {
        isValid: true,
        node: validChildrenNodes[0],
        note: "Selected node is a page with multiple valid children - returning the first one instead",
      };
    }

    return {
      isValid: false,
      reason: "Selected node is a page with multiple children",
    };
  }

  // If the selected node is not a valid node type, return an error
  if (!validNodeTypes.has(found.type)) {
    return {
      isValid: false,
      reason: "Selected node type is not supported",
    };
  }

  // All good
  return { isValid: true, node: found };
};
