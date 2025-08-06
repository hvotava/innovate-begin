const axios = require('axios');

// Load content from content management system for training
async function loadContentForTraining(trainingType, companyId) {
  try {
    console.log(`📚 Loading content for training: ${trainingType}, company: ${companyId}`);
    
    // Get content from our AI proxy API
    const response = await axios.get(`http://localhost:${process.env.PORT || 3001}/api/ai-proxy/content/company/${companyId}`);
    
    if (response.data && response.data.content_sources) {
      const contentSources = response.data.content_sources;
      console.log(`✅ Found ${contentSources.length} content sources for company ${companyId}`);
      
      // Filter content for training type (if we had categories)
      // For now, use any available content
      const relevantContent = contentSources.filter(source => source.status === 'ready');
      
      if (relevantContent.length > 0) {
        const content = relevantContent[0]; // Use first available content
        return {
          hasContent: true,
          contentTitle: content.title,
          contentId: content.id,
          wordCount: content.word_count || 0,
          // Generate training-specific questions based on content
          questions: generateQuestionsForContent(content, trainingType)
        };
      }
    }
    
    console.log(`❌ No content found for training ${trainingType}, using default`);
    return {
      hasContent: false,
      questions: getDefaultQuestionsForTraining(trainingType)
    };
    
  } catch (error) {
    console.error(`❌ Error loading content for training ${trainingType}:`, error.message);
    return {
      hasContent: false,
      questions: getDefaultQuestionsForTraining(trainingType)
    };
  }
}

// Generate questions based on uploaded content and training type
function generateQuestionsForContent(content, trainingType) {
  const baseQuestions = [
    `Na základě nahraného materiálu "${content.title}", vysvětlete mi hlavní téma.`,
    'Co je podle vás nejdůležitější informace z tohoto školení?',
    'Jak byste využili tyto znalosti ve své práci?'
  ];
  
  // Add training-specific questions
  switch(trainingType) {
    case 'english_business':
      baseQuestions.push('Jaké business principy jste si z lekce zapamatovali?');
      break;
    case 'english_technical':
      baseQuestions.push('Popište mi technický postup, který jste se naučili.');
      break;
    case 'safety_training':
      baseQuestions.push('Jaká bezpečnostní opatření jsou klíčová podle této lekce?');
      break;
    default:
      baseQuestions.push('Máte k probranému tématu nějaké dotazy?');
  }
  
  return baseQuestions;
}

// Fallback questions if no content is available
function getDefaultQuestionsForTraining(trainingType) {
  const defaultQuestions = {
    'english_basic': [
      'Řekněte mi něco o sobě a vaší práci.',
      'Jaké máte zkušenosti s tímto tématem?',
      'Co byste se chtěli naučit?'
    ],
    'english_business': [
      'Popište mi vaši roli v business prostředí.',
      'Jaké business výzvy řešíte?',
      'Co očekáváte od tohoto business školení?'
    ],
    'english_technical': [
      'Jaké technické procesy používáte v práci?',
      'S jakými technickými výzvami se setkáváte?',
      'Co byste chtěli zlepšit ve svých technických dovednostech?'
    ],
    'safety_training': [
      'Jaké bezpečnostní postupy dodržujete na pracovišti?',
      'Setkali jste se někdy s nebezpečnou situací?',
      'Co považujete za nejdůležitější v bezpečnosti práce?'
    ],
    'german_basic': [
      'Jaké jsou vaše cíle pro toto školení?',
      'Máte s tímto tématem nějaké zkušenosti?',
      'Co byste si chtěli z lekce odnést?'
    ]
  };
  
  return defaultQuestions[trainingType] || defaultQuestions['english_basic'];
}

module.exports = { loadContentForTraining };
