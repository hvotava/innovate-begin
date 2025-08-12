// AI Lesson Generator Service
// Generates structured lessons from uploaded PDF/text content using OpenAI

let OpenAI, openai;
try {
  OpenAI = require('openai');
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log('✅ OpenAI client initialized for lesson generation');
} catch (error) {
  console.warn('⚠️ OpenAI package not available for lesson generation:', error.message);
  console.warn('⚠️ AI Lesson Generator will use fallback mode');
}

class AILessonGenerator {
  /**
   * Generate a structured lesson from content
   * @param {string} rawContent - The raw text content from PDF/text
   * @param {string} title - The lesson title
   * @param {string} language - Language code (cs, en, de, sk)
   * @param {Object} options - Generation options
   */
  static async generateLesson(rawContent, title, language = 'cs', options = {}) {
    console.log('🤖 AI Lesson Generator: Starting lesson generation');
    console.log('📝 Content length:', rawContent.length);
    console.log('🏷️ Title:', title);
    console.log('🌍 Language:', language);

    if (!openai) {
      console.warn('⚠️ OpenAI not available, using fallback lesson generation');
      return this.generateFallbackLesson(rawContent, title, language);
    }

    try {
      const prompt = this.buildLessonPrompt(rawContent, title, language, options);
      
      console.log('🤖 Calling OpenAI for lesson generation...');
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(language)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      const generatedContent = response.choices[0].message.content;
      console.log('✅ OpenAI lesson generation successful');
      
      // Parse and structure the response
      const structuredLesson = this.parseGeneratedLesson(generatedContent, title);
      
      console.log('📚 Generated lesson structure:', {
        title: structuredLesson.title,
        sectionsCount: structuredLesson.sections?.length || 0,
        contentLength: structuredLesson.content.length
      });

      return structuredLesson;

    } catch (error) {
      console.error('❌ OpenAI lesson generation failed:', error.message);
      
      // Fallback to basic lesson structure
      return this.generateFallbackLesson(rawContent, title, language);
    }
  }

  /**
   * Build the prompt for OpenAI lesson generation
   */
  static buildLessonPrompt(content, title, language, options) {
    const languageInstructions = {
      'cs': 'Odpověz v češtině. Vytvoř školící materiál bez uvítání.',
      'en': 'Respond in English. Create training material without greetings.',
      'de': 'Antworte auf Deutsch. Erstelle Schulungsmaterial ohne Begrüßung.',
      'sk': 'Odpovedaj v slovenčine. Vytvor školiaci materiál bez privítania.'
    };

    const instruction = languageInstructions[language] || languageInstructions['cs'];

    return `${instruction}

Na základě následujícího obsahu vytvoř vzdělávací školení:

TÉMA: ${title}

OBSAH:
${content.substring(0, 3000)} ${content.length > 3000 ? '...[zkráceno]' : ''}

POŽADAVKY:
1. Vytvoř pouze školící obsah, žádné uvítání ani pozdravu
2. Začni rovnou hlavním obsahem bez úvodu
3. Rozděl obsah do logických sekcí s prostými nadpisy
4. Přidej klíčové pojmy a definice
5. Zahrň praktické příklady kde je to možné
6. Použij vzdělávací a přístupný jazyk
7. Školení by mělo trvat 5-10 minut čtení
8. NEPOUŽÍVEJ speciální znaky jako #, *, -, pouze prostý text s nadpisy

FORMÁT ODPOVĚDI:
Vrať pouze strukturovaný školící text, bez dalších komentářů.

Struktura (bez speciálních znaků):

[Hlavní nadpis]

[Hlavní obsah první sekce]

[Nadpis druhé sekce]
[Obsah druhé sekce]

[Nadpis třetí sekce]
[Obsah třetí sekce]

Klíčové pojmy:
Pojem 1: Definice
Pojem 2: Definice

Shrnutí:
[Shrnutí školení]

Praktické aplikace:
[Praktické tipy]`;
  }

