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
      score: 0,
      recordingUrl: null,
      recordingDuration: null
    });
  }
  
  // Get current state
  static getState(callSid) {
    const state = conversationState.get(callSid) || null;
    console.log('🔍 DEBUG: getState for callSid:', callSid, 'found:', !!state);
    if (state) {
      console.log('🔍 DEBUG: State details:', {
        currentQuestionIndex: state.currentQuestionIndex,
        score: state.score,
        userAnswersLength: state.userAnswers ? state.userAnswers.length : 0,
        recordingUrl: state.recordingUrl ? 'SET' : 'NOT SET'
      });
    }
    return state;
  }
  
  // Update recording information
  static updateRecordingInfo(callSid, recordingUrl, recordingDuration) {
    const state = conversationState.get(callSid);
    if (state) {
      state.recordingUrl = recordingUrl;
      state.recordingDuration = recordingDuration;
      console.log('🔍 DEBUG: Updated recording info:', {
        callSid: callSid,
        recordingUrl: recordingUrl,
        recordingDuration: recordingDuration
      });
    }
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
    
    // Initialize only if this is the first question (currentQuestionIndex is 0)
    if (state.currentQuestionIndex === 0) {
      console.log('🔍 DEBUG: First question, initializing state');
      if (!state.score) {
        state.score = 0;
        console.log('🔍 DEBUG: Initialized score to 0');
      }
      if (!state.userAnswers) {
        state.userAnswers = [];
        console.log('🔍 DEBUG: Initialized userAnswers array');
      }
    } else {
      console.log('🔍 DEBUG: Not first question, preserving existing state');
    }
    
    const currentQuestionIndex = state.currentQuestionIndex;
    
    // Validate question index
    if (currentQuestionIndex >= state.lesson.questions.length) {
      console.log('❌ ERROR: currentQuestionIndex out of bounds:', {
        currentQuestionIndex: currentQuestionIndex,
        totalQuestions: state.lesson.questions.length
      });
      // Reset to last valid question
      state.currentQuestionIndex = state.lesson.questions.length - 1;
      console.log('🔧 FIXED: Reset currentQuestionIndex to:', state.currentQuestionIndex);
    }
    
    const currentQuestion = state.lesson.questions[state.currentQuestionIndex];
    
    console.log('🔍 DEBUG: Question index and data:', {
      currentQuestionIndex: state.currentQuestionIndex,
      totalQuestions: state.lesson.questions.length,
      currentQuestion: currentQuestion
    });
    
    console.log(`🎯 Current question:`, currentQuestion);
    
    let feedback = "";
    let isCorrect = false;
    
    // Check if this is a test question with multiple choice options
    if (currentQuestion && typeof currentQuestion === 'object' && currentQuestion.options) {
      // This is a multiple choice test question from database
      console.log('🔍 DEBUG: Checking test answer:', {
        transcribedText: transcribedText,
        question: currentQuestion.question,
        options: currentQuestion.options,
        correctAnswer: currentQuestion.correctAnswer,
        correctAnswerText: currentQuestion.options[currentQuestion.correctAnswer],
        questionIndex: state.currentQuestionIndex,
        totalQuestions: state.lesson.questions.length
      });
      
      // VALIDATE DATABASE DATA
      if (!currentQuestion.options || !Array.isArray(currentQuestion.options)) {
        console.error('❌ ERROR: Invalid question options:', currentQuestion);
        feedback = "Chyba v databázi - neplatné otázky. Kontaktujte administrátora.";
        return {
          feedback: feedback,
          nextQuestion: "",
          questionType: 'error'
        };
      }
      
      if (currentQuestion.correctAnswer === undefined || currentQuestion.correctAnswer < 0 || currentQuestion.correctAnswer >= currentQuestion.options.length) {
        console.error('❌ ERROR: Invalid correctAnswer index:', {
          correctAnswer: currentQuestion.correctAnswer,
          optionsLength: currentQuestion.options.length,
          question: currentQuestion.question
        });
        feedback = "Chyba v databázi - neplatná správná odpověď. Kontaktujte administrátora.";
        return {
          feedback: feedback,
          nextQuestion: "",
          questionType: 'error'
        };
      }
      
      isCorrect = this.checkTestAnswer(transcribedText, currentQuestion);
      
      console.log('🔍 DEBUG: Answer evaluation result:', {
        isCorrect: isCorrect,
        transcribedText: transcribedText,
        correctAnswerText: currentQuestion.options[currentQuestion.correctAnswer],
        userAnswer: transcribedText,
        questionText: currentQuestion.question,
        allOptions: currentQuestion.options
      });
      
      console.log('🔍 DEBUG: Language analysis:', {
        questionLanguage: 'Czech',
        transcribedLanguage: transcribedText.includes('á') || transcribedText.includes('č') || transcribedText.includes('š') ? 'Czech' : 'English/Other',
        containsCzechChars: transcribedText.includes('á') || transcribedText.includes('č') || transcribedText.includes('š'),
        containsEnglishWords: transcribedText.toLowerCase().includes('a') || transcribedText.toLowerCase().includes('b') || transcribedText.toLowerCase().includes('c') || transcribedText.toLowerCase().includes('d')
      });
    
      if (isCorrect) {
        state.score++;
        feedback = "Výborně! Správná odpověď. ";
        console.log('✅ CORRECT ANSWER DETECTED!');
      } else {
        // Get correct answer using correctAnswer index
        const correctAnswerText = currentQuestion.options[currentQuestion.correctAnswer] || 'neznámá';
        
        // Generate helpful feedback based on question content
        let explanation = this.generateExplanation(currentQuestion, correctAnswerText);
        
        // ADD QUESTION VALIDATION
        console.log('🔍 DEBUG: Question validation:', {
          questionText: currentQuestion.question,
          userAnswer: transcribedText,
          correctAnswerText: correctAnswerText,
          allOptions: currentQuestion.options,
          correctAnswerIndex: currentQuestion.correctAnswer
        });
        
        // Check if the question and answer make sense
        const questionText = currentQuestion.question.toLowerCase();
        if (questionText.includes('kolik') && questionText.includes('kostí') && !correctAnswerText.includes('206') && !correctAnswerText.includes('dvě stě')) {
          console.error('❌ DATABASE ERROR: Question about bones but wrong answer!');
          console.error('Question:', currentQuestion.question);
          console.error('Correct answer should be about 206 bones, but got:', correctAnswerText);
          
          // AUTO-FIX: Try to find the correct answer in options
          const correctOptionIndex = currentQuestion.options.findIndex(option => 
            option.includes('206') || option.includes('dvě stě') || option.includes('206')
          );
          
          if (correctOptionIndex !== -1) {
            console.log('🔧 AUTO-FIX: Found correct bone answer at index:', correctOptionIndex);
            currentQuestion.correctAnswer = correctOptionIndex;
            const fixedCorrectAnswer = currentQuestion.options[correctOptionIndex];
            console.log('🔧 AUTO-FIX: Updated correct answer to:', fixedCorrectAnswer);
            
            // Re-check the answer with the fixed correct answer
            const fixedIsCorrect = this.checkTestAnswer(transcribedText, currentQuestion);
            if (fixedIsCorrect) {
              console.log('✅ AUTO-FIX: Answer is now correct!');
              state.score++;
              feedback = "Výborně! Správná odpověď. ";
              isCorrect = true;
            }
          }
        }
        
        feedback = `Bohužel ne. Správná odpověď je: ${correctAnswerText}. ${explanation} `;
        console.log('❌ WRONG ANSWER - User said:', transcribedText, 'Expected:', correctAnswerText);
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
      
      // VALIDATE EACH QUESTION
      questions.forEach((question, index) => {
        console.log(`🔍 DEBUG: Question ${index + 1}:`, {
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          correctAnswerText: question.options ? question.options[question.correctAnswer] : 'N/A'
        });
        
        // Validate question structure
        if (!question.question) {
          console.error(`❌ ERROR: Question ${index + 1} missing question text`);
        }
        if (!question.options || !Array.isArray(question.options)) {
          console.error(`❌ ERROR: Question ${index + 1} missing or invalid options`);
        }
        if (question.correctAnswer === undefined || question.correctAnswer < 0 || question.correctAnswer >= (question.options ? question.options.length : 0)) {
          console.error(`❌ ERROR: Question ${index + 1} invalid correctAnswer index:`, {
            correctAnswer: question.correctAnswer,
            optionsLength: question.options ? question.options.length : 0
          });
        }
      });
      
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
    
    console.log('🔍 DEBUG: Answer evaluation started:', {
      userText: userText,
      correctAnswerIndex: correctAnswerIndex,
      correctAnswerText: correctAnswerText,
      allOptions: questionObj.options
    });
    
    // 1. Check for letter answers (A, B, C, D) - both uppercase and lowercase
    const letterMatch = userText.match(/[abcdABCD]/);
    if (letterMatch) {
      const userLetter = letterMatch[0].toLowerCase();
      const userLetterIndex = userLetter.charCodeAt(0) - 97; // a=0, b=1, c=2, d=3
      const isCorrect = userLetterIndex === correctAnswerIndex;
      
      console.log('🔍 DEBUG: Letter answer detected:', {
        userLetter: userLetter,
        userLetterIndex: userLetterIndex,
        correctAnswerIndex: correctAnswerIndex,
        isCorrect: isCorrect
      });
      
      return isCorrect;
    }
    
    // 2. Check for Czech number words (for numeric answers)
    if (correctAnswerText && !isNaN(correctAnswerText)) {
      const czechNumbers = {
        'jedna': '1', 'dva': '2', 'tři': '3', 'čtyři': '4', 'pět': '5',
        'šest': '6', 'sedm': '7', 'osm': '8', 'devět': '9', 'deset': '10',
        'sto': '100', 'dvě stě': '200', 'dvě stě šest': '206',
        'tři sta': '300', 'tři sta šedesát pět': '365'
      };
      
      // Check if user said a Czech number
      for (const [czechWord, number] of Object.entries(czechNumbers)) {
        if (userText.includes(czechWord)) {
          const isCorrect = number === correctAnswerText;
          console.log('🔍 DEBUG: Czech number detected:', {
            czechWord: czechWord,
            number: number,
            correctAnswerText: correctAnswerText,
            isCorrect: isCorrect
          });
          return isCorrect;
        }
      }
    }
    
    // 3. Check for exact text match with correct answer
    if (correctAnswerText && typeof correctAnswerText === 'string') {
      const isCorrect = userText.includes(correctAnswerText.toLowerCase());
      console.log('🔍 DEBUG: Text match check:', {
        userText: userText,
        correctAnswerText: correctAnswerText.toLowerCase(),
        isCorrect: isCorrect
      });
      return isCorrect;
    }
    
    // 4. Check for partial word matches (for longer answers)
    if (correctAnswerText && typeof correctAnswerText === 'string') {
      const correctWords = correctAnswerText.toLowerCase().split(' ');
      const userWords = userText.split(' ');
      
      // Check if at least 50% of correct words are in user's answer
      const matchingWords = correctWords.filter(word => 
        userWords.some(userWord => userWord.includes(word) || word.includes(userWord))
      );
      
      const matchPercentage = matchingWords.length / correctWords.length;
      const isCorrect = matchPercentage >= 0.5;
      
      console.log('🔍 DEBUG: Partial word match:', {
        correctWords: correctWords,
        userWords: userWords,
        matchingWords: matchingWords,
        matchPercentage: matchPercentage,
        isCorrect: isCorrect
      });
      
      return isCorrect;
    }
    
    console.log('🔍 DEBUG: No match found, answer is incorrect');
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
        
        console.log('🔍 DEBUG: TestResult model loaded:', !!TestResult);
        console.log('🔍 DEBUG: User model loaded:', !!User);
        
        // Find user by phone from conversation state
        let userId = state.lesson.user_id;
        if (!userId) {
          // Try to find user by phone number from conversation
          console.log('🔍 DEBUG: Looking for user by phone number...');
          try {
            const { User } = require('../models');
            const user = await User.findOne({
              where: { phone: state.lesson.userPhone || state.lesson.phone }
            });
            
            if (user) {
              userId = user.id;
              console.log('✅ Found user by phone:', { userId: userId, phone: user.phone });
            } else {
              console.log('⚠️ User not found by phone, using default');
              userId = 1; // Fallback to admin user
            }
          } catch (error) {
            console.error('❌ Error finding user by phone:', error.message);
            userId = 1; // Fallback to admin user
          }
        }
        
        // Save each answer as a separate TestResult record
        try {
          for (let i = 0; i < state.userAnswers.length; i++) {
            const answer = state.userAnswers[i];
            
            // Get recording URL from conversation state if available
            const recordingUrl = state.recordingUrl || null;
            const recordingDuration = state.recordingDuration || null;
            
            console.log('🔍 DEBUG: Saving TestResult:', {
              userId: userId,
              questionText: answer.question,
              userAnswer: answer.userAnswer,
              isCorrect: answer.isCorrect,
              recordingUrl: recordingUrl,
              sessionId: callSid
            });
            
            await TestResult.create({
              userId: userId,
              trainingType: state.lesson.title,
              lessonTitle: state.lesson.title,
              contentId: state.lesson.lesson_id,
              questionText: answer.question,
              userAnswer: answer.userAnswer,
              recordingUrl: recordingUrl,
              recordingDuration: recordingDuration,
              aiEvaluation: {
                isCorrect: answer.isCorrect,
                correctAnswer: answer.correctAnswer,
                feedback: answer.isCorrect ? 'Správná odpověď' : `Správná odpověď je: ${answer.correctAnswer}`,
                questionNumber: i + 1,
                evaluationDate: new Date().toISOString()
              },
              completionPercentage: answer.isCorrect ? 100 : 0,
              qualityScore: answer.isCorrect ? 100 : 0,
              sessionId: callSid
            });
          }
        } catch (error) {
          console.error('❌ Error creating TestResult records:', error.message);
          console.error('📋 Full error details:', error);
          console.log('⚠️ Test results not saved, but continuing...');
          
          // Try to save at least basic information
          try {
            console.log('🔄 Attempting to save basic test result...');
            await TestResult.create({
              userId: userId,
              trainingType: state.lesson.title,
              lessonTitle: state.lesson.title,
              contentId: state.lesson.lesson_id,
              questionText: 'Test completion',
              userAnswer: 'Test completed',
              recordingUrl: null,
              recordingDuration: null,
              aiEvaluation: {
                isCorrect: false,
                correctAnswer: 'N/A',
                feedback: 'Test completed with errors',
                questionNumber: 0
              },
              completionPercentage: 0,
              qualityScore: 0,
              sessionId: callSid
            });
            console.log('✅ Basic test result saved successfully');
          } catch (basicError) {
            console.error('❌ Even basic test result save failed:', basicError.message);
          }
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
     
     console.log('🔍 DEBUG: Generating explanation for:', {
       question: question,
       correctAnswer: correctAnswer
     });
     
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
     return `Správná odpověď je: ${correctAnswer}. Zapamatujte si to pro příště.`;
   }
}

module.exports = { ConversationManager };
