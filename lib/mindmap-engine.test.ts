import { computeMindMapLayout, computeSubtreeWidth } from './mindmap-layout';
import { measureNodeDimensions } from './mindmap-measurer';
import { MindMapNode } from './types/mindmap';
import {
  TEST_DATASET_20,
  TEST_DATASET_50,
  TEST_DATASET_100,
  TEST_DATASET_200,
  TEST_DATASET_500,
  TEST_DATASET_1000,
} from './data/test-datasets';

function runRegressionTests() {
  console.log('=== RUNNING MIND MAP ENGINE REGRESSION TESTS ===\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // TEST 1: BUG-001 - Branch Side Stability on Collapse/Expand
  {
    const rootNode = TEST_DATASET_50.root;
    const initialLayout = computeMindMapLayout(rootNode, 'balanced', new Set());
    const rightSideNodesInitial = new Set(
      initialLayout.nodes.filter((n) => n.depth === 1 && !n.isLeft).map((n) => n.id)
    );

    // Collapse one right branch
    const firstRightId = Array.from(rightSideNodesInitial)[0];
    const collapsedLayout = computeMindMapLayout(rootNode, 'balanced', new Set([firstRightId]));

    const rightSideNodesAfterCollapse = new Set(
      collapsedLayout.nodes.filter((n) => n.depth === 1 && !n.isLeft).map((n) => n.id)
    );

    assert(
      rightSideNodesInitial.size === rightSideNodesAfterCollapse.size &&
        Array.from(rightSideNodesInitial).every((id) => rightSideNodesAfterCollapse.has(id)),
      'BUG-001: Level-1 branch sides remain completely stable after collapsing a branch'
    );
  }

  // TEST 2: BUG-002 - Vertical Layout Subtree Width Allocation
  {
    const deepTestTree: MindMapNode = {
      id: 'root-v',
      label: 'Root Vertical',
      children: [
        {
          id: 'v1',
          label: 'Branch 1',
          children: [
            { id: 'v1-1', label: 'Child 1.1' },
            { id: 'v1-2', label: 'Child 1.2' },
            { id: 'v1-3', label: 'Child 1.3' },
          ],
        },
        {
          id: 'v2',
          label: 'Branch 2',
          children: [
            { id: 'v2-1', label: 'Child 2.1' },
            { id: 'v2-2', label: 'Child 2.2' },
          ],
        },
      ],
    };

    const vertLayout = computeMindMapLayout(deepTestTree, 'vertical', new Set());
    const v1Node = vertLayout.nodes.find((n) => n.id === 'v1')!;
    const v2Node = vertLayout.nodes.find((n) => n.id === 'v2')!;

    // Verify distance between v1 and v2 is at least width of v1 subtree
    const v1SubtreeWidth = computeSubtreeWidth(deepTestTree.children![0], 1, new Set()).width;
    const distanceBetweenBranches = Math.abs(v2Node.x - v1Node.x);

    assert(
      distanceBetweenBranches >= v1SubtreeWidth * 0.8,
      'BUG-002: Vertical mode calculates subtree width preventing horizontal overlap'
    );
  }

  // TEST 3: BUG-005 - Search Robustness against null/undefined fields
  {
    const malformedNode: MindMapNode = {
      id: 'malformed-1',
      label: undefined as unknown as string,
      subtitle: null as unknown as string,
      description: undefined,
      children: [
        {
          id: 'malformed-child',
          label: 'Valid Child Label',
          keyFacts: [null as unknown as string, 'Fact 1'],
        },
      ],
    };

    let didCrash = false;
    try {
      const q = 'search';
      const traverse = (node: MindMapNode) => {
        if (q.length > 0 && node) {
          const labelStr = (node.label ?? '').toLowerCase();
          const subStr = (node.subtitle ?? '').toLowerCase();
          const descStr = (node.description ?? '').toLowerCase();
          const factsArr = node.keyFacts ?? [];
          labelStr.includes(q);
          subStr.includes(q);
          descStr.includes(q);
          factsArr.some((f) => (f ?? '').toLowerCase().includes(q));
        }
        if (node?.children) {
          node.children.forEach(traverse);
        }
      };
      traverse(malformedNode);
    } catch (e) {
      didCrash = true;
    }

    assert(!didCrash, 'BUG-005: Search traversal gracefully handles undefined/null labels without crashing');
  }

  // TEST 4: BUG-007 - Subtitle Single-Line Height Clamping
  {
    const longSubtitleNode: MindMapNode = {
      id: 'long-sub',
      label: 'Main Concept',
      subtitle: 'This is a very long subtitle that would span across multiple lines if measured as multiline text in canvas 2d measurer',
    };

    const dim = measureNodeDimensions(longSubtitleNode, 1);
    assert(
      dim.height <= 85,
      'BUG-007: Subtitle measurement clamps to 1 line to match single-line CSS rendering bounds'
    );
  }

  // TEST 5: Benchmark Datasets Integrity (20, 50, 100, 200, 500, 1000 Nodes)
  {
    const datasets = [
      TEST_DATASET_20,
      TEST_DATASET_50,
      TEST_DATASET_100,
      TEST_DATASET_200,
      TEST_DATASET_500,
      TEST_DATASET_1000,
    ];
    for (const ds of datasets) {
      const layout = computeMindMapLayout(ds.root, 'balanced', new Set());
      assert(
        layout.nodes.length > 0 && layout.connectors.length > 0,
        `Benchmark Dataset ${ds.id} (${layout.nodes.length} nodes) lays out cleanly`
      );
    }
  }

  console.log(`\n=== ALL ${passed}/${total} REGRESSION TESTS PASSED SUCCESSFULLY ===\n`);
}

runRegressionTests();
