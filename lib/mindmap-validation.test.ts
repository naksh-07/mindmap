import { validateMindMapData, parseAndIngestMindMapData } from './mindmap-data';
import {
  TEST_DATASET_20,
  TEST_DATASET_50,
  TEST_DATASET_100,
  TEST_DATASET_200,
  TEST_DATASET_500,
  TEST_DATASET_1000,
} from './data/test-datasets';

function runValidationTestSuite() {
  console.log('=== RUNNING MIND MAP DATA VALIDATION TEST SUITE ===\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // TEST 1: Valid Minimal Map
  {
    const minimalMap = {
      id: 'min-1',
      title: 'Minimal Map',
      subject: 'Testing',
      language: 'en',
      root: {
        id: 'r1',
        label: 'Root Node',
      },
    };
    const res = validateMindMapData(minimalMap);
    assert(res.success && res.errors.length === 0, '1. Valid minimal map passes validation');
  }

  // TEST 2: Valid Complex Hindi Map
  {
    const hindiMap = {
      id: 'hi-geo',
      title: 'भारत का भौतिक स्वरूप',
      subject: 'भूगोल',
      language: 'hi',
      root: {
        id: 'r-hi',
        label: 'भारत का स्वरूप',
        children: [
          {
            id: 'n-him',
            label: 'हिमालय',
            subtitle: 'उत्तरी पर्वत',
            description: 'नवीन पर्वतमाला',
            badge: '2400km',
            keyFacts: ['सर्वोच्च श्रेणी', 'हिमनद स्रोत'],
            children: [{ id: 'n-himadri', label: 'हिमाद्रि' }],
          },
        ],
      },
      crossLinks: [
        { sourceId: 'n-him', targetId: 'n-himadri', label: 'श्रेणी संबंध', type: 'relationship' },
      ],
      quizQuestions: [
        {
          id: 'q-1',
          nodeId: 'n-him',
          nodeLabel: 'हिमालय',
          question: 'हिमालय की कुल लंबाई कितनी है?',
          options: ['1000 km', '2400 km', '5000 km'],
          correctAnswerIndex: 1,
          explanation: 'हिमालय 2400 किमी में फैला है।',
        },
      ],
    };
    const res = validateMindMapData(hindiMap);
    assert(res.success && res.errors.length === 0, '2. Valid complex Hindi map passes validation');
  }

  // TEST 3: Missing Root
  {
    const missingRoot = {
      id: 'no-root',
      title: 'No Root Map',
      subject: 'Testing',
      language: 'en',
    };
    const res = validateMindMapData(missingRoot);
    assert(
      !res.success && res.errors.some((e) => e.code === 'MISSING_REQUIRED_FIELD' && e.path === 'root'),
      '3. Missing root produces fatal validation error'
    );
  }

  // TEST 4: Null Root
  {
    const nullRoot = {
      id: 'null-root',
      title: 'Null Root Map',
      subject: 'Testing',
      language: 'en',
      root: null,
    };
    const res = validateMindMapData(nullRoot);
    assert(
      !res.success && res.errors.some((e) => e.path === 'root'),
      '4. Null root produces fatal validation error'
    );
  }

  // TEST 5: Missing Node ID
  {
    const missingNodeId = {
      id: 'map-5',
      title: 'Map',
      subject: 'Testing',
      language: 'en',
      root: {
        id: '',
        label: 'Root Label',
      },
    };
    const res = validateMindMapData(missingNodeId);
    assert(
      !res.success && res.errors.some((e) => e.code === 'MISSING_REQUIRED_FIELD' && e.path === 'root.id'),
      '5. Missing/empty node ID produces fatal error'
    );
  }

  // TEST 6: Duplicate Node IDs
  {
    const dupNodeIdMap = {
      id: 'map-6',
      title: 'Duplicate Node IDs',
      subject: 'Testing',
      language: 'en',
      root: {
        id: 'dup-1',
        label: 'Root Node',
        children: [
          { id: 'dup-child', label: 'Child 1' },
          { id: 'dup-child', label: 'Child 2 Duplicate' },
        ],
      },
    };
    const res = validateMindMapData(dupNodeIdMap);
    assert(
      !res.success && res.errors.some((e) => e.code === 'DUPLICATE_NODE_ID'),
      '6. Duplicate node ID detected across tree'
    );
  }

  // TEST 7: Missing Node Label
  {
    const missingLabelMap = {
      id: 'map-7',
      title: 'Missing Label',
      subject: 'Testing',
      language: 'en',
      root: {
        id: 'r7',
        label: '   ',
      },
    };
    const res = validateMindMapData(missingLabelMap);
    assert(
      !res.success && res.errors.some((e) => e.code === 'MISSING_REQUIRED_FIELD' && e.path === 'root.label'),
      '7. Whitespace/missing node label produces fatal error'
    );
  }

  // TEST 8: Invalid Children Property
  {
    const invalidChildrenMap = {
      id: 'map-8',
      title: 'Invalid Children',
      subject: 'Testing',
      language: 'en',
      root: {
        id: 'r8',
        label: 'Root Node',
        children: 'not-an-array',
      },
    };
    const res = validateMindMapData(invalidChildrenMap);
    assert(
      !res.success && res.errors.some((e) => e.code === 'INVALID_TYPE' && e.path === 'root.children'),
      '8. Non-array children property produces fatal error'
    );
  }

  // TEST 9: Invalid Language
  {
    const invalidLangMap = {
      id: 'map-9',
      title: 'Invalid Language',
      subject: 'Testing',
      language: 'fr',
      root: { id: 'r9', label: 'Root' },
    };
    const res = validateMindMapData(invalidLangMap);
    assert(
      !res.success && res.errors.some((e) => e.code === 'INVALID_VALUE' && e.path === 'language'),
      '9. Invalid language code produces fatal error'
    );
  }

  // TEST 10: Invalid CrossLink Source ID
  {
    const invalidCrossSourceMap = {
      id: 'map-10',
      title: 'Invalid Cross Source',
      subject: 'Testing',
      language: 'en',
      root: { id: 'r10', label: 'Root Node' },
      crossLinks: [{ sourceId: 'ghost-id', targetId: 'r10' }],
    };
    const res = validateMindMapData(invalidCrossSourceMap);
    assert(
      !res.success && res.errors.some((e) => e.code === 'INVALID_NODE_REFERENCE' && e.path === 'crossLinks[0].sourceId'),
      '10. Non-existent crossLink sourceId produces fatal error'
    );
  }

  // TEST 11: Invalid CrossLink Target ID
  {
    const invalidCrossTargetMap = {
      id: 'map-11',
      title: 'Invalid Cross Target',
      subject: 'Testing',
      language: 'en',
      root: { id: 'r11', label: 'Root Node' },
      crossLinks: [{ sourceId: 'r11', targetId: 'ghost-target' }],
    };
    const res = validateMindMapData(invalidCrossTargetMap);
    assert(
      !res.success && res.errors.some((e) => e.code === 'INVALID_NODE_REFERENCE' && e.path === 'crossLinks[0].targetId'),
      '11. Non-existent crossLink targetId produces fatal error'
    );
  }

  // TEST 12: Invalid CrossLink Type
  {
    const invalidCrossTypeMap = {
      id: 'map-12',
      title: 'Invalid Cross Type',
      subject: 'Testing',
      language: 'en',
      root: {
        id: 'r12',
        label: 'Root Node',
        children: [{ id: 'c12', label: 'Child Node' }],
      },
      crossLinks: [{ sourceId: 'r12', targetId: 'c12', type: 'unknown-type' as any }],
    };
    const res = validateMindMapData(invalidCrossTypeMap);
    assert(
      !res.success && res.errors.some((e) => e.code === 'INVALID_VALUE' && e.path === 'crossLinks[0].type'),
      '12. Invalid crossLink type produces fatal error'
    );
  }

  // TEST 13: Invalid Quiz Node ID
  {
    const invalidQuizNodeMap = {
      id: 'map-13',
      title: 'Invalid Quiz Node',
      subject: 'Testing',
      language: 'en',
      root: { id: 'r13', label: 'Root' },
      quizQuestions: [
        {
          id: 'q13',
          nodeId: 'ghost-node',
          question: 'Q?',
          options: ['A', 'B'],
          correctAnswerIndex: 0,
        },
      ],
    };
    const res = validateMindMapData(invalidQuizNodeMap);
    assert(
      !res.success && res.errors.some((e) => e.code === 'INVALID_NODE_REFERENCE' && e.path === 'quizQuestions[0].nodeId'),
      '13. Non-existent quiz nodeId produces fatal error'
    );
  }

  // TEST 14: Empty Quiz Options
  {
    const emptyQuizOptMap = {
      id: 'map-14',
      title: 'Empty Quiz Options',
      subject: 'Testing',
      language: 'en',
      root: { id: 'r14', label: 'Root' },
      quizQuestions: [
        {
          id: 'q14',
          nodeId: 'r14',
          question: 'Q?',
          options: [],
          correctAnswerIndex: 0,
        },
      ],
    };
    const res = validateMindMapData(emptyQuizOptMap);
    assert(
      !res.success && res.errors.some((e) => e.code === 'EMPTY_OPTIONS' && e.path === 'quizQuestions[0].options'),
      '14. Empty quiz options array produces fatal error'
    );
  }

  // TEST 15: Invalid Quiz Correct Answer Index
  {
    const invalidQuizIdxMap = {
      id: 'map-15',
      title: 'Invalid Answer Index',
      subject: 'Testing',
      language: 'en',
      root: { id: 'r15', label: 'Root' },
      quizQuestions: [
        {
          id: 'q15',
          nodeId: 'r15',
          question: 'Q?',
          options: ['A', 'B'],
          correctAnswerIndex: 5,
        },
      ],
    };
    const res = validateMindMapData(invalidQuizIdxMap);
    assert(
      !res.success && res.errors.some((e) => e.code === 'INVALID_QUIZ_OPTION_INDEX' && e.path === 'quizQuestions[0].correctAnswerIndex'),
      '15. Out-of-bounds quiz correctAnswerIndex produces fatal error'
    );
  }

  // TEST 16: Duplicate Quiz IDs
  {
    const dupQuizIdMap = {
      id: 'map-16',
      title: 'Duplicate Quiz IDs',
      subject: 'Testing',
      language: 'en',
      root: { id: 'r16', label: 'Root' },
      quizQuestions: [
        { id: 'q-dup', nodeId: 'r16', question: 'Q1', options: ['A', 'B'], correctAnswerIndex: 0 },
        { id: 'q-dup', nodeId: 'r16', question: 'Q2', options: ['C', 'D'], correctAnswerIndex: 1 },
      ],
    };
    const res = validateMindMapData(dupQuizIdMap);
    assert(
      !res.success && res.errors.some((e) => e.code === 'DUPLICATE_QUIZ_ID' && e.path === 'quizQuestions[1].id'),
      '16. Duplicate quiz ID produces fatal error'
    );
  }

  // TEST 17: Benchmark Datasets Validation (20, 50, 100, 200, 500, 1000 Nodes)
  {
    const datasets = [
      { id: '20', data: TEST_DATASET_20 },
      { id: '50', data: TEST_DATASET_50 },
      { id: '100', data: TEST_DATASET_100 },
      { id: '200', data: TEST_DATASET_200 },
      { id: '500', data: TEST_DATASET_500 },
      { id: '1000', data: TEST_DATASET_1000 },
    ];

    for (const ds of datasets) {
      const res = validateMindMapData(ds.data);
      assert(
        res.success && res.errors.length === 0,
        `17. Benchmark dataset ${ds.id} passes strict validation cleanly`
      );
    }
  }

  // TEST 18: Raw JSON String Parsing Test
  {
    const rawJsonStr = JSON.stringify({
      id: 'raw-json-1',
      title: 'Raw Text Map',
      subject: 'Testing',
      language: 'en',
      root: { id: 'r-raw', label: 'Parsed Root' },
    });

    const parseRes = parseAndIngestMindMapData(rawJsonStr);
    assert(
      parseRes.success && parseRes.data !== null && parseRes.data.root.id === 'r-raw',
      '18. Raw JSON text string parses and ingests cleanly'
    );
  }

  console.log(`\n=== ALL ${passed}/${total} VALIDATION TESTS PASSED SUCCESSFULLY ===\n`);
}

runValidationTestSuite();
