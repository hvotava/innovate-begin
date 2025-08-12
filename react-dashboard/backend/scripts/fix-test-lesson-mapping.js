const { sequelize, Lesson, Test, Training } = require('../models');

async function fixTestLessonMapping() {
  console.log('🔗 Starting test-lesson mapping fix - ensuring test.id = lesson.lesson_number...');
  
  try {
    await sequelize.authenticate();
    console.log('🔗 Database connected');
    
    // Get all lessons with their lesson_numbers
    const lessons = await Lesson.findAll({
      include: [{
        model: Training,
        attributes: ['title']
      }],
      order: [['trainingId', 'ASC'], ['lesson_number', 'ASC']]
    });
    
    console.log(`📚 Found ${lessons.length} lessons to process`);
    
    for (const lesson of lessons) {
      const lessonId = lesson.id;
      const lessonNumber = lesson.lesson_number;
      const trainingTitle = lesson.Training?.title || 'Unknown';
      
      console.log(`\n🔍 Processing Lesson "${lesson.title}"`);
      console.log(`   lesson.id: ${lessonId}, lesson_number: ${lessonNumber}, training: "${trainingTitle}"`);
      
      if (!lessonNumber || lessonNumber <= 0) {
        console.log(`   ⚠️ SKIPPING: Invalid lesson_number (${lessonNumber})`);
        continue;
      }
      
      // Find existing test for this lesson (by lessonId reference)
      const existingTest = await Test.findOne({
        where: { lessonId: lessonId }
      });
      
      if (existingTest) {
        console.log(`   📝 Found existing test: ID ${existingTest.id}, title: "${existingTest.title}"`);
        
        if (existingTest.id === lessonNumber) {
          console.log(`   ✅ CORRECT: test.id (${existingTest.id}) = lesson.lesson_number (${lessonNumber})`);
          continue;
        }
        
        console.log(`   ❌ MISMATCH: test.id (${existingTest.id}) ≠ lesson.lesson_number (${lessonNumber})`);
        
        // Check if a test with the target ID already exists
        const conflictTest = await Test.findByPk(lessonNumber);
        
        if (conflictTest && conflictTest.id !== existingTest.id) {
          console.log(`   ⚠️ CONFLICT: Test with ID ${lessonNumber} already exists: "${conflictTest.title}"`);
          
          // Merge the tests - keep the one with correct ID, update its data
          console.log(`   🔄 MERGING: Updating test ${lessonNumber} with data from test ${existingTest.id}`);
          
          await conflictTest.update({
            title: existingTest.title || conflictTest.title,
            questions: existingTest.questions || conflictTest.questions,
            lessonId: lessonId, // Ensure it points to correct lesson
            trainingId: lesson.trainingId,
            orderNumber: lessonNumber
          });
          
          // Delete the old test
          await existingTest.destroy();
          console.log(`   ✅ MERGED: Updated test ${lessonNumber} and deleted old test ${existingTest.id}`);
          
        } else {
          // No conflict - recreate test with correct ID
          console.log(`   🔄 RECREATING: Test with ID ${lessonNumber}`);
          
          const testData = {
            id: lessonNumber, // Set correct ID
            title: existingTest.title,
            questions: existingTest.questions,
            lessonId: lessonId,
            trainingId: lesson.trainingId,
            orderNumber: lessonNumber,
            createdAt: existingTest.createdAt,
            updatedAt: new Date()
          };
          
          // Delete old test first
          await existingTest.destroy();
          
          // Create new test with correct ID
          const newTest = await Test.create(testData);
          console.log(`   ✅ RECREATED: Test ${newTest.id} for lesson "${lesson.title}"`);
        }
        
      } else {
        console.log(`   ❌ NO TEST FOUND for lesson ${lessonId}`);
        
        // Check if test with desired ID exists but points to different lesson
        const orphanTest = await Test.findByPk(lessonNumber);
        
        if (orphanTest) {
          console.log(`   🔄 ADOPTING: Test ${lessonNumber} exists but points to lesson ${orphanTest.lessonId}`);
          
          await orphanTest.update({
            lessonId: lessonId,
            trainingId: lesson.trainingId,
            title: `${lesson.title} - Test`,
            orderNumber: lessonNumber
          });
          
          console.log(`   ✅ ADOPTED: Test ${lessonNumber} now belongs to lesson "${lesson.title}"`);
          
        } else {
          // Create new test with correct ID
          console.log(`   🔧 CREATING: New test with ID ${lessonNumber}`);
          
          const newTest = await Test.create({
            id: lessonNumber,
            title: `${lesson.title} - Test`,
            questions: [
              {
                question: `Otázka k lekci: ${lesson.title}`,
                options: ['Odpověď A', 'Odpověď B', 'Odpověď C', 'Odpověď D'],
                correctAnswer: 0,
                type: 'multiple_choice'
              }
            ],
            lessonId: lessonId,
            trainingId: lesson.trainingId,
            orderNumber: lessonNumber
          });
          
          console.log(`   ✅ CREATED: Test ${newTest.id} for lesson "${lesson.title}"`);
        }
      }
    }
    
    // Final verification
    console.log(`\n🔍 FINAL VERIFICATION:`);
    const finalLessons = await Lesson.findAll({
      include: [{
        model: Training,
        attributes: ['title']
      }],
      order: [['trainingId', 'ASC'], ['lesson_number', 'ASC']]
    });
    
    let correctMappings = 0;
    let problemMappings = 0;
    
    for (const lesson of finalLessons) {
      const test = await Test.findOne({ where: { lessonId: lesson.id } });
      
      if (test) {
        if (test.id === lesson.lesson_number) {
          correctMappings++;
          console.log(`✅ Lesson ${lesson.lesson_number} "${lesson.title}" → Test ${test.id}`);
        } else {
          problemMappings++;
          console.log(`❌ Lesson ${lesson.lesson_number} "${lesson.title}" → Test ${test.id} (MISMATCH)`);
        }
      } else {
        problemMappings++;
        console.log(`❌ Lesson ${lesson.lesson_number} "${lesson.title}" → NO TEST`);
      }
    }
    
    console.log(`\n🎉 FINAL RESULTS:`);
    console.log(`✅ Correct mappings: ${correctMappings}`);
    console.log(`❌ Problem mappings: ${problemMappings}`);
    
    if (problemMappings === 0) {
      console.log('🎉 All lessons now have correctly mapped tests!');
      console.log('✅ Lesson 1 → Test 1, Lesson 2 → Test 2, etc.');
    }
    
  } catch (error) {
    console.error('❌ Error during test-lesson mapping fix:', error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  fixTestLessonMapping();
}

module.exports = { fixTestLessonMapping }; 