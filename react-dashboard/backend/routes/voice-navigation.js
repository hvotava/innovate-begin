// Voice Navigation System for AI Tutor
const { User, Lesson, Test } = require('../models');

// Navigation commands mapping
const NAVIGATION_COMMANDS = {
  '1': 'repeat_lesson',
  '2': 'next_lesson', 
  '3': 'previous_lesson',
  '4': 'end_session',
  'jedna': 'repeat_lesson',
  'dva': 'next_lesson',
  'tři': 'previous_lesson',
  'čtyři': 'end_session',
  'zopakovat': 'repeat_lesson',
  'další': 'next_lesson',
  'předchozí': 'previous_lesson',
  'ukončit': 'end_session'
};

// Conversation states
const CONVERSATION_STATES = {
  LESSON_PLAYING: 'lesson_playing',
  LESSON_COMPLETED: 'lesson_completed', 
  TEST_ACTIVE: 'test_active',
  TEST_COMPLETED: 'test_completed',
  NAVIGATION_MENU: 'navigation_menu'
};

// Voice Navigation Manager
class VoiceNavigationManager {
  static conversationStates = new Map();
  
  // Initialize conversation state
  static initializeState(callSid, lessonData) {
    const state = {
      callSid,
      lesson: lessonData,
      currentState: CONVERSATION_STATES.LESSON_PLAYING,
      currentQuestionIndex: 0,
      userAnswers: [],
      score: 0,
      totalQuestions: 0,
      userLanguage: lessonData.language || 'cs',
      lessonCompleted: false,
      testCompleted: false,
      navigationHistory: [],
      recordingUrl: null,
      recordingDuration: null
    };
    
    this.conversationStates.set(callSid, state);
    console.log(`🎯 NEW: Voice Navigation initialized for lesson: ${lessonData.title}`);
    console.log(`📊 State: ${state.currentState}`);
  }

  // Get conversation state
  static getState(callSid) {
    return this.conversationStates.get(callSid);
  }

  // Update conversation state
  static updateState(callSid, updates) {
    const state = this.getState(callSid);
    if (state) {
      Object.assign(state, updates);
      console.log(`🔄 State updated: ${state.currentState}`);
    }
  }

  // Process user response with navigation
  static async processUserResponse(userInput, callSid, userPhone) {
    const state = this.getState(callSid);
    if (!state) {
      console.log('❌ No conversation state found');
      return { questionType: 'error', feedback: 'Omlouvám se, došlo k chybě.' };
    }

    console.log(`🎯 Processing user input: "${userInput}" in state: ${state.currentState}`);

    // Process based on current state
    switch (state.currentState) {
      case CONVERSATION_STATES.LESSON_PLAYING:
        return this.handleLessonPhase(userInput, state, userPhone);
      
      case CONVERSATION_STATES.LESSON_COMPLETED:
        return this.handleLessonCompleted(userInput, state, userPhone);
      
      case CONVERSATION_STATES.TEST_ACTIVE:
        return this.handleTestPhase(userInput, state, userPhone);
      
      case CONVERSATION_STATES.TEST_COMPLETED:
        return this.handleTestCompleted(userInput, state, userPhone);
      
      case CONVERSATION_STATES.NAVIGATION_MENU:
        return this.handleNavigationMenu(userInput, state, userPhone);
      
      default:
        return this.handleLessonPhase(userInput, state, userPhone);
    }
  }

  // Check for navigation commands
  static checkNavigationCommand(userInput) {
    const cleanInput = userInput.toLowerCase().trim();
    
    for (const [command, action] of Object.entries(NAVIGATION_COMMANDS)) {
      if (cleanInput.includes(command)) {
        console.log(`🎮 Navigation command detected: ${command} → ${action}`);
        return action;
      }
    }
    
    return null;
  }

