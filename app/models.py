from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey, JSON, Text, Boolean, Float, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base
import enum

# Enums for better type safety
class ContentType(enum.Enum):
    PDF = "pdf"
    TEXT = "text"
    URL = "url"
    VIDEO = "video"

class ProcessingStatus(enum.Enum):
    PROCESSING = "processing"
    READY = "ready"
    ERROR = "error"

class CourseStatus(enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"

class DifficultyLevel(enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class TestType(enum.Enum):
    PLACEMENT = "placement"
    LESSON = "lesson"
    REVIEW = "review"
    FINAL = "final"

# Company model (propojení s React dashboard)
class Company(Base):
    __tablename__ = "companies"
    
    id = mapped_column(Integer, primary_key=True)
    name = mapped_column(String(200), nullable=False, unique=True)
    ico = mapped_column(String(8), nullable=True, unique=True)  # IČO
    contact_person_id = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    settings = mapped_column(JSON, nullable=False, default=dict)  # Company-specific settings
    ai_budget_limit = mapped_column(Float, nullable=True)  # Monthly AI API budget limit
    created_at = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="company", foreign_keys="User.company_id")
    content_sources = relationship("ContentSource", back_populates="company")
    courses = relationship("Course", back_populates="company")
    placement_tests = relationship("PlacementTest", back_populates="company")

# Content source model pro upload PDF/textů
class ContentSource(Base):
    __tablename__ = "content_sources"
    
    id = mapped_column(Integer, primary_key=True)
    company_id = mapped_column(Integer, ForeignKey("companies.id"), nullable=False)
    title = mapped_column(String(200), nullable=False)
    content_type = mapped_column(Enum(ContentType), nullable=False)
    raw_content = mapped_column(Text, nullable=True)  # Extracted text content
    processed_content = mapped_column(JSON, nullable=True)  # AI-processed structure
    file_path = mapped_column(String(500), nullable=True)  # File storage path
    file_size = mapped_column(Integer, nullable=True)  # File size in bytes
    processing_status = mapped_column(Enum(ProcessingStatus), nullable=False, default=ProcessingStatus.PROCESSING)
    processing_error = mapped_column(Text, nullable=True)  # Error message if processing failed
    metadata = mapped_column(JSON, nullable=False, default=dict)  # Word count, language, etc.
    created_at = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    processed_at = mapped_column(DateTime, nullable=True)
    
    # Relationships
    company = relationship("Company", back_populates="content_sources")
    courses = relationship("Course", back_populates="content_source")

# Course model pro strukturované kurzy
class Course(Base):
    __tablename__ = "courses"
    
    id = mapped_column(Integer, primary_key=True)
    company_id = mapped_column(Integer, ForeignKey("companies.id"), nullable=False)
    content_source_id = mapped_column(Integer, ForeignKey("content_sources.id"), nullable=True)
    title = mapped_column(String(200), nullable=False)
    description = mapped_column(Text, nullable=True)
    total_lessons = mapped_column(Integer, nullable=False, default=0)
    difficulty_levels = mapped_column(JSON, nullable=False, default=list)  # Available difficulty tracks
    prerequisites = mapped_column(JSON, nullable=False, default=list)  # Required prior knowledge
    learning_objectives = mapped_column(JSON, nullable=False, default=list)  # Course objectives
    estimated_duration = mapped_column(Integer, nullable=True)  # In hours
    status = mapped_column(Enum(CourseStatus), nullable=False, default=CourseStatus.DRAFT)
    is_public = mapped_column(Boolean, nullable=False, default=False)  # Can be shared between companies
    ai_generation_prompt = mapped_column(Text, nullable=True)  # Custom prompt for AI generation
    created_at = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="courses")
    content_source = relationship("ContentSource", back_populates="courses")
    lessons = relationship("Lesson", back_populates="course")
    user_progress = relationship("UserProgress", back_populates="course")
    learning_paths = relationship("LearningPath", back_populates="course")

