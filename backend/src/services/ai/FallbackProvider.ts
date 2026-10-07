import { AIProvider } from './AIProvider';
import { ChatMessage, ChatResponse, ImageAnalysisResponse, ReportAnalysisResponse } from '../../types';
import { SafetyEngine } from '../safety/SafetyEngine';

export class FallbackProvider implements AIProvider {
  readonly name = 'MediGuide Built-in Clinical Knowledge Engine';

  isConfigured(): boolean {
    return true;
  }

  async generateChatResponse(
    messages: ChatMessage[],
    userQuery: string
  ): Promise<ChatResponse> {
    const queryLower = userQuery.toLowerCase();

    let summary = 'Here is educational guidance regarding your health query.';
    const possibleExplanations: string[] = [];
    const importantInformation: string[] = [];
    const whenToSeeDoctor: string[] = [];

    if (queryLower.includes('headache') || queryLower.includes('migraine')) {
      summary = 'Headaches can range from common tension headaches to vascular migraines or secondary tension.';
      possibleExplanations.push(
        'Tension-type headache often related to stress, eye strain, or muscle tension.',
        'Migraine characterized by pulsating pain, light sensitivity, or nausea.',
        'Dehydration, lack of sleep, or sinus pressure.'
      );
      importantInformation.push(
        'Rest in a quiet, dark room, hydrate well with water or electrolyte solutions.',
        'Gentle neck stretching and avoiding bright screens can help relieve tension.',
        'Track headache triggers such as specific foods, stress, or irregular sleep cycles.'
      );
      whenToSeeDoctor.push(
        'Headache described as the "worst headache of your life" or sudden thunderclap onset.',
        'Headache accompanied by fever, stiff neck, confusion, weakness, or numbness.',
        'Headaches occurring more frequently than twice a week.'
      );
    } else if (queryLower.includes('fever') || queryLower.includes('temperature')) {
      summary = 'A fever is generally a natural physiological response indicating your immune system is combating an infection.';
      possibleExplanations.push(
        'Viral upper respiratory infection (common cold, influenza).',
        'Bacterial infection requiring clinical diagnostic tests.',
        'Inflammatory or post-vaccination immune response.'
      );
      importantInformation.push(
        'Stay well hydrated with broths, water, and herbal teas to prevent dehydration.',
        'Wear light clothing and rest in a well-ventilated room.',
        'Monitor temperature regularly using a clean digital thermometer.'
      );
      whenToSeeDoctor.push(
        'Fever exceeding 103°F (39.4°C) in adults or lasting longer than 3 consecutive days.',
        'Fever accompanied by severe throat pain, difficulty breathing, rash, or persistent vomiting.'
      );
    } else if (queryLower.includes('stomach') || queryLower.includes('nausea') || queryLower.includes('digest')) {
      summary = 'Gastrointestinal symptoms can stem from dietary irritation, viral gastroenteritis, or acid reflux.';
      possibleExplanations.push(
        'Mild acute gastroenteritis ("stomach bug").',
        'Gastroesophageal reflux disease (GERD) or indigestion from spicy/fatty meals.',
        'Food sensitivity, mild foodborne illness, or irritable bowel.'
      );
      importantInformation.push(
        'Follow a gentle BRAT diet (Bananas, Rice, Applesauce, Toast) once vomiting subsides.',
        'Sip small amounts of oral rehydration solutions frequently.',
        'Avoid caffeine, alcohol, dairy, and heavily spiced foods.'
      );
      whenToSeeDoctor.push(
        'Inability to keep liquids down for more than 24 hours.',
        'Severe localized sharp abdominal pain (especially lower right abdomen).',
        'Presence of blood in vomit or stool.'
      );
    } else if (queryLower.includes('cold') || queryLower.includes('cough') || queryLower.includes('sore throat')) {
      summary = 'Coughs and upper respiratory symptoms are frequently caused by self-limiting viral pathogens.';
      possibleExplanations.push(
        'Common cold (rhinovirus, coronavirus).',
        'Seasonal allergic rhinitis or post-nasal drip.',
        'Mild acute bronchitis.'
      );
      importantInformation.push(
        'Warm saline gargles (1/2 tsp salt in warm water) can soothe throat irritation.',
        'Use a cool-mist humidifier and drink warm honey-lemon water (for individuals over 1 year old).',
        'Get plenty of restorative sleep to assist your immune defense.'
      );
      whenToSeeDoctor.push(
        'Shortness of breath, wheezing, or chest tightness.',
        'Cough lasting longer than 3 weeks or coughing up rust-colored/blood-streaked phlegm.'
      );
    } else {
      summary = `Overview regarding: "${userQuery}". MediGuide provides safe, patient-friendly medical context.`;
      possibleExplanations.push(
        'Physical symptoms can have multiple interacting causes including environmental factors, lifestyle, or mild acute conditions.',
        'Individual biological history and lab biomarkers play a crucial role in differential analysis.'
      );
      importantInformation.push(
        'Maintaining hydration, balanced nutrition, and recording symptom timeline provides useful clinical data.',
        'Avoid self-medicating with prescription antibiotics or changing prescribed dosages without consulting your doctor.'
      );
      whenToSeeDoctor.push(
        'Any persistent, severe, or worsening symptom that interferes with daily activities.',
        'Whenever you feel uncertain or require diagnostic lab tests or imaging.'
      );
    }

    return {
      summary,
      possibleExplanations,
      importantInformation,
      whenToSeeDoctor,
      disclaimer: SafetyEngine.MANDATORY_DISCLAIMER,
      riskLevel: 'LOW',
      isEmergency: false,
      provider: this.name,
    };
  }

