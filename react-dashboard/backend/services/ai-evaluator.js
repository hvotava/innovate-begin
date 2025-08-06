// AI Evaluation Service for test responses
class AIEvaluator {
  
  // Evaluate user response completeness and quality
  static evaluateResponse(question, userResponse, trainingType, lessonContext = null) {
    try {
      console.log(`🧠 AI Evaluating response for ${trainingType}`);
      console.log(`❓ Question: ${question}`);
      console.log(`💬 Response: ${userResponse}`);
      
      const evaluation = {
        completionPercentage: this.calculateCompletionPercentage(question, userResponse, trainingType),
        qualityScore: this.calculateQualityScore(userResponse, trainingType),
        feedback: this.generateFeedback(question, userResponse, trainingType),
        strengths: this.identifyStrengths(userResponse, trainingType),
        improvements: this.identifyImprovements(userResponse, trainingType),
        isComplete: false,
        keywordMatches: this.findKeywordMatches(question, userResponse, trainingType),
        responseLength: this.analyzeResponseLength(userResponse),
        timestamp: new Date().toISOString()
      };
      
      evaluation.isComplete = evaluation.completionPercentage >= 70;
      
      console.log(`✅ Evaluation complete:`, {
        completion: `${evaluation.completionPercentage}%`,
        quality: `${evaluation.qualityScore}%`,
        isComplete: evaluation.isComplete
      });
      
      return evaluation;
      
    } catch (error) {
      console.error('❌ AI Evaluation error:', error.message);
      return this.getDefaultEvaluation();
    }
  }
  
  // Calculate completion percentage (0-100)
  static calculateCompletionPercentage(question, response, trainingType) {
    if (!response || response.trim().length < 10) return 0;
    
    let completionScore = 0;
    const responseWords = response.toLowerCase().split(/\s+/);
    const questionWords = question.toLowerCase().split(/\s+/);
    
    // Base score for response length
    if (response.length > 50) completionScore += 30;
    if (response.length > 100) completionScore += 20;
    if (response.length > 200) completionScore += 10;
    
    // Check for question relevance
    const relevantWords = this.getRelevantWords(questionWords, trainingType);
    const matchedRelevantWords = relevantWords.filter(word => 
      responseWords.some(rWord => rWord.includes(word) || word.includes(rWord))
    );
    
    if (matchedRelevantWords.length > 0) {
      completionScore += Math.min(40, matchedRelevantWords.length * 10);
    }
    
    // Check for complete sentences
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length >= 2) completionScore += 10;
    if (sentences.length >= 3) completionScore += 10;
    
    return Math.min(100, Math.max(0, completionScore));
  }
  
  // Calculate quality score (0-100)
  static calculateQualityScore(response, trainingType) {
    if (!response) return 0;
    
    let qualityScore = 0;
    const words = response.split(/\s+/);
    
    // Length quality
    if (words.length >= 10) qualityScore += 20;
    if (words.length >= 20) qualityScore += 10;
    if (words.length >= 30) qualityScore += 10;
    
    // Vocabulary quality (simple heuristics)
    const professionalWords = this.getProfessionalWords(trainingType);
    const usedProfessionalWords = professionalWords.filter(word =>
      response.toLowerCase().includes(word.toLowerCase())
    );
    qualityScore += Math.min(30, usedProfessionalWords.length * 5);
    
    // Structure quality
    if (response.includes('.') || response.includes('!') || response.includes('?')) {
      qualityScore += 10;
    }
    
    // Coherence (basic check for conjunctions and flow)
    const connectiveWords = ['and', 'but', 'because', 'so', 'then', 'also', 'however', 'ale', 'a', 'také', 'protože'];
    const hasConnectives = connectiveWords.some(word => response.toLowerCase().includes(word));
    if (hasConnectives) qualityScore += 20;
    
    return Math.min(100, Math.max(0, qualityScore));
  }
  
  // Generate feedback based on response
  static generateFeedback(question, response, trainingType) {
    const completionPct = this.calculateCompletionPercentage(question, response, trainingType);
    const qualityPct = this.calculateQualityScore(response, trainingType);
    
    if (completionPct >= 80 && qualityPct >= 80) {
      return "Výborná odpověď! Prokázali jste dobré porozumění tématu a vyjádřili se jasně.";
    } else if (completionPct >= 60 && qualityPct >= 60) {
      return "Dobrá odpověď! Téma jste pochopili, zkuste být příště konkrétnější.";
    } else if (completionPct >= 40) {
      return "Odpověď byla částečně správná, ale zkuste více rozvinout vaše myšlenky.";
    } else {
      return "Zkuste odpovědět podrobněji a více se zaměřit na položenou otázku.";
    }
  }
  
  // Get relevant words for different training types
  static getRelevantWords(questionWords, trainingType) {
    const typeSpecificWords = {
      'safety_training': ['safety', 'bezpečnost', 'ochrana', 'riziko', 'postup', 'opatření'],
      'english_business': ['business', 'company', 'meeting', 'project', 'client', 'firma', 'projekt'],
      'english_technical': ['technical', 'process', 'equipment', 'system', 'technický', 'postup', 'zařízení'],
      'english_basic': ['basic', 'simple', 'everyday', 'work', 'family', 'základní', 'práce', 'rodina'],
      'german_basic': ['grund', 'basic', 'arbeit', 'familie', 'základní', 'práce']
    };
    
    const specificWords = typeSpecificWords[trainingType] || [];
    return [...questionWords.filter(word => word.length > 3), ...specificWords];
  }
  
  // Get professional vocabulary for training type
  static getProfessionalWords(trainingType) {
    const vocabularies = {
      'safety_training': ['bezpečnost', 'ochrana', 'prevence', 'riziko', 'opatření', 'postup', 'pokyny', 'kontrola'],
      'english_business': ['business', 'professional', 'company', 'client', 'project', 'meeting', 'presentation', 'strategy'],
      'english_technical': ['technical', 'system', 'process', 'equipment', 'procedure', 'specification', 'maintenance'],
      'english_basic': ['work', 'family', 'daily', 'routine', 'experience', 'describe', 'explain'],
      'german_basic': ['arbeit', 'familie', 'alltag', 'erfahrung', 'beschreiben', 'erklären']
    };
    
    return vocabularies[trainingType] || [];
  }
  
  // Default evaluation for error cases
  static getDefaultEvaluation() {
    return {
      completionPercentage: 0,
      qualityScore: 0,
      feedback: "Nepodařilo se vyhodnotit odpověď. Zkuste to prosím znovu.",
      strengths: [],
      improvements: ["Zkuste odpovědět jasně a srozumitelně"],
      isComplete: false,
      keywordMatches: [],
      responseLength: { characters: 0, words: 0, sentences: 0, averageWordsPerSentence: 0 },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { AIEvaluator }; 