  // Handle navigation commands
  static async handleNavigation(command, state, userPhone) {
    console.log(`🎮 Handling navigation command: ${command}`);
    
    switch (command) {
      case 'repeat_lesson':
        state.currentState = CONVERSATION_STATES.LESSON_PLAYING;
        state.currentQuestionIndex = 0;
        state.userAnswers = [];
        state.score = 0;
        
        return {
          questionType: 'lesson',
          feedback: 'Zopakujeme lekci.',
          nextQuestion: this.formatLessonContent(state.lesson),
          navigationOptions: this.getNavigationOptions(state.userLanguage)
        };
      
      case 'next_lesson':
        return await this.loadNextLesson(state, userPhone);
      
      case 'previous_lesson':
        return await this.loadPreviousLesson(state, userPhone);
      
      case 'end_session':
        return {
          questionType: 'session_complete',
          feedback: 'Děkuji za účast. Na shledanou!'
        };
      
      default:
        return {
          questionType: 'error',
          feedback: 'Nerozumím příkazu. Zkuste to znovu.'
        };
    }
  }

  // Handle lesson completion
  static async handleLessonCompleted(userInput, state, userPhone) {
    console.log('📚 Lesson completed, starting test...');
    
    state.currentState = CONVERSATION_STATES.TEST_ACTIVE;
    state.currentQuestionIndex = 0;
    state.totalQuestions = state.lesson.questions ? state.lesson.questions.length : 0;
    
    console.log(`🔍 Debug: questions array length = ${state.lesson.questions ? state.lesson.questions.length : 'undefined'}`);
    console.log(`🔍 Debug: totalQuestions = ${state.totalQuestions}`);
    
    if (state.totalQuestions === 0) {
      console.log('⚠️ No questions found, ending session');
      return {
        questionType: 'session_complete',
        feedback: 'Lekce dokončena. Test není k dispozici.'
      };
    }
    
    const firstQuestion = this.formatTestQuestion(state.lesson.questions[0], state.userLanguage);
    console.log(`✅ Starting test with first question: ${firstQuestion.substring(0, 100)}...`);
    
    return {
      questionType: 'test',
      feedback: 'Lekce dokončena. Začínáme test.',
      nextQuestion: firstQuestion,
      navigationOptions: this.getNavigationOptions(state.userLanguage)
    };
  }

  // Handle test completion
  static async handleTestCompleted(userInput, state, userPhone) {
    console.log('🎓 Test completed, ending session...');
    console.log(`📊 Final score: ${state.score}/${state.totalQuestions} (${Math.round((state.score / state.totalQuestions) * 100)}%)`);
    
    // Save results (aggregate)
    try {
      await this.saveTestResults(state);
    } catch (e) {
      console.error('❌ Saving test results failed:', e.message);
    }
    
    const percentage = Math.round((state.score / state.totalQuestions) * 100);
    const feedback = this.generateTestFeedback(percentage, state.userLanguage);
    
    console.log(`📋 Test feedback: ${feedback}`);
    
    return {
      questionType: 'session_complete',
      feedback: `${feedback} Výsledek: ${state.score}/${state.totalQuestions} (${percentage}%).`,
      testResults: { score: state.score, total: state.totalQuestions, percentage }
    };
  }

  static async saveTestResults(state) {
    try {
      const TestResult = require('../models/TestResult');
      const userId = state.lesson?.user_id || null;
      const lessonTitle = state.lesson?.title || null;
      const trainingType = state.lesson?.trainingType || 'lesson_test';
      const sessionId = state.callSid || null;
      const percentage = Math.round((state.score / state.totalQuestions) * 100);

      // Save aggregate summary row
      await TestResult.create({
        userId,
        trainingType,
        lessonTitle,
        questionText: 'TEST SUMMARY',
        userAnswer: `${state.score}/${state.totalQuestions}`,
        aiEvaluation: { percentage },
        sessionId
      });

      console.log('✅ Test results saved (summary)');
    } catch (error) {
      console.error('❌ Error creating TestResult records:', error.message);
    }
  }

