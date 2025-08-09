import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  ExpandMore as ExpandMoreIcon,
  RadioButtonChecked as MultipleChoiceIcon,
  Edit as FreeTextIcon,
  TextFields as FillBlankIcon,
  CompareArrows as MatchingIcon,
  Visibility as PreviewIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Psychology as BrainIcon
} from '@mui/icons-material';
import api from '../services/api';

interface Question {
  id: string;
  type: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  alternatives?: string[];
  pairs?: Array<{term: string; definition: string}>;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  keyWords: string[];
  generated: boolean;
  generatedAt?: string;
  language: string;
}

interface QuestionType {
  name: string;
  description: string;
  icon: string;
  example: string;
}

interface AITestGeneratorProps {
  open: boolean;
  onClose: () => void;
  onQuestionsGenerated: (questions: Question[]) => void;
  lessonId?: number;
  language?: string;
}

const AITestGenerator: React.FC<AITestGeneratorProps> = ({
  open,
  onClose,
  onQuestionsGenerated,
  lessonId,
  language = 'cs'
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [mainQuestion, setMainQuestion] = useState('');
  const [context, setContext] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<Record<string, QuestionType>>({});
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = ['Zadání tématu', 'Výběr typů otázek', 'Generování AI', 'Výběr a úprava'];

  const questionTypeIcons = {
    multiple_choice: <MultipleChoiceIcon />,
    free_text: <FreeTextIcon />,
    fill_in_blank: <FillBlankIcon />,
    matching: <MatchingIcon />
  };

  // Load available question types
  useEffect(() => {
    if (open) {
      loadQuestionTypes();
    }
  }, [open, language]);

  const loadQuestionTypes = async () => {
    try {
      const response = await api.get(`/ai-test-generator/types?language=${language}`);
      if (response.data.success) {
        setAvailableTypes(response.data.descriptions);
      }
    } catch (error) {
      console.error('Failed to load question types:', error);
    }
  };

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const generateQuestions = async () => {
    if (!mainQuestion.trim()) {
      setError('Hlavní otázka je povinná');
      return;
    }

    if (selectedTypes.length === 0) {
      setError('Vyberte alespoň jeden typ otázky');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/ai-test-generator/generate', {
        mainQuestion,
        context,
        requestedTypes: selectedTypes,
        language,
        lessonId
      });

      if (response.data.success) {
        setGeneratedQuestions(response.data.questions);
        setSelectedQuestions(response.data.questions.map((q: Question) => q.id));
        setActiveStep(3);
      } else {
        setError(response.data.error || 'Generování selhalo');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Chyba při generování otázek');
      console.error('AI generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionToggle = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleQuestionEdit = (questionId: string, field: string, value: any) => {
    setGeneratedQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ));
  };

  const handleFinish = () => {
    const finalQuestions = generatedQuestions.filter(q => 
      selectedQuestions.includes(q.id)
    );
    onQuestionsGenerated(finalQuestions);
    handleClose();
  };

  const handleClose = () => {
    setActiveStep(0);
    setMainQuestion('');
    setContext('');
    setSelectedTypes([]);
    setGeneratedQuestions([]);
    setSelectedQuestions([]);
    setError(null);
    onClose();
  };

  const handleNext = () => {
    if (activeStep === 0 && !mainQuestion.trim()) {
      setError('Zadejte hlavní otázku nebo téma');
      return;
    }
    if (activeStep === 1 && selectedTypes.length === 0) {
      setError('Vyberte alespoň jeden typ otázky');
      return;
    }
    
    setError(null);
    if (activeStep === 2) {
      generateQuestions();
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setError(null);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Hlavní otázka nebo téma"
              value={mainQuestion}
              onChange={(e) => setMainQuestion(e.target.value)}
              multiline
              rows={3}
              placeholder="Např: Jaké jsou hlavní typy obráběcích kapalin a jaké jsou jejich výhody?"
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Dodatečný kontext (volitelné)"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              multiline
              rows={4}
              placeholder="Přidejte kontext, obsah lekce nebo další informace pro lepší generování otázek..."
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Vyberte typy otázek pro generování:
            </Typography>
            <FormGroup>
              {Object.entries(availableTypes).map(([type, info]) => (
                <Card key={type} sx={{ mb: 2, border: selectedTypes.includes(type) ? 2 : 1, borderColor: selectedTypes.includes(type) ? 'primary.main' : 'divider' }}>
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedTypes.includes(type)}
                          onChange={() => handleTypeToggle(type)}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {questionTypeIcons[type as keyof typeof questionTypeIcons]}
                          <Typography variant="subtitle1" fontWeight="bold">
                            {info.name}
                          </Typography>
                        </Box>
                      }
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 1 }}>
                      {info.description}
                    </Typography>
                    <Paper sx={{ p: 1, ml: 4, bgcolor: 'grey.50' }}>
                      <Typography variant="caption" fontStyle="italic">
                        Příklad: {info.example}
                      </Typography>
                    </Paper>
                  </CardContent>
                </Card>
              ))}
            </FormGroup>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <BrainIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Generování otázek pomocí AI
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Téma: "{mainQuestion}"
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Typy: {selectedTypes.map(type => availableTypes[type]?.name).join(', ')}
            </Typography>
            {loading && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <CircularProgress />
                <Typography variant="body2">
                  Generuji otázky...
                </Typography>
              </Box>
            )}
          </Box>
        );

      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Vygenerované otázky ({generatedQuestions.length})
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Vyberte otázky, které chcete přidat do testu, a případně je upravte:
            </Typography>
            
            {generatedQuestions.map((question, index) => (
              <Accordion key={question.id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Checkbox
                      checked={selectedQuestions.includes(question.id)}
                      onChange={() => handleQuestionToggle(question.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {questionTypeIcons[question.type as keyof typeof questionTypeIcons]}
                    <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                      {question.question}
                    </Typography>
                    <Chip 
                      label={availableTypes[question.type]?.name || question.type} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                    <Chip 
                      label={question.difficulty} 
                      size="small" 
                      color={question.difficulty === 'hard' ? 'error' : question.difficulty === 'medium' ? 'warning' : 'success'}
                      variant="outlined"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ pl: 2 }}>
                    <TextField
                      fullWidth
                      label="Otázka"
                      value={question.question}
                      onChange={(e) => handleQuestionEdit(question.id, 'question', e.target.value)}
                      sx={{ mb: 2 }}
                      multiline
                    />
                    
                    {question.type === 'multiple_choice' && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Možnosti:</Typography>
                        {question.options?.map((option, idx) => (
                          <TextField
                            key={idx}
                            fullWidth
                            label={`Možnost ${String.fromCharCode(65 + idx)}`}
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...(question.options || [])];
                              newOptions[idx] = e.target.value;
                              handleQuestionEdit(question.id, 'options', newOptions);
                            }}
                            sx={{ mb: 1 }}
                          />
                        ))}
                        <TextField
                          fullWidth
                          label="Správná odpověď"
                          value={question.correctAnswer}
                          onChange={(e) => handleQuestionEdit(question.id, 'correctAnswer', e.target.value)}
                          sx={{ mb: 1 }}
                        />
                      </Box>
                    )}
                    
                    {question.type === 'free_text' && (
                      <Box sx={{ mb: 2 }}>
                        <TextField
                          fullWidth
                          label="Vzorová správná odpověď"
                          value={question.correctAnswer}
                          onChange={(e) => handleQuestionEdit(question.id, 'correctAnswer', e.target.value)}
                          multiline
                          rows={2}
                          sx={{ mb: 1 }}
                        />
                        <TextField
                          fullWidth
                          label="Klíčová slova (oddělte čárkou)"
                          value={question.keyWords.join(', ')}
                          onChange={(e) => handleQuestionEdit(question.id, 'keyWords', e.target.value.split(',').map(w => w.trim()))}
                          sx={{ mb: 1 }}
                        />
                      </Box>
                    )}
                    
                    {question.type === 'fill_in_blank' && (
                      <Box sx={{ mb: 2 }}>
                        <TextField
                          fullWidth
                          label="Správná odpověď"
                          value={question.correctAnswer}
                          onChange={(e) => handleQuestionEdit(question.id, 'correctAnswer', e.target.value)}
                          sx={{ mb: 1 }}
                        />
                        <TextField
                          fullWidth
                          label="Alternativní odpovědi (oddělte čárkou)"
                          value={question.alternatives?.join(', ') || ''}
                          onChange={(e) => handleQuestionEdit(question.id, 'alternatives', e.target.value.split(',').map(w => w.trim()))}
                          sx={{ mb: 1 }}
                        />
                      </Box>
                    )}
                    
                    {question.type === 'matching' && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Páry:</Typography>
                        {question.pairs?.map((pair, idx) => (
                          <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                            <TextField
                              label={`Pojem ${idx + 1}`}
                              value={pair.term}
                              onChange={(e) => {
                                const newPairs = [...(question.pairs || [])];
                                newPairs[idx] = { ...newPairs[idx], term: e.target.value };
                                handleQuestionEdit(question.id, 'pairs', newPairs);
                              }}
                              sx={{ flex: 1 }}
                            />
                            <TextField
                              label={`Definice ${idx + 1}`}
                              value={pair.definition}
                              onChange={(e) => {
                                const newPairs = [...(question.pairs || [])];
                                newPairs[idx] = { ...newPairs[idx], definition: e.target.value };
                                handleQuestionEdit(question.id, 'pairs', newPairs);
                              }}
                              sx={{ flex: 1 }}
                            />
                          </Box>
                        ))}
                      </Box>
                    )}
                    
                    <TextField
                      fullWidth
                      label="Vysvětlení"
                      value={question.explanation}
                      onChange={(e) => handleQuestionEdit(question.id, 'explanation', e.target.value)}
                      multiline
                      rows={2}
                    />
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AIIcon color="primary" />
        AI Generátor testových otázek
        <IconButton 
          onClick={handleClose} 
          sx={{ ml: 'auto' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pb: 1 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {renderStepContent()}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={handleBack} 
          disabled={activeStep === 0 || loading}
        >
          Zpět
        </Button>
        
        {activeStep < steps.length - 1 ? (
          <Button 
            variant="contained" 
            onClick={handleNext}
            disabled={loading}
            startIcon={activeStep === 2 ? <AIIcon /> : undefined}
          >
            {activeStep === 2 ? 'Generovat AI' : 'Další'}
          </Button>
        ) : (
          <Button 
            variant="contained" 
            onClick={handleFinish}
            disabled={selectedQuestions.length === 0}
            startIcon={<CheckIcon />}
          >
            Přidat vybrané otázky ({selectedQuestions.length})
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AITestGenerator; 