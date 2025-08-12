"""
AI Services for the AI Tutor System

This module contains all AI-powered services including:
- Placement test analysis
- Content generation from PDFs/text
- Question generation
- Learning path optimization
- Progress assessment
"""

import json
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import openai
from openai import AsyncOpenAI
import PyPDF2
import io
import re
from sqlalchemy.orm import Session

from .models import (
    User, Company, ContentSource, Course, Lesson, PlacementTest, PlacementResult,
    QuestionBank, UserProgress, LearningPath, ContentType, ProcessingStatus,
    DifficultyLevel, CourseStatus
)

logger = logging.getLogger(__name__)

class AIServiceError(Exception):
    """Custom exception for AI service errors"""
    pass

class PlacementTestService:
    """Service for analyzing placement tests and determining user levels"""
    
    def __init__(self, openai_client: AsyncOpenAI):
        self.client = openai_client
        
    async def analyze_placement_text(self, text: str, language: str = "en") -> Dict:
        """
        Analyze user's placement test text to determine English proficiency level
        
        Args:
            text: User's written text sample
            language: Target language (default: "en" for English)
            
        Returns:
            Dict with analysis results including level, confidence, strengths, weaknesses
        """
        
        if len(text.strip()) < 50:
            raise AIServiceError("Text too short for accurate analysis (minimum 50 characters)")
            
        # Analyze text with OpenAI
        analysis_prompt = f"""
        Analyze this text sample to determine English proficiency level according to CEFR standards.
        Consider: grammar accuracy, vocabulary range, sentence complexity, coherence, and fluency indicators.
        
        Text to analyze:
        "{text}"
        
        Provide analysis in this exact JSON format:
        {{
            "level": "A1|A2|B1|B2|C1|C2",
            "confidence": 0.0-1.0,
            "detailed_analysis": {{
                "grammar_score": 0-100,
                "vocabulary_score": 0-100,
                "coherence_score": 0-100,
                "complexity_score": 0-100
            }},
            "strengths": ["strength1", "strength2", ...],
            "weaknesses": ["weakness1", "weakness2", ...],
            "recommended_focus": ["area1", "area2", ...],
            "explanation": "Brief explanation of the assessment",
            "estimated_study_hours": number_of_hours_to_next_level
        }}
        """
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": analysis_prompt}],
                temperature=0.3,
                max_tokens=1500
            )
            
            analysis_text = response.choices[0].message.content.strip()
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', analysis_text, re.DOTALL)
            if json_match:
                analysis = json.loads(json_match.group())
            else:
                # Fallback parsing
                analysis = json.loads(analysis_text)
                
            # Validate required fields
            required_fields = ['level', 'confidence', 'strengths', 'weaknesses', 'recommended_focus']
            for field in required_fields:
                if field not in analysis:
                    raise AIServiceError(f"Missing required field in AI analysis: {field}")
                    
            return analysis
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI analysis JSON: {e}")
            raise AIServiceError("Failed to parse AI analysis response")
        except Exception as e:
            logger.error(f"Placement test analysis failed: {e}")
            raise AIServiceError(f"AI analysis failed: {str(e)}")
    
    def determine_starting_lesson(self, level: str, course_id: int, db: Session) -> Optional[int]:
        """
        Determine which lesson user should start with based on their level
        
        Args:
            level: CEFR level (A1, A2, B1, B2, C1, C2)
            course_id: Course ID
            db: Database session
            
        Returns:
            Lesson ID to start with, or None if no suitable lesson found
        """
        
        # Level mapping to lesson numbers
        level_mapping = {
            "A1": 1,    # Beginners start at lesson 1
            "A2": 3,    # Elementary start at lesson 3
            "B1": 6,    # Intermediate start at lesson 6
            "B2": 10,   # Upper-intermediate start at lesson 10
            "C1": 15,   # Advanced start at lesson 15
            "C2": 20    # Proficiency start at lesson 20
        }
        
        start_lesson_number = level_mapping.get(level, 1)
        
        # Find appropriate lesson in the course
        lesson = db.query(Lesson).filter(
            Lesson.course_id == course_id,
            Lesson.lesson_number >= start_lesson_number
        ).order_by(Lesson.lesson_number).first()
        
        return lesson.id if lesson else None

