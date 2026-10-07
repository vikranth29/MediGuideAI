import { EmergencyCheckResult, RiskLevel } from '../../types';

interface EmergencyPattern {
  condition: string;
  keywords: RegExp[];
  action: string;
  riskLevel: RiskLevel;
}

export class EmergencyDetector {
  private static patterns: EmergencyPattern[] = [
    {
      condition: 'Acute Coronary Syndrome / Heart Attack Red Flag',
      keywords: [
        /\b(chest\s*pain|crushing\s*chest|chest\s*pressure|pain\s*radiating\s*to\s*(arm|jaw|neck|back)|heart\s*attack|tightness\s*in\s*chest)\b/i,
        /\b(squeezing\s*chest|heavy\s*weight\s*on\s*chest)\b/i,
      ],
      action: 'Call emergency services (911 / 112 / 108) immediately. Sit down, try to stay calm, and do not attempt to drive yourself to the hospital.',
      riskLevel: 'EMERGENCY',
    },
    {
      condition: 'Acute Stroke Symptoms (FAST Protocol)',
      keywords: [
        /\b(face\s*droop|slurred\s*speech|can'?t\s*speak|arm\s*weakness|sudden\s*numbness\s*on\s*one\s*side|stroke|loss\s*of\s*vision\s*in\s*one\s*eye|facial\s*asymmetry)\b/i,
        /\b(sudden\s*paralysis|difficulty\s*swallowing\s*suddenly|sudden\s*confusion)\b/i,
      ],
      action: 'Stroke is a medical emergency where every second counts. Call emergency services immediately and note the exact time symptoms started.',
      riskLevel: 'EMERGENCY',
    },
    {
      condition: 'Severe Respiratory Distress / Airway Compromise',
      keywords: [
        /\b(cannot\s*breathe|can'?t\s*breathe|choking|gasping\s*for\s*air|severe\s*shortness\s*of\s*breath|blue\s*lips|stridor|throat\s*closing|asphyxiation)\b/i,
        /\b(struggling\s*to\s*breathe|airway\s*blocked)\b/i,
      ],
      action: 'Call emergency services right away. Keep airway open, sit upright, and use prescribed emergency rescue inhaler or EpiPen if applicable.',
      riskLevel: 'EMERGENCY',
    },
    {
      condition: 'Severe Allergic Reaction / Anaphylaxis',
      keywords: [
        /\b(anaphylaxis|epipen|throat\s*swelling|tongue\s*swelling|allergic\s*reaction\s*and\s*cannot\s*breathe|swollen\s*lips\s*and\s*wheezing)\b/i,
      ],
      action: 'Administer intramuscular Epinephrine (EpiPen) immediately into the outer thigh if available, and call emergency services without delay.',
      riskLevel: 'EMERGENCY',
    },
    {
      condition: 'Severe Hemorrhage / Active Uncontrolled Bleeding',
      keywords: [
        /\b(bleeding\s*heavily|spurting\s*blood|vomiting\s*blood|coughing\s*up\s*large\s*blood|uncontrolled\s*bleeding|arterial\s*bleed|stab\s*wound|gunshot)\b/i,
      ],
      action: 'Apply firm, continuous direct pressure with a clean cloth or sterile bandage. Do not remove the cloth if soaked; add more on top and call emergency services.',
      riskLevel: 'EMERGENCY',
    },
    {
      condition: 'Mental Health Crisis / Self-Harm or Suicide Risk',
      keywords: [
        /\b(want\s*to\s*die|kill\s*myself|suicide|suicidal|end\s*my\s*life|take\s*all\s*my\s*pills|hanging\s*myself|slit\s*wrists|harming\s*myself)\b/i,
      ],
      action: 'You are not alone. Please reach out to emergency professionals right now: Call or text 988 (US Suicide & Crisis Lifeline), call 14416 (Tele-MANAS India), call 111 (UK NHS Mental Health), or contact 911 / 112 immediately.',
      riskLevel: 'EMERGENCY',
    },
    {
      condition: 'Loss of Consciousness / Syncope / Seizure',
      keywords: [
        /\b(unconscious|passed\s*out|fainted\s*and\s*not\s*waking|active\s*seizure|grand\s*mal|convulsing|unresponsive)\b/i,
      ],
      action: 'Place the person in recovery position on their side to prevent choking if breathing. Never put objects in mouth during a seizure. Call emergency services immediately.',
      riskLevel: 'EMERGENCY',
    },
    {
      condition: 'Severe Neurological Warning (Thunderclap Headache / Meningitis)',
      keywords: [
        /\b(worst\s*headache\s*of\s*my\s*life|thunderclap\s*headache|sudden\s*explosive\s*headache|stiff\s*neck\s*with\s*(high\s*fever|confusion|rash))\b/i,
      ],
      action: 'Sudden explosive headaches or high fever with stiff neck require urgent neurological evaluation in an emergency department.',
      riskLevel: 'HIGH',
    },
    {
      condition: 'Suspected Poisoning / Acute Toxicity',
      keywords: [
        /\b(swallowed\s*bleach|drank\s*poison|overdosed\s*on|swallowed\s*battery|chemical\s*ingestion|carbon\s*monoxide\s*poisoning)\b/i,
      ],
      action: 'Contact Poison Control Center immediately (US: 1-800-222-1222, India: 1800-116-117) or call 911/112. Do not induce vomiting unless advised by medical poison experts.',
      riskLevel: 'EMERGENCY',
    }
  ];

  public static check(text: string): EmergencyCheckResult {
    if (!text || typeof text !== 'string') {
      return {
        isEmergency: false,
        riskLevel: 'LOW',
        triggerKeywords: [],
      };
    }

    const lower = text.toLowerCase();
    const matchedKeywords: string[] = [];

    for (const pattern of this.patterns) {
      for (const rx of pattern.keywords) {
        const match = lower.match(rx);
        if (match) {
          matchedKeywords.push(match[0]);
          return {
            isEmergency: pattern.riskLevel === 'EMERGENCY',
            riskLevel: pattern.riskLevel,
            triggerKeywords: matchedKeywords,
            matchedCondition: pattern.condition,
            emergencyAction: pattern.action,
            emergencyHelplines: [
              'US Emergency: 911',
              'India Emergency: 112 / 108',
              'UK Emergency: 999',
              'Europe Emergency: 112',
              'Crisis / Suicide Lifeline: 988 (US) | 14416 (India)',
            ],
          };
        }
      }
    }

    // Secondary moderate risk checks
    const moderateKeywords = [
      /\b(high\s*fever|fever\s*above\s*103|severe\s*abdominal\s*pain|vomiting\s*for\s*days|cannot\s*keep\s*fluids\s*down|deep\s*wound|broken\s*bone|fracture)\b/i,
      /\b(blood\s*in\s*urine|blood\s*in\s*stool|black\s*tarry\s*stool|acute\s*eye\s*pain|vision\s*blur\s*sudden)\b/i,
    ];

    for (const rx of moderateKeywords) {
      const match = lower.match(rx);
      if (match) {
        return {
          isEmergency: false,
          riskLevel: 'MODERATE',
          triggerKeywords: [match[0]],
          matchedCondition: 'Potential Serious Symptom Requiring Clinical Assessment',
          emergencyAction: 'Please schedule an in-person or urgent care consultation promptly to evaluate these symptoms.',
        };
      }
    }

    return {
      isEmergency: false,
      riskLevel: 'LOW',
      triggerKeywords: [],
    };
  }
}
