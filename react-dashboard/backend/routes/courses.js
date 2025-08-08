const express = require('express');
const router = express.Router();
const { Training, Lesson, Company } = require('../models');

// Get courses for a company
router.get('/company/:companyId', async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    console.log(`📚 Loading courses for company ${companyId}`);
    
    const trainings = await Training.findAll({
      where: { companyId: companyId },
      include: [
        { model: Company, as: 'Company' },
        { model: Lesson, as: 'Lessons' }
      ]
    });
    
    const courses = trainings.map(training => ({
      id: training.id,
      title: training.title,
      description: training.description,
      status: 'active',
      total_lessons: training.Lessons ? training.Lessons.length : 0,
      estimated_duration: training.Lessons ? training.Lessons.length * 15 : 0, // 15 min per lesson
      difficulty_levels: ['beginner', 'intermediate'],
      created_at: training.createdAt,
      lesson_count: training.Lessons ? training.Lessons.length : 0
    }));
    
    console.log(`✅ Found ${courses.length} courses for company ${companyId}`);
    
    res.json({
      courses: courses,
      total_courses: courses.length
    });
    
  } catch (error) {
    console.error('❌ Error loading courses:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get lessons for a course
router.get('/:courseId/lessons', async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    console.log(`📚 Loading lessons for course ${courseId}`);
    
    const training = await Training.findByPk(courseId, {
      include: [{ model: Lesson, as: 'Lessons' }]
    });
    
    if (!training) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const lessons = training.Lessons.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      content: lesson.content,
      course_id: courseId,
      lesson_number: lesson.id,
      difficulty: 'medium',
      ai_generated: false,
      has_questions: false
    }));
    
    console.log(`✅ Found ${lessons.length} lessons for course ${courseId}`);
    
    res.json({
      lessons: lessons,
      total_lessons: lessons.length
    });
    
  } catch (error) {
    console.error('❌ Error loading lessons:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Activate a course
router.post('/:courseId/activate', async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    console.log(`✅ Activating course ${courseId}`);
    
    // In a real implementation, you would update the course status
    // For now, just return success
    
    res.json({
      success: true,
      message: 'Course activated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error activating course:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 