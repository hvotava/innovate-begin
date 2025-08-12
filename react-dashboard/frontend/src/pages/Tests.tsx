import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  Paper,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  CardActions,
  Fab,
  Grid,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Quiz as TestIcon,
  Assignment as LessonIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  Search as SearchIcon,
  PlayArrow as StartIcon,
  Category as CategoryIcon,
  QuestionAnswer as QuestionIcon,
  ExpandMore as ExpandMoreIcon,
  DragIndicator as DragIcon,
  AutoAwesome as AIIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { testsAPI, lessonsAPI, trainingsAPI } from '../services/api';
import { Test, Lesson, Training, Question } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { canManageTests, canViewAllData } from '../utils/permissions';
import AITestGenerator from '../components/AITestGenerator';

interface TestFormData {
  title: string;
  lessonId: number | '';
  trainingId: number | '';
  orderNumber: number;
  questions: Question[];
}

interface QuestionFormData {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  type?: 'multiple_choice' | 'free_text' | 'fill_in_blank' | 'matching';
  difficulty?: 'easy' | 'medium' | 'hard';
  keyWords?: string[];
  alternatives?: string[];
  pairs?: Array<{term: string; definition: string}>;
}

const Tests: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  
  const [tests, setTests] = useState<Test[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [formData, setFormData] = useState<TestFormData>({
    title: '',
    lessonId: '',
    trainingId: '',
    orderNumber: 0,
    questions: []
  });
  
  // Question editor states
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [questionFormData, setQuestionFormData] = useState<QuestionFormData>({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    type: 'multiple_choice',
    difficulty: 'medium',
    keyWords: [],
    alternatives: [],
    pairs: []
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [lessonFilter, setLessonFilter] = useState('');
  const [trainingFilter, setTrainingFilter] = useState('');
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  // Kontrola oprávnění
  const canManage = user ? canManageTests(user.role) : false;
  const canViewAll = user ? canViewAllData(user.role) : false;

  useEffect(() => {
    if (!canManage) {
      setSnackbar({
        open: true,
        message: 'Nemáte oprávnění k správě testů',
        severity: 'error'
      });
      return;
    }
    
    fetchTests();
    fetchLessons();
    fetchTrainings();
  }, [canManage, searchTerm, lessonFilter, trainingFilter]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await testsAPI.getTests({ 
        search: searchTerm,
        lessonId: lessonFilter
      });
      setTests(response.data.tests);
    } catch (error) {
      console.error('Error fetching tests:', error);
      showSnackbar('Nepodařilo se načíst testy', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async () => {
    try {
      const response = await lessonsAPI.getLessons();
      setLessons(response.data.lessons);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const fetchTrainings = async () => {
    try {
      const response = await trainingsAPI.getTrainings();
      setTrainings(response.data.trainings);
    } catch (error) {
      console.error('Error fetching trainings:', error);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (test?: Test) => {
    if (test) {
      setEditingTest(test);
      setFormData({
        title: test.title,
        lessonId: test.lessonId,
        trainingId: test.trainingId || '',
        orderNumber: test.orderNumber || 0,
        questions: test.questions || []
      });
    } else {
      setEditingTest(null);
      setFormData({
        title: '',
        lessonId: '',
        trainingId: '',
        orderNumber: 0,
        questions: []
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTest(null);
    setFormData({
      title: '',
      lessonId: '',
      trainingId: '',
      orderNumber: 0,
      questions: []
    });
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        title: formData.title,
        lessonId: Number(formData.lessonId),
        trainingId: Number(formData.trainingId),
        orderNumber: formData.orderNumber,
        questions: formData.questions
      };

      if (editingTest) {
        await testsAPI.updateTest(editingTest.id, submitData);
        showSnackbar('Test byl úspěšně aktualizován', 'success');
      } else {
        await testsAPI.createTest(submitData);
        showSnackbar('Test byl úspěšně vytvořen', 'success');
      }

      handleCloseDialog();
      fetchTests();
    } catch (error: any) {
      console.error('Error saving test:', error);
      const errorMessage = error.response?.data?.error || 'Nepodařilo se uložit test';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleDelete = async (test: Test) => {
    if (!window.confirm(`Opravdu chcete smazat test "${test.title}"?`)) {
      return;
    }

    try {
      await testsAPI.deleteTest(test.id);
      showSnackbar('Test byl úspěšně smazán', 'success');
      fetchTests();
    } catch (error: any) {
      console.error('Error deleting test:', error);
      const errorMessage = error.response?.data?.error || 'Nepodařilo se smazat test';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleSearch = () => {
    fetchTests();
  };

  // Question management
  const handleOpenQuestionDialog = (questionIndex?: number) => {
    if (questionIndex !== undefined) {
      setEditingQuestionIndex(questionIndex);
      const question = formData.questions[questionIndex];
      setQuestionFormData({
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation || ''
      });
    } else {
      setEditingQuestionIndex(null);
      setQuestionFormData({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: ''
      });
    }
    setQuestionDialogOpen(true);
  };

  const handleSaveQuestion = () => {
    const newQuestion: Question = {
      question: questionFormData.question,
      options: questionFormData.options.filter(opt => opt.trim() !== ''),
      correctAnswer: questionFormData.correctAnswer,
      explanation: questionFormData.explanation || undefined
    };

    let updatedQuestions = [...formData.questions];
    
    if (editingQuestionIndex !== null) {
      updatedQuestions[editingQuestionIndex] = newQuestion;
    } else {
      updatedQuestions.push(newQuestion);
    }

    setFormData({ ...formData, questions: updatedQuestions });
    setQuestionDialogOpen(false);
  };

  const handleDeleteQuestion = (questionIndex: number) => {
    const updatedQuestions = formData.questions.filter((_, index) => index !== questionIndex);
    setFormData({ ...formData, questions: updatedQuestions });
  };

  // Category color mapping
  const getCategoryColor = (category?: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
    if (!category) return 'secondary';
    
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('bezpečnost') || lowerCategory.includes('security')) return 'error';
    if (lowerCategory.includes('technik') || lowerCategory.includes('technical')) return 'primary';
    if (lowerCategory.includes('soft') || lowerCategory.includes('komunikace')) return 'success';
    if (lowerCategory.includes('prodej') || lowerCategory.includes('sales')) return 'warning';
    return 'secondary';
  };

  // Desktop DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'title',
      headerName: 'Název testu',
      flex: 1,
      minWidth: 200
    },
    {
      field: 'lesson',
      headerName: 'Lekce',
      width: 200,
      renderCell: (params) => {
        const lesson = params.row.Lesson;
        return lesson ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LessonIcon fontSize="small" />
            <Typography variant="body2" noWrap>
              {lesson.title}
            </Typography>
          </Box>
        ) : '—';
      }
    },
    {
      field: 'training',
      headerName: 'Školení',
      width: 180,
      renderCell: (params) => {
        const training = params.row.Lesson?.Training;
        return training ? (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SchoolIcon fontSize="small" />
              <Typography variant="body2" noWrap>
                {training.title}
              </Typography>
            </Box>
            {training.category && (
              <Chip 
                label={training.category}
                color={getCategoryColor(training.category)}
                size="small"
                sx={{ fontSize: '0.7rem', height: 18, mt: 0.5 }}
              />
            )}
          </Box>
        ) : '—';
      }
    },
    {
      field: 'orderNumber',
      headerName: 'Pořadí',
      width: 80,
      renderCell: (params) => (
        <Chip 
          label={params.value || 0}
          color="primary"
          size="small"
          variant="outlined"
        />
      )
    },
    {
      field: 'questionsCount',
      headerName: 'Otázky',
      width: 80,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <QuestionIcon fontSize="small" />
          <Typography variant="body2">
            {params.row.questions?.length || 0}
          </Typography>
        </Box>
      )
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Akce',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<StartIcon />}
          label="Spustit"
          onClick={() => {
            // Navigate to test detail/start
            console.log('Start test:', params.row.id);
          }}
        />,
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Upravit"
          onClick={() => handleOpenDialog(params.row)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Smazat"
          onClick={() => handleDelete(params.row)}
        />
      ]
    }
  ];

  // Mobile Card Component
  const TestCard: React.FC<{ test: Test }> = ({ test }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TestIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {test.title}
          </Typography>
          <Chip 
            label={`#${test.orderNumber || 0}`}
            color="primary"
            size="small"
            variant="outlined"
          />
        </Box>
        
        {test.Lesson && (
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LessonIcon fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2" fontWeight="medium">
                {test.Lesson.title}
              </Typography>
            </Box>
            
            {test.Lesson.Training && (
              <Box sx={{ ml: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolIcon fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    {test.Lesson.Training.title}
                  </Typography>
                </Box>
                
                {test.Lesson.Training.category && (
                  <Chip 
                    label={test.Lesson.Training.category}
                    color={getCategoryColor(test.Lesson.Training.category)}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                )}
              </Box>
            )}
          </Box>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <QuestionIcon fontSize="small" color="primary" />
            <Typography variant="body2">
              {test.questions?.length || 0} otázek
            </Typography>
          </Box>
        </Box>
      </CardContent>
      
      <CardActions>
        <Button 
          size="small" 
          startIcon={<StartIcon />}
          color="primary"
        >
          Spustit
        </Button>
        <Button 
          size="small" 
          startIcon={<EditIcon />}
          onClick={() => handleOpenDialog(test)}
        >
          Upravit
        </Button>
        <Button 
          size="small" 
          startIcon={<DeleteIcon />}
          color="error"
          onClick={() => handleDelete(test)}
        >
          Smazat
        </Button>
      </CardActions>
    </Card>
  );

  if (!canManage) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Nemáte oprávnění k přístupu na tuto stránku.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        mb: 3,
        gap: 2
      }}>
        <Typography variant="h4" component="h1">
          Správa testů
        </Typography>
        
        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Přidat test
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              placeholder="Hledat testy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              size="small"
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Školení</InputLabel>
              <Select
                value={trainingFilter}
                onChange={(e) => setTrainingFilter(e.target.value)}
                label="Školení"
              >
                <MenuItem value="">Všechna školení</MenuItem>
                {trainings.map((training) => (
                  <MenuItem key={training.id} value={training.id.toString()}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SchoolIcon fontSize="small" />
                      <Typography noWrap>{training.title}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Lekce</InputLabel>
              <Select
                value={lessonFilter}
                onChange={(e) => setLessonFilter(e.target.value)}
                label="Lekce"
              >
                <MenuItem value="">Všechny lekce</MenuItem>
                {lessons
                  .filter(lesson => !trainingFilter || lesson.trainingId.toString() === trainingFilter)
                  .map((lesson) => (
                  <MenuItem key={lesson.id} value={lesson.id.toString()}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LessonIcon fontSize="small" />
                      <Typography noWrap>{lesson.title}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleSearch}
              disabled={loading}
            >
              Hledat
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Content */}
      {isMobile ? (
        <>
          {/* Mobile Card View */}
          {tests.map((test) => (
            <TestCard key={test.id} test={test} />
          ))}
          
          {/* Mobile FAB */}
          <Fab
            color="primary"
            aria-label="add"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={() => handleOpenDialog()}
          >
            <AddIcon />
          </Fab>
        </>
      ) : (
        /* Desktop DataGrid */
        <Paper sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={tests}
            columns={columns}
            loading={loading}
            checkboxSelection
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 }
              }
            }}
          />
        </Paper>
      )}

      {/* Main Test Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        fullScreen={isMobile}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {editingTest ? 'Upravit test' : 'Přidat test'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Název testu"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Školení</InputLabel>
                <Select
                  value={formData.trainingId}
                  onChange={(e) => {
                    const trainingId = e.target.value as number;
                    setFormData({ ...formData, trainingId, lessonId: '' }); // Reset lesson when training changes
                  }}
                  label="Školení"
                >
                  {trainings.map((training) => (
                    <MenuItem key={training.id} value={training.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SchoolIcon fontSize="small" />
                        <Typography>{training.title}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Lekce</InputLabel>
                <Select
                  value={formData.lessonId}
                  onChange={(e) => setFormData({ ...formData, lessonId: e.target.value as number })}
                  label="Lekce"
                  disabled={!formData.trainingId}
                >
                  {lessons
                    .filter(lesson => !formData.trainingId || lesson.trainingId === formData.trainingId)
                    .map((lesson) => (
                    <MenuItem key={lesson.id} value={lesson.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LessonIcon fontSize="small" />
                        <Typography>{lesson.title}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Pořadí"
                type="number"
                value={formData.orderNumber}
                onChange={(e) => setFormData({ ...formData, orderNumber: Number(e.target.value) })}
                margin="normal"
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>
          
          {/* Questions Section */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Otázky ({formData.questions.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  startIcon={<AIIcon />}
                  onClick={() => setAiGeneratorOpen(true)}
                  variant="contained"
                  color="primary"
                  size="small"
                >
                  AI Generátor
                </Button>
              <Button 
                startIcon={<AddIcon />}
                onClick={() => handleOpenQuestionDialog()}
                variant="outlined"
                size="small"
              >
                Přidat otázku
              </Button>
              </Box>
            </Box>
            
            {formData.questions.length > 0 ? (
              <List>
                {formData.questions.map((question, index) => (
                  <Accordion key={index}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <DragIcon fontSize="small" color="action" />
                        <Typography sx={{ flexGrow: 1 }}>
                          {index + 1}. {question.question}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Chip 
                            label={question.type === 'multiple_choice' ? `${question.options.length} možností` :
                                  question.type === 'free_text' ? 'Volná odpověď' :
                                  question.type === 'fill_in_blank' ? 'Doplňovačka' :
                                  question.type === 'matching' ? `${question.pairs?.length || 0} párů` :
                                  `${question.options.length} možností`}
                          size="small" 
                          color="primary"
                            variant="outlined"
                          />
                          {question.difficulty && (
                            <Chip 
                              label={question.difficulty}
                              size="small" 
                              color={question.difficulty === 'hard' ? 'error' : question.difficulty === 'medium' ? 'warning' : 'success'}
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ mb: 2 }}>
                        {(question.type === 'multiple_choice' || !question.type) && (
                          <>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Možnosti:</Typography>
                        {question.options.map((option, optIndex) => (
                          <Typography 
                            key={optIndex}
                            variant="body2" 
                            sx={{ 
                              ml: 2, 
                              color: optIndex === question.correctAnswer ? 'success.main' : 'text.secondary',
                              fontWeight: optIndex === question.correctAnswer ? 'bold' : 'normal'
                            }}
                          >
                            {optIndex + 1}. {option} {optIndex === question.correctAnswer && '✓'}
                          </Typography>
                        ))}
                          </>
                        )}
                        
                        {question.type === 'free_text' && (
                          <>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Vzorová odpověď:</Typography>
                            <Typography variant="body2" sx={{ ml: 2, mb: 1, color: 'success.main' }}>
                              {question.options[question.correctAnswer]}
                            </Typography>
                            {question.keyWords && question.keyWords.length > 0 && (
                              <>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Klíčová slova:</Typography>
                                <Box sx={{ ml: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                  {question.keyWords.map((word, idx) => (
                                    <Chip key={idx} label={word} size="small" variant="outlined" />
                                  ))}
                                </Box>
                              </>
                            )}
                          </>
                        )}
                        
                        {question.type === 'fill_in_blank' && (
                          <>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Správná odpověď:</Typography>
                            <Typography variant="body2" sx={{ ml: 2, mb: 1, color: 'success.main' }}>
                              {question.options[question.correctAnswer]}
                            </Typography>
                            {question.alternatives && question.alternatives.length > 0 && (
                              <>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Alternativní odpovědi:</Typography>
                                <Box sx={{ ml: 2 }}>
                                  {question.alternatives.map((alt, idx) => (
                                    <Typography key={idx} variant="body2" sx={{ color: 'text.secondary' }}>
                                      • {alt}
                                    </Typography>
                                  ))}
                                </Box>
                              </>
                            )}
                          </>
                        )}
                        
                        {question.type === 'matching' && (
                          <>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Páry:</Typography>
                            {question.pairs?.map((pair, idx) => (
                              <Box key={idx} sx={{ ml: 2, mb: 1, display: 'flex', gap: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '120px' }}>
                                  {pair.term}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                  → {pair.definition}
                                </Typography>
                              </Box>
                            ))}
                          </>
                        )}
                        
                        {question.explanation && (
                          <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Vysvětlení:</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {question.explanation}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          size="small" 
                          onClick={() => handleOpenQuestionDialog(index)}
                          startIcon={<EditIcon />}
                        >
                          Upravit
                        </Button>
                        <Button 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteQuestion(index)}
                          startIcon={<DeleteIcon />}
                        >
                          Smazat
                        </Button>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </List>
            ) : (
              <Alert severity="info">
                Zatím nejsou přidané žádné otázky. Klikněte na "Přidat otázku" pro vytvoření první otázky.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Zrušit</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.title.trim() || !formData.lessonId || formData.questions.length === 0}
          >
            {editingTest ? 'Uložit' : 'Vytvořit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Question Dialog */}
      <Dialog 
        open={questionDialogOpen} 
        onClose={() => setQuestionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingQuestionIndex !== null ? 'Upravit otázku' : 'Přidat otázku'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Otázka"
            value={questionFormData.question}
            onChange={(e) => setQuestionFormData({ ...questionFormData, question: e.target.value })}
            margin="normal"
            multiline
            rows={2}
            required
          />
          
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Možnosti odpovědí:
          </Typography>
          {questionFormData.options.map((option, index) => (
            <TextField
              key={index}
              fullWidth
              label={`Možnost ${index + 1}`}
              value={option}
              onChange={(e) => {
                const newOptions = [...questionFormData.options];
                newOptions[index] = e.target.value;
                setQuestionFormData({ ...questionFormData, options: newOptions });
              }}
              margin="normal"
              size="small"
            />
          ))}
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Správná odpověď</InputLabel>
            <Select
              value={questionFormData.correctAnswer}
              onChange={(e) => setQuestionFormData({ ...questionFormData, correctAnswer: e.target.value as number })}
              label="Správná odpověď"
            >
              {questionFormData.options.map((option, index) => (
                <MenuItem key={index} value={index} disabled={!option.trim()}>
                  {index + 1}. {option || '(prázdná)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Vysvětlení (volitelné)"
            value={questionFormData.explanation}
            onChange={(e) => setQuestionFormData({ ...questionFormData, explanation: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuestionDialogOpen(false)}>Zrušit</Button>
          <Button 
            onClick={handleSaveQuestion} 
            variant="contained"
            disabled={
              !questionFormData.question.trim() || 
              questionFormData.options.filter(opt => opt.trim()).length < 2
            }
          >
            {editingQuestionIndex !== null ? 'Uložit' : 'Přidat'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* AI Test Generator */}
      <AITestGenerator
        open={aiGeneratorOpen}
        onClose={() => setAiGeneratorOpen(false)}
        onQuestionsGenerated={(questions) => {
          // Convert AI questions to test format and add to formData
          const convertedQuestions: Question[] = questions.map(q => ({
            question: q.question,
            options: q.type === 'multiple_choice' ? q.options || [] : 
                    q.type === 'fill_in_blank' ? [`${q.correctAnswer}`, ...(q.alternatives || [])] :
                    q.type === 'matching' ? q.pairs?.map(p => `${p.term}: ${p.definition}`) || [] :
                    [q.correctAnswer],
            correctAnswer: 0, // First option is always correct for AI generated questions
            explanation: q.explanation || '',
            type: (q.type as 'multiple_choice' | 'free_text' | 'fill_in_blank' | 'matching') || 'multiple_choice',
            difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
            keyWords: q.keyWords || [],
            alternatives: q.alternatives || [],
            pairs: q.pairs || []
          }));

          setFormData(prev => ({
            ...prev,
            questions: [...prev.questions, ...convertedQuestions]
          }));

          setSnackbar({
            open: true,
            message: `Úspěšně přidáno ${questions.length} AI generovaných otázek!`,
            severity: 'success'
          });
        }}
        lessonId={typeof formData.lessonId === 'number' ? formData.lessonId : undefined}
        language="cs"
      />
    </Box>
  );
};

export default Tests; 