  // Handle navigation menu
  static async handleNavigationMenu(userInput, state, userPhone) {
    const navigationCommand = this.checkNavigationCommand(userInput);
    
    if (navigationCommand) {
      return this.handleNavigation(navigationCommand, state, userPhone);
    }
    
    return {
      questionType: 'navigation_menu',
      feedback: 'Prosím, vyberte možnost.',
      nextQuestion: this.getNavigationMenu(state.userLanguage),
      navigationOptions: this.getNavigationOptions(state.userLanguage)
    };
  }

  // Load next lesson
  static async loadNextLesson(state, userPhone) { // Uses next lesson after current
    const { getNextLesson, loadTestQuestionsFromDB } = require('./lesson-selector');
    try {
      const currentId = state.lesson?.lesson_id;
      let nextLessonRecord = null;
      if (currentId) {
        nextLessonRecord = await getNextLesson(currentId);
      }
      if (!nextLessonRecord) {
        return {
          questionType: 'navigation_menu',
          feedback: 'Žádná další lekce nenavazuje.',
          nextQuestion: this.getNavigationMenu(state.userLanguage)
        };
      }
      const questions = await loadTestQuestionsFromDB(nextLessonRecord.id);
      const nextLesson = {
        type: 'lesson',
        lesson_id: nextLessonRecord.id,
        title: nextLessonRecord.title,
        content: nextLessonRecord.content || nextLessonRecord.description,
        language: state.userLanguage,
        questions
      };
      
      if (nextLesson && nextLesson.type === 'lesson') {
        state.lesson = nextLesson;
        state.currentState = CONVERSATION_STATES.LESSON_PLAYING;
        state.currentQuestionIndex = 0;
        state.userAnswers = [];
        state.score = 0;
        
        return {
          questionType: 'lesson',
          feedback: 'Načítám další lekci.',
          nextQuestion: this.formatLessonContent(nextLesson),
          navigationOptions: this.getNavigationOptions(state.userLanguage)
        };
      } else {
        return {
          questionType: 'session_complete',
          feedback: 'Žádné další lekce nejsou k dispozici.'
        };
      }
    } catch (error) {
      console.error('❌ Error loading next lesson:', error);
      return {
        questionType: 'error',
        feedback: 'Nepodařilo se načíst další lekci.'
      };
    }
  }

  // Load previous lesson
  static async loadPreviousLesson(state, userPhone) { // Uses previous lesson before current
    const { getPreviousLesson, loadTestQuestionsFromDB } = require('./lesson-selector');
    try {
      const currentId = state.lesson?.lesson_id;
      let prevLessonRecord = null;
      if (currentId) {
        prevLessonRecord = await getPreviousLesson(currentId);
      }
      if (!prevLessonRecord) {
        return {
          questionType: 'navigation_menu',
          feedback: 'Žádná předchozí lekce není k dispozici.',
          nextQuestion: this.getNavigationMenu(state.userLanguage)
        };
      }
      const questions = await loadTestQuestionsFromDB(prevLessonRecord.id);
      const prevLesson = {
        type: 'lesson',
        lesson_id: prevLessonRecord.id,
        title: prevLessonRecord.title,
        content: prevLessonRecord.content || prevLessonRecord.description,
        language: state.userLanguage,
        questions
      };
      
      if (prevLesson && prevLesson.type === 'lesson') {
        state.lesson = prevLesson;
        state.currentState = CONVERSATION_STATES.LESSON_PLAYING;
        state.currentQuestionIndex = 0;
        state.userAnswers = [];
        state.score = 0;
        
        return {
          questionType: 'lesson',
          feedback: 'Načítám předchozí lekci.',
          nextQuestion: this.formatLessonContent(prevLesson),
          navigationOptions: this.getNavigationOptions(state.userLanguage)
        };
      } else {
        return {
          questionType: 'session_complete',
          feedback: 'Žádné předchozí lekce nejsou k dispozici.'
        };
      }
    } catch (error) {
      console.error('❌ Error loading previous lesson:', error);
      return {
        questionType: 'error',
        feedback: 'Nepodařilo se načíst předchozí lekci.'
      };
    }
  }