class ContentProcessingService:
    """Service for processing uploaded content and generating courses"""
    
    def __init__(self, openai_client: AsyncOpenAI):
        self.client = openai_client
        
    async def extract_text_from_pdf(self, pdf_file_path: str) -> str:
        """Extract text content from PDF file"""
        try:
            with open(pdf_file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text_content = ""
                
                for page in pdf_reader.pages:
                    text_content += page.extract_text() + "\n"
                    
                return text_content.strip()
                
        except Exception as e:
            logger.error(f"PDF text extraction failed: {e}")
            raise AIServiceError(f"Failed to extract text from PDF: {str(e)}")
    
    async def process_content_to_course(self, content_source: ContentSource, 
                                      target_lessons: int = 10) -> Dict:
        """
        Process content source and generate structured course with lessons
        
        Args:
            content_source: ContentSource object with raw content
            target_lessons: Number of lessons to generate
            
        Returns:
            Dict with course structure and lessons
        """
        
        if not content_source.raw_content:
            raise AIServiceError("No raw content available for processing")
            
        content = content_source.raw_content[:8000]  # Limit for API
        
        generation_prompt = f"""
        Convert the following educational content into a structured training course with {target_lessons} lessons.
        
        For each lesson, provide:
        1. Title (descriptive, no greetings)
        2. Learning objectives (3-5 specific goals)
        3. Core training content (300-500 words, structured, no greetings or introductions)
        4. Key vocabulary (8-12 important terms with definitions)
        5. Estimated duration in minutes
        6. Difficulty level (beginner/intermediate/advanced)
        
        IMPORTANT: Content should be pure training material without any greetings, welcomes, or special characters like #, *, -.
        Start directly with the educational content.
        
        Content to process:
        "{content}"
        
        Return as JSON in this exact format:
        {{
            "course_title": "Generated Course Title",
            "course_description": "Brief course description",
            "total_estimated_hours": estimated_total_hours,
            "difficulty_levels": ["beginner", "intermediate", "advanced"],
            "lessons": [
                {{
                    "title": "Lesson Title",
                    "learning_objectives": ["objective1", "objective2", "objective3"],
                    "content": "Detailed lesson content...",
                    "key_vocabulary": {{"term1": "definition1", "term2": "definition2"}},
                    "estimated_duration": minutes,
                    "difficulty": "beginner|intermediate|advanced",
                    "lesson_number": 1
                }},
                ...
            ]
        }}
        """
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": generation_prompt}],
                temperature=0.4,
                max_tokens=4000
            )
            
            course_text = response.choices[0].message.content.strip()
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', course_text, re.DOTALL)
            if json_match:
                course_data = json.loads(json_match.group())
            else:
                course_data = json.loads(course_text)
                
            # Validate structure
            if 'lessons' not in course_data or not course_data['lessons']:
                raise AIServiceError("No lessons generated from content")
                
            return course_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse course generation JSON: {e}")
            raise AIServiceError("Failed to parse course generation response")
        except Exception as e:
            logger.error(f"Course generation failed: {e}")
            raise AIServiceError(f"Course generation failed: {str(e)}")

