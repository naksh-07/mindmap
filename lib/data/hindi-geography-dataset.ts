import { MindMapData } from '../types/mindmap';

export const HINDI_GEOGRAPHY_MINDMAP: MindMapData = {
  id: 'geo-india-physio-01',
  title: 'भारत का भौतिक भूगोल',
  subtitle: 'Physical Geography of India - एनसीईआरटी आधारित संपूर्ण संरचना',
  subject: 'भूगोल (Geography)',
  chapter: 'अध्याय 2: भारत का भौतिक स्वरूप',
  language: 'hi',
  root: {
    id: 'root-india',
    label: 'भारत का भौतिक भूगोल',
    subtitle: '6 प्रमुख भौगोलिक विभाग',
    description: 'भारत विविधतापूर्ण भू-आकृतियों वाला देश है जिसमें पर्वत, मैदान, पठार, मरुस्थल, तटीय मैदान एवं द्वीप समूह शामिल हैं।',
    category: 'root',
    badge: '32.8 लाख वर्ग किमी',
    color: '#3b82f6', // Indigo Blue
    icon: 'Globe',
    keyFacts: [
      'भारत विश्व का 7वाँ सबसे बड़ा देश है',
      'उत्तरी सीमा पर विशाल हिमालय तथा दक्षिण में हिन्द महासागर स्थित है',
      'भूगर्भिक दृष्टि से भारत गोंडवाना लैंड का हिस्सा रहा है'
    ],
    children: [
      {
        id: 'himalaya',
        label: 'हिमालय पर्वत शृंखला',
        subtitle: 'नवीन मोड़दार पर्वत (Young Fold Mountains)',
        description: 'विश्व की सबसे ऊँची एवं दुर्गम पर्वत श्रेणी जो भारत की उत्तरी सीमा पर चाप (Arc) के आकार में 2,400 किमी फैली है।',
        category: 'mountain',
        badge: '2,400 किमी लम्बाई',
        color: '#d97706', // Amber Gold
        icon: 'Mountain',
        keyFacts: [
          'सिंधु से ब्रह्मपुत्र नदी तक विस्तार',
          'पश्चिम में चौड़ाई 400 किमी तथा पूर्व में 150 किमी',
          'संसार की सबसे ऊँची चोटियाँ स्थित हैं'
        ],
        children: [
          {
            id: 'himadri',
            label: 'महान हिमालय (हिमाद्रि)',
            subtitle: 'आंतरिक / सर्वोच्च हिमालय',
            description: 'सतत एवं सबसे ऊँची श्रेणी जिसमें औसत ऊँचाई 6,000 मीटर है। कोर ग्रेनाइट से बना है।',
            category: 'sub-mountain',
            badge: 'औसत 6,000m',
            color: '#b45309',
            keyFacts: [
              'माउंट एवरेस्ट (8,848.86m) सर्वोच्च शिखर',
              'कंचनजंगा (8,586m) भारत में स्थित उच्च शिखर',
              'वर्षभर बर्फ से ढके रहने वाले हिमनद (Gangotri, Yamunotri)'
            ],
            children: [
              {
                id: 'everest',
                label: 'माउंट एवरेस्ट',
                subtitle: 'विश्व की सर्वोच्च चोटी (8,848.86m)',
                description: 'नेपाल-तिब्बत सीमा पर स्थित, इसे नेपाल में सागरमाथा कहते हैं।',
                badge: '8,848.86m'
              },
              {
                id: 'kanchanjunga',
                label: 'कंचनजंगा',
                subtitle: 'भारत की सर्वोच्च श्रेणी (8,586m)',
                description: 'सिक्किम राज्य में स्थित, जैव विविधता का विशाल स्रोत।',
                badge: '8,586m'
              }
            ]
          },
          {
            id: 'himachal',
            label: 'मध्य हिमालय (हिमाचल)',
            subtitle: 'निम्न हिमालय श्रेणी',
            description: 'अत्यधिक संपीडित एवं परिवर्तित शैलों से बनी श्रेणी। औसत ऊँचाई 3,700 से 4,500 मीटर।',
            category: 'sub-mountain',
            badge: '3,700-4,500m',
            color: '#d97706',
            keyFacts: [
              'पीर पंजाल सबसे लंबी श्रेणी',
              'धौलाधर एवं महाभारत श्रेणियां प्रमुख',
              'प्रसिद्ध कश्मीर, कुल्लू एवं कांगड़ा घाटी स्थित'
            ],
            children: [
              {
                id: 'pir-panjal',
                label: 'पीर पंजाल श्रेणी',
                subtitle: 'सबसे लंबी श्रेणी',
                description: 'अटल टनल (Atal Tunnel) इसी श्रेणी में स्थित है।'
              },
              {
                id: 'hill-stations',
                label: 'प्रसिद्ध पर्वतीय नगर',
                subtitle: 'पर्यटन स्थल',
                description: 'शिमला, मसूरी, नैनीताल, दार्जिलिंग।'
              }
            ]
          },
          {
            id: 'shiwalik',
            label: 'शिवालिक श्रेणी',
            subtitle: 'बाह्य हिमालय (Outer Himalayas)',
            description: 'हिमालय की सबसे बाहरी श्रेणी। चौड़ाई 10-50 किमी, ऊँचाई 900 से 1100 मीटर।',
            category: 'sub-mountain',
            badge: '900-1,100m',
            color: '#f59e0b',
            keyFacts: [
              'नदियों द्वारा लाई गई बजरी एवं जलोढ़ से निर्मित',
              'हिमाचल और शिवालिक के बीच की घाटियों को दून (Doon) कहते हैं',
              'देहरादून, कोटली दून एवं पाटली दून प्रमुख'
            ],
            children: [
              {
                id: 'dehradun',
                label: 'देहरादून एवं दून घाटियाँ',
                subtitle: 'लंबवत घाटियाँ (Doon Valleys)',
                description: 'शिवालिक एवं निम्न हिमालय के मध्य स्थित प्रसिद्ध घाटियाँ।'
              }
            ]
          }
        ]
      },
      {
        id: 'plains',
        label: 'उत्तरी मैदान',
        subtitle: 'जलोढ़ मृदा निर्मित (Alluvial Plains)',
        description: 'तीन प्रमुख नदी प्रणालियों—सिंधु, गंगा एवं ब्रह्मपुत्र तथा उनकी सहायक नदियों द्वारा निर्मित अत्यंत उपजाऊ समतल मैदान।',
        category: 'plain',
        badge: '7 लाख वर्ग किमी',
        color: '#059669', // Emerald Green
        icon: 'Wheat',
        keyFacts: [
          'लम्बाई लगभग 2,400 किमी तथा चौड़ाई 240 से 320 किमी',
          'सघन जनसंख्या वाला कृषि प्रधान भौगोलिक भाग',
          'पर्याप्त जल आपूर्ति एवं अनुकूल जलवायु'
        ],
        children: [
          {
            id: 'bhabar',
            label: 'भाबर क्षेत्र (Bhabar)',
            subtitle: 'कंकड़-पत्थर युक्त पट्टी',
            description: 'शिवालिक की ढाल पर 8 से 16 किमी चौड़ी गुटिका (Pebbles) निक्षेपण पट्टी जहाँ नदियाँ विलुप्त हो जाती हैं।',
            category: 'sub-plain',
            badge: '8-16 किमी चौड़ा',
            color: '#047857',
            keyFacts: [
              'कृषि के लिए अनुपयुक्त संकीर्ण पट्टी',
              'नदियाँ भाबर पट्टी में धरातल के नीचे प्रवाहित होती हैं'
            ]
          },
          {
            id: 'tarai',
            label: 'तराई क्षेत्र (Terai)',
            subtitle: 'दलदली एवं नम क्षेत्र',
            description: 'भाबर के दक्षिण में नदियों का पुनः धरातल पर प्रकटीकरण। दलदली क्षेत्र जो घने जंगलों व वन्यजीवों से समृद्ध है।',
            category: 'sub-plain',
            badge: 'नम एवं दलदली',
            color: '#059669',
            keyFacts: [
              'दुधवा राष्ट्रीय उद्यान इसी क्षेत्र में स्थित है',
              'विस्थापित शरणार्थियों हेतु कृषि भूमि में बदला गया'
            ]
          },
          {
            id: 'bangar-khadar',
            label: 'बांगर एवं खादर मैदान',
            subtitle: 'जलोढ़ मिट्टी का वर्गीकरण',
            description: 'पुराना जलोढ़ (बांगर) तथा नवीन उपजाऊ जलोढ़ (खादर)।',
            category: 'sub-plain',
            badge: 'कृषि का केंद्र',
            color: '#10b981',
            children: [
              {
                id: 'bangar',
                label: 'बांगर (Bangar)',
                subtitle: 'पुराना जलोढ़ (Old Alluvium)',
                description: 'नदी के बाढ़ वाले मैदान के ऊपर स्थित वेदिका (Terrace) जैसी आकृति जिसमें "कंकर" पाए जाते हैं।'
              },
              {
                id: 'khadar',
                label: 'खादर (Khadar)',
                subtitle: 'नवीन उपजाऊ जलोढ़ (New Alluvium)',
                description: 'प्रतिवर्ष बाढ़ द्वारा नवीनीकृत उपजाऊ मिट्टी, गहन कृषि के लिए आदर्श।'
              }
            ]
          }
        ]
      },
      {
        id: 'plateau',
        label: 'प्रायद्वीपीय पठार',
        subtitle: 'प्राचीनतम भूखंड (Peninsular Plateau)',
        description: 'पुराने क्रिस्टलीय, आग्नेय तथा रूपांतरित शैलों से बना मेज की आकृति वाला स्थल। गोंडवाना लैंड के टूटने से निर्मित।',
        category: 'plateau',
        badge: 'प्राचीन गोंडवाना',
        color: '#4f46e5', // Indigo
        icon: 'Layers',
        keyFacts: [
          'त्रिभुजाकार भूभाग, उत्तर में चौड़ा दक्षिण में संकरा',
          'काली मृदा (दक्कन ट्रैप) का बाहुल्य, कपास हेतु उपयुक्त',
          'खनिज संसाधनों (कोयला, लोहा, अभ्रक) का विशाल भंडार'
        ],
        children: [
          {
            id: 'central-highland',
            label: 'मध्य उच्च भूमि',
            subtitle: 'नर्मदा नदी के उत्तर में',
            description: 'मालवा का पठार, बुंदेलखंड, बघेलखंड तथा छोटानागपुर पठार क्षेत्र। पूर्व की ओर नदियाँ (चंबल, बेतवा, केन) बहती हैं।',
            category: 'sub-plateau',
            color: '#4338ca',
            children: [
              {
                id: 'malwa',
                label: 'मालवा का पठार',
                subtitle: 'अरावली व विंध्य के मध्य',
                description: 'काली मिट्टी से समृद्ध लावा निर्मित पठार।'
              },
              {
                id: 'chhotanagpur',
                label: 'छोटानागपुर पठार',
                subtitle: 'भारत का रूर (Mineral Storehouse)',
                description: 'दामोदर नदी घाटी, कोयला एवं अभ्रक का विशाल भंडार।'
              }
            ]
          },
          {
            id: 'deccan-plateau',
            label: 'दक्कन का पठार',
            subtitle: 'त्रिभुजाकार दक्कन ट्रैप',
            description: 'नर्मदा के दक्षिण में स्थित। इसके पश्चिमी किनारे पर पश्चिमी घाट तथा पूर्वी किनारे पर पूर्वी घाट स्थित हैं।',
            category: 'sub-plateau',
            color: '#6366f1',
            children: [
              {
                id: 'western-ghats',
                label: 'पश्चिमी घाट (सह्याद्रि)',
                subtitle: 'सतत एवं ऊँची पर्वतमाला',
                description: 'औसत ऊँचाई 900-1600 मी। सर्वोच्च शिखर अनाईमुडी (2,695m)। जैव विविधता हॉटस्पॉट।',
                badge: 'अनाईमुडी 2,695m'
              },
              {
                id: 'eastern-ghats',
                label: 'पूर्वी घाट',
                subtitle: 'कटा-छँटा एवं असमान',
                description: 'नदियों द्वारा काटा गया। औसत ऊँचाई 600 मी। सर्वोच्च शिखर महेंद्रगिरि (1,501m)।'
              }
            ]
          }
        ]
      },
      {
        id: 'coastal',
        label: 'तटीय मैदान',
        subtitle: 'समुद्र तटीय संकीर्ण पट्टियाँ (Coastal Plains)',
        description: 'प्रायद्वीपीय पठार के दोनों ओर अरब सागर (पश्चिम) तथा बंगाल की खाड़ी (पूर्व) के साथ स्थित तटीय पट्टियाँ।',
        category: 'coastal',
        badge: '7,516 किमी तटरेखा',
        color: '#0284c7', // Sky Blue
        icon: 'Waves',
        keyFacts: [
          'पश्चिमी तट संकीर्ण तथा पूर्वी तट चौड़ा व समतल',
          'मत्स्य पालन एवं समुद्री व्यापार का प्रमुख केंद्र',
          'पूर्वी तट पर बड़ी नदियों के विशाल डेल्टा स्थित हैं'
        ],
        children: [
          {
            id: 'west-coast',
            label: 'पश्चिमी तटीय मैदान',
            subtitle: 'संकीर्ण पट्टी (अरब सागर)',
            description: 'पश्चिमी घाट एवं अरब सागर के बीच स्थित संकीर्ण मैदान। यहाँ नदियाँ ज्वारनदमुख (Estuary) बनाती हैं।',
            category: 'sub-coastal',
            color: '#0369a1',
            children: [
              {
                id: 'konkan',
                label: 'कोंकण तट (Konkan)',
                subtitle: 'मुंबई से गोवा',
                description: 'उत्तरी भाग, पथरीला व संकीर्ण।'
              },
              {
                id: 'malabar',
                label: 'मालाबार तट (Malabar)',
                subtitle: 'केरल तटीय भाग',
                description: 'दक्षिणी भाग, कयाल (Lagoon/Backwaters) हेतु प्रसिद्ध।'
              }
            ]
          },
          {
            id: 'east-coast',
            label: 'पूर्वी तटीय मैदान',
            subtitle: 'चौड़ा डेल्टाई मैदान (बंगाल की खाड़ी)',
            description: 'महानदी, गोदावरी, कृष्णा एवं कावेरी नदियों द्वारा निर्मित उपजाऊ डेल्टा मैदान।',
            category: 'sub-coastal',
            color: '#0284c7',
            children: [
              {
                id: 'coromandel',
                label: 'कोरोमंडल तट',
                subtitle: 'तमिलनाडु तट',
                description: 'शीतकालीन मानसून (लौटता मानसून) से वर्षा प्राप्त करता है।'
              },
              {
                id: 'chilika',
                label: 'चिल्का झील (Chilika)',
                subtitle: 'भारत की सबसे बड़ी खारे पानी की झील',
                description: 'ओडिशा तट पर स्थित प्रसिद्ध लैगून।'
              }
            ]
          }
        ]
      },
      {
        id: 'islands',
        label: 'द्वीप समूह',
        subtitle: 'समुद्री द्वीप समूह (Islands)',
        description: 'भारत के दो मुख्य द्वीप समूह—बंगाल की खाड़ी में अंडमान एवं निकोबार तथा अरब सागर में लक्षद्वीप।',
        category: 'island',
        badge: '2 प्रमुख द्वीप समूह',
        color: '#e11d48', // Rose Red
        icon: 'Compass',
        keyFacts: [
          'अंडमान-निकोबार जलमग्न पर्वतों के शिखर हैं',
          'लक्षद्वीप प्रवाल भित्तियों (Coral Reefs) द्वारा निर्मित है',
          'सामरिक एवं पर्यटन दृष्टि से अत्यंत महत्त्वपूर्ण'
        ],
        children: [
          {
            id: 'andaman-nicobar',
            label: 'अंडमान एवं निकोबार',
            subtitle: 'बंगाल की खाड़ी (572 द्वीप)',
            description: 'उत्तरी अंडमान व दक्षिणी निकोबार 10 डिग्री चैनल द्वारा अलग होते हैं। यहाँ बैरन द्वीप पर एकमात्र सक्रिय ज्वालामुखी है।',
            category: 'sub-island',
            color: '#be123c',
            badge: '10° Channel',
            children: [
              {
                id: 'barren-island',
                label: 'बैरन द्वीप (Barren Island)',
                subtitle: 'सक्रिय ज्वालामुखी',
                description: 'भारत का एकमात्र जीवित ज्वालामुखी द्वीप।'
              },
              {
                id: 'indira-point',
                label: 'इंदिरा पॉइंट (Indira Point)',
                subtitle: 'भारत का सबसे दक्षिणी बिंदु',
                description: 'ग्रेट निकोबार में स्थित (2004 सुनामी में आंशिक जलमग्न)।'
              }
            ]
          },
          {
            id: 'lakshadweep',
            label: 'लक्षद्वीप समूह',
            subtitle: 'अरब सागर (36 द्वीप)',
            description: 'प्रवाल जनित द्वीप (Atolls)। राजधानी कवारत्ती। पिटली द्वीप पक्षी अभयारण्य हेतु प्रसिद्ध।',
            category: 'sub-island',
            color: '#e11d48',
            badge: 'Coral Origin',
            children: [
              {
                id: 'kavaratti',
                label: 'कवारत्ती (Kavaratti)',
                subtitle: 'प्रशासनिक राजधानी',
                description: 'लक्षद्वीप का मुख्य केंद्र व सुंदर प्रवाल रोधिका।'
              }
            ]
          }
        ]
      }
    ]
  },
  crossLinks: [
    {
      sourceId: 'himadri',
      targetId: 'plains',
      label: 'नदी उद्गम एवं जलोढ़ निक्षेपण (Gangotri/Yamunotri → Northern Plains)',
      type: 'causality'
    },
    {
      sourceId: 'western-ghats',
      targetId: 'malabar',
      label: 'मानसून वृष्टि छाया एवं तटीय वर्षा',
      type: 'relationship'
    },
    {
      sourceId: 'bhabar',
      targetId: 'shiwalik',
      label: 'शिवालिक ढाल पर गुटिका निक्षेप',
      type: 'relationship'
    }
  ],
  quizQuestions: [
    {
      id: 'q1',
      nodeId: 'himadri',
      nodeLabel: 'महान हिमालय (हिमाद्रि)',
      question: 'महान हिमालय (हिमाद्रि) की औसत ऊँचाई कितनी है?',
      options: ['3,700 मीटर', '6,000 मीटर', '1,100 मीटर', '2,400 मीटर'],
      correctAnswerIndex: 1,
      explanation: 'महान हिमालय या हिमाद्रि की औसत ऊँचाई लगभग 6,000 मीटर है और इसमें विश्व की सबसे ऊँची चोटियाँ स्थित हैं।'
    },
    {
      id: 'q2',
      nodeId: 'bhabar',
      nodeLabel: 'भाबर क्षेत्र',
      question: 'शिवालिक की ढाल पर कंकड़-पत्थरों से निर्मित पट्टी को किस नाम से जाना जाता है?',
      options: ['तराई', 'खादर', 'भाबर', 'बांगर'],
      correctAnswerIndex: 2,
      explanation: 'शिवालिक की ढाल पर 8 से 16 किमी चौड़ी गुटिका/कंकड़ पट्टी को भाबर कहते हैं जहाँ नदियाँ विलुप्त हो जाती हैं।'
    },
    {
      id: 'q3',
      nodeId: 'barren-island',
      nodeLabel: 'बैरन द्वीप',
      question: 'भारत का एकमात्र सक्रिय ज्वालामुखी कहाँ स्थित है?',
      options: ['लक्षद्वीप में', 'बैरन द्वीप (अंडमान एवं निकोबार)', 'मालाबार तट पर', 'कवारत्ती में'],
      correctAnswerIndex: 1,
      explanation: 'अंडमान एवं निकोबार द्वीप समूह का बैरन द्वीप भारत का एकमात्र सक्रिय (जीवित) ज्वालामुखी है।'
    },
    {
      id: 'q4',
      nodeId: 'western-ghats',
      nodeLabel: 'पश्चिमी घाट',
      question: 'प्रायद्वीपीय भारत या पश्चिमी घाट की सबसे ऊँची चोटी कौन सी है?',
      options: ['महेंद्रगिरि', 'कंचनजंगा', 'अनाईमुडी (2,695m)', 'धौलागिरि'],
      correctAnswerIndex: 2,
      explanation: 'अनाईमुडी (2,695 मीटर) पश्चिमी घाट तथा पूरे प्रायद्वीपीय भारत का सर्वोच्च शिखर है।'
    }
  ]
};