  // Format lesson content
  static formatLessonContent(lesson) {
    return `${lesson.title}. ${lesson.content || lesson.description || 'Praktické školení.'}`;
  }

  // Format test question
  static formatTestQuestion(question, language) {
    if (!question) return 'Otázka není k dispozici.';
    
    let formattedQuestion = question.question || 'Otázka';
    
    if (question.options && Array.isArray(question.options)) {
      formattedQuestion += ' Možnosti: ';
      question.options.forEach((option, index) => {
        const letter = String.fromCharCode(65 + index); // A, B, C, D
        formattedQuestion += `${letter}) ${option}. `;
      });
    }
    
    return formattedQuestion;
  }

  // Get navigation options
  static getNavigationOptions(language) {
    switch (language) {
      case 'en':
        return 'Say 1 to repeat, 2 for next, 3 for previous, 4 to end.';
      case 'de':
        return 'Sagen Sie 1 zum Wiederholen, 2 für nächste, 3 für vorherige, 4 zum Beenden.';
      case 'sk':
        return 'Povedzte 1 na zopakovanie, 2 na ďalšiu, 3 na predchádzajúcu, 4 na ukončenie.';
      default: // cs
        return 'Řekněte 1 pro zopakování, 2 pro další, 3 pro předchozí, 4 pro ukončení.';
    }
  }

  // Get navigation menu
  static getNavigationMenu(language) {
    switch (language) {
      case 'en':
        return 'Navigation menu: 1 - Repeat lesson, 2 - Next lesson, 3 - Previous lesson, 4 - End session.';
      case 'de':
        return 'Navigationsmenü: 1 - Lektion wiederholen, 2 - Nächste Lektion, 3 - Vorherige Lektion, 4 - Sitzung beenden.';
      case 'sk':
        return 'Navigačné menu: 1 - Zopakovať lekciu, 2 - Ďalšia lekcia, 3 - Predchádzajúca lekcia, 4 - Ukončiť reláciu.';
      default: // cs
        return 'Navigační menu: 1 - Zopakovat lekci, 2 - Další lekce, 3 - Předchozí lekce, 4 - Ukončit relaci.';
    }
  }

  // Generate test feedback
  static generateTestFeedback(percentage, language) {
    if (percentage >= 90) {
      return 'Výborně! Máte skvělé výsledky.';
    } else if (percentage >= 70) {
      return 'Dobře! Máte dobré výsledky.';
    } else if (percentage >= 50) {
      return 'Průměrně. Zkuste to znovu.';
    } else {
      return 'Potřebujete více procvičit.';
    }
  }

  // Handle lesson phase
  static async handleLessonPhase(userInput, state, userPhone) {
    console.log('📚 Lesson phase - processing');
    
    // Only transition when explicitly triggered after lesson ends
    if (userInput !== 'AUTO_START') {
      return {
        questionType: 'lesson',
        feedback: state.lesson.message,
        nextQuestion: state.lesson.content
      };
    }
    console.log('✅ Lesson completed, starting test');
    state.currentState = CONVERSATION_STATES.TEST_ACTIVE;
    state.currentQuestionIndex = 0;
    state.totalQuestions = state.lesson.questions ? state.lesson.questions.length : 0;
    state.score = 0;
    state.userAnswers = [];
    
    console.log(`🔍 Debug: questions array length = ${state.lesson.questions ? state.lesson.questions.length : 'undefined'}`);
    console.log(`🔍 Debug: totalQuestions = ${state.totalQuestions}`);
    
    if (state.totalQuestions === 0) {
      console.log('⚠️ No questions found, ending session');
      return {
        questionType: 'session_complete',
        feedback: 'Lekce dokončena. Test není k dispozici.'
      };
    }
    
    const firstQuestion = this.formatTestQuestion(state.lesson.questions[0], state.userLanguage);
    console.log(`✅ Starting test with first question: ${firstQuestion.substring(0, 100)}...`);
    
    return {
      questionType: 'test',
      feedback: 'Lekce dokončena. Začínáme test.',
      nextQuestion: firstQuestion,
      navigationOptions: this.getNavigationOptions(state.userLanguage)
    };
  }

