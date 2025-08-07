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
      console.log('🔍 DEBUG: CallSid:', callSid, 'UserPhone:', userPhone);
      
      let state = this.getState(callSid);
      if (!state) {
        console.log('❌ No conversation state found for call:', callSid);
        console.log('🔍 DEBUG: Available states:', Array.from(this.conversationState.keys()));
        return {
          feedback: "Omlouvám se, došlo k chybě. Začněme znovu.",
          nextQuestion: null,
          questionType: 'error'
        };
      }
      
      console.log('✅ Conversation state found:', {
        state: state.state,
        currentQuestionIndex: state.currentQuestionIndex,
        totalQuestions: state.lesson.questions.length,
        score: state.score
      });
      
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
  
  // Handle test questions phase (now loading from database from start)
  static async handleLessonPhase(transcribedText, state, callSid) {
    console.log(`📚 TEST PHASE: Question ${(state.currentQuestionIndex || 0) + 1}/${state.lesson.questions.length}`);
    console.log(`📝 User answer: "${transcribedText}"`);
    console.log('🔍 DEBUG: Is this a fallback response?', transcribedText.includes('Fallback'));
    console.log('🔍 DEBUG: State before processing:', {
      currentQuestionIndex: state.currentQuestionIndex,
      score: state.score,
      userAnswersLength: state.userAnswers ? state.userAnswers.length : 0,
      stateType: state.state
    });
    
    // Initialize if this is the first question
    if (!state.currentQuestionIndex) {
      state.currentQuestionIndex = 0;
      console.log('🔍 DEBUG: Initialized currentQuestionIndex to 0');
    }
    if (!state.score) {
      state.score = 0;
      console.log('🔍 DEBUG: Initialized score to 0');
    }
    if (!state.userAnswers) {
      state.userAnswers = [];
      console.log('🔍 DEBUG: Initialized userAnswers array');
    }
    
    const currentQuestionIndex = state.currentQuestionIndex;
    const currentQuestion = state.lesson.questions[currentQuestionIndex];
    
    console.log('🔍 DEBUG: Question index and data:', {
      currentQuestionIndex: currentQuestionIndex,
      totalQuestions: state.lesson.questions.length,
      currentQuestion: currentQuestion
    });
    
    console.log(`🎯 Current question:`, currentQuestion);
    
    let feedback = "";
    let isCorrect = false;
    
    // Check if this is a test question with multiple choice options
    if (currentQuestion && typeof currentQuestion === 'object' && currentQuestion.options) {
      // This is a multiple choice test question from database
      isCorrect = this.checkTestAnswer(transcribedText, currentQuestion);
    
      if (isCorrect) {
        state.score++;
        feedback = "Správně! ";
      } else {
        // Get correct answer using correctAnswer index
        const correctAnswerText = currentQuestion.options[currentQuestion.correctAnswer] || 'neznámá';
        
        // Generate helpful feedback based on question content
        let explanation = this.generateExplanation(currentQuestion, correctAnswerText);
        
        feedback = `Bohužel ne. Správná odpověď je: ${correctAnswerText}. ${explanation} `;
      }
      
      // Store user answer
      state.userAnswers.push({
        question: currentQuestion.question || currentQuestion.text,
        userAnswer: transcribedText,
        correctAnswer: currentQuestion.options[currentQuestion.correctAnswer] || 'Neznámá',
        isCorrect: isCorrect
      });
      
      console.log(`📊 Score: ${state.score}/${state.userAnswers.length} (${isCorrect ? 'CORRECT' : 'WRONG'})`);
      
    } else {
      // This is a text question - give general feedback
      feedback = this.analyzeLessonResponse(transcribedText, state.lesson) + " ";
    }
    
    // Move to next question
    state.currentQuestionIndex++;
    console.log('🔍 DEBUG: Moved to next question, new index:', state.currentQuestionIndex);
    
    // Check if we've completed all questions
    if (state.currentQuestionIndex >= state.lesson.questions.length) {
      console.log(`🎓 ALL QUESTIONS COMPLETED!`);
      
      if (state.userAnswers && state.userAnswers.length > 0) {
        // We have test results to show
        const finalScore = state.score;
        const totalQuestions = state.userAnswers.length;
        const percentage = Math.round((finalScore / totalQuestions) * 100);
        
        const resultMessage = `Test "${state.lesson.title}" dokončen! Získali jste ${finalScore} z ${totalQuestions} bodů (${percentage}%). `;
        
        console.log(`🏆 FINAL RESULT: ${finalScore}/${totalQuestions} = ${percentage}%`);
        
        // Save test results to database
        await this.saveTestResults(state, callSid);
        
        state.state = STATES.RESULTS;
        return {
          feedback: feedback + resultMessage + "Hovor bude ukončen.",
          nextQuestion: "",
          questionType: 'session_complete',
          testResults: {
            score: finalScore,
            total: totalQuestions,
            percentage: percentage
          }
        };
      } else {
        return {
          feedback: feedback + "Test dokončen! Hovor bude ukončen.",
          nextQuestion: "",
          questionType: 'session_complete'
        };
      }
    }
    
    // Continue with next question
    const nextQuestion = state.lesson.questions[state.currentQuestionIndex];
    console.log('🔍 DEBUG: Next question data:', {
      nextQuestionIndex: state.currentQuestionIndex,
      nextQuestion: nextQuestion
    });
    
    let formattedNextQuestion = "";
    
    // If next question is a test question object, format it properly
    if (typeof nextQuestion === 'object' && nextQuestion.question) {
      formattedNextQuestion = this.formatTestQuestion(nextQuestion, state.currentQuestionIndex + 1);
      console.log('🔍 DEBUG: Formatted next question:', formattedNextQuestion);
    } else if (typeof nextQuestion === 'string') {
      formattedNextQuestion = nextQuestion;
      console.log('🔍 DEBUG: Next question is string:', formattedNextQuestion);
    } else {
      formattedNextQuestion = "Další otázka není k dispozici.";
    }
    
    console.log('🔍 DEBUG: Returning response with:', {
      feedback: feedback,
      nextQuestion: formattedNextQuestion,
      questionType: 'test_continue'
    });
    
    return {
      feedback: feedback,
      nextQuestion: formattedNextQuestion,
      questionType: 'test_continue'
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
      
      // Debug: Check what lessons exist
      const allLessons = await Lesson.findAll({ attributes: ['id', 'title'] });
      console.log(`🔍 All lessons in DB:`, allLessons.map(l => ({ id: l.id, title: l.title })));
      
      // Debug: Check what tests exist  
      const allTests = await Test.findAll({ attributes: ['id', 'title', 'lessonId'] });
      console.log(`🔍 All tests in DB:`, allTests.map(t => ({ id: t.id, title: t.title, lessonId: t.lessonId })));
      
      const tests = await Test.findAll({
        where: { lessonId: lessonId },
        include: [{ 
          model: Lesson, 
          attributes: ['id', 'title'] 
        }]
      });
      
      console.log(`🔍 Tests found for lessonId ${lessonId}:`, tests.length);
      
      if (tests.length === 0) {
        console.log(`❌ No tests found for lesson ${lessonId}`);
        console.log(`❌ Try checking if lessonId exists and tests are properly linked`);
        return [];
      }
      
      // Extract questions from first test
      const test = tests[0];
      console.log(`📝 Test details:`, { id: test.id, title: test.title, lessonId: test.lessonId });
      console.log(`📝 Raw questions data:`, test.questions);
      
      // Handle both JSON string and already parsed object
      let questions;
      if (typeof test.questions === 'string') {
        questions = JSON.parse(test.questions || '[]');
      } else {
        questions = test.questions || [];
      }
      
      console.log(`✅ Loaded ${questions.length} test questions:`, questions);
      return questions;
      
    } catch (error) {
      console.error(`❌ Error loading test questions:`, error.message);
      console.error(`❌ Full error:`, error);
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
        // Handle both string options and object options
        const optionText = typeof option === 'string' ? option : (option.text || option);
        formatted += `${String.fromCharCode(65 + index)}) ${optionText} `;
      });
      formatted += "Řekněte písmeno správné odpovědi.";
    }
    
    return formatted;
  }
  
  // Check if user's answer matches correct answer
  static checkTestAnswer(transcribedText, questionObj) {
    const userText = transcribedText.toLowerCase().trim();
    const correctAnswerIndex = questionObj.correctAnswer;
    const correctAnswerText = questionObj.options[correctAnswerIndex];
    
    // Check for letter answers (A, B, C, D)
    const letterMatch = userText.match(/[abcd]/);
    if (letterMatch) {
      const userLetterIndex = letterMatch[0].charCodeAt(0) - 97; // a=0, b=1, c=2, d=3
      return userLetterIndex === correctAnswerIndex;
    }
    
    // Check for partial text match with correct answer
    if (correctAnswerText && typeof correctAnswerText === 'string') {
      return userText.includes(correctAnswerText.toLowerCase());
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
  
  // Save test results to database
  static saveTestResults(state, callSid) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('💾 Saving test results to database...');
        
        const TestResult = require('../models/TestResult');
        const { User } = require('../models');
        
        // Find user by phone from conversation state
        let userId = state.lesson.user_id;
        if (!userId) {
          // Try to find user by callSid or other means
          console.log('⚠️ User ID not found in state, using default or admin');
          userId = 1; // Fallback to admin user
        }
        
        // Save each answer as a separate TestResult record
        for (let i = 0; i < state.userAnswers.length; i++) {
          const answer = state.userAnswers[i];
          
          await TestResult.create({
            userId: userId,
            trainingType: state.lesson.title,
            lessonTitle: state.lesson.title,
            contentId: state.lesson.lesson_id,
            questionText: answer.question,
            userAnswer: answer.userAnswer,
            recordingUrl: null, // TODO: Add recording URL if available
            recordingDuration: null,
            aiEvaluation: {
              isCorrect: answer.isCorrect,
              correctAnswer: answer.correctAnswer,
              feedback: answer.isCorrect ? 'Správná odpověď' : `Správná odpověď je: ${answer.correctAnswer}`,
              questionNumber: i + 1
            },
            completionPercentage: answer.isCorrect ? 100 : 0,
            qualityScore: answer.isCorrect ? 100 : 0,
            sessionId: callSid
          });
        }
        
        // Calculate and log final results
        const correctAnswers = state.userAnswers.filter(a => a.isCorrect).length;
        const totalQuestions = state.userAnswers.length;
        const percentage = Math.round((correctAnswers / totalQuestions) * 100);
        
        console.log(`✅ Test results saved: ${correctAnswers}/${totalQuestions} (${percentage}%)`);
        console.log(`📊 Questions saved for user ${userId}, lesson "${state.lesson.title}"`);
        
        resolve();
      } catch (error) {
        console.error('❌ Error saving test results:', error.message);
        console.error('📋 Full error:', error);
        reject(error);
      }
    });
  }
   
   // Generate helpful explanation for wrong answers
   static generateExplanation(questionObj, correctAnswer) {
     const question = questionObj.question.toLowerCase();
     
     // Smart explanations based on question content
     if (question.includes('kolik') && question.includes('kostí')) {
       return 'Dospělý člověk má přesně 206 kostí.';
     } else if (question.includes('funkce') && question.includes('srdce')) {
       return 'Hlavní funkcí srdce je pumpování krve tělem.';
     } else if (question.includes('dýchání') || question.includes('orgán')) {
       return 'Plíce jsou zodpovědné za dýchání a výměnu kyslíku.';
     } else if (question.includes('mozek')) {
       return 'Mozek řídí všechny tělesné funkce a myšlení.';
     } else if (question.includes('játra')) {
       return 'Játra filtrují toxiny z krve a produkují žluč.';
     } else if (question.includes('žaludek')) {
       return 'Žaludek tráví potravu pomocí žaludečních šťáv.';
    }
     
         // Generic helpful response
    return 'Zapamatujte si to pro příště.';
  }
}

module.exports = { ConversationManager };
