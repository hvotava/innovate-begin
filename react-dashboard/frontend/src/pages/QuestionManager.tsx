import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Badge,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Quiz as QuizIcon,
  Psychology as PsychologyIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Lesson {
  id: number;
  title: string;
  content: string;
  course_id: number;
  lesson_number: number;
  difficulty: string;
  ai_generated: boolean;
  has_questions: boolean;
}

interface Question {
  question: string;
  type: string;
  correct_answer: string;
  options?: string[];
  explanation: string;
  difficulty: string;
  category: string;
  points: number;
}

interface QuestionBank {
  questions: Question[];
  has_questions: boolean;
  difficulty: string;
  usage_count: number;
  avg_success_rate: number;
  last_updated: string;
}

const QuestionManager: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [questionBank, setQuestionBank] = useState<QuestionBank | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Generation settings
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  
  // Question preview
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);

  // Load lessons
  const loadLessons = useCallback(async () => {
    if (!user?.companyId) return;

    try {
      setLoading(true);
      // Get courses first
      const coursesResponse = await api.get(`/api/courses/company/${user.companyId}`);
      const courses = coursesResponse.data.courses || [];
      
      // Get lessons directly from lessons API
      try {
        const lessonsResponse = await api.get('/api/lessons');
        const allLessons: Lesson[] = lessonsResponse.data.lessons.map((lesson: any) => ({
          ...lesson,
          course_id: 1, // Default course
          has_questions: false // Will be updated when checking question banks
        }));
        
        // Check which lessons have questions
        for (const lesson of allLessons) {
          try {
            const questionsResponse = await api.get(`/api/questions/lessons/${lesson.id}/questions`);
            lesson.has_questions = questionsResponse.data.has_questions;
          } catch (err) {
            lesson.has_questions = false;
          }
        }
        
        setLessons(allLessons);
      } catch (err) {
        console.warn('Could not load lessons');
        setLessons([]);
      }
      
      // Check which lessons have questions
      for (const lesson of allLessons) {
        try {
          const questionsResponse = await api.get(`/api/lessons/${lesson.id}/questions`);
          lesson.has_questions = questionsResponse.data.has_questions;
        } catch (err) {
          lesson.has_questions = false;
        }
      }
      
      setLessons(allLessons);
    } catch (err: any) {
      console.error('Error loading lessons:', err);
      setError('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  // Load questions for a lesson
  const loadQuestions = async (lessonId: number, selectedDifficulty: string = 'medium') => {
    try {
      setLoading(true);
      const response = await api.get(`/api/questions/lessons/${lessonId}/questions?difficulty=${selectedDifficulty}`);
      setQuestionBank(response.data);
    } catch (err: any) {
      console.error('Error loading questions:', err);
      setQuestionBank({
        questions: [],
        has_questions: false,
        difficulty: selectedDifficulty,
        usage_count: 0,
        avg_success_rate: 0,
        last_updated: ''
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate questions
  const handleGenerateQuestions = async () => {
    if (!selectedLesson) return;

    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post(`/api/questions/lessons/${selectedLesson.id}/generate-questions`, {
        question_count: questionCount,
        difficulty: difficulty
      });

      if (response.data.success) {
        setSuccess(`Generated ${response.data.questions_generated} questions successfully!`);
        setPreviewQuestions(response.data.questions || []);
        setShowGenerateDialog(false);
        
        // Reload questions and lessons
        await loadQuestions(selectedLesson.id, difficulty);
        await loadLessons();
      }
    } catch (err: any) {
      console.error('Error generating questions:', err);
      setError(err.response?.data?.error || 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'multiple_choice': return '📝';
      case 'short_answer': return '✍️';
      case 'speaking': return '🗣️';
      case 'true_false': return '✅';
      default: return '❓';
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <QuizIcon sx={{ mr: 2, fontSize: 40 }} />
            <Box>
              <Typography variant="h4" component="h1">
                Question Manager
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Generate and manage AI-powered questions for lessons
              </Typography>
            </Box>
          </Box>
          
          {selectedLesson && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PsychologyIcon />}
              onClick={() => setShowGenerateDialog(true)}
              disabled={generating}
            >
              Generate Questions
            </Button>
          )}
        </Box>
      </Paper>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Lessons List */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📚 Available Lessons
              </Typography>
              
              {loading && !lessons.length ? (
                <LinearProgress />
              ) : (
                <List>
                  {lessons.map((lesson) => (
                    <ListItem
                      key={lesson.id}
                      button
                      selected={selectedLesson?.id === lesson.id}
                      onClick={() => {
                        setSelectedLesson(lesson);
                        loadQuestions(lesson.id);
                      }}
                      sx={{
                        borderRadius: 1,
                        mb: 1,
                        border: selectedLesson?.id === lesson.id ? 2 : 1,
                        borderColor: selectedLesson?.id === lesson.id ? 'primary.main' : 'grey.300'
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2">
                              {lesson.title}
                            </Typography>
                            {lesson.has_questions && (
                              <CheckCircleIcon sx={{ color: 'success.main', fontSize: 16 }} />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption">
                              Lesson {lesson.lesson_number}
                            </Typography>
                            <br />
                            <Chip 
                              label={lesson.difficulty} 
                              size="small" 
                              color={getDifficultyColor(lesson.difficulty) as any}
                            />
                            {lesson.ai_generated && (
                              <Chip 
                                label="AI Generated" 
                                size="small" 
                                variant="outlined"
                                sx={{ ml: 0.5 }}
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              
              {lessons.length === 0 && !loading && (
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                  No lessons available. Create courses first.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Question Bank */}
        <Grid item xs={12} md={8}>
          {!selectedLesson ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <SchoolIcon sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
                <Typography variant="h6" color="textSecondary">
                  Select a lesson to view or generate questions
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">
                    Questions for: {selectedLesson.title}
                  </Typography>
                  
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Difficulty</InputLabel>
                    <Select
                      value={difficulty}
                      onChange={(e) => {
                        setDifficulty(e.target.value);
                        loadQuestions(selectedLesson.id, e.target.value);
                      }}
                    >
                      <MenuItem value="easy">Easy</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="hard">Hard</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {questionBank?.has_questions ? (
                  <Box>
                    {/* Question Bank Stats */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {questionBank.questions.length}
                          </Typography>
                          <Typography variant="caption">Questions</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="info.main">
                            {questionBank.usage_count}
                          </Typography>
                          <Typography variant="caption">Used</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="success.main">
                            {questionBank.avg_success_rate.toFixed(1)}%
                          </Typography>
                          <Typography variant="caption">Success Rate</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="secondary.main">
                            {questionBank.difficulty}
                          </Typography>
                          <Typography variant="caption">Difficulty</Typography>
                        </Paper>
                      </Grid>
                    </Grid>

                    {/* Questions List */}
                    <Typography variant="h6" gutterBottom>
                      📋 Questions Preview
                    </Typography>
                    
                    {questionBank.questions.slice(0, 5).map((question, index) => (
                      <Accordion key={index}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                            <Typography sx={{ fontSize: '1.2rem' }}>
                              {getQuestionTypeIcon(question.type)}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                              {question.question.substring(0, 80)}...
                            </Typography>
                            <Chip 
                              label={question.category} 
                              size="small" 
                              variant="outlined"
                            />
                            <Chip 
                              label={`${question.points} pts`} 
                              size="small" 
                              color="primary"
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box>
                            <Typography variant="body1" paragraph>
                              <strong>Question:</strong> {question.question}
                            </Typography>
                            
                            {question.options && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>Options:</Typography>
                                {question.options.map((option, optIndex) => (
                                  <Typography 
                                    key={optIndex} 
                                    variant="body2"
                                    sx={{ 
                                      ml: 2, 
                                      color: option === question.correct_answer ? 'success.main' : 'text.primary',
                                      fontWeight: option === question.correct_answer ? 'bold' : 'normal'
                                    }}
                                  >
                                    {String.fromCharCode(65 + optIndex)}. {option}
                                    {option === question.correct_answer && ' ✓'}
                                  </Typography>
                                ))}
                              </Box>
                            )}
                            
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Correct Answer:</strong> {question.correct_answer}
                            </Typography>
                            
                            <Typography variant="body2" color="textSecondary">
                              <strong>Explanation:</strong> {question.explanation}
                            </Typography>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                    
                    {questionBank.questions.length > 5 && (
                      <Button
                        variant="outlined"
                        fullWidth
                        sx={{ mt: 2 }}
                        onClick={() => {
                          setPreviewQuestions(questionBank.questions);
                          setShowQuestionDialog(true);
                        }}
                      >
                        View All {questionBank.questions.length} Questions
                      </Button>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <QuizIcon sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      No questions available for this lesson
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Generate AI-powered questions to create engaging assessments
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<PsychologyIcon />}
                      onClick={() => setShowGenerateDialog(true)}
                    >
                      Generate Questions
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Generate Questions Dialog */}
      <Dialog open={showGenerateDialog} onClose={() => setShowGenerateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          🤖 Generate AI Questions
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" paragraph>
            Generate diverse questions for: <strong>{selectedLesson?.title}</strong>
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Number of Questions"
                type="number"
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
                inputProps={{ min: 1, max: 50 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Difficulty Level</InputLabel>
                <Select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            AI will generate a variety of question types including multiple choice, short answer, and speaking prompts based on the lesson content.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGenerateDialog(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleGenerateQuestions}
            disabled={generating}
            startIcon={generating ? undefined : <PsychologyIcon />}
          >
            {generating ? 'Generating...' : 'Generate Questions'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* All Questions Dialog */}
      <Dialog 
        open={showQuestionDialog} 
        onClose={() => setShowQuestionDialog(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          All Questions - {selectedLesson?.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {previewQuestions.length} questions available
          </Typography>
          
          {previewQuestions.map((question, index) => (
            <Accordion key={index}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>
                  {index + 1}. {getQuestionTypeIcon(question.type)} {question.question.substring(0, 60)}...
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Typography variant="body1" paragraph>
                    {question.question}
                  </Typography>
                  
                  {question.options && (
                    <Box sx={{ mb: 2 }}>
                      {question.options.map((option, optIndex) => (
                        <Typography 
                          key={optIndex} 
                          variant="body2"
                          sx={{ 
                            ml: 2, 
                            color: option === question.correct_answer ? 'success.main' : 'text.primary'
                          }}
                        >
                          {String.fromCharCode(65 + optIndex)}. {option}
                        </Typography>
                      ))}
                    </Box>
                  )}
                  
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Answer:</strong> {question.correct_answer}
                  </Typography>
                  
                  <Typography variant="body2" color="textSecondary">
                    {question.explanation}
                  </Typography>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQuestionDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuestionManager; 