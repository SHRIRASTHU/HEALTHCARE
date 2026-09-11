const config = require('../config/config');
const OpenAI = require('openai');

let openaiClient = null;
if (config.openaiApiKey && config.openaiApiKey !== 'your_openai_api_key_here') {
  try {
    openaiClient = new OpenAI({ apiKey: config.openaiApiKey });
  } catch (e) {
    console.warn('OpenAI Client initialization error:', e.message);
  }
}

// Emergency keywords check
const EMERGENCY_KEYWORDS = [
  'chest pain', 'shortness of breath', 'can\'t breathe', 'cannot breathe',
  'unconscious', 'passed out', 'fainted', 'severe bleeding', 'heavy bleeding',
  'stroke', 'numbness on one side', 'slurred speech', 'anaphylaxis', 'severe allergic',
  'heart attack', 'choking', 'head trauma', 'head injury'
];

const checkEmergency = (query) => {
  const q = query.toLowerCase();
  return EMERGENCY_KEYWORDS.some(kw => q.includes(kw));
};

// Fallback Medical Rules Engine for offline / key-less mode
const generateMedicalFallbackResponse = (query) => {
  const isEmergency = checkEmergency(query);
  const lower = query.toLowerCase();

  if (isEmergency) {
    return {
      isEmergency: true,
      response: `🚨 **EMERGENCY WARNING**: Your symptoms (or inquiry) sound like they could indicate a serious or life-threatening medical emergency.

**IMMEDIATE ACTION REQUIRED:**
1. Please call your local emergency service (**108** or **911**) or proceed to the nearest Emergency Room immediately.
2. Do not attempt to self-treat or wait for an online consultation.
3. If possible, inform someone nearby of your condition.

*Disclaimer: HEALTHCARE AI is an informational assistant, not a human physician or emergency service.*`
    };
  }

  let text = '';
  let sources = ['WHO Guidelines', 'Mayo Clinic Patient Guidance', 'NHS Health Advice'];

  if (lower.includes('headache') || lower.includes('head pain')) {
    text = `### Guidance for Mild to Moderate Headaches

**Common Causes:**
* Tension or stress
* Dehydration or skipped meals
* Lack of sleep or eye strain

**Recommended Self-Care Steps:**
1. Drink 1-2 glasses of water immediately to stay hydrated.
2. Rest in a quiet, dark room for 20-30 minutes.
3. Apply a warm or cool compress to your forehead or neck.

**When to Consult a Doctor:**
* If the headache is sudden and severe (thunderclap headache).
* Accompanied by fever, stiff neck, confusion, or vision changes.`;
  } else if (lower.includes('ankle') || lower.includes('sprain') || lower.includes('twisted')) {
    text = `### First-Aid for Minor Ankle Sprains (R.I.C.E. Protocol)

**Immediate Steps:**
1. **Rest**: Avoid putting weight on the injured leg.
2. **Ice**: Apply an ice pack wrapped in a cloth for 15-20 minutes every 2-3 hours.
3. **Compress**: Wrap gently with an elastic bandage to reduce swelling.
4. **Elevate**: Prop your ankle up above heart level when sitting or lying down.

**When to Seek Professional Evaluation:**
* Inability to bear weight for more than 4 steps.
* Severe swelling, visible deformity, or extreme pain.`;
  } else if (lower.includes('cut') || lower.includes('wound') || lower.includes('bleed')) {
    text = `### First-Aid for Minor Cuts and Scrapes

**Step-by-Step Care:**
1. **Clean Hands**: Wash your hands thoroughly before touching the wound.
2. **Stop Bleeding**: Apply gentle pressure with a clean cloth or bandage.
3. **Rinse**: Clean the wound under gentle running tap water.
4. **Disinfect & Cover**: Apply an antiseptic cream and cover with a sterile bandage.

**When to See a Doctor:**
* If the cut is deep, gaping, or exposes fat/muscle.
* If you haven't had a Tetanus shot in the last 5-10 years.
* Signs of infection (redness, heat, pus, worsening pain).`;
  } else if (lower.includes('fever') || lower.includes('temperature') || lower.includes('cold')) {
    text = `### Guidance for Mild Fever & Common Cold Symptoms

**Care Tips:**
1. Stay well hydrated with water, herbal teas, or warm broths.
2. Get plenty of restful sleep to allow your immune system to recover.
3. Keep room temperatures comfortable and dress in light clothing.

**When to See a Doctor:**
* Fever higher than 102°F (38.9°C) lasting more than 3 days.
* Difficulty breathing or severe sore throat.`;
  } else {
    text = `### General Health & Wellness Information

Thank you for reaching out to HEALTHCARE AI.

**General Guidance:**
* Ensure you remain hydrated and maintain balanced nutrition.
* Monitor your symptoms and keep a log of when they began.
* Rest and avoid strenuous activity if you are feeling unwell.

**Next Steps:**
If your symptoms persist, worsen, or cause discomfort, we strongly recommend booking a consultation with one of our verified medical specialists on the platform.`;
  }

  return {
    isEmergency: false,
    response: `${text}

---
*Notice: I am an AI Assistant providing general health guidance. This information is for educational purposes only and is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical concerns.*

**Sources:** ${sources.join(' • ')}`
  };
};

const processAIChat = async (userQuestion, userHistory = []) => {
  const isEmergency = checkEmergency(userQuestion);
  if (isEmergency) {
    return generateMedicalFallbackResponse(userQuestion);
  }

  if (openaiClient) {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are HEALTHCARE AI, an intelligent, empathetic medical guidance assistant for the HEALTHCARE telemedicine platform.
CRITICAL SAFETY DIRECTIVES:
1. NEVER claim to be a licensed doctor or render formal medical diagnoses.
2. ALWAYS include a clear disclaimer that your response is general information and not a replacement for professional diagnosis.
3. If the user presents emergency symptoms (severe chest pain, difficulty breathing, severe bleeding, stroke symptoms), immediately instruct them to seek emergency services (108/911).
4. Provide structured, practical first-aid, self-care, and wellness steps based on trusted medical guidelines (WHO/CDC/NHS).
5. Suggest relevant medical specializations (e.g. Cardiologist, Dermatologist) when applicable so they can book on HEALTHCARE.`
        },
        ...userHistory.map(h => ({ role: h.role || 'user', content: h.content || '' })),
        { role: 'user', content: userQuestion }
      ];

      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 500,
        temperature: 0.7
      });

      const responseText = completion.choices[0].message.content;
      return {
        isEmergency: false,
        response: responseText
      };
    } catch (err) {
      console.warn('OpenAI API call error, falling back to intelligent response engine:', err.message);
      return generateMedicalFallbackResponse(userQuestion);
    }
  }

  return generateMedicalFallbackResponse(userQuestion);
};

module.exports = {
  processAIChat,
  checkEmergency
};
