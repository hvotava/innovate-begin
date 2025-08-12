const { User, Lesson, Test } = require('../models');

// Get lesson content for user - start with first available database lesson
async function getLessonForUser(phoneNumber) {
  try {
    console.log(`🎯 DEBUG: Finding lesson for phone: ${phoneNumber}`);
    
    // Find user by phone number
    const user = await User.findOne({
      where: { phone: phoneNumber }
    });
    
    console.log(`🔍 DEBUG: User search result:`, user ? {
      id: user.id,
      name: user.name,
      phone: user.phone,
      training_type: user.training_type,
      language: user.language
    } : null);
    
    if (!user) {
      console.log(`❌ User not found for phone: ${phoneNumber}, using default lesson`);
      // Get first available lesson from database
      const firstLesson = await Lesson.findOne({
        order: [['id', 'ASC']]
      });
      
      if (firstLesson) {
        return {
          type: 'lesson',
          lesson_id: firstLesson.id,
          user_id: 1, // Fallback to admin user when phone not found
          title: firstLesson.title,
          message: `Vítejte! Začneme s lekcí "${firstLesson.title}".`,
          content: firstLesson.content || firstLesson.description || 'Praktické školení podle materiálů.',
          questions: generateQuestionsFromLesson(firstLesson)
        };
      }
      
      return {
        type: 'error',
        message: 'Omlouvám se, nejsou k dispozici žádné lekce. Kontaktujte administrátora.'
      };
    }
    
    console.log(`✅ Found user: ${user.name}, training type: ${user.training_type}, language: ${user.language}`);
    
    // Get user's preferred language
    const userLanguage = user.language || 'cs';
    console.log(`🌍 User language: ${userLanguage}`);
    
    // Get lesson by user's training_type (which is now lesson ID) or first lesson
    let targetLesson = null;
    
    if (user.training_type && user.training_type !== '') {
      // Try to find lesson by ID (training_type now contains lesson ID)
      targetLesson = await Lesson.findByPk(parseInt(user.training_type));
      console.log(`🔍 Looking for lesson ID: ${user.training_type}, found: ${targetLesson ? 'YES' : 'NO'}`);
    }
    
    // If no specific lesson or lesson not found, get first available lesson
    if (!targetLesson) {
      targetLesson = await Lesson.findOne({
        order: [['id', 'ASC']]
      });
      console.log(`📚 Using first available lesson: ${targetLesson ? targetLesson.title : 'NONE'}`);
    }
    
    if (!targetLesson) {
      return {
        type: 'error',
        message: 'Omlouvám se, nejsou k dispozici žádné lekce. Kontaktujte administrátora.'
      };
    }
    
    // Load test questions from database instead of hardcoded ones
    console.log(`📚 Loading test questions for lesson ID: ${targetLesson.id}`);
    console.log(`📚 Lesson title: ${targetLesson.title}`);
    const testQuestions = await loadTestQuestionsFromDB(targetLesson.id);
    
    console.log(`📊 Lesson ${targetLesson.id}: ${testQuestions.length} questions loaded from database`);
    if (testQuestions.length === 0) {
      console.log(`⚠️ No questions found in database for lesson ${targetLesson.id}, will show empty test`);
    } else {
      console.log(`✅ Questions found:`, testQuestions.map(q => q.question || q.text));
    }
    
    // Create lesson response with language support
    const lesson = {
        type: 'lesson',
      lesson_id: targetLesson.id,
      user_id: user.id,
      title: targetLesson.title,
      message: getLocalizedMessage(userLanguage, user.name, targetLesson.title),
      content: targetLesson.content || targetLesson.description || getLocalizedContent(userLanguage),
      questions: testQuestions,  // Use only database questions
      language: userLanguage
    };
    
    console.log(`📋 Generated lesson:`, {
      id: lesson.lesson_id,
      user_id: lesson.user_id,
      title: lesson.title,
      questionsCount: lesson.questions.length
    });
    console.log(`🔍 DEBUG: Lesson will be saved with user_id: ${lesson.user_id}`);
    
    return lesson;
    
  } catch (error) {
    console.error('❌ Error finding lesson:', error.message);
    return {
      type: 'error',
      message: 'Omlouvám se, došlo k chybě. Zkuste to prosím později.'
    };
  }
}

