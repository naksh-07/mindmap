export interface MindMapNode {
  id: string;
  label: string; // Concept name (e.g., "हिमालय", "उत्तरी मैदान")
  subtitle?: string; // Short qualifier (e.g., "नवीन मोड़दार पर्वत")
  description?: string; // Short educational summary
  category?: string; // e.g., "mountain", "plain", "plateau", "coastal", "island"
  badge?: string; // Quick tag or metric (e.g. "7,700m+", "3,200 km")
  color?: string; // Optional category color highlight
  icon?: string; // Lucide icon name or emoji symbol
  children?: MindMapNode[];
  tags?: string[];
  keyFacts?: string[]; // Quick key points for active recall / revision
}

export interface CrossLink {
  sourceId: string;
  targetId: string;
  label?: string; // e.g. "नदी उद्गम संबंध"
  type?: 'relationship' | 'causality' | 'comparison';
}

export interface QuizQuestion {
  id: string;
  nodeId: string;
  nodeLabel: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface MindMapData {
  id: string;
  title: string;
  subtitle?: string;
  subject: string;
  chapter?: string;
  language: 'hi' | 'en' | 'mixed';
  root: MindMapNode;
  crossLinks?: CrossLink[];
  quizQuestions?: QuizQuestion[];
}

export type LayoutMode = 'balanced' | 'horizontal' | 'vertical' | 'radial';
