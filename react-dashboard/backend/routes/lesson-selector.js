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
    const testQuestions = await loadTestQuestionsFromDB(targetLesson.id);
    
    // Create lesson response with language support
    const lesson = {
        type: 'lesson',
      lesson_id: targetLesson.id,
      user_id: user.id,
      title: targetLesson.title,
      message: getLocalizedMessage(userLanguage, user.name, targetLesson.title),
      content: targetLesson.content || targetLesson.description || getLocalizedContent(userLanguage),
      questions: testQuestions.length > 0 ? testQuestions : generateQuestionsFromLesson(targetLesson),  // Fallback to hardcoded if no DB questions
      language: userLanguage
    };
    
    console.log(`📋 Generated lesson:`, {
      id: lesson.lesson_id,
      title: lesson.title,
      questionsCount: lesson.questions.length
    });
    
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
      }
    ];
  }
}

// Load test questions from database for a lesson
async function loadTestQuestionsFromDB(lessonId) {
  try {
    console.log(`🔍 Loading test questions for lesson ID: ${lessonId}`);
    
    // Find tests for this lesson
    const tests = await Test.findAll({
      where: { lessonId: lessonId }
    });
    
    console.log(`📋 Found ${tests.length} tests for lesson ${lessonId}`);
    
    if (tests.length === 0) {
      console.log(`❌ No tests found for lesson ${lessonId}`);
      return [];
    }
    
    // Get questions from the first test
    const test = tests[0];
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
      return `Hello ${userName}! Let's start with the test "${lessonTitle}".`;
    case 'de':
      return `Guten Tag ${userName}! Wir beginnen mit dem Test "${lessonTitle}".`;
    case 'sk':
      return `Dobrý deň ${userName}! Začneme s testom "${lessonTitle}".`;
    default: // cs
      return `Dobrý den ${userName}! Začneme s testem "${lessonTitle}".`;
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
  const next = await Lesson.findOne({ where: { id: { [require('sequelize').Op.gt]: currentLessonId } }, order: [['id', 'ASC']] });
  return next;
}

async function getPreviousLesson(currentLessonId) {
  const prev = await Lesson.findOne({ where: { id: { [require('sequelize').Op.lt]: currentLessonId } }, order: [['id', 'DESC']] });
  return prev;
}

module.exports = { getLessonForUser, getLocalizedMessage, getLocalizedContent, getLocalizedInstructions, loadTestQuestionsFromDB, getNextLesson, getPreviousLesson };
