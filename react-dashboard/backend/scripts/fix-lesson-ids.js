const { sequelize, Lesson, Test, Training } = require('../models');

async function fixLessonIds() {
  console.log('�� Starting lesson ID fix - ensuring lesson.id = lesson.lesson_number...');
  
  try {
    await sequelize.authenticate();
    console.log('🔢 Database connected');
    
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
      
      // Check if lesson.id already matches lesson_number
      if (lessonId === lessonNumber) {
        console.log(`   ✅ CORRECT: lesson.id (${lessonId}) = lesson_number (${lessonNumber})`);
        continue;
      }
      
      console.log(`   ❌ MISMATCH: lesson.id (${lessonId}) ≠ lesson_number (${lessonNumber})`);
      
      // Check if a lesson with the target ID already exists
      const conflictLesson = await Lesson.findByPk(lessonNumber);
      
      if (conflictLesson && conflictLesson.id !== lessonId) {
        console.log(`   ⚠️ CONFLICT: Lesson with ID ${lessonNumber} already exists: "${conflictLesson.title}"`);
        
        // Merge the lessons - keep the one with correct ID, update its data
        console.log(`   🔄 MERGING: Updating lesson ${lessonNumber} with data from lesson ${lessonId}`);
        
        await conflictLesson.update({
          title: lesson.title || conflictLesson.title,
          content: lesson.content || conflictLesson.content,
          description: lesson.description || conflictLesson.description,
          trainingId: lesson.trainingId,
          lesson_number: lessonNumber,
          order_in_course: lessonNumber,
          language: lesson.language || conflictLesson.language,
          level: lesson.level || conflictLesson.level,
          base_difficulty: lesson.base_difficulty || conflictLesson.base_difficulty,
          lesson_type: lesson.lesson_type || conflictLesson.lesson_type
        });
        
        // Update all tests that reference the old lesson ID
        const testsToUpdate = await Test.findAll({
          where: { lessonId: lessonId }
        });
        
        for (const test of testsToUpdate) {
          await test.update({ lessonId: lessonNumber });
          console.log(`   🔄 Updated test ${test.id} to reference lesson ${lessonNumber}`);
        }
        
        // Delete the old lesson
        await lesson.destroy();
        console.log(`   ✅ MERGED: Updated lesson ${lessonNumber} and deleted old lesson ${lessonId}`);
        
      } else {
        // No conflict - recreate lesson with correct ID
        console.log(`   🔄 RECREATING: Lesson with ID ${lessonNumber}`);
        
        const lessonData = {
          id: lessonNumber, // Set correct ID
          title: lesson.title,
          content: lesson.content,
          description: lesson.description,
          trainingId: lesson.trainingId,
          lesson_number: lessonNumber,
          order_in_course: lessonNumber,
          language: lesson.language,
          level: lesson.level,
          base_difficulty: lesson.base_difficulty,
          lesson_type: lesson.lesson_type,
          createdAt: lesson.createdAt,
          updatedAt: new Date()
        };
        
        // Update all tests that reference the old lesson ID
        const testsToUpdate = await Test.findAll({
          where: { lessonId: lessonId }
        });
        
        for (const test of testsToUpdate) {
          await test.update({ lessonId: lessonNumber });
          console.log(`   🔄 Updated test ${test.id} to reference lesson ${lessonNumber}`);
        }
        
        // Delete old lesson first
        await lesson.destroy();
        
        // Create new lesson with correct ID
        const newLesson = await Lesson.create(lessonData);
        console.log(`   ✅ RECREATED: Lesson ${newLesson.id} for "${lesson.title}"`);
      }
    }
    
    console.log('\n🎉 Lesson ID fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing lesson IDs:', error);
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  fixLessonIds();
}

module.exports = { fixLessonIds }; 