class QuestionGenerationService:
    """Service for generating questions for lessons"""
    
    def __init__(self, openai_client: AsyncOpenAI):
        self.client = openai_client
        
    async def generate_questions_for_lesson(self, lesson_content: str, 
                                          difficulty: str = "medium",
                                          question_count: int = 10) -> Dict:
        """
        Generate diverse questions for a lesson
        
        Args:
            lesson_content: Content of the lesson
            difficulty: easy, medium, or hard
            question_count: Number of questions to generate
            
        Returns:
            Dict with generated questions
        """
        
        question_prompt = f"""
        Create {question_count} diverse questions based on this lesson content.
        Difficulty level: {difficulty}
        
        Include variety of question types:
        - Multiple choice (40%)
        - Short answer (30%) 
        - Speaking/conversation prompts (20%)
        - True/False (10%)
        
        Lesson content:
        "{lesson_content[:2000]}"
        
        Return JSON in this exact format:
        {{
            "questions": [
                {{
                    "question": "Question text",
                    "type": "multiple_choice|short_answer|speaking|true_false",
                    "correct_answer": "Correct answer",
                    "options": ["option1", "option2", "option3", "option4"],
                    "explanation": "Why this is correct",
                    "difficulty": "easy|medium|hard",
                    "category": "vocabulary|grammar|comprehension|conversation",
                    "points": score_value
                }},
                ...
            ],
            "total_questions": {question_count},
            "difficulty_distribution": {{
                "easy": count,
                "medium": count, 
                "hard": count
            }}
        }}
        """
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": question_prompt}],
                temperature=0.5,
                max_tokens=3000
            )
            
            questions_text = response.choices[0].message.content.strip()
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', questions_text, re.DOTALL)
            if json_match:
                questions_data = json.loads(json_match.group())
            else:
                questions_data = json.loads(questions_text)
                
            # Validate structure
            if 'questions' not in questions_data or not questions_data['questions']:
                raise AIServiceError("No questions generated")
                
            return questions_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse questions JSON: {e}")
            raise AIServiceError("Failed to parse questions generation response")
        except Exception as e:
            logger.error(f"Question generation failed: {e}")
            raise AIServiceError(f"Question generation failed: {str(e)}")

class LearningPathService:
    """Service for creating and optimizing personalized learning paths"""
    
    def __init__(self, openai_client: AsyncOpenAI):
        self.client = openai_client
        
    async def create_personalized_path(self, user: User, course: Course, 
                                     placement_result: PlacementResult,
                                     db: Session) -> Dict:
        """
        Create personalized learning path based on user's placement results
        
        Args:
            user: User object
            course: Course object
            placement_result: PlacementResult object
            db: Database session
            
        Returns:
            Dict with personalized learning path
        """
        
        # Get available lessons in course
        lessons = db.query(Lesson).filter(
            Lesson.course_id == course.id
        ).order_by(Lesson.lesson_number).all()
        
        if not lessons:
            raise AIServiceError("No lessons available in course")
            
        user_profile = {
            "level": placement_result.determined_level,
            "confidence": placement_result.confidence_score,
            "strengths": placement_result.strengths,
            "weaknesses": placement_result.weaknesses,
            "recommended_focus": placement_result.recommended_focus,
            "learning_preferences": user.learning_preferences
        }
        
        lessons_info = [
            {
                "id": lesson.id,
                "title": lesson.title,
                "difficulty": lesson.base_difficulty,
                "lesson_number": lesson.lesson_number,
                "estimated_duration": lesson.estimated_duration,
                "learning_objectives": lesson.learning_objectives
            }
            for lesson in lessons
        ]
        
        path_prompt = f"""
        Create a personalized learning path for this user profile and available lessons.
        
        User Profile:
        {json.dumps(user_profile, indent=2)}
        
        Available Lessons:
        {json.dumps(lessons_info, indent=2)}
        
        Create an optimal learning sequence considering:
        1. User's current level and weaknesses
        2. Logical progression through topics
        3. Difficulty adjustment recommendations
        4. Review and reinforcement schedule
        
        Return JSON:
        {{
            "recommended_sequence": [lesson_id1, lesson_id2, ...],
            "difficulty_adjustments": {{
                "lesson_id": "easier|normal|harder"
            }},
            "focus_areas": ["area1", "area2", ...],
            "estimated_completion_weeks": number,
            "review_schedule": {{
                "lesson_id": {{
                    "initial_review_days": days,
                    "subsequent_reviews": [day1, day2, ...]
                }}
            }},
            "adaptive_rules": [
                {{
                    "condition": "if score < 70%",
                    "action": "add_remedial_content"
                }}
            ]
        }}
        """
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": path_prompt}],
                temperature=0.3,
                max_tokens=2000
            )
            
            path_text = response.choices[0].message.content.strip()
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', path_text, re.DOTALL)
            if json_match:
                path_data = json.loads(json_match.group())
            else:
                path_data = json.loads(path_text)
                
            return path_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse learning path JSON: {e}")
            raise AIServiceError("Failed to parse learning path response")
        except Exception as e:
            logger.error(f"Learning path creation failed: {e}")
            raise AIServiceError(f"Learning path creation failed: {str(e)}")

