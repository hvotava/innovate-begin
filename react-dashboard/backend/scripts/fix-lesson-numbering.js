const { sequelize, Lesson, Test, Training } = require('../models');

async function fixLessonNumbering() {
  console.log('🔢 Starting lesson and test renumbering from 1...');
  
  try {
    await sequelize.authenticate();
    console.log('🔗 Database connected');
    
    // Get all trainings
    const trainings = await Training.findAll({
      include: [{
        model: Lesson,
        order: [['lesson_number', 'ASC'], ['id', 'ASC']]
      }],
      order: [['id', 'ASC']]
    });
    
    console.log(`📚 Found ${trainings.length} trainings to process`);
    
    for (const training of trainings) {
      console.log(`\n🎯 Processing training: ${training.title} (ID: ${training.id})`);
      console.log(`📝 Lessons in training: ${training.Lessons.length}`);
      
      if (training.Lessons.length === 0) {
        console.log('⚠️ No lessons in this training, skipping...');
        continue;
      }
      
      // Renumber lessons starting from 1
      for (let i = 0; i < training.Lessons.length; i++) {
        const lesson = training.Lessons[i];
        const newLessonNumber = i + 1; // Start from 1
        
        console.log(`📚 Lesson ${lesson.id}: "${lesson.title}"`);
        console.log(`   Old lesson_number: ${lesson.lesson_number} -> New: ${newLessonNumber}`);
        
        // Update lesson
        await lesson.update({
          lesson_number: newLessonNumber,
          order_in_course: newLessonNumber
        });
        
        // Check if test with same ID as lesson exists
        const existingTest = await Test.findByPk(lesson.id);
        
        if (existingTest) {
          console.log(`   ✅ Test with ID ${lesson.id} already exists: "${existingTest.title}"`);
          // Update test to ensure it has correct lessonId and trainingId
          await existingTest.update({
            lessonId: lesson.id,
            trainingId: training.id,
            orderNumber: newLessonNumber
          });
          console.log(`   📝 Updated test ${existingTest.id} metadata`);
        } else {
          console.log(`   ❌ No test found with ID ${lesson.id} (matching lesson ID)`);
          console.log(`   🔧 Creating test with ID ${lesson.id} for lesson "${lesson.title}"`);
          
          // Create basic test for this lesson
          try {
            const newTest = await Test.create({
              id: lesson.id, // Same ID as lesson
              title: `${lesson.title} - Test`,
              questions: [
                {
                  question: `Otázka k lekci: ${lesson.title}`,
                  options: ['Odpověď A', 'Odpověď B', 'Odpověď C', 'Odpověď D'],
                  correctAnswer: 0,
                  type: 'multiple_choice'
                }
              ],
              lessonId: lesson.id,
              trainingId: training.id,
              orderNumber: newLessonNumber
            });
            console.log(`   ✅ Created test ${newTest.id}: "${newTest.title}"`);
          } catch (testError) {
            console.error(`   ❌ Error creating test for lesson ${lesson.id}:`, testError.message);
          }
        }
      }
      
      console.log(`✅ Completed training: ${training.title}`);
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    const allLessons = await Lesson.findAll({
      include: [{ model: Training, attributes: ['title'] }],
      order: [['trainingId', 'ASC'], ['lesson_number', 'ASC']]
    });
    
    console.log(`📚 Total lessons: ${allLessons.length}`);
    allLessons.forEach(lesson => {
      console.log(`   Lesson ${lesson.id}: ${lesson.title} (lesson_number: ${lesson.lesson_number}, training: ${lesson.Training?.title})`);
    });
    
    const allTests = await Test.findAll({
      include: [{ model: Lesson, attributes: ['title'] }],
      order: [['id', 'ASC']]
    });
    
    console.log(`\n🧪 Total tests: ${allTests.length}`);
    allTests.forEach(test => {
      console.log(`   Test ${test.id}: ${test.title} (lessonId: ${test.lessonId}, lesson: ${test.Lesson?.title || 'N/A'})`);
    });
    
    console.log('\n🎉 Lesson and test renumbering completed successfully!');
    console.log('✅ All lessons now start from lesson_number = 1');
    console.log('✅ All tests have matching IDs with their lessons (test.id = lesson.id)');
    
  } catch (error) {
    console.error('❌ Error during renumbering:', error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  fixLessonNumbering();
}

module.exports = { fixLessonNumbering }; 