  /**
   * Get system prompt for different languages
   */
  static getSystemPrompt(language) {
    const prompts = {
      'cs': 'Jsi odborný školící konzultant. Vytváříš kvalitní školící materiály bez uvítání a pozdravu. Začínáš rovnou obsahem. Nepoužíváš speciální znaky jako #, *, -. Používáš jasný, přímý jazyk a logickou strukturu.',
      'en': 'You are an expert training consultant. You create high-quality training materials without greetings or welcomes. You start directly with content. You do not use special characters like #, *, -. You use clear, direct language and logical structure.',
      'de': 'Sie sind ein erfahrener Schulungsberater. Sie erstellen hochwertige Schulungsmaterialien ohne Begrüßungen. Sie beginnen direkt mit dem Inhalt. Sie verwenden keine Sonderzeichen wie #, *, -. Sie verwenden klare, direkte Sprache und logische Struktur.',
      'sk': 'Ste odborný školiaci konzultant. Vytvárate kvalitné školiace materiály bez privítania. Začínate priamo obsahom. Nepoužívate špeciálne znaky ako #, *, -. Používate jasný, priamy jazyk a logickú štruktúru.'
    };

    return prompts[language] || prompts['cs'];
  }

  /**
   * Parse the generated lesson content into structured format
   */
  static parseGeneratedLesson(generatedContent, originalTitle) {
    try {
      // Extract title from content if present
      const titleMatch = generatedContent.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : originalTitle;

      // Extract sections
      const sections = [];
      const sectionMatches = generatedContent.match(/^##\s+(.+)$/gm);
      
      if (sectionMatches) {
        sectionMatches.forEach(match => {
          const sectionTitle = match.replace(/^##\s+/, '');
          sections.push(sectionTitle);
        });
      }

      return {
        title: title,
        content: generatedContent,
        sections: sections,
        generatedAt: new Date().toISOString(),
        type: 'ai_generated',
        metadata: {
          sectionsCount: sections.length,
          estimatedReadingTime: Math.ceil(generatedContent.length / 1000) + ' minut'
        }
      };

    } catch (error) {
      console.error('❌ Error parsing generated lesson:', error.message);
      
      return {
        title: originalTitle,
        content: generatedContent,
        sections: [],
        generatedAt: new Date().toISOString(),
        type: 'ai_generated_simple'
      };
    }
  }

  /**
   * Generate fallback lesson when OpenAI is not available
   */
  static generateFallbackLesson(content, title, language) {
    console.log('📝 Generating fallback lesson structure');

    const templates = {
      'cs': {
        intro: 'Tato lekce obsahuje důležité informace z nahraného obsahu.',
        summary: 'Shrnutí klíčových bodů z lekce.',
        keyPoints: 'Klíčové body'
      },
      'en': {
        intro: 'This lesson contains important information from the uploaded content.',
        summary: 'Summary of key points from the lesson.',
        keyPoints: 'Key Points'
      }
    };

    const template = templates[language] || templates['cs'];

    // Create basic structured lesson
    const structuredContent = `# ${title}

## Úvod
${template.intro}

## Obsah
${content}

## ${template.keyPoints}
- Prostudujte si poskytnutý obsah
- Zaměřte se na klíčové informace
- Aplikujte poznatky v praxi

## Shrnutí
${template.summary}`;

    return {
      title: title,
      content: structuredContent,
      sections: ['Úvod', 'Obsah', template.keyPoints, 'Shrnutí'],
      generatedAt: new Date().toISOString(),
      type: 'fallback_generated',
      metadata: {
        sectionsCount: 4,
        estimatedReadingTime: Math.ceil(content.length / 1000) + ' minut'
      }
    };
  }

  /**
   * Extract key topics from content for lesson planning
   */
  static async extractKeyTopics(content, language = 'cs') {
    if (!openai) {
      return this.extractKeyTopicsFallback(content);
    }

    try {
      const prompt = `Analyzuj následující text a vyextrahuj 5-7 klíčových témat:

${content.substring(0, 2000)}

Vrať pouze seznam témat, každé na novém řádku, začínající pomlčkou.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.5
      });

      const topics = response.choices[0].message.content
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(topic => topic.length > 0);

      return topics;

    } catch (error) {
      console.error('❌ Error extracting key topics:', error.message);
      return this.extractKeyTopicsFallback(content);
    }
  }

  /**
   * Fallback key topics extraction using simple text analysis
   */
  static extractKeyTopicsFallback(content) {
    // Simple keyword extraction based on frequency and length
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4);

    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    const sortedWords = Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 7)
      .map(([word]) => word);

    return sortedWords;
  }
}

module.exports = { AILessonGenerator }; 