class ProgressAnalysisService:
    """Service for analyzing user progress and providing recommendations"""
    
    def __init__(self, openai_client: AsyncOpenAI):
        self.client = openai_client
        
    async def analyze_user_progress(self, user_progress: UserProgress, 
                                  recent_attempts: List, db: Session) -> Dict:
        """
        Analyze user's learning progress and provide recommendations
        
        Args:
            user_progress: UserProgress object
            recent_attempts: List of recent Attempt objects
            db: Database session
            
        Returns:
            Dict with progress analysis and recommendations
        """
        
        # Prepare progress data
        progress_data = {
            "completion_percentage": user_progress.completion_percentage,
            "lessons_completed": user_progress.lessons_completed,
            "lesson_scores": user_progress.lesson_scores,
            "weak_areas": user_progress.weak_areas,
            "strong_areas": user_progress.strong_areas,
            "study_streak": user_progress.study_streak,
            "total_study_time": user_progress.total_study_time
        }
        
        recent_performance = [
            {
                "lesson_id": attempt.lesson_id,
                "score": attempt.score,
                "completed_at": attempt.completed_at.isoformat() if attempt.completed_at else None,
                "feedback": attempt.feedback
            }
            for attempt in recent_attempts[-10:]  # Last 10 attempts
        ]
        
        analysis_prompt = f"""
        Analyze this user's learning progress and provide actionable recommendations.
        
        Progress Data:
        {json.dumps(progress_data, indent=2)}
        
        Recent Performance:
        {json.dumps(recent_performance, indent=2)}
        
        Provide analysis in JSON format:
        {{
            "overall_assessment": "excellent|good|fair|needs_improvement",
            "progress_trend": "improving|stable|declining",
            "learning_velocity": "fast|normal|slow",
            "engagement_level": "high|medium|low",
            "recommendations": [
                {{
                    "type": "study_schedule|difficulty_adjustment|content_focus|motivation",
                    "priority": "high|medium|low",
                    "action": "Specific recommendation",
                    "expected_impact": "Description of expected improvement"
                }}
            ],
            "predicted_completion_date": "YYYY-MM-DD",
            "risk_factors": ["factor1", "factor2", ...],
            "celebration_points": ["achievement1", "achievement2", ...]
        }}
        """
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": analysis_prompt}],
                temperature=0.3,
                max_tokens=1500
            )
            
            analysis_text = response.choices[0].message.content.strip()
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', analysis_text, re.DOTALL)
            if json_match:
                analysis = json.loads(json_match.group())
            else:
                analysis = json.loads(analysis_text)
                
            return analysis
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse progress analysis JSON: {e}")
            raise AIServiceError("Failed to parse progress analysis response")
        except Exception as e:
            logger.error(f"Progress analysis failed: {e}")
            raise AIServiceError(f"Progress analysis failed: {str(e)}")

# Service factory for easy access
class AIServiceFactory:
    """Factory for creating AI service instances"""
    
    def __init__(self, openai_api_key: str):
        self.openai_client = AsyncOpenAI(api_key=openai_api_key)
        
    def get_placement_service(self) -> PlacementTestService:
        return PlacementTestService(self.openai_client)
        
    def get_content_service(self) -> ContentProcessingService:
        return ContentProcessingService(self.openai_client)
        
    def get_question_service(self) -> QuestionGenerationService:
        return QuestionGenerationService(self.openai_client)
        
    def get_learning_path_service(self) -> LearningPathService:
        return LearningPathService(self.openai_client)
        
    def get_progress_service(self) -> ProgressAnalysisService:
        return ProgressAnalysisService(self.openai_client) 