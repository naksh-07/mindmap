import { MindMapData } from '../types/mindmap';
import { IngestionResult } from './types';
import { validateMindMapData } from './validator';
import { normalizeMindMapData } from './normalizer';

/**
 * Parses raw JSON string or unvalidated object, validates against MindMapData rules,
 * and returns normalized MindMapData or structured errors.
 */
export function parseAndIngestMindMapData(input: unknown): IngestionResult {
  let parsedObj: unknown = input;

  if (typeof input === 'string') {
    try {
      parsedObj = JSON.parse(input);
    } catch (err) {
      return {
        data: null,
        success: false,
        errors: [
          {
            path: 'root',
            code: 'MALFORMED_JSON',
            message: `JSON syntax error: ${err instanceof Error ? err.message : 'Invalid JSON string'}`,
            severity: 'fatal',
          },
        ],
        warnings: [],
      };
    }
  }

  const validationRes = validateMindMapData(parsedObj);

  if (!validationRes.success) {
    return {
      data: null,
      success: false,
      errors: validationRes.errors,
      warnings: validationRes.warnings,
    };
  }

  const normalized = normalizeMindMapData(parsedObj as MindMapData);

  return {
    data: normalized,
    success: true,
    errors: [],
    warnings: validationRes.warnings,
  };
}
