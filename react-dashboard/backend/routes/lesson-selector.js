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
      training_type: user.training_type
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
    
    console.log(`✅ Found user: ${user.name}, training type: ${user.training_type}`);
    
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
    
    // Create lesson response
    const lesson = {
      type: 'lesson',
      lesson_id: targetLesson.id,
      user_id: user.id,
      title: targetLesson.title,
      message: `Dobrý den ${user.name}! Začneme s testem "${targetLesson.title}".`,
      content: targetLesson.content || targetLesson.description || 'Praktické školení podle nahraných materiálů.',
      questions: testQuestions.length > 0 ? testQuestions : generateQuestionsFromLesson(targetLesson)  // Fallback to hardcoded if no DB questions
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
      'Co víte o obráběcích kapalinách a jejich použití?',
      'Jaké druhy obráběcích kapalin znáte?',
      'Jak se používají obráběcí kapaliny ve vaší práci?',
      'Jaká bezpečnostní opatření dodržujete při práci s obráběcími kapalinami?'
    ];
  } else if (lessonTitle.includes('lidské tělo')) {
    return [
      'Popište mi hlavní části lidského těla.',
      'Co víte o anatomii člověka?',
      'Jak fungují základní tělesné systémy?',
      'Jaké orgány považujete za nejdůležitější a proč?'
    ];
  } else {
    // Generic questions for any lesson
    return [
      `Na základě lekce "${lesson.title}", vysvětlete mi hlavní téma.`,
      'Co je podle vás nejdůležitější informace z této lekce?',
      'Jak byste využili tyto znalosti ve své práci nebo životě?',
      'Máte k probranému tématu nějaké dotazy nebo připomínky?'
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
    
    const questions = JSON.parse(test.questions || '[]');
    
    console.log(`✅ Loaded ${questions.length} questions from database:`, questions.map(q => q.question || q.text));
    
    return questions;
    
  } catch (error) {
    console.error(`❌ Error loading test questions from DB:`, error.message);
    return [];
  }
}

module.exports = { getLessonForUser };
