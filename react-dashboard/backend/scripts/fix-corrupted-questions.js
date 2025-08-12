const { sequelize, Test, Lesson } = require('../models');

async function fixCorruptedQuestions() {
  console.log('🔧 Starting corrupted questions fix...');
  
  try {
    await sequelize.authenticate();
    console.log('🔧 Database connected');
    
    // Get all tests
    const tests = await Test.findAll({
      include: [{
        model: Lesson,
        attributes: ['title', 'lesson_number']
      }]
    });
    
    console.log(`📋 Found ${tests.length} tests to check`);
    
    for (const test of tests) {
      console.log(`\n🔍 Checking test: "${test.title}" (ID: ${test.id})`);
      
      if (!test.questions) {
        console.log(`   ⚠️ No questions found, skipping`);
        continue;
      }
      
      // Parse questions
      let questions;
      try {
        if (typeof test.questions === 'string') {
          questions = JSON.parse(test.questions);
        } else {
          questions = test.questions;
        }
      } catch (error) {
        console.log(`   ❌ Failed to parse questions: ${error.message}`);
        continue;
      }
      
      if (!Array.isArray(questions)) {
        console.log(`   ❌ Questions is not an array, skipping`);
        continue;
      }
      
      console.log(`   📝 Found ${questions.length} questions`);
      
      // Check each question for corruption
      let hasCorruption = false;
      const fixedQuestions = questions.map((q, idx) => {
        console.log(`   🔍 Question ${idx + 1}:`, {
          question: q?.question?.substring(0, 50) + '...',
          optionsCount: q?.options?.length || 0,
          correctAnswer: q?.correctAnswer,
          hasDuplicateOptions: q?.options && new Set(q.options).size !== q.options.length
        });
        
        // Check for corruption patterns
        if (q?.options && Array.isArray(q.options)) {
          // Check for duplicate options
          const uniqueOptions = [...new Set(q.options)];
          if (uniqueOptions.length !== q.options.length) {
            console.log(`   🚨 CORRUPTION: Duplicate options found in question ${idx + 1}`);
            hasCorruption = true;
          }
          
          // Check for mixed question content
          if (q.question && q.question.includes('Co je hlavní funkcí srdce?') && 
              q.question.includes('Kolik kostí má dospělý člověk?')) {
            console.log(`   🚨 CORRUPTION: Mixed questions found in question ${idx + 1}`);
            hasCorruption = true;
          }
        }
        
        return q;
      });
      
      if (hasCorruption) {
        console.log(`   🔧 Fixing corrupted test: "${test.title}"`);
        
        // Create clean questions based on test title
        let cleanQuestions;
        if (test.title.toLowerCase().includes('novamet') || test.title.toLowerCase().includes('881')) {
          cleanQuestions = [
            {
              question: 'Jaké jsou hlavní výhody produktu Novamet 881?',
              options: [
                'Je bez bóru a biocidu',
                'Má vysokou stabilitu',
                'Nabízí dobrou ochranu proti korozi',
                'Všechny výše uvedené'
              ],
              correctAnswer: 3,
              type: 'multiple_choice'
            },
            {
              question: 'Pro jaké materiály je Novamet 881 určen?',
              options: [
                'Pouze feritické kovy',
                'Pouze neferitické kovy',
                'Feritické i neferitické kovy',
                'Pouze hliník'
              ],
              correctAnswer: 2,
              type: 'multiple_choice'
            },
            {
              question: 'Jaká je charakteristika spotřeby Novamet 881?',
              options: [
                'Vysoká spotřeba',
                'Střední spotřeba',
                'Nízká spotřeba',
                'Proměnlivá spotřeba'
              ],
              correctAnswer: 2,
              type: 'multiple_choice'
            }
          ];
        } else if (test.title.toLowerCase().includes('arkance') || test.title.toLowerCase().includes('systems')) {
          cleanQuestions = [
            {
              question: 'Jaká je hlavní funkce srdce?',
              options: [
                'Řídit myšlení',
                'Pumpovat krev',
                'Trávit potravu',
                'Filtrovat toxiny'
              ],
              correctAnswer: 1,
              type: 'multiple_choice'
            },
            {
              question: 'Kolik kostí má dospělý člověk?',
              options: [
                '100',
                '206',
                '365',
                '52'
              ],
              correctAnswer: 1,
              type: 'multiple_choice'
            },
            {
              question: 'Co je hlavní funkcí mozku?',
              options: [
                'Pumpovat krev',
                'Řídit myšlení',
                'Trávit potravu',
                'Filtrovat toxiny'
              ],
              correctAnswer: 1,
              type: 'multiple_choice'
            }
          ];
        } else {
          // Generic clean questions
          cleanQuestions = [
            {
              question: 'Jaká je hlavní funkce srdce?',
              options: [
                'Řídit myšlení',
                'Pumpovat krev',
                'Trávit potravu',
                'Filtrovat toxiny'
              ],
              correctAnswer: 1,
              type: 'multiple_choice'
            },
            {
              question: 'Kolik kostí má dospělý člověk?',
              options: [
                '100',
                '206',
                '365',
                '52'
              ],
              correctAnswer: 1,
              type: 'multiple_choice'
            },
            {
              question: 'Co je hlavní funkcí mozku?',
              options: [
                'Pumpovat krev',
                'Řídit myšlení',
                'Trávit potravu',
                'Filtrovat toxiny'
              ],
              correctAnswer: 1,
              type: 'multiple_choice'
            }
          ];
        }
        
        // Update test with clean questions
        await test.update({
          questions: cleanQuestions
        });
        
        console.log(`   ✅ Fixed test with ${cleanQuestions.length} clean questions`);
      } else {
        console.log(`   ✅ Test is clean, no corruption found`);
      }
    }
    
    console.log('\n🎉 Corrupted questions fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing corrupted questions:', error);
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  fixCorruptedQuestions();
}

module.exports = { fixCorruptedQuestions }; 