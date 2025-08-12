const { sequelize, Test, Lesson, Training } = require('../models');

async function fixTestIds() {
  console.log('🔧 Starting test ID fixing - ensuring test.id = lesson.id...');
  
  try {
    await sequelize.authenticate();
    console.log('🔗 Database connected');
    
    // Get all tests with their lessons
    const tests = await Test.findAll({
      include: [{
        model: Lesson,
        include: [{ model: Training, attributes: ['title'] }]
      }],
      order: [['id', 'ASC']]
    });
    
    console.log(`🧪 Found ${tests.length} tests to analyze`);
    
    const problemTests = [];
    const correctTests = [];
    
    // Analyze each test
    for (const test of tests) {
      const testId = test.id;
      const lessonId = test.lessonId;
      const lessonTitle = test.Lesson?.title || 'Unknown';
      const trainingTitle = test.Lesson?.Training?.title || 'Unknown';
      
      console.log(`\n🔍 Analyzing Test ${testId}: "${test.title}"`);
      console.log(`   lessonId: ${lessonId}, lesson: "${lessonTitle}", training: "${trainingTitle}"`);
      
      if (testId === lessonId) {
        console.log(`   ✅ CORRECT: test.id (${testId}) = lesson.id (${lessonId})`);
        correctTests.push(test);
      } else {
        console.log(`   ❌ PROBLEM: test.id (${testId}) ≠ lesson.id (${lessonId})`);
        problemTests.push({ test, expectedId: lessonId });
      }
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`✅ Correct tests: ${correctTests.length}`);
    console.log(`❌ Problem tests: ${problemTests.length}`);
    
    if (problemTests.length === 0) {
      console.log('🎉 All tests have correct IDs! No fixes needed.');
      return;
    }
    
    console.log(`\n🔧 FIXING ${problemTests.length} problem tests...`);
    
    for (const { test, expectedId } of problemTests) {
      console.log(`\n🔄 Fixing Test "${test.title}"`);
      console.log(`   Current ID: ${test.id} -> Target ID: ${expectedId}`);
      
      try {
        // Check if a test with the target ID already exists
        const existingTest = await Test.findByPk(expectedId);
        
        if (existingTest && existingTest.id !== test.id) {
          console.log(`   ⚠️ WARNING: Test with ID ${expectedId} already exists: "${existingTest.title}"`);
          console.log(`   🔄 Will merge/update existing test instead of creating duplicate`);
          
          // Update the existing test with better data
          await existingTest.update({
            title: test.title.includes('Generated') ? test.title : existingTest.title,
            questions: test.questions && test.questions.length > 0 ? test.questions : existingTest.questions,
            lessonId: expectedId,
            trainingId: test.trainingId,
            orderNumber: test.orderNumber
          });
          
          // Delete the old test with wrong ID
          await test.destroy();
          console.log(`   ✅ Updated existing test ${expectedId} and deleted duplicate ${test.id}`);
          
        } else {
          // Safe to change the ID
          console.log(`   🔄 Changing test ID from ${test.id} to ${expectedId}`);
          
          // Create new test with correct ID and delete old one
          // (Sequelize doesn't allow changing primary keys directly)
          const newTest = await Test.create({
            id: expectedId,
            title: test.title,
            questions: test.questions,
            lessonId: test.lessonId,
            trainingId: test.trainingId,
            orderNumber: test.orderNumber,
            createdAt: test.createdAt,
            updatedAt: new Date()
          });
          
          // Delete old test
          await test.destroy();
          console.log(`   ✅ Created new test with ID ${newTest.id} and deleted old test ${test.id}`);
        }
        
      } catch (error) {
        console.error(`   ❌ Error fixing test ${test.id}:`, error.message);
      }
    }
    
    // Final verification
    console.log(`\n🔍 FINAL VERIFICATION:`);
    const finalTests = await Test.findAll({
      include: [{ model: Lesson, attributes: ['id', 'title'] }],
      order: [['id', 'ASC']]
    });
    
    let finalCorrect = 0;
    let finalProblems = 0;
    
    finalTests.forEach(test => {
      if (test.id === test.lessonId) {
        finalCorrect++;
        console.log(`✅ Test ${test.id}: "${test.title}" -> Lesson "${test.Lesson?.title}"`);
      } else {
        finalProblems++;
        console.log(`❌ Test ${test.id}: "${test.title}" -> Lesson ID ${test.lessonId} "${test.Lesson?.title}"`);
      }
    });
    
    console.log(`\n🎉 FINAL RESULTS:`);
    console.log(`✅ Correct tests: ${finalCorrect}`);
    console.log(`❌ Remaining problems: ${finalProblems}`);
    
    if (finalProblems === 0) {
      console.log('🎉 All tests now have correct IDs (test.id = lesson.id)!');
      console.log('✅ Voice system will now find tests correctly!');
    }
    
  } catch (error) {
    console.error('❌ Error during test ID fixing:', error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  fixTestIds();
}

module.exports = { fixTestIds }; 