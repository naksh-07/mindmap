import { MindMapData, MindMapNode } from '../types/mindmap';
import { HINDI_GEOGRAPHY_MINDMAP } from './hindi-geography-dataset';

// Helper to generate stress-test hierarchy nodes
function generateSubtreeNodes(
  prefix: string,
  count: number,
  depth: number,
  maxDepth: number
): MindMapNode[] {
  if (depth > maxDepth) return [];
  const nodes: MindMapNode[] = [];
  const hindiSubjects = [
    'अपक्षय (Weathering)',
    'अपरदन चक्र (Erosion Cycle)',
    'वायुदाब पेटियाँ (Pressure Belts)',
    'भारतीय मानसून (Indian Monsoon)',
    'जलोढ़ मिट्टी (Alluvial Soil)',
    'गोंडवाना लैंड (Gondwana Land)',
    'प्लेट विवर्तनिकी (Plate Tectonics)',
    'समताप मंडल (Stratosphere)',
    'जैविक विविधता (Biodiversity)',
    'सौर विकिरण (Solar Radiation)',
  ];

  for (let i = 1; i <= count; i++) {
    const id = `${prefix}-${depth}-${i}`;
    const subject = hindiSubjects[(i - 1) % hindiSubjects.length];
    const hasChildren = depth < maxDepth && i <= Math.ceil(count / 2);
    
    nodes.push({
      id,
      label: `${subject} #${i}`,
      subtitle: `स्तर ${depth} - उप-अवधारणा अध्ययन बिंदु`,
      description: `${subject} के संदर्भ में विस्तृत भौगोलिक एवं वैज्ञानिक सिद्धांत।`,
      badge: depth === 1 ? `विभाग ${i}` : undefined,
      children: hasChildren
        ? generateSubtreeNodes(id, Math.max(2, Math.floor(count / 2)), depth + 1, maxDepth)
        : undefined,
    });
  }
  return nodes;
}

// Dataset A: ~20 nodes (Small Focused Map)
export const TEST_DATASET_20: MindMapData = {
  id: 'test-20-nodes',
  title: 'भारत का भौतिक भूगोल (20 अवधारणाएं)',
  subtitle: 'छोटे आकार का परीक्षण मानचित्र',
  subject: 'भूगोल (Geography)',
  language: 'hi',
  root: {
    id: 'root-20',
    label: 'भारत का भौतिक स्वरूप',
    subtitle: 'मुख्य प्राकृतिक प्रदेश',
    children: [
      {
        id: 'himalaya-20',
        label: 'हिमालय पर्वत शृंखला',
        subtitle: 'नवीन मोड़दार पर्वत',
        children: [
          { id: 'himadri-20', label: 'महान हिमालय (हिमाद्रि)', subtitle: 'औसत 6,000m' },
          { id: 'himachal-20', label: 'मध्य हिमालय (हिमाचल)', subtitle: '3,700-4,500m' },
          { id: 'shiwalik-20', label: 'शिवालिक श्रेणी', subtitle: 'बाहरी हिमालय' },
        ],
      },
      {
        id: 'plains-20',
        label: 'उत्तरी भारत का मैदान',
        subtitle: 'विशाल जलोढ़ मैदान',
        children: [
          { id: 'bhabar-20', label: 'भाबर क्षेत्र', subtitle: 'कंकड़-पत्थर युक्त पट्टी' },
          { id: 'terai-20', label: 'तराई क्षेत्र', subtitle: 'दलदली एवं वनाच्छादित' },
          { id: 'bangar-20', label: 'बांगर एवं खादर', subtitle: 'पुराना व नया जलोढ़' },
        ],
      },
      {
        id: 'plateau-20',
        label: 'प्रायद्वीपीय पठार',
        subtitle: 'प्राचीन गोंडवाना भूभाग',
        children: [
          { id: 'malwa-20', label: 'मध्य उच्च भूमि (मालवा)', subtitle: 'चंबल द्रोणी' },
          { id: 'deccan-20', label: 'दक्कन का पठार', subtitle: 'लावा निर्मित काली मिट्टी' },
          { id: 'ghats-20', label: 'पूर्वी व पश्चिमी घाट', subtitle: 'सह्याद्रि पर्वत' },
        ],
      },
      {
        id: 'islands-20',
        label: 'द्वीप समूह',
        subtitle: 'बंगाल की खाड़ी व अरब सागर',
        children: [
          { id: 'andaman-20', label: 'अंडमान और निकोबार', subtitle: 'ज्वालामुखी द्वीप' },
          { id: 'lakshadweep-20', label: 'लक्षद्वीप समूह', subtitle: 'प्रवाल द्वीप (Coral)' },
        ],
      },
    ],
  },
};