  // Handle test phase with improved answer checking
  static async handleTestPhase(userInput, state, userPhone) {
    console.log(`🧪 Test phase - Question ${state.currentQuestionIndex + 1}/${state.totalQuestions}`);
    console.log(`🔍 Debug: currentQuestionIndex=${state.currentQuestionIndex}, totalQuestions=${state.totalQuestions}`);
    
    // Check if test is completed
    if (state.currentQuestionIndex >= state.totalQuestions) {
      console.log('🎓 Test completed, transitioning to TEST_COMPLETED state');
      state.currentState = CONVERSATION_STATES.TEST_COMPLETED;
      return this.handleTestCompleted(userInput, state, userPhone);
    }
    
    // Process test question
    const currentQuestion = state.lesson.questions[state.currentQuestionIndex];
    const isCorrect = this.checkTestAnswer(userInput, currentQuestion);
    
    if (isCorrect) {
      state.score++;
      console.log(`✅ Correct answer! Score: ${state.score}/${state.totalQuestions}`);
    } else {
      console.log(`❌ Wrong answer. Score: ${state.score}/${state.totalQuestions}`);
    }
    
    state.userAnswers.push({
      question: currentQuestion.question,
      userAnswer: userInput,
      correct: isCorrect,
      correctAnswer: currentQuestion.options[currentQuestion.correctAnswer]
    });
    
    // Save each answer immediately to database (aligned with TestResult schema)
    try {
      const TestResult = require('../models/TestResult');
      const userId = state.lesson?.user_id || null;
      const lessonTitle = state.lesson?.title || null;
      const trainingType = state.lesson?.trainingType || 'lesson_test';

      await TestResult.create({
        userId,
        trainingType,
        lessonTitle,
        questionText: currentQuestion.question,
        userAnswer: userInput,
        recordingUrl: state.recordingUrl || null,
        recordingDuration: state.recordingDuration || null,
        sessionId: state.callSid || null
      });
      state.savedIndividually = true;
      console.log(`💾 Answer saved to database: ${isCorrect ? 'CORRECT' : 'WRONG'}`);
    } catch (error) {
      console.error('❌ Error saving answer to database:', error.message);
    }
    
    state.currentQuestionIndex++;
    
    // Get next question or complete test
    if (state.currentQuestionIndex < state.totalQuestions) {
      const nextQuestion = this.formatTestQuestion(state.lesson.questions[state.currentQuestionIndex], state.userLanguage);
      
      return {
        questionType: 'test',
        feedback: isCorrect ? 'Správně!' : 'Špatně.',
        nextQuestion: nextQuestion,
        navigationOptions: this.getNavigationOptions(state.userLanguage)
      };
    } else {
      state.currentState = CONVERSATION_STATES.TEST_COMPLETED;
      return this.handleTestCompleted(userInput, state, userPhone);
    }
  }

