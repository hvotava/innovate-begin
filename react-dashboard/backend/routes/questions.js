const express = require('express');
const router = express.Router();
const { Lesson, Test } = require('../models');

// Get questions for a lesson
router.get('/lessons/:lessonId/questions', async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    const difficulty = req.query.difficulty || 'medium';
    
    console.log(`📝 Loading questions for lesson ${lessonId}, difficulty: ${difficulty}`);
    
    // Find tests for this lesson
    const tests = await Test.findAll({
      where: { lessonId: lessonId }
    });
    
    if (tests.length === 0) {
      return res.json({
        questions: [],
        has_questions: false,
        difficulty: difficulty,
        usage_count: 0,
        avg_success_rate: 0,
        last_updated: null
      });
    }
    
    // Get questions from the first test
    const test = tests[0];
    let questions = [];
    
    if (test.questions) {
      questions = typeof test.questions === 'string' 
        ? JSON.parse(test.questions) 
        : test.questions;
    }
    
    console.log(`✅ Found ${questions.length} questions for lesson ${lessonId}`);
    
    res.json({
      questions: questions.map(q => ({
        question: q.question || q.text,
        type: 'multiple_choice',
        correct_answer: q.options ? q.options[q.correctAnswer] : '',
        options: q.options || [],
        explanation: q.explanation || '',
        difficulty: difficulty,
        category: 'general',
        points: 1
      })),
      has_questions: questions.length > 0,
      difficulty: difficulty,
      usage_count: 0,
      avg_success_rate: 0,
      last_updated: test.updatedAt
    });
    
  } catch (error) {
    console.error('❌ Error loading questions:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Generate questions for a lesson
router.post('/lessons/:lessonId/generate-questions', async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    const { question_count = 5, difficulty = 'medium' } = req.body;
    
    console.log(`🤖 Generating ${question_count} questions for lesson ${lessonId}, difficulty: ${difficulty}`);
    
    // Get lesson content
    const lesson = await Lesson.findByPk(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    
    // Generate questions using OpenAI (simplified version)
    const questions = await generateQuestionsFromContent(lesson.content, lesson.title, question_count);
    
    // Save to database
    const test = await Test.create({
      id: lessonId, // EXPLICITNĚ nastavit ID = lessonId!
      title: `${lesson.title} Test`,
      description: `Generated test for ${lesson.title}`,
      questions: JSON.stringify(questions),
      lessonId: lessonId,
      type: 'multiple_choice',
      timeLimit: 600,
      passingScore: 70
    });
    
    console.log(`✅ Generated ${questions.length} questions for lesson ${lessonId}`);
    
    res.json({
      success: true,
      questions_generated: questions.length,
      questions: questions.map(q => ({
        question: q.question,
        type: 'multiple_choice',
        correct_answer: q.options[q.correctAnswer],
        options: q.options,
        explanation: '',
        difficulty: difficulty,
        category: 'general',
        points: 1
      }))
    });
    
  } catch (error) {
    console.error('❌ Error generating questions:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to generate questions from content
async function generateQuestionsFromContent(content, lessonTitle, count = 5) {
  // Simplified question generation (in real implementation, this would use OpenAI)
  const questions = [
    {
      question: `Co je hlavní téma lekce "${lessonTitle}"?`,
      options: ['Praktické školení', 'Teoretické znalosti', 'Bezpečnostní opatření', 'Všechny odpovědi'],
      correctAnswer: 0
    },
    {
      question: 'Co je podle vás nejdůležitější informace z této lekce?',
      options: ['Teoretické znalosti', 'Praktické dovednosti', 'Bezpečnostní pravidla', 'Všechny informace'],
      correctAnswer: 3
    },
    {
      question: 'Jak byste využili tyto znalosti ve své práci?',
      options: ['Pro lepší výkon', 'Pro bezpečnost', 'Pro komunikaci', 'Všechny možnosti'],
      correctAnswer: 3
    }
  ];
  
  return questions.slice(0, count);
}

module.exports = router; 