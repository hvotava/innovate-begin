const { User } = require('../models');
const { loadContentForTraining } = require('./content-loader');

// Get lesson content for user based on their progress and uploaded content
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
    
    console.log(`✅ Found user: ${user.name}, training type: ${user.training_type}`);
    
    // If no training type set, start with placement test
    if (!user.training_type || user.training_type === '') {
      return {
        type: 'placement_test',
        user_id: user.id,
        title: 'Úvodní test pro ' + user.name,
        message: `Dobrý den ${user.name}! Začneme úvodním testem k určení vaší úrovně a vhodného školení.`,
        questions: [
          'Představte se a řekněte své jméno a odkud jste.',
          'Popište svou práci nebo činnost.',
          'Co očekáváte od tohoto školení a jaké máte zkušenosti s tímto tématem?'
        ]
      };
    }
    
        // Load actual content for this training type and company
    const contentData = await loadContentForTraining(user.training_type, user.companyId);
    
    // Get training type display names
    const trainingTitles = {
      'english_basic': 'Základní Školení',
      'english_business': 'Business Školení', 
      'english_technical': 'Technické Školení',
      'german_basic': 'Speciální Školení',
      'safety_training': 'Bezpečnostní Školení'
    };
    
    const trainingTitle = trainingTitles[user.training_type] || 'Obecné Školení';
    
    // Create lesson based on loaded content
    const lesson = {
      type: 'lesson',
      training: user.training_type,
      title: trainingTitle,
      hasUploadedContent: contentData.hasContent,
      contentTitle: contentData.contentTitle || null,
      message: contentData.hasContent 
        ? `Dobrý den ${user.name}! Budeme procvičovat podle nahraného materiálu "${contentData.contentTitle}".`
        : `Dobrý den ${user.name}! Začneme s obecným školením pro ${trainingTitle.toLowerCase()}.`,
      content: contentData.hasContent
        ? `Projdeme si obsah z nahraného materiálu a otestujeme vaše porozumění.`
        : `Probereme základní témata a zjistíme vaše současné znalosti.`,
      questions: contentData.questions
    };
    
    console.log(`📋 Generated lesson:`, {
      title: lesson.title,
      hasContent: lesson.hasUploadedContent,
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

module.exports = { getLessonForUser };
