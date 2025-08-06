const axios = require('axios');
const { Test, Lesson } = require('../models');

// Conversation states
const STATES = {
  LESSON: 'lesson',
  TEST: 'test', 
  RESULTS: 'results',
  NEXT_LESSON: 'next_lesson'
};

// Track conversation state per call
const conversationState = new Map();

// Advanced AI conversation handler for Lesson -> Test -> Results flow
class ConversationManager {
  
  // Initialize conversation state
  static initializeState(callSid, lesson) {
    conversationState.set(callSid, {
      state: STATES.LESSON,
      lesson: lesson,
      currentQuestionIndex: 0,
      lessonQuestionsAnswered: 0,
      testQuestions: [],
      userAnswers: [],
      score: 0
    });
  }
  
  // Get current state
  static getState(callSid) {
    return conversationState.get(callSid) || null;
  }
  
  // Process user response based on current conversation state
  static async processUserResponse(transcribedText, callSid, userPhone) {
    try {
      console.log(`🧠 Processing response: "${transcribedText}"`);
      
      let state = this.getState(callSid);
      if (!state) {
        return {
          feedback: "Omlouvám se, došlo k chybě. Začněme znovu.",
          nextQuestion: null,
          questionType: 'error'
        };
      }
      
      console.log(`📊 Current state: ${state.state}, Question ${state.currentQuestionIndex}`);
      
      // Handle different conversation phases
      switch (state.state) {
        case STATES.LESSON:
          return await this.handleLessonPhase(transcribedText, state, callSid);
        case STATES.TEST:
          return await this.handleTestPhase(transcribedText, state, callSid);
        case STATES.RESULTS:
          return await this.handleResultsPhase(transcribedText, state, callSid);
        default:
          return this.getErrorResponse();
      }
      
    } catch (error) {
      console.error('❌ Conversation processing error:', error.message);
      return this.getErrorResponse();
    }
  }
  
  // Handle lesson phase responses
  static async handleLessonPhase(transcribedText, state, callSid) {
    state.lessonQuestionsAnswered++;
    
    // Simple lesson feedback
    const feedback = this.analyzeLessonResponse(transcribedText, state.lesson);
    
    // After 4 lesson questions, move to test
    if (state.lessonQuestionsAnswered >= 4) {
      console.log(`📝 Lesson completed, loading test for lesson ID: ${state.lesson.lesson_id}`);
      
      // Load test questions from database
      const testQuestions = await this.loadTestQuestions(state.lesson.lesson_id);
      
      if (testQuestions.length > 0) {
        state.state = STATES.TEST;
        state.testQuestions = testQuestions;
        state.currentQuestionIndex = 0;
        
        return {
          feedback: feedback + " Výborně! Nyní přejdeme k testu.",
          nextQuestion: this.formatTestQuestion(testQuestions[0], 1),
          questionType: 'test_start'
        };
      } else {
        return {
          feedback: feedback + " Lekce dokončena! Test není k dispozici.",
          nextQuestion: "Děkuji za pozornost. Hovor ukončujeme.",
          questionType: 'lesson_complete'
        };
      }
    }
    
    // Continue with lesson questions
    const nextLessonQ = state.lesson.questions[state.lessonQuestionsAnswered] || 
      "Máte k této lekci ještě nějaké dotazy?";
    
    return {
      feedback: feedback,
      nextQuestion: nextLessonQ,
      questionType: 'lesson_continue'
    };
  }
  
  // Handle test phase responses  
  static async handleTestPhase(transcribedText, state, callSid) {
    const currentQuestion = state.testQuestions[state.currentQuestionIndex];
    
    // Analyze user's answer (simple pattern matching)
    const isCorrect = this.checkTestAnswer(transcribedText, currentQuestion);
    if (isCorrect) state.score++;
    
    // Store user answer
    state.userAnswers.push({
      question: currentQuestion.question,
      userAnswer: transcribedText,
      correctAnswer: currentQuestion.correct_answer,
      isCorrect: isCorrect
    });
    
    const feedback = isCorrect ? "Správně!" : `Ne úplně. Správná odpověď je: ${currentQuestion.correct_answer}`;
    
    // Move to next question
    state.currentQuestionIndex++;
    
    // Check if test is complete
    if (state.currentQuestionIndex >= state.testQuestions.length) {
      return await this.completeTest(state, callSid);
    }
    
    // Continue with next test question
    const nextQuestion = state.testQuestions[state.currentQuestionIndex];
    return {
      feedback: feedback,
      nextQuestion: this.formatTestQuestion(nextQuestion, state.currentQuestionIndex + 1),
      questionType: 'test_continue'
    };
  }
  
