import { MindMapData } from '../types/mindmap';

export type ValidationErrorCode =
  | 'MISSING_REQUIRED_FIELD'
  | 'INVALID_TYPE'
  | 'INVALID_VALUE'
  | 'DUPLICATE_NODE_ID'
  | 'DUPLICATE_QUIZ_ID'
  | 'INVALID_NODE_REFERENCE'
  | 'INVALID_QUIZ_OPTION_INDEX'
  | 'EMPTY_OPTIONS'
  | 'CIRCULAR_REFERENCE'
  | 'MALFORMED_JSON';

export interface ValidationError {
  path: string;
  code: ValidationErrorCode;
  message: string;
  severity: 'fatal';
}

export interface ValidationWarning {
  path: string;
  code: string;
  message: string;
}

export interface ValidationResult {
  success: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface IngestionResult {
  data: MindMapData | null;
  success: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
