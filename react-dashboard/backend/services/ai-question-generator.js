// Safe OpenAI import with fallback
let OpenAI, openai;
try {
  OpenAI = require('openai');
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  console.log('✅ OpenAI client initialized successfully');
} catch (error) {
  console.warn('⚠️ OpenAI package not available:', error.message);
  console.warn('⚠️ AI Test Generator will use fallback mode');
}

// Question types
const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  FREE_TEXT: 'free_text', 
  FILL_IN_BLANK: 'fill_in_blank',
  MATCHING: 'matching'
};

class AIQuestionGenerator {
  
  /**
   * Generate various types of questions based on a main topic/question
   * @param {string} mainQuestion - The main question/topic to generate from
   * @param {string} context - Additional context (lesson content, etc.)
   * @param {string[]} requestedTypes - Array of question types to generate
   * @param {string} language - Language code (cs, en, de, sk)
   * @returns {Promise<Object[]>} Array of generated questions
   */
  static async generateQuestions(mainQuestion, context = '', requestedTypes = [], language = 'cs') {
    try {
      console.log('🤖 AI Question Generator: Generating questions for:', mainQuestion);
      console.log('📝 Requested types:', requestedTypes);
      
      // Check if OpenAI is available
      if (!openai) {
        console.warn('⚠️ OpenAI not available, using fallback questions');
        return this.getFallbackQuestions(language);
      }
      
      const prompt = this.buildPrompt(mainQuestion, context, requestedTypes, language);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt(language)
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const generatedContent = response.choices[0].message.content;
      console.log('🤖 AI Generated content:', generatedContent);
      
      // Parse the AI response into structured questions
      const questions = this.parseAIResponse(generatedContent, language);
      
      console.log('✅ Generated', questions.length, 'questions');
      return questions;
      
    } catch (error) {
      console.error('❌ AI Question Generator error:', error.message);
      throw new Error(`Failed to generate questions: ${error.message}`);
    }
  }

  /**
   * Build the prompt for AI question generation
   */
  static buildPrompt(mainQuestion, context, requestedTypes, language) {
    console.log('🔧 BuildPrompt DEBUG:', {
      requestedTypes,
      requestedTypesLength: requestedTypes.length,
      allTypes: Object.values(QUESTION_TYPES)
    });
    
    const typeDescriptions = this.getTypeDescriptions(language);
    const selectedTypes = requestedTypes.length > 0 ? requestedTypes : Object.values(QUESTION_TYPES);
    
    console.log('✅ Final selectedTypes for AI prompt:', selectedTypes);
    
    return `
Hlavní otázka/téma: "${mainQuestion}"

${context ? `Kontext: ${context}` : ''}

Vygeneruj testové otázky v následujících typech:
${selectedTypes.map(type => `- ${typeDescriptions[type]}`).join('\n')}

Pro každý typ otázky vygeneruj 1-2 kvalitní varianty.

Požadavky:
- Otázky musí být relevantní k hlavnímu tématu
- Multiple choice odpovědi musí být věrohodné a náročné
- Fill-in-blank musí testovat klíčové pojmy
- Free text otázky musí mít jasná hodnotící kritéria
- Matching otázky musí mít logické páry

Vrať odpověď ve formátu JSON podle následující struktury pro každý typ otázky.
    `.trim();
  }

  /**
   * Get system prompt based on language
   */
  static getSystemPrompt(language) {
    const prompts = {
      cs: `Jsi expert na tvorbu vzdělávacích testů. Tvým úkolem je vytvářet kvalitní, relevantní a pedagogicky správné testové otázky v češtině. 

Vrať odpověď POUZE jako validní JSON array s touto strukturou:
[
  {
    "type": "multiple_choice",
    "question": "Otázka zde",
    "options": ["Možnost A", "Možnost B", "Možnost C", "Možnost D"],
    "correctAnswer": "Možnost A",
    "explanation": "Vysvětlení správné odpovědi",
    "difficulty": "easy|medium|hard",
    "keyWords": ["klíčové", "slovo"]
  },
  {
    "type": "free_text",
    "question": "Otázka zde",
    "correctAnswer": "Vzorová správná odpověď",
    "keyWords": ["důležité", "pojmy", "pro", "hodnocení"],
    "explanation": "Co by měla odpověď obsahovat",
    "difficulty": "easy|medium|hard"
  },
  {
    "type": "fill_in_blank",
    "question": "Věta s _____ mezerou pro doplnění",
    "correctAnswer": "správné slovo",
    "alternatives": ["alternativní", "odpovědi"],
    "explanation": "Vysvětlení",
    "difficulty": "easy|medium|hard",
    "keyWords": ["kontext", "slova"]
  },
  {
    "type": "matching",
    "question": "Přiřaďte pojmy k definicím",
    "pairs": [
      {"term": "Pojem 1", "definition": "Definice 1"},
      {"term": "Pojem 2", "definition": "Definice 2"}
    ],
    "explanation": "Vysvětlení párování",
    "difficulty": "easy|medium|hard",
    "keyWords": ["související", "pojmy"]
  }
]

Nepiš žádný další text, pouze validní JSON.`,
      
      en: `You are an expert in creating educational tests. Your task is to create high-quality, relevant and pedagogically correct test questions in English.

Return response ONLY as valid JSON array with this structure: [...]

Do not write any additional text, only valid JSON.`
    };
    
    return prompts[language] || prompts.cs;
  }