// Generate practical questions based on lesson content
function generateQuestionsFromLesson(lesson) {
  const lessonTitle = lesson.title.toLowerCase();
  
  // Generate specific questions based on lesson topic
  if (lessonTitle.includes('obráběcí kapaliny')) {
    return [
      {
        question: 'Co víte o obráběcích kapalinách a jejich použití?',
        options: ['Používají se k chlazení', 'Používají se k mazání', 'Používají se k čištění', 'Všechny odpovědi'],
        correctAnswer: 3
      },
      {
        question: 'Jaké druhy obráběcích kapalin znáte?',
        options: ['Vodní', 'Olejové', 'Emulzní', 'Všechny druhy'],
        correctAnswer: 3
      }
    ];
  } else if (lessonTitle.includes('lidské tělo')) {
    return [
      {
        question: 'Který orgán je zodpovědný za pumpování krve?',
        options: ['Mozek', 'Srdce', 'Plíce', 'Játra'],
        correctAnswer: 1
      },
      {
        question: 'Jaký orgán je zodpovědný za dýchání?',
        options: ['Žaludek', 'Mozek', 'Plíce', 'Játra'],
        correctAnswer: 2
      }
    ];
  } else {
    // Generic questions for any lesson with multiple choice format
    return [
      {
        question: `Na základě lekce "${lesson.title}", co je hlavní téma?`,
        options: ['Praktické školení', 'Teoretické znalosti', 'Bezpečnostní opatření', 'Všechny odpovědi'],
        correctAnswer: 0
      },
      {
        question: 'Co je podle vás nejdůležitější informace z této lekce?',
        options: ['Teoretické znalosti', 'Praktické dovednosti', 'Bezpečnostní pravidla', 'Všechny informace'],
        correctAnswer: 3
      },
      {
        question: 'Jak byste využili tyto znalosti ve své práci?',
        options: ['Pro lepší výkon', 'Pro bezpečnost', 'Pro komunikaci', 'Všechny možnosti'],
        correctAnswer: 3
      },
      {
        question: 'Co je nejdůležitější při aplikaci těchto znalostí?',
        options: ['Přesnost', 'Bezpečnost', 'Rychlost', 'Všechny faktory'],
        correctAnswer: 3
      },
      {
        question: 'Jak byste shrnuli tuto lekci v jedné větě?',
        options: ['Praktické školení', 'Bezpečnostní opatření', 'Teoretické znalosti', 'Komplexní přístup'],
        correctAnswer: 3
      }
    ];
  }
}

// Load test questions from database for a lesson
async function loadTestQuestionsFromDB(lessonId) {
  try {
    console.log(`🔍 Loading test questions for lesson ID: ${lessonId}`);
    
    // Find test with same ID as lesson (Varianta A: test.id = lesson.id)
    const test = await Test.findByPk(lessonId);
    
    if (!test) {
      console.log(`❌ No test found with ID ${lessonId} (matching lesson ID)`);
      return [];
    }
    
    console.log(`📋 Found test with ID ${test.id} for lesson ${lessonId}`);
    console.log(`📝 Using test: ${test.title} (ID: ${test.id})`);
    console.log(`📝 Raw questions data:`, test.questions);
    
    // Handle both JSON string and already parsed object
    let questions;
    if (typeof test.questions === 'string') {
      questions = JSON.parse(test.questions || '[]');
    } else {
      questions = test.questions || [];
    }
    
    console.log(`✅ Loaded ${questions.length} questions from database:`, questions.map(q => q.question || q.text));
    console.log(`🔍 DEBUG: Full question structures:`, questions.map((q, i) => ({
      index: i,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      correctAnswerType: typeof q.correctAnswer,
      type: q.type,
      hasOptions: !!q.options,
      optionsLength: q.options?.length
    })));
    
    return questions;
    
  } catch (error) {
    console.error(`❌ Error loading test questions from DB:`, error.message);
    return [];
  }
}

// Localization functions
function getLocalizedMessage(language, userName, lessonTitle) {
  switch (language) {
    case 'en':
      return `Starting training: "${lessonTitle}".`;
    case 'de':
      return `Beginnen mit Schulung: "${lessonTitle}".`;
    case 'sk':
      return `Začíname so školením: "${lessonTitle}".`;
    default: // cs
      return `Začínáme školení: "${lessonTitle}".`;
  }
}

