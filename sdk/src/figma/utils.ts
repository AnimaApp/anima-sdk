import type { Node } from "@figma/rest-api-spec";

export type FigmaNode = Node;

export const findChildrenNode = (
  node: FigmaNode,
  targetNodeId: string
): FigmaNode | null => {
  if (node.id === targetNodeId) {
    return node;
  }

  if ("children" in node) {
    for (const child of node.children) {
      const found = findChildrenNode(child, targetNodeId);
      if (found) {
        return found;
      }
    }
  }

  return null;
};