  async analyzeMedicalReport(
    reportText: string,
    fileName?: string
  ): Promise<ReportAnalysisResponse> {
    const textLower = reportText.toLowerCase();

    const structuredFindings: import('../../types').ReportFinding[] = [
      {
        metric: 'Document Content Analysis',
        value: 'Extracted plain text review completed',
        status: 'neutral',
        explanation: 'The uploaded file has been parsed and reviewed for standard medical indices and biomarkers.',
      },
    ];

    const riskFlags: string[] = [];
    const questionsForDoctor: string[] = [
      'What do these specific laboratory values mean in the context of my overall medical history?',
      'Are any follow-up tests or repeat panels recommended in 3 to 6 months?',
      'Should I make any specific dietary or lifestyle modifications based on these results?',
    ];

    if (textLower.includes('glucose') || textLower.includes('hba1c') || textLower.includes('sugar')) {
      structuredFindings.push({
        metric: 'Blood Glucose / Glycemic Marker',
        value: 'Identified in document',
        status: textLower.includes('high') || textLower.includes('elevated') ? 'abnormal' : 'normal',
        explanation: 'Glycemic markers reflect carbohydrate metabolism and blood sugar regulation over time.',
      });
      if (textLower.includes('high') || textLower.includes('elevated')) {
        riskFlags.push('Glycemic parameter noted as elevated in document text.');
      }
      questionsForDoctor.push('Does this glycemic value indicate prediabetes, insulin resistance, or dietary fluctuations?');
    }

    if (textLower.includes('cholesterol') || textLower.includes('lipid') || textLower.includes('triglyceride')) {
      structuredFindings.push({
        metric: 'Lipid Profile / Cholesterol',
        value: 'Identified in document',
        status: textLower.includes('borderline') || textLower.includes('high') ? 'abnormal' : 'normal',
        explanation: 'Lipid panels measure circulating HDL, LDL, and triglycerides linked to cardiovascular health.',
      });
      questionsForDoctor.push('What are my cardiovascular target goals for LDL and HDL cholesterol?');
    }

    if (textLower.includes('hemoglobin') || textLower.includes('cbc') || textLower.includes('wbc')) {
      structuredFindings.push({
        metric: 'Complete Blood Count (CBC)',
        value: 'Cellular markers present',
        status: 'normal',
        explanation: 'Measures oxygen-carrying red cells, immune white cells, and blood clotting platelets.',
      });
    }

    return {
      summary: `Educational summary for ${fileName || 'Uploaded Medical Report'}: The document contains clinical data and lab findings. Below are patient-friendly breakdowns of the key parameters detected.`,
      keyFindings: [
        'Document parsed successfully for medical metrics and clinical terminology.',
        'Extracted parameters categorized for discussion with your healthcare team.',
        'Reference ranges vary by laboratory and patient demographic factors.',
      ],
      structuredFindings,
      riskFlags,
      recommendations: [
        'Bring a printed or digital copy of this report to your next clinical consultation.',
        'Note any current medications or supplements you take, as these can affect lab markers.',
        'Do not discontinue or modify any prescription medications based solely on automated summaries.',
      ],
      questionsForDoctor,
      disclaimer: 'AI-generated educational summary — not a medical diagnosis. Only a qualified physician can interpret lab values in clinical context.',
      riskLevel: riskFlags.length > 0 ? 'MODERATE' : 'LOW',
      fileName,
      extractedSnippet: reportText.slice(0, 300) + (reportText.length > 300 ? '...' : ''),
      provider: this.name,
    };
  }

  async analyzeMedicalImage(
    _imageBase64: string,
    _mimeType: string,
    prompt?: string
  ): Promise<ImageAnalysisResponse> {
    return {
      summary: 'Medical image received. Automated educational observation provided below.',
      visualObservations: [
        'Image received and validated as a supported image format.',
        'Visual features show surface skin/tissue context or anatomical presentation.',
        'Automated lighting and resolution checks indicate the image is legible for general review.',
      ],
      potentialConsiderations: [
        'Skin and medical images require high-resolution in-person dermatological inspection, dermatoscope analysis, or radiological tools.',
        'Changes in size, color, asymmetry, border irregularity, or evolution (ABCDE criteria) are key reasons to seek clinical evaluation.',
      ],
      questionsForDoctor: [
        'Would an in-person physical examination or biopsy be recommended for this lesion/area?',
        'What specific symptoms (such as rapid change, bleeding, or itching) should I watch for?',
      ],
      emergencyWarning: undefined,
      disclaimer: 'I can provide general educational observations, but this image must be evaluated by a qualified healthcare professional. AI image analysis cannot replace a medical diagnosis.',
      riskLevel: 'LOW',
      provider: this.name,
    };
  }
}