function getLocalizedContent(language) {
  switch (language) {
    case 'en':
      return 'Practical training based on uploaded materials.';
    case 'de':
      return 'Praktisches Training basierend auf hochgeladenen Materialien.';
    case 'sk':
      return 'Praktické školenie podľa nahraných materiálov.';
    default: // cs
      return 'Praktické školení podle nahraných materiálů.';
  }
}

function getLocalizedInstructions(language) {
  switch (language) {
    case 'en':
      return 'After the beep, say your answer clearly in English. Say the letter A, B, C or D. Press hash when finished.';
    case 'de':
      return 'Nach dem Piepton sagen Sie Ihre Antwort deutlich auf Deutsch. Sagen Sie den Buchstaben A, B, C oder D. Drücken Sie Hash wenn fertig.';
    case 'sk':
      return 'Po pípnutí povedzte svoju odpoveď slovensky nahlas a jasne. Povedzte písmeno A, B, C alebo D. Stlačte mriežku keď dokončíte.';
    default: // cs
      return 'Po pípnutí řekněte svoji odpověď česky nahlas a jasně. Řekněte písmeno A, B, C nebo D. Stiskněte mřížku když dokončíte.';
  }
}

async function getNextLesson(currentLessonId) {
  try {
    console.log(`🔍 Finding next lesson after lesson ID: ${currentLessonId}`);
    
    // First get the current lesson to know its trainingId and order
    const currentLesson = await Lesson.findByPk(currentLessonId);
    if (!currentLesson) {
      console.log(`❌ Current lesson ${currentLessonId} not found`);
      return null;
    }
    
    console.log(`📚 Current lesson: ${currentLesson.title}, trainingId: ${currentLesson.trainingId}, lesson_number: ${currentLesson.lesson_number}`);
    
    // Find next lesson in the same training by lesson_number or order_in_course
    let next = null;
    
    // Try to find by lesson_number first (if set)
    if (currentLesson.lesson_number !== null && currentLesson.lesson_number !== undefined) {
      next = await Lesson.findOne({ 
        where: { 
          trainingId: currentLesson.trainingId,
          lesson_number: { [require('sequelize').Op.gt]: currentLesson.lesson_number }
        }, 
        order: [['lesson_number', 'ASC']] 
      });
      console.log(`🔍 Search by lesson_number (${currentLesson.lesson_number + 1}+): ${next ? 'FOUND' : 'NOT FOUND'}`);
    }
    
    // If not found by lesson_number, try by order_in_course
    if (!next && currentLesson.order_in_course !== null && currentLesson.order_in_course !== undefined) {
      next = await Lesson.findOne({ 
        where: { 
          trainingId: currentLesson.trainingId,
          order_in_course: { [require('sequelize').Op.gt]: currentLesson.order_in_course }
        }, 
        order: [['order_in_course', 'ASC']] 
      });
      console.log(`🔍 Search by order_in_course (${currentLesson.order_in_course + 1}+): ${next ? 'FOUND' : 'NOT FOUND'}`);
    }
    
    // If still not found, fallback to ID-based search within same training
    if (!next) {
      next = await Lesson.findOne({ 
        where: { 
          trainingId: currentLesson.trainingId,
          id: { [require('sequelize').Op.gt]: currentLessonId }
        }, 
        order: [['id', 'ASC']] 
      });
      console.log(`🔍 Search by ID (${currentLessonId + 1}+) within same training: ${next ? 'FOUND' : 'NOT FOUND'}`);
    }
    
    if (next) {
      console.log(`✅ Found next lesson: ${next.title} (ID: ${next.id})`);
    } else {
      console.log(`⚠️ No next lesson found in training ${currentLesson.trainingId}`);
    }
    
    return next;
  } catch (error) {
    console.error('❌ Error in getNextLesson:', error);
    return null;
  }
}

async function getPreviousLesson(currentLessonId) {
  const prev = await Lesson.findOne({ where: { id: { [require('sequelize').Op.lt]: currentLessonId } }, order: [['id', 'DESC']] });
  return prev;
}

module.exports = { getLessonForUser, getLocalizedMessage, getLocalizedContent, getLocalizedInstructions, loadTestQuestionsFromDB, getNextLesson, getPreviousLesson };
