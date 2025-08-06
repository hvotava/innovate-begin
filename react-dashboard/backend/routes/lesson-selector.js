const { User } = require('../models');

// Get lesson content for user based on their progress
async function getLessonForUser(phoneNumber) {
  try {
    console.log(`🎯 Finding lesson for phone: ${phoneNumber}`);
    
    // Find user by phone number
    const user = await User.findOne({
      where: { phone: phoneNumber }
    });
    
    if (!user) {
      console.log(`❌ User not found for phone: ${phoneNumber}`);
      return {
        type: 'placement_test',
        title: 'Úvodní test',
        message: 'Vítejte! Prosím odpovězte na několik otázek k určení vaší úrovně.',
        questions: [
          'Představte se anglicky - řekněte své jméno a odkud jste.',
          'Popište svou práci nebo školu anglicky.',
          'Co děláte ve volném čase? Odpovězte anglicky.'
        ]
      };
    }
    
    console.log(`✅ Found user: ${user.name}, lesson level: ${user.current_lesson_level}`);
    
    // If no lesson level set, start with placement test
    if (!user.current_lesson_level || user.current_lesson_level === 0) {
      return {
        type: 'placement_test',
        user_id: user.id,
        title: 'Úvodní test pro ' + user.name,
        message: `Dobrý den ${user.name}! Začneme úvodním testem k určení vaší úrovně angličtiny.`,
        questions: [
          'Představte se anglicky - řekněte své jméno a odkud jste.',
          'Popište svou práci nebo činnost anglicky.',
          'Jaké máte plány do budoucna? Odpovězte anglicky.'
        ]
      };
    }
    
    // Return appropriate lesson based on user level
    const lessons = {
      1: {
        type: 'lesson',
        level: 1,
        title: 'Lekce 1 - Základní představení',
        message: `Pokračujeme v lekci ${user.current_lesson_level}. Budeme procvičovat základní představení.`,
        content: 'Naučíme se, jak se představit, říct své jméno, věk a odkud jsme.',
        questions: [
          'How old are you?',
          'Where are you from?',
          'What do you do for work?'
        ]
      },
      2: {
        type: 'lesson',
        level: 2,
        title: 'Lekce 2 - Rodina a přátelé',
        message: `Pokračujeme v lekci ${user.current_lesson_level}. Budeme mluvit o rodině.`,
        content: 'Naučíme se mluvit o rodině, přátelích a vztazích.',
        questions: [
          'Tell me about your family.',
          'Do you have any siblings?',
          'Who is your best friend?'
        ]
      }
    };
    
    return lessons[user.current_lesson_level] || lessons[1];
    
  } catch (error) {
    console.error('❌ Error finding lesson:', error.message);
    return {
      type: 'error',
      message: 'Omlouvám se, došlo k chybě. Zkuste to prosím později.'
    };
  }
}

module.exports = { getLessonForUser };