  // Complete test and show results
  static async completeTest(state, callSid) {
    const totalQuestions = state.testQuestions.length;
    const correctAnswers = state.score;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    state.state = STATES.RESULTS;
    
    // Generate results message
    let resultMessage = `Test dokončen! Skórovali jste ${correctAnswers} ze ${totalQuestions} otázek (${percentage}%).`;
    
    if (percentage >= 80) {
      resultMessage += " Výborný výsledek!";
    } else if (percentage >= 60) {
      resultMessage += " Dobrý výsledek, ale je zde prostor pro zlepšení.";
    } else {
      resultMessage += " Doporučujeme procvičit tuto lekci znovu.";
    }
    
    console.log(`📊 Test completed: ${correctAnswers}/${totalQuestions} (${percentage}%)`);
    
    return {
      feedback: resultMessage,
      nextQuestion: "Děkuji za dokončení testu. Přejdeme k další lekci.",
      questionType: 'test_results',
      testResults: {
        score: correctAnswers,
        total: totalQuestions,
        percentage: percentage,
        answers: state.userAnswers
      }
    };
  }
  
  // Handle results phase
  static async handleResultsPhase(transcribedText, state, callSid) {
    // Test is complete, could load next lesson here
    return {
      feedback: "Děkuji za vaši účast v tomto školení.",
      nextQuestion: "Hovor bude nyní ukončen. Na shledanou!",
      questionType: 'session_complete'
    };
  }
  
  // Load test questions from database
  static async loadTestQuestions(lessonId) {
    try {
      console.log(`📚 Loading tests for lesson ID: ${lessonId}`);
      
      const tests = await Test.findAll({
        where: { lessonId: lessonId }
      });
      
      if (tests.length === 0) {
        console.log(`❌ No tests found for lesson ${lessonId}`);
        return [];
      }
      
      // Extract questions from first test
      const test = tests[0];
      const questions = JSON.parse(test.questions || '[]');
      
      console.log(`✅ Loaded ${questions.length} test questions`);
      return questions;
      
    } catch (error) {
      console.error(`❌ Error loading test questions:`, error.message);
      return [];
    }
  }
  
  // Format test question with multiple choice options
  static formatTestQuestion(questionObj, questionNumber) {
    const question = questionObj.question || questionObj.text || 'Otázka není k dispozici';
    const options = questionObj.options || [];
    
    let formatted = `Otázka ${questionNumber}: ${question}`;
    
    if (options.length > 0) {
      formatted += " Možnosti odpovědí: ";
      options.forEach((option, index) => {
        formatted += `${String.fromCharCode(65 + index)}) ${option} `;
      });
      formatted += "Řekněte písmeno správné odpovědi.";
    }
    
    return formatted;
  }
  
  // Check if user's answer matches correct answer
  static checkTestAnswer(transcribedText, questionObj) {
    const correctAnswer = questionObj.correct_answer || questionObj.answer;
    const userText = transcribedText.toLowerCase().trim();
    
    // Check for letter answers (A, B, C, D)
    const letterMatch = userText.match(/[abcd]/);
    if (letterMatch && correctAnswer) {
      const correctLetter = correctAnswer.toLowerCase();
      return letterMatch[0] === correctLetter;
    }
    
    // Check for partial text match
    if (correctAnswer && typeof correctAnswer === 'string') {
      return userText.includes(correctAnswer.toLowerCase());
    }
    
    return false;
  }
  
  // Analyze lesson response
  static analyzeLessonResponse(text, lesson) {
    const responseLength = text.split(' ').length;
    const lessonTitle = lesson.title.toLowerCase();
    
    // Topic-specific keywords
    let hasRelevantKeywords = false;
    
    if (lessonTitle.includes('lidské tělo')) {
      hasRelevantKeywords = /tělo|orgán|srdce|mozek|plíce|játra|anatomie/i.test(text);
    } else if (lessonTitle.includes('obráběcí kapaliny')) {
      hasRelevantKeywords = /kapalina|olej|chlazení|mazání|obrábění|stroj/i.test(text);
    }
    
    if (hasRelevantKeywords && responseLength > 8) {
      return "Výborně! Vaša odpoveď ukazuje dobré porozumění tématu.";
    } else if (hasRelevantKeywords) {
      return "Správný směr. Zkuste přidat více detailů.";
    } else if (responseLength > 5) {
      return "Děkuji za odpověď. Pokračujeme.";
    } else {
      return "Rozumím. Další otázka.";
    }
  }
  
  // Error response
  static getErrorResponse() {
    return {
      feedback: "Omlouvám se, došlo k chybě.",
      nextQuestion: "Zkuste to prosím znovu.",
      questionType: 'error'
    };
  }
}

module.exports = { ConversationManager };