  /**
   * Get type descriptions for prompt
   */
  static getTypeDescriptions(language) {
    const descriptions = {
      cs: {
        [QUESTION_TYPES.MULTIPLE_CHOICE]: 'Multiple Choice - otázka s jednou správnou a několika špatnými odpověďmi',
        [QUESTION_TYPES.FREE_TEXT]: 'Volná odpověď - otázka na vlastními slovy s klíčovými pojmy pro hodnocení',
        [QUESTION_TYPES.FILL_IN_BLANK]: 'Doplňovačka - věta s chybějícími slovy',
        [QUESTION_TYPES.MATCHING]: 'Přiřazování - pojmy k definicím'
      },
      en: {
        [QUESTION_TYPES.MULTIPLE_CHOICE]: 'Multiple Choice - question with one correct and several wrong answers',
        [QUESTION_TYPES.FREE_TEXT]: 'Free Text - question answered in own words with key terms for evaluation',
        [QUESTION_TYPES.FILL_IN_BLANK]: 'Fill in the Blank - sentence with missing words',
        [QUESTION_TYPES.MATCHING]: 'Matching - terms to definitions'
      }
    };
    
    return descriptions[language] || descriptions.cs;
  }

  /**
   * Parse AI response into structured questions
   */
  static parseAIResponse(content, language) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in AI response');
      }
      
      const questions = JSON.parse(jsonMatch[0]);
      
      // Validate and enhance each question
      return questions.map(q => this.validateAndEnhanceQuestion(q, language));
      
    } catch (error) {
      console.error('❌ Failed to parse AI response:', error.message);
      console.error('Raw content:', content);
      
      // Return fallback questions if parsing fails
      return this.getFallbackQuestions(language);
    }
  }

  /**
   * Validate and enhance a single question
   */
  static validateAndEnhanceQuestion(question, language) {
    // Ensure required fields
    const enhanced = {
      ...question,
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      generated: true,
      generatedAt: new Date().toISOString(),
      language: language,
      difficulty: question.difficulty || 'medium'
    };

    // Type-specific validation
    switch (question.type) {
      case QUESTION_TYPES.MULTIPLE_CHOICE:
        if (!enhanced.options || enhanced.options.length < 2) {
          enhanced.options = ['Možnost A', 'Možnost B', 'Možnost C', 'Možnost D'];
        }
        if (!enhanced.correctAnswer) {
          enhanced.correctAnswer = enhanced.options[0];
        }
        break;
        
      case QUESTION_TYPES.FREE_TEXT:
        if (!enhanced.keyWords) {
          enhanced.keyWords = [];
        }
        break;
        
      case QUESTION_TYPES.FILL_IN_BLANK:
        if (!enhanced.alternatives) {
          enhanced.alternatives = [];
        }
        break;
        
      case QUESTION_TYPES.MATCHING:
        if (!enhanced.pairs || enhanced.pairs.length < 2) {
          enhanced.pairs = [
            {term: 'Pojem 1', definition: 'Definice 1'},
            {term: 'Pojem 2', definition: 'Definice 2'}
          ];
        }
        break;
    }

    return enhanced;
  }

  /**
   * Get fallback questions if AI generation fails
   */
  static getFallbackQuestions(language) {
    return [
      {
        id: `fallback_${Date.now()}_1`,
        type: QUESTION_TYPES.MULTIPLE_CHOICE,
        question: 'Vygenerovaná otázka (náhradní)',
        options: ['Možnost A', 'Možnost B', 'Možnost C', 'Možnost D'],
        correctAnswer: 'Možnost A',
        explanation: 'Toto je náhradní otázka. Upravte ji podle potřeby.',
        difficulty: 'medium',
        keyWords: ['náhradní'],
        generated: true,
        generatedAt: new Date().toISOString(),
        language: language
      }
    ];
  }

  /**
   * Get available question types
   */
  static getQuestionTypes() {
    return QUESTION_TYPES;
  }
}

module.exports = {
  AIQuestionGenerator,
  QUESTION_TYPES
}; 