// Dataset B: ~50 nodes (Medium Map)
export const TEST_DATASET_50: MindMapData = HINDI_GEOGRAPHY_MINDMAP;

// Dataset C: ~100 nodes (Large Multi-Chapter Map)
export const TEST_DATASET_100: MindMapData = {
  id: 'test-100-nodes',
  title: 'भौतिक भूगोल एवं जलवायु विज्ञान (100+ अवधारणाएं)',
  subtitle: 'विस्तृत परीक्षा अध्ययन मानचित्र',
  subject: 'भूगोल एवं पर्यावरण',
  language: 'hi',
  root: {
    id: 'root-100',
    label: 'भौतिक भूगोल की संपूर्ण रूपरेखा',
    subtitle: 'भू-आकृति विज्ञान, जलवायु एवं महासागर',
    children: [
      {
        id: 'geomorphology-100',
        label: 'भू-आकृति विज्ञान (Geomorphology)',
        subtitle: 'पृथ्वी की आंतरिक व बाह्य संरचना',
        children: generateSubtreeNodes('geo', 5, 2, 4),
      },
      {
        id: 'climatology-100',
        label: 'जलवायु विज्ञान (Climatology)',
        subtitle: 'वायुमंडल, वायुदाब व मानसून',
        children: generateSubtreeNodes('clim', 5, 2, 4),
      },
      {
        id: 'oceanography-100',
        label: 'समुद्र विज्ञान (Oceanography)',
        subtitle: 'महासागरीय धाराएं व तटीय उचावच',
        children: generateSubtreeNodes('ocean', 5, 2, 4),
      },
      {
        id: 'biogeography-100',
        label: 'जैव भूगोल व मृदा विज्ञान',
        subtitle: 'मृदा प्रकार, वनस्पति व पारिस्थिकी',
        children: generateSubtreeNodes('bio', 5, 2, 4),
      },
    ],
  },
};

// Dataset D: ~200 nodes (Stress Map)
export const TEST_DATASET_200: MindMapData = {
  id: 'test-200-nodes',
  title: 'सामान्य अध्ययन भूगोल महा-मानचित्र (200+ अवधारणाएं)',
  subtitle: 'तनाव परीक्षण एवं प्रदर्शन मूल्यांकन (Stress Test Map)',
  subject: 'भूगोल एवं पर्यावरण विज्ञान',
  language: 'hi',
  root: {
    id: 'root-200',
    label: 'विश्व एवं भारत का भूगोल (संपूर्ण पाठ्यक्रम)',
    subtitle: '200 अवधारणाएं - 5 स्तर पदानुक्रम',
    children: [
      {
        id: 'branch-1-200',
        label: '1. भू-आकृति एवं शैल चक्र',
        subtitle: 'आंतरिक बल व प्लेट टेक्टोनिक्स',
        children: generateSubtreeNodes('b1', 6, 2, 5),
      },
      {
        id: 'branch-2-200',
        label: '2. वायुमंडल एवं जलवायु प्रणाली',
        subtitle: 'तापमान वितरण व चक्रवात',
        children: generateSubtreeNodes('b2', 6, 2, 5),
      },
      {
        id: 'branch-3-200',
        label: '3. जलमंडल व महासागरीय संसाधन',
        subtitle: 'लवणता, ज्वार-भाटा व प्रवाल',
        children: generateSubtreeNodes('b3', 6, 2, 5),
      },
      {
        id: 'branch-4-200',
        label: '4. भारत का भौतिक एवं अपवाह स्वरूप',
        subtitle: 'नदियाँ, झीलें व पर्वत श्रेणियाँ',
        children: generateSubtreeNodes('b4', 6, 2, 5),
      },
      {
        id: 'branch-5-200',
        label: '5. पर्यावरण एवं जैव विविधता संरक्षण',
        subtitle: 'राष्ट्रीय उद्यान व संकटग्रस्त प्रजातियाँ',
        children: generateSubtreeNodes('b5', 6, 2, 5),
      },
    ],
  },
};

