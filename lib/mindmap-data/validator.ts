import { ValidationError, ValidationWarning, ValidationResult } from './types';

/**
 * Validates unknown raw data against canonical MindMapData schema rules.
 * Does NOT mutate data and does NOT silently fix structural errors.
 */
export function validateMindMapData(input: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return {
      success: false,
      errors: [
        {
          path: 'root',
          code: 'MALFORMED_JSON',
          message: 'MindMapData must be a non-null JSON object',
          severity: 'fatal',
        },
      ],
      warnings: [],
    };
  }

  const raw = input as Record<string, unknown>;

  // TOP LEVEL VALIDATION
  if (typeof raw.id !== 'string' || raw.id.trim() === '') {
    errors.push({
      path: 'id',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'Top-level "id" is required and must be a non-empty string',
      severity: 'fatal',
    });
  }

  if (typeof raw.title !== 'string' || raw.title.trim() === '') {
    errors.push({
      path: 'title',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'Top-level "title" is required and must be a non-empty string',
      severity: 'fatal',
    });
  }

  if (typeof raw.subject !== 'string' || raw.subject.trim() === '') {
    errors.push({
      path: 'subject',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'Top-level "subject" is required and must be a non-empty string',
      severity: 'fatal',
    });
  }

  if (raw.language !== 'hi' && raw.language !== 'en' && raw.language !== 'mixed') {
    errors.push({
      path: 'language',
      code: 'INVALID_VALUE',
      message: 'Top-level "language" must be one of "hi", "en", or "mixed"',
      severity: 'fatal',
    });
  }

  if (!raw.root || typeof raw.root !== 'object' || Array.isArray(raw.root)) {
    errors.push({
      path: 'root',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'Top-level "root" node is required and must be an object',
      severity: 'fatal',
    });
    return { success: false, errors, warnings };
  }

  // NODE TREE VALIDATION
  const seenNodeIds = new Set<string>();

  function validateNode(node: unknown, path: string, branchStack: Set<unknown>) {
    if (node === null || typeof node !== 'object' || Array.isArray(node)) {
      errors.push({
        path,
        code: 'INVALID_TYPE',
        message: `Node at path "${path}" must be a non-null object`,
        severity: 'fatal',
      });
      return;
    }

    if (branchStack.has(node)) {
      errors.push({
        path,
        code: 'CIRCULAR_REFERENCE',
        message: `Circular object reference detected at path "${path}"`,
        severity: 'fatal',
      });
      return;
    }

    branchStack.add(node);
    const n = node as Record<string, unknown>;

    // ID validation
    if (typeof n.id !== 'string' || n.id.trim() === '') {
      errors.push({
        path: `${path}.id`,
        code: 'MISSING_REQUIRED_FIELD',
        message: `Node ID at path "${path}.id" is required and must be a non-empty string`,
        severity: 'fatal',
      });
    } else {
      if (seenNodeIds.has(n.id)) {
        errors.push({
          path: `${path}.id`,
          code: 'DUPLICATE_NODE_ID',
          message: `Duplicate node ID "${n.id}" found at path "${path}.id"`,
          severity: 'fatal',
        });
      } else {
        seenNodeIds.add(n.id);
      }
    }

    // Label validation
    if (typeof n.label !== 'string' || n.label.trim() === '') {
      errors.push({
        path: `${path}.label`,
        code: 'MISSING_REQUIRED_FIELD',
        message: `Node label at path "${path}.label" is required and must be a non-empty string`,
        severity: 'fatal',
      });
    }

    // Optional metadata type warnings/errors
    if (n.subtitle !== undefined && typeof n.subtitle !== 'string') {
      warnings.push({
        path: `${path}.subtitle`,
        code: 'INVALID_TYPE',
        message: `Subtitle at "${path}.subtitle" should be a string`,
      });
    }

    if (n.description !== undefined && typeof n.description !== 'string') {
      warnings.push({
        path: `${path}.description`,
        code: 'INVALID_TYPE',
        message: `Description at "${path}.description" should be a string`,
      });
    }

    if (n.keyFacts !== undefined && !Array.isArray(n.keyFacts)) {
      warnings.push({
        path: `${path}.keyFacts`,
        code: 'INVALID_TYPE',
        message: `keyFacts at "${path}.keyFacts" should be an array of strings`,
      });
    }

    // Children validation
    if (n.children !== undefined) {
      if (!Array.isArray(n.children)) {
        errors.push({
          path: `${path}.children`,
          code: 'INVALID_TYPE',
          message: `Children property at path "${path}.children" must be an array`,
          severity: 'fatal',
        });
      } else {
        n.children.forEach((child, index) => {
          validateNode(child, `${path}.children[${index}]`, new Set(branchStack));
        });
      }
    }
  }

  validateNode(raw.root, 'root', new Set());

  // CROSS-LINKS VALIDATION
  if (raw.crossLinks !== undefined) {
    if (!Array.isArray(raw.crossLinks)) {
      errors.push({
        path: 'crossLinks',
        code: 'INVALID_TYPE',
        message: 'Top-level "crossLinks" must be an array if provided',
        severity: 'fatal',
      });
    } else {
      raw.crossLinks.forEach((link, idx) => {
        const linkPath = `crossLinks[${idx}]`;
        if (link === null || typeof link !== 'object' || Array.isArray(link)) {
          errors.push({
            path: linkPath,
            code: 'INVALID_TYPE',
            message: `CrossLink at "${linkPath}" must be a non-null object`,
            severity: 'fatal',
          });
          return;
        }

        const l = link as Record<string, unknown>;

        if (typeof l.sourceId !== 'string' || l.sourceId.trim() === '') {
          errors.push({
            path: `${linkPath}.sourceId`,
            code: 'MISSING_REQUIRED_FIELD',
            message: `CrossLink sourceId at "${linkPath}.sourceId" is required`,
            severity: 'fatal',
          });
        } else if (!seenNodeIds.has(l.sourceId)) {
          errors.push({
            path: `${linkPath}.sourceId`,
            code: 'INVALID_NODE_REFERENCE',
            message: `CrossLink sourceId "${l.sourceId}" at "${linkPath}.sourceId" does not exist in node tree`,
            severity: 'fatal',
          });
        }

        if (typeof l.targetId !== 'string' || l.targetId.trim() === '') {
          errors.push({
            path: `${linkPath}.targetId`,
            code: 'MISSING_REQUIRED_FIELD',
            message: `CrossLink targetId at "${linkPath}.targetId" is required`,
            severity: 'fatal',
          });
        } else if (!seenNodeIds.has(l.targetId)) {
          errors.push({
            path: `${linkPath}.targetId`,
            code: 'INVALID_NODE_REFERENCE',
            message: `CrossLink targetId "${l.targetId}" at "${linkPath}.targetId" does not exist in node tree`,
            severity: 'fatal',
          });
        }

        if (
          l.type !== undefined &&
          l.type !== 'relationship' &&
          l.type !== 'causality' &&
          l.type !== 'comparison'
        ) {
          errors.push({
            path: `${linkPath}.type`,
            code: 'INVALID_VALUE',
            message: `CrossLink type at "${linkPath}.type" must be "relationship", "causality", or "comparison"`,
            severity: 'fatal',
          });
        }
      });
    }
  }

  // QUIZ QUESTIONS VALIDATION
  if (raw.quizQuestions !== undefined) {
    if (!Array.isArray(raw.quizQuestions)) {
      errors.push({
        path: 'quizQuestions',
        code: 'INVALID_TYPE',
        message: 'Top-level "quizQuestions" must be an array if provided',
        severity: 'fatal',
      });
    } else {
      const seenQuizIds = new Set<string>();

      raw.quizQuestions.forEach((q, idx) => {
        const qPath = `quizQuestions[${idx}]`;
        if (q === null || typeof q !== 'object' || Array.isArray(q)) {
          errors.push({
            path: qPath,
            code: 'INVALID_TYPE',
            message: `Quiz question at "${qPath}" must be a non-null object`,
            severity: 'fatal',
          });
          return;
        }

        const qObj = q as Record<string, unknown>;

        if (typeof qObj.id !== 'string' || qObj.id.trim() === '') {
          errors.push({
            path: `${qPath}.id`,
            code: 'MISSING_REQUIRED_FIELD',
            message: `Quiz question ID at "${qPath}.id" is required`,
            severity: 'fatal',
          });
        } else if (seenQuizIds.has(qObj.id)) {
          errors.push({
            path: `${qPath}.id`,
            code: 'DUPLICATE_QUIZ_ID',
            message: `Duplicate quiz question ID "${qObj.id}" found at "${qPath}.id"`,
            severity: 'fatal',
          });
        } else {
          seenQuizIds.add(qObj.id);
        }

        if (typeof qObj.nodeId !== 'string' || qObj.nodeId.trim() === '') {
          errors.push({
            path: `${qPath}.nodeId`,
            code: 'MISSING_REQUIRED_FIELD',
            message: `Quiz nodeId at "${qPath}.nodeId" is required`,
            severity: 'fatal',
          });
        } else if (!seenNodeIds.has(qObj.nodeId)) {
          errors.push({
            path: `${qPath}.nodeId`,
            code: 'INVALID_NODE_REFERENCE',
            message: `Quiz nodeId "${qObj.nodeId}" at "${qPath}.nodeId" does not exist in node tree`,
            severity: 'fatal',
          });
        }

        if (typeof qObj.question !== 'string' || qObj.question.trim() === '') {
          errors.push({
            path: `${qPath}.question`,
            code: 'MISSING_REQUIRED_FIELD',
            message: `Quiz question text at "${qPath}.question" is required`,
            severity: 'fatal',
          });
        }

        if (!Array.isArray(qObj.options) || qObj.options.length === 0) {
          errors.push({
            path: `${qPath}.options`,
            code: 'EMPTY_OPTIONS',
            message: `Quiz options at "${qPath}.options" must be a non-empty array`,
            severity: 'fatal',
          });
        } else {
          const optCount = qObj.options.length;
          const ansIdx = qObj.correctAnswerIndex;
          if (
            typeof ansIdx !== 'number' ||
            !Number.isInteger(ansIdx) ||
            ansIdx < 0 ||
            ansIdx >= optCount
          ) {
            errors.push({
              path: `${qPath}.correctAnswerIndex`,
              code: 'INVALID_QUIZ_OPTION_INDEX',
              message: `correctAnswerIndex (${ansIdx}) at "${qPath}.correctAnswerIndex" is out of bounds for options length ${optCount}`,
              severity: 'fatal',
            });
          }
        }
      });
    }
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
  };
}