# Placement test model
class PlacementTest(Base):
    __tablename__ = "placement_tests"
    
    id = mapped_column(Integer, primary_key=True)
    company_id = mapped_column(Integer, ForeignKey("companies.id"), nullable=False)
    title = mapped_column(String(200), nullable=False)
    instructions = mapped_column(Text, nullable=False)
    questions = mapped_column(JSON, nullable=False, default=list)  # Standardized placement questions
    scoring_matrix = mapped_column(JSON, nullable=False, default=dict)  # Level determination logic
    time_limit = mapped_column(Integer, nullable=False, default=30)  # Minutes
    min_text_length = mapped_column(Integer, nullable=False, default=100)  # Minimum words for text input
    is_active = mapped_column(Boolean, nullable=False, default=True)
    ai_analysis_prompt = mapped_column(Text, nullable=True)  # Custom AI analysis prompt
    created_at = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="placement_tests")
    placement_results = relationship("PlacementResult", back_populates="placement_test")

# Placement result model
class PlacementResult(Base):
    __tablename__ = "placement_results"
    
    id = mapped_column(Integer, primary_key=True)
    user_id = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    placement_test_id = mapped_column(Integer, ForeignKey("placement_tests.id"), nullable=False)
    raw_text_input = mapped_column(Text, nullable=False)  # User's free text input
    ai_analysis = mapped_column(JSON, nullable=False)  # Full OpenAI analysis results
    determined_level = mapped_column(String(20), nullable=False)
    confidence_score = mapped_column(Float, nullable=False)  # 0.0 - 1.0
    strengths = mapped_column(JSON, nullable=False, default=list)  # Identified strong areas
    weaknesses = mapped_column(JSON, nullable=False, default=list)  # Areas needing improvement
    recommended_focus = mapped_column(JSON, nullable=False, default=list)  # Recommended study areas
    recommended_start_lesson = mapped_column(Integer, nullable=True)
    completed_at = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    placement_test = relationship("PlacementTest", back_populates="placement_results")

# Question bank model pro AI-generované otázky
class QuestionBank(Base):
    __tablename__ = "question_banks"
    
    id = mapped_column(Integer, primary_key=True)
    lesson_id = mapped_column(Integer, ForeignKey("lessons.id"), nullable=False)
    questions = mapped_column(JSON, nullable=False)  # Structured question data
    difficulty = mapped_column(Enum(DifficultyLevel), nullable=False)
    categories = mapped_column(JSON, nullable=False, default=list)  # Grammar, vocabulary, comprehension
    usage_count = mapped_column(Integer, nullable=False, default=0)
    avg_success_rate = mapped_column(Float, nullable=False, default=0.0)
    ai_generation_prompt = mapped_column(Text, nullable=True)  # Prompt used for generation
    last_updated = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    created_at = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    lesson = relationship("Lesson", back_populates="question_banks")

# User progress model pro detailní tracking
class UserProgress(Base):
    __tablename__ = "user_progress"
    
    id = mapped_column(Integer, primary_key=True)
    user_id = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = mapped_column(Integer, ForeignKey("courses.id"), nullable=False)
    current_lesson_id = mapped_column(Integer, ForeignKey("lessons.id"), nullable=True)
    completion_percentage = mapped_column(Float, nullable=False, default=0.0)
    lessons_completed = mapped_column(JSON, nullable=False, default=list)  # List of completed lesson IDs
    lesson_scores = mapped_column(JSON, nullable=False, default=dict)  # {lesson_id: score}
    weak_areas = mapped_column(JSON, nullable=False, default=list)  # Categories needing improvement
    strong_areas = mapped_column(JSON, nullable=False, default=list)  # Categories where user excels
    study_streak = mapped_column(Integer, nullable=False, default=0)  # Days of consecutive study
    total_study_time = mapped_column(Integer, nullable=False, default=0)  # Total minutes studied
    last_accessed = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    completed_at = mapped_column(DateTime, nullable=True)
    next_review_date = mapped_column(DateTime, nullable=True)  # For spaced repetition
    
    # Relationships
    user = relationship("User")
    course = relationship("Course", back_populates="user_progress")
    current_lesson = relationship("Lesson", foreign_keys=[current_lesson_id])

