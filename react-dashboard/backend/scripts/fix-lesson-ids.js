const { sequelize, Lesson, Test, Training } = require('../models');

async function fixLessonIds() {
  console.log('🔢 Starting lesson ID fixing - ensuring lesson.id = lesson.lesson_number...');
  
  try {
    await sequelize.authenticate();
    console.log('🔗 Database connected');
    
    // Get all lessons with their tests
    const lessons = await Lesson.findAll({
      include: [{
        model: Training,
        attributes: ['title']
      }],
      order: [['trainingId', 'ASC'], ['lesson_number', 'ASC']]
    });
    
    console.log(`📚 Found ${lessons.length} lessons to analyze`);
    
    const problemLessons = [];
    const correctLessons = [];
    
    // Analyze each lesson
    for (const lesson of lessons) {
      const lessonId = lesson.id;
      const lessonNumber = lesson.lesson_number;
      const trainingTitle = lesson.Training?.title || 'Unknown';
      
      console.log(`\n🔍 Analyzing Lesson ${lessonId}: "${lesson.title}"`);
      console.log(`   lesson_number: ${lessonNumber}, training: "${trainingTitle}"`);
      
      if (lessonId === lessonNumber) {
        console.log(`   ✅ CORRECT: lesson.id (${lessonId}) = lesson.lesson_number (${lessonNumber})`);
        correctLessons.push(lesson);
      } else {
        console.log(`   ❌ PROBLEM: lesson.id (${lessonId}) ≠ lesson.lesson_number (${lessonNumber})`);
        problemLessons.push({ lesson, expectedId: lessonNumber });
      }
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`✅ Correct lessons: ${correctLessons.length}`);
    console.log(`❌ Problem lessons: ${problemLessons.length}`);
    
    if (problemLessons.length === 0) {
      console.log('🎉 All lessons have correct IDs! No fixes needed.');
      return;
    }
    
    console.log(`\n⚠️ WARNING: Changing lesson IDs is DANGEROUS!`);
    console.log(`This will affect foreign keys and relationships.`);
    console.log(`Consider using the multi-strategy test lookup instead.`);
    
    console.log(`\n🔧 FIXING ${problemLessons.length} problem lessons...`);
    
    for (const { lesson, expectedId } of problemLessons) {
      console.log(`\n🔄 Fixing Lesson "${lesson.title}"`);
      console.log(`   Current ID: ${lesson.id} -> Target ID: ${expectedId}`);
      
      try {
        // Check if a lesson with the target ID already exists
        const existingLesson = await Lesson.findByPk(expectedId);
        
        if (existingLesson && existingLesson.id !== lesson.id) {
          console.log(`   ⚠️ CONFLICT: Lesson with ID ${expectedId} already exists: "${existingLesson.title}"`);
          console.log(`   🚫 SKIPPING to avoid data corruption`);
          continue;
        }
        
        // Find all tests that reference this lesson
        const referencingTests = await Test.findAll({
          where: { lessonId: lesson.id }
        });
        
        console.log(`   📝 Found ${referencingTests.length} tests referencing lesson ${lesson.id}`);
        
        // Create new lesson with correct ID
        console.log(`   🔄 Creating new lesson with ID ${expectedId}`);
        const newLesson = await Lesson.create({
          id: expectedId,
          title: lesson.title,
          content: lesson.content,
          description: lesson.description,
          trainingId: lesson.trainingId,
          lesson_number: lesson.lesson_number,
          order_in_course: lesson.order_in_course,
          language: lesson.language,
          level: lesson.level,
          lesson_type: lesson.lesson_type,
          required_score: lesson.required_score,
          script: lesson.script,
          metadata: lesson.metadata,
          createdAt: lesson.createdAt,
          updatedAt: new Date()
        });
        
        // Update all referencing tests
        for (const test of referencingTests) {
          await test.update({ lessonId: expectedId });
          console.log(`   📝 Updated test ${test.id} lessonId: ${lesson.id} -> ${expectedId}`);
        }
        
        // Delete old lesson
        await lesson.destroy();
        console.log(`   ✅ Created lesson with ID ${newLesson.id} and deleted old lesson ${lesson.id}`);
        
      } catch (error) {
        console.error(`   ❌ Error fixing lesson ${lesson.id}:`, error.message);
      }
    }
    
    // Final verification
    console.log(`\n🔍 FINAL VERIFICATION:`);
    const finalLessons = await Lesson.findAll({
      include: [{ model: Training, attributes: ['title'] }],
      order: [['trainingId', 'ASC'], ['lesson_number', 'ASC']]
    });
    
    let finalCorrect = 0;
    let finalProblems = 0;
    
    finalLessons.forEach(lesson => {
      if (lesson.id === lesson.lesson_number) {
        finalCorrect++;
        console.log(`✅ Lesson ${lesson.id}: "${lesson.title}" (lesson_number: ${lesson.lesson_number})`);
      } else {
        finalProblems++;
        console.log(`❌ Lesson ${lesson.id}: "${lesson.title}" (lesson_number: ${lesson.lesson_number})`);
      }
    });
    
    console.log(`\n🎉 FINAL RESULTS:`);
    console.log(`✅ Correct lessons: ${finalCorrect}`);
    console.log(`❌ Remaining problems: ${finalProblems}`);
    
    if (finalProblems === 0) {
      console.log('🎉 All lessons now have correct IDs (lesson.id = lesson.lesson_number)!');
      console.log('✅ Voice system will now find tests correctly!');
    }
    
  } catch (error) {
    console.error('❌ Error during lesson ID fixing:', error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  console.log('⚠️ WARNING: This script changes lesson primary keys!');
  console.log('⚠️ This is DANGEROUS and may cause data corruption!');
  console.log('⚠️ Consider using multi-strategy test lookup instead.');
  console.log('⚠️ Uncomment the line below to proceed at your own risk:');
  // fixLessonIds();
}

module.exports = { fixLessonIds }; 