// Dataset E: ~500 nodes (Extreme Stress Map)
export const TEST_DATASET_500: MindMapData = {
  id: 'test-500-nodes',
  title: 'अत्यधिक तनाव परीक्षण मानचित्र (500+ अवधारणाएं)',
  subtitle: '500 अवधारणाएं - 5 स्तर पदानुक्रम',
  subject: 'भूगोल एवं सिविल सेवा पाठ्यक्रम',
  language: 'hi',
  root: {
    id: 'root-500',
    label: 'संपूर्ण सामान्य अध्ययन (500 नोड्स)',
    subtitle: 'विस्तृत तनाव परीक्षण डेटासेट',
    children: [
      { id: 'b1-500', label: '1. भू-आकृति एवं भू-गर्भ', children: generateSubtreeNodes('s1', 8, 2, 5) },
      { id: 'b2-500', label: '2. जलवायु एवं मौसम प्रणाली', children: generateSubtreeNodes('s2', 8, 2, 5) },
      { id: 'b3-500', label: '3. जलमंडल व महासागर', children: generateSubtreeNodes('s3', 8, 2, 5) },
      { id: 'b4-500', label: '4. मृदा व प्राकृतिक वनस्पति', children: generateSubtreeNodes('s4', 8, 2, 5) },
      { id: 'b5-500', label: '5. भारत का भूगोल', children: generateSubtreeNodes('s5', 8, 2, 5) },
      { id: 'b6-500', label: '6. पर्यावरण विज्ञान', children: generateSubtreeNodes('s6', 8, 2, 5) },
    ],
  },
};

// Dataset F: ~1000 nodes (Catastrophic Stress Map)
export const TEST_DATASET_1000: MindMapData = {
  id: 'test-1000-nodes',
  title: 'महा-तनाव परीक्षण मानचित्र (1000+ अवधारणाएं)',
  subtitle: '1000 अवधारणाएं - 6 स्तर पदानुक्रम',
  subject: 'संपूर्ण सिविल सेवा पाठ्यक्रम',
  language: 'hi',
  root: {
    id: 'root-1000',
    label: 'महा-मानचित्र (1000 नोड्स)',
    subtitle: '1000 नोड्स - प्रदर्शन मूल्यांकन',
    children: [
      { id: 'c1-1000', label: '1. भौतिक भूगोल', children: generateSubtreeNodes('k1', 10, 2, 6) },
      { id: 'c2-1000', label: '2. मानव एवं आर्थिक भूगोल', children: generateSubtreeNodes('k2', 10, 2, 6) },
      { id: 'c3-1000', label: '3. भारतीय अर्थव्यवस्था', children: generateSubtreeNodes('k3', 10, 2, 6) },
      { id: 'c4-1000', label: '4. पर्यावरण एवं पारिस्थितिकी', children: generateSubtreeNodes('k4', 10, 2, 6) },
      { id: 'c5-1000', label: '5. विज्ञान एवं प्रौद्योगिकी', children: generateSubtreeNodes('k5', 10, 2, 6) },
      { id: 'c6-1000', label: '6. आपदा प्रबंधन', children: generateSubtreeNodes('k6', 10, 2, 6) },
      { id: 'c7-1000', label: '7. अंतर्राष्ट्रीय संबंध', children: generateSubtreeNodes('k7', 10, 2, 6) },
      { id: 'c8-1000', label: '8. आंतरिक सुरक्षा', children: generateSubtreeNodes('k8', 10, 2, 6) },
    ],
  },
};

export const ALL_TEST_DATASETS: Record<string, MindMapData> = {
  'geo-20': TEST_DATASET_20,
  'geo-50': TEST_DATASET_50,
  'geo-100': TEST_DATASET_100,
  'geo-200': TEST_DATASET_200,
  'geo-500': TEST_DATASET_500,
  'geo-1000': TEST_DATASET_1000,
};