  // Enhanced test answer checking with fuzzy matching
  static checkTestAnswer(userInput, question) {
    if (!question || !question.correctAnswer) return false;
    
    const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const cleanInput = normalize(userInput);
    const correctAnswer = question.options[question.correctAnswer];
    
    if (!correctAnswer) return false;
    
    console.log(`🔍 Checking answer: "${cleanInput}" against "${correctAnswer}"`);
    console.log(`🔍 Question options: ${question.options.join(', ')}`);
    console.log(`🔍 Correct answer index: ${question.correctAnswer}`);
    
    // Levenshtein distance function
    const levenshtein = (a, b) => {
      if (a.length === 0) return b.length;
      if (b.length === 0) return a.length;
      const matrix = Array(b.length + 1).fill().map(() => Array(a.length + 1).fill(0));
      for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
      for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
      for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
          matrix[j][i] = Math.min(
            matrix[j-1][i] + 1,
            matrix[j][i-1] + 1,
            matrix[j-1][i-1] + (a[i-1] === b[j-1] ? 0 : 1)
          );
        }
      }
      return matrix[b.length][a.length];
    };
    
    // Check exact match (diacritics-insensitive)
    if (cleanInput.includes(normalize(correctAnswer))) {
      console.log('✅ Exact match found');
      return true;
    }
    
    // Check letter match (A, B, C, D)
    const correctLetter = String.fromCharCode(65 + question.correctAnswer);
    if (cleanInput.includes(correctLetter.toLowerCase())) {
      console.log('✅ Letter match found');
      return true;
    }
    
    // Check number match (1, 2, 3, 4)
    const correctNumber = question.correctAnswer + 1;
    if (cleanInput.includes(correctNumber.toString())) {
      console.log('✅ Number match found');
      return true;
    }
    
    // Check Czech number words + variants without diacritics
    const czechNumbers = ['jedna', 'dva', 'tri', 'ctyri'];
    if (cleanInput.includes(czechNumbers[question.correctAnswer])) {
      console.log('✅ Czech number match found');
      return true;
    }
    
    // Check specific Czech number phrases (for common medical/scientific numbers)
    const specificNumbers = {
      '206': ['dveste sest', 'dvěstě šest', 'dvesta sest', 'dvě stě šest', '206'],
      '100': ['sto', 'jedna sta', '100'],
      '365': ['tri sta sedesatpet', 'tři sta šedesát pět', '365'],
      '52': ['padesatdva', 'padesát dva', '52']
    };
    
    for (const [number, phrases] of Object.entries(specificNumbers)) {
      if (correctAnswer === number) {
        for (const phrase of phrases) {
          if (cleanInput.includes(normalize(phrase))) {
            console.log(`✅ Specific Czech number match found: "${phrase}" for ${number}`);
            return true;
          }
        }
      }
    }
    
    // Check fuzzy match with Levenshtein distance (75% similarity)
    const normalizedCorrect = normalize(correctAnswer);
    const distance = levenshtein(cleanInput, normalizedCorrect);
    const similarity = 1 - (distance / Math.max(cleanInput.length, normalizedCorrect.length));
    
    if (similarity >= 0.6) {
      console.log(`✅ Fuzzy match found: ${Math.round(similarity * 100)}% similarity`);
      return true;
    }
    
    // Check if any word in input is similar to correct answer
    const words = cleanInput.split(' ');
    for (const word of words) {
      if (word.length >= 3) {
        const wordDistance = levenshtein(word, normalizedCorrect);
        const wordSimilarity = 1 - (wordDistance / Math.max(word.length, normalizedCorrect.length));
        if (wordSimilarity >= 0.7) {
          console.log(`✅ Word similarity match: "${word}" ~= "${normalizedCorrect}" (${Math.round(wordSimilarity * 100)}%)`);
          return true;
        }
      }
    }
    
    // Check partial word match (50% threshold) - original logic as fallback
    const correctWords = normalizedCorrect.split(' ');
    let matchCount = 0;
    for (const word of words) {
      for (const correctWord of correctWords) {
        if (word.includes(correctWord) || correctWord.includes(word)) {
          matchCount++;
        }
      }
    }
    
    const matchPercentage = (matchCount / Math.max(words.length, correctWords.length)) * 100;
    if (matchPercentage >= 50) {
      console.log(`✅ Partial match found: ${matchPercentage}%`);
      return true;
    }
    
    console.log('❌ No match found');
    return false;
  }

  // Update recording info
  static updateRecordingInfo(callSid, recordingUrl, recordingDuration) {
    const state = this.getState(callSid);
    if (state) {
      state.recordingUrl = recordingUrl;
      state.recordingDuration = recordingDuration;
    }
  }
}

module.exports = { VoiceNavigationManager, CONVERSATION_STATES, NAVIGATION_COMMANDS }; 