# Learning path model pro personalizované učení
class LearningPath(Base):
    __tablename__ = "learning_paths"
    
    id = mapped_column(Integer, primary_key=True)
    user_id = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = mapped_column(Integer, ForeignKey("courses.id"), nullable=False)
    recommended_lessons = mapped_column(JSON, nullable=False, default=list)  # Ordered lesson IDs
    difficulty_adjustments = mapped_column(JSON, nullable=False, default=dict)  # Per-lesson difficulty
    review_schedule = mapped_column(JSON, nullable=False, default=dict)  # Spaced repetition schedule
    adaptive_rules = mapped_column(JSON, nullable=False, default=list)  # Applied adaptive rules
    ai_recommendations = mapped_column(JSON, nullable=False, default=dict)  # Latest AI recommendations
    last_updated = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    created_at = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    course = relationship("Course", back_populates="learning_paths")

# Rozšířený User model s novými poli
class User(Base):
    __tablename__ = "users"
    id = mapped_column(Integer, primary_key=True)
    name = mapped_column(String(100), nullable=False)
    phone = mapped_column(String(20), nullable=False)
    email = mapped_column(String(120), nullable=True)
    level = mapped_column(String(20), nullable=True, default="beginner")
    language = mapped_column(String(2), nullable=True, default="cs")
    detail = mapped_column(Text, nullable=True)
    current_lesson_level = mapped_column(Integer, nullable=False, default=0)
    
    # Nová pole pro company vztah
    company_id = mapped_column(Integer, ForeignKey("companies.id"), nullable=True)
    role = mapped_column(String(20), nullable=False, default="regular_user")  # admin, contact_person, regular_user
    placement_completed = mapped_column(Boolean, nullable=False, default=False)
    placement_score = mapped_column(Float, nullable=True)  # Score from placement test
    learning_preferences = mapped_column(JSON, nullable=False, default=dict)  # User learning preferences
    
    created_at = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="users", foreign_keys=[company_id])
    attempts = relationship("Attempt", back_populates="user")
    badges = relationship("UserBadge", back_populates="user")



# Rozšíření Lesson modelu o course vztah
class Lesson(Base):
    __tablename__ = "lessons"
    id = mapped_column(Integer, primary_key=True)
    course_id = mapped_column(Integer, ForeignKey("courses.id"), nullable=True)  # Nullable pro existující lekce
    trainingId = mapped_column(Integer, nullable=True)  # Kompatibilita s Node.js backend
    title = mapped_column(String(200), nullable=False)
    description = mapped_column(Text, nullable=True)  # Nový sloupec pro popis lekce
    content = mapped_column(Text, nullable=False, default="")  # Hlavní obsah lekce
    learning_objectives = mapped_column(JSON, nullable=False, default=list)  # Cíle lekce
    language = mapped_column(String(2), nullable=False, default="cs")
    script = mapped_column(Text, nullable=False, default="")  # Změněno na nullable=False s default
    questions = mapped_column(JSON, nullable=False)
    level = mapped_column(String(20), nullable=False, default="beginner")
    base_difficulty = mapped_column(String(20), nullable=False, default="medium") # "easy", "medium", "hard"
    lesson_number = mapped_column(Integer, nullable=False, default=0)
    order_in_course = mapped_column(Integer, nullable=True)  # Pořadí v kurzu
    required_score = mapped_column(Float, nullable=False, default=90.0)
    lesson_type = mapped_column(String(20), nullable=False, default="test")  # "test", "teaching", "scenario"
    estimated_duration = mapped_column(Integer, nullable=True)  # Minutes
    ai_generated = mapped_column(Boolean, nullable=False, default=False)  # Was generated by AI
    ai_generation_prompt = mapped_column(Text, nullable=True)  # Prompt used for generation
    created_at = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    course = relationship("Course", back_populates="lessons")
    attempts = relationship("Attempt", back_populates="lesson")
    question_banks = relationship("QuestionBank", back_populates="lesson")
    
    def get_next_question(self) -> Optional[dict]:
        if not self.questions.get("all"):
            return None
        current_index = next(
            (i for i, q in enumerate(self.questions["all"]) 
             if q["question"] == self.questions["current"]),
            -1
        )
        if current_index == -1 or current_index == len(self.questions["all"]) - 1:
            next_question = self.questions["all"][0]
        else:
            next_question = self.questions["all"][current_index + 1]
        return {
            "current": next_question["question"],
            "answer": next_question["answer"]
        }

