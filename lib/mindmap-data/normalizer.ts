import { MindMapData, MindMapNode } from '../types/mindmap';

/**
 * Normalizes optional arrays in valid MindMapData.
 * Does NOT repair structural errors or alter invalid IDs/references.
 */
export function normalizeMindMapData(input: MindMapData): MindMapData {
  function normalizeNode(node: MindMapNode): MindMapNode {
    return {
      ...node,
      children: node.children ? node.children.map(normalizeNode) : [],
      tags: node.tags ?? [],
      keyFacts: node.keyFacts ?? [],
    };
  }

  return {
    ...input,
    root: normalizeNode(input.root),
    crossLinks: input.crossLinks ?? [],
    quizQuestions: input.quizQuestions ?? [],
  };
}
