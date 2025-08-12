// Language Translation Service
class LanguageTranslator {
  
  // Supported languages
  static SUPPORTED_LANGUAGES = {
    'cs': 'Czech',
    'en': 'English', 
    'de': 'German',
    'es': 'Spanish',
    'fr': 'French',
    'zh': 'Chinese',
    'sk': 'Slovak'
  };

  // Twilio language codes mapping
  static TWILIO_LANGUAGES = {
    'cs': 'cs-CZ',
    'en': 'en-US',
    'de': 'de-DE',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'zh': 'zh-CN',
    'sk': 'sk-SK'
  };

  // Voice mapping for Twilio
  static TWILIO_VOICES = {
    'cs': 'Google.cs-CZ-Standard-A',
    'en': 'Google.en-US-Standard-A',
    'de': 'Google.de-DE-Standard-A',
    'es': 'Google.es-ES-Standard-A',
    'fr': 'Google.fr-FR-Standard-A',
    'zh': 'Google.zh-CN-Standard-A',
    'sk': 'Google.sk-SK-Standard-A'
  };

  // Basic translations for common phrases
  static TRANSLATIONS = {
    welcome: {
      'cs': 'Vítejte v AI tutorovi!',
      'en': 'Welcome to AI tutor!',
      'de': 'Willkommen beim KI-Tutor!',
      'es': '¡Bienvenido al tutor de IA!',
      'fr': 'Bienvenue dans le tuteur IA!',
      'zh': '欢迎使用AI导师！',
      'sk': 'Vitajte v AI tutorovi!'
    },
    correct_answer: {
      'cs': 'Správná odpověď!',
      'en': 'Correct answer!',
      'de': 'Richtige Antwort!',
      'es': '¡Respuesta correcta!',
      'fr': 'Bonne réponse!',
      'zh': '答案正确！',
      'sk': 'Správna odpoveď!'
    },
    wrong_answer: {
      'cs': 'Nesprávná odpověď.',
      'en': 'Wrong answer.',
      'de': 'Falsche Antwort.',
      'es': 'Respuesta incorrecta.',
      'fr': 'Mauvaise réponse.',
      'zh': '答案错误。',
      'sk': 'Nesprávna odpoveď.'
    },
    next_question: {
      'cs': 'Další otázka:',
      'en': 'Next question:',
      'de': 'Nächste Frage:',
      'es': 'Siguiente pregunta:',
      'fr': 'Question suivante:',
      'zh': '下一个问题：',
      'sk': 'Ďalšia otázka:'
    },
    test_completed: {
      'cs': 'Test dokončen!',
      'en': 'Test completed!',
      'de': 'Test abgeschlossen!',
      'es': '¡Test completado!',
      'fr': 'Test terminé!',
      'zh': '测试完成！',
      'sk': 'Test dokončený!'
    },
    lesson_completed: {
      'cs': 'Lekce dokončena!',
      'en': 'Lesson completed!',
      'de': 'Lektion abgeschlossen!',
      'es': '¡Lección completada!',
      'fr': 'Leçon terminée!',
      'zh': '课程完成！',
      'sk': 'Lekcia dokončená!'
    },
    say_your_answer: {
      'cs': 'Řekněte svoji odpověď.',
      'en': 'Say your answer.',
      'de': 'Sagen Sie Ihre Antwort.',
      'es': 'Diga su respuesta.',
      'fr': 'Dites votre réponse.',
      'zh': '请说出您的答案。',
      'sk': 'Povedzte svoju odpoveď.'
    },
    continuing_next_lesson: {
      'cs': 'Pokračujeme další lekcí.',
      'en': 'Continuing with the next lesson.',
      'de': 'Wir fahren mit der nächsten Lektion fort.',
      'es': 'Continuamos con la siguiente lección.',
      'fr': 'Nous continuons avec la leçon suivante.',
      'zh': '继续下一课。',
      'sk': 'Pokračujeme ďalšou lekciou.'
    },
    training_completed: {
      'cs': 'Školení dokončeno. Děkuji!',
      'en': 'Training completed. Thank you!',
      'de': 'Schulung abgeschlossen. Danke!',
      'es': 'Entrenamiento completado. ¡Gracias!',
      'fr': 'Formation terminée. Merci!',
      'zh': '培训完成。谢谢！',
      'sk': 'Školenie dokončené. Ďakujem!'
    }
  };

  // Get translation for a key in specified language
  static translate(key, language = 'cs') {
    const translations = this.TRANSLATIONS[key];
    if (!translations) {
      console.warn(`⚠️ Translation key '${key}' not found`);
      return key;
    }
    
    return translations[language] || translations['cs'] || key;
  }

  // Get Twilio language code
  static getTwilioLanguage(language = 'cs') {
    return this.TWILIO_LANGUAGES[language] || 'cs-CZ';
  }

  // Get Twilio voice
  static getTwilioVoice(language = 'cs') {
    return this.TWILIO_VOICES[language] || 'Google.cs-CZ-Standard-A';
  }

  // Detect language from text (basic detection)
  static detectLanguage(text) {
    const lowerText = text.toLowerCase();
    
    // Czech characters
    if (/[áčďéěíňóřšťúůýž]/.test(text)) {
      return 'cs';
    }
    
    // Slovak characters
    if (/[ľôŕĺ]/.test(text) || lowerText.includes('ľ')) {
      return 'sk';
    }
    
    // German characters
    if (/[äöüß]/.test(text)) {
      return 'de';
    }
    
    // Spanish characters
    if (/[ñáéíóúü¿¡]/.test(text)) {
      return 'es';
    }
    
    // French characters
    if (/[àâäéèêëïîôöùûüÿç]/.test(text)) {
      return 'fr';
    }
    
    // Chinese characters
    if (/[\u4e00-\u9fff]/.test(text)) {
      return 'zh';
    }
    
    // Default to English for Latin characters
    return 'en';
  }

  // Translate lesson content to user's language
  static async translateContent(content, fromLanguage, toLanguage) {
    if (fromLanguage === toLanguage) {
      return content;
    }
    
    // For now, return original content with language note
    // In production, you would use Google Translate API or similar
    console.log(`🌍 Translation needed: ${fromLanguage} → ${toLanguage}`);
    console.log(`📝 Content to translate: ${content.substring(0, 100)}...`);
    
    // Simple mock translation for demonstration
    const translationNote = this.translate('translation_note', toLanguage) || 
      `[Translated from ${fromLanguage} to ${toLanguage}]`;
    
    return `${translationNote}\n\n${content}`;
  }

  // Get localized instructions for voice prompts
  static getLocalizedInstructions(language) {
    const instructions = {
      'cs': 'Poslouchejte pozorně a odpovězte na otázky.',
      'en': 'Listen carefully and answer the questions.',
      'de': 'Hören Sie aufmerksam zu und beantworten Sie die Fragen.',
      'es': 'Escuche atentamente y responda las preguntas.',
      'fr': 'Écoutez attentivement et répondez aux questions.',
      'zh': '仔细听并回答问题。',
      'sk': 'Počúvajte pozorne a odpovedajte na otázky.'
    };
    
    return instructions[language] || instructions['cs'];
  }
}

module.exports = { LanguageTranslator }; 