class Badge(Base):
    __tablename__ = "badges"
    id = mapped_column(Integer, primary_key=True)
    name = mapped_column(String(100), nullable=False, unique=True)
    description = mapped_column(Text, nullable=False)
    icon_svg = mapped_column(Text, nullable=True) # Ikonka jako SVG kód
    category = mapped_column(String(50), nullable=False) # Kategorie, za kterou se odznak uděluje

class UserBadge(Base):
    __tablename__ = "user_badges"
    id = mapped_column(Integer, primary_key=True)
    user_id = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    badge_id = mapped_column(Integer, ForeignKey("badges.id"), nullable=False)
    awarded_at = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="badges")
    badge = relationship("Badge")

class TestSession(Base):
    """Model pro sledování průběhu testování"""
    __tablename__ = "test_sessions" 
    
    id = mapped_column(Integer, primary_key=True)
    user_id = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = mapped_column(Integer, ForeignKey("lessons.id"), nullable=False)
    attempt_id = mapped_column(Integer, ForeignKey("attempts.id"), nullable=True)
    
    # Stav testování
    current_question_index = mapped_column(Integer, nullable=False, default=0)
    total_questions = mapped_column(Integer, nullable=False, default=0)
    questions_data = mapped_column(JSON, nullable=False)
    
    # Adaptivní obtížnost a sledování chyb
    difficulty_score = mapped_column(Float, nullable=False, default=50.0)
    failed_categories = mapped_column(JSON, nullable=False, default=list)
    
    # Výsledky
    answers = mapped_column(JSON, nullable=False, default=list)
    scores = mapped_column(JSON, nullable=False, default=list)
    current_score = mapped_column(Float, nullable=False, default=0.0)
    
    # Metadata
    started_at = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    completed_at = mapped_column(DateTime, nullable=True)
    is_completed = mapped_column(Boolean, nullable=False, default=False)
    
    # Relationships
    user = relationship("User")
    lesson = relationship("Lesson")
    attempt = relationship("Attempt")

class Answer(Base):
    __tablename__ = "answers"
    id = mapped_column(Integer, primary_key=True)
    attempt_id = mapped_column(Integer, ForeignKey("attempts.id"), nullable=False)
    question_index = mapped_column(Integer, nullable=False)
    question_text = mapped_column(Text, nullable=False)
    correct_answer = mapped_column(Text, nullable=False)
    user_answer = mapped_column(Text, nullable=False)
    score = mapped_column(Float, nullable=False)
    is_correct = mapped_column(Boolean, nullable=False)
    feedback = mapped_column(Text)
    suggestions = mapped_column(Text)
    created_at = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    attempt = relationship("Attempt", back_populates="answers")

class Attempt(Base):
    __tablename__ = "attempts"
    id = mapped_column(Integer, primary_key=True)
    user_id = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = mapped_column(Integer, ForeignKey("lessons.id"), nullable=False)
    status = mapped_column(String(20), nullable=False, default="pending")
    score = mapped_column(Float)
    feedback = mapped_column(Text)
    created_at = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    completed_at = mapped_column(DateTime)
    next_due = mapped_column(DateTime)
    user = relationship("User", back_populates="attempts")
    lesson = relationship("Lesson", back_populates="attempts")
    answers = relationship("Answer", back_populates="attempt")
    
    def calculate_next_due(self) -> None:
        if self.score is None:
            self.next_due = datetime.utcnow() + timedelta(days=1)
        elif self.score < 80:
            self.next_due = datetime.utcnow() + timedelta(days=3)
        elif self.score < 90:
            self.next_due = datetime.utcnow() + timedelta(days=7)
        else:
            self.next_due = datetime.utcnow() + timedelta(days=30) 
            
    def calculate_overall_score(self) -> float:
        if not self.answers:
            return 0.0
        total_score = sum(answer.score for answer in self.answers)
        return total_score / len(self.answers) 