import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Assignment as AssignmentIcon,
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Timer as TimerIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface PlacementTestData {
  title: string;
  instructions: string;
  time_limit: number;
  min_text_length: number;
}

interface AnalysisResult {
  level: string;
  confidence: number;
  detailed_analysis: {
    grammar_score: number;
    vocabulary_score: number;
    coherence_score: number;
    complexity_score: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommended_focus: string[];
  explanation: string;
  estimated_study_hours?: number;
}

const PlacementTest: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  
  const [placementTest, setPlacementTest] = useState<PlacementTestData | null>(null);
  const [userText, setUserText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);

  // Timer effect
  useEffect(() => {
    if (placementTest && !analysisResult && !isSubmitting) {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [placementTest, analysisResult, isSubmitting]);

  // Load placement test on mount
  useEffect(() => {
    const loadPlacementTest = async () => {
      try {
        setLoading(true);
        console.log('🔄 Loading placement test for company:', user?.companyId);
        const response = await api.get(`/api/ai-proxy/placement-test/${user?.companyId || 1}`);
        console.log('✅ Placement test loaded:', response.data);
        setPlacementTest(response.data);
        setError(null);
      } catch (err: any) {
        console.error('❌ Error loading placement test:', err);
        console.error('📋 Error details:', err.response?.data);
        console.error('🔢 Status code:', err.response?.status);
        setError('Failed to load placement test');
      } finally {
        setLoading(false);
      }
    };

    if (user?.companyId) {
      loadPlacementTest();
    }
  }, [user?.companyId]);

  const handleSubmit = async () => {
    if (!userText.trim() || userText.length < (placementTest?.min_text_length || 100)) {
      setError(`Text must be at least ${placementTest?.min_text_length || 100} characters long`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('🚀 Submitting placement test analysis...');
      console.log('📝 Data:', {
        user_id: user?.id,
        company_id: user?.companyId,
        text_length: userText.length
      });
      
      const response = await api.post('/api/ai-proxy/placement-test/analyze', {
        user_id: user?.id,
        company_id: user?.companyId,
        text: userText
      });
      
      console.log('✅ Analysis response:', response.data);

      if (response.data.success) {
        setAnalysisResult(response.data.analysis);
        setShowResults(true);
      } else {
        setError('Analysis failed. Please try again.');
      }
    } catch (err: any) {
      console.error('❌ Error analyzing placement test:', err);
      console.error('📋 Error details:', err.response?.data);
      console.error('🔢 Status code:', err.response?.status);
      setError(err.response?.data?.error || 'Failed to analyze text. Please try again.');
    } finally {
      console.log('🏁 Placement test analysis finished');
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getLevelColor = (level: string) => {
    const colors = {
      'A1': '#f44336', // Red
      'A2': '#ff9800', // Orange  
      'B1': '#ffeb3b', // Yellow
      'B2': '#4caf50', // Green
      'C1': '#2196f3', // Blue
      'C2': '#9c27b0'  // Purple
    };
    return colors[level as keyof typeof colors] || '#757575';
  };

  const getLevelDescription = (level: string) => {
    const descriptions = {
      'A1': 'Beginner - Basic phrases and expressions',
      'A2': 'Elementary - Simple everyday situations',
      'B1': 'Intermediate - Most situations while traveling',
      'B2': 'Upper-Intermediate - Complex texts and discussions',
      'C1': 'Advanced - Flexible and effective language use',
      'C2': 'Proficiency - Native-like fluency'
    };
    return descriptions[level as keyof typeof descriptions] || 'Unknown level';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Loading placement test...
        </Typography>
      </Box>
    );
  }

  if (!placementTest) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load placement test. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AssignmentIcon sx={{ mr: 2, fontSize: 40 }} />
              <Box>
                <Typography variant="h4" component="h1">
                  {placementTest.title}
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Determine your English proficiency level
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {!analysisResult && (
          <>
            {/* Instructions */}
            <Grid item xs={12} md={8}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📝 Instructions
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {placementTest.instructions}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                    <Chip 
                      icon={<TimerIcon />} 
                      label={`Time Limit: ${placementTest.time_limit} minutes`}
                      color="info"
                      variant="outlined"
                    />
                    <Chip 
                      icon={<SchoolIcon />} 
                      label={`Min. Length: ${placementTest.min_text_length} characters`}
                      color="secondary"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>

              {/* Text Input */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ✍️ Your Text
                  </Typography>
                  
                  <TextField
                    multiline
                    rows={12}
                    fullWidth
                    variant="outlined"
                    placeholder="Write about any topic you're comfortable with... (hobbies, work, family, travel, etc.)"
                    value={userText}
                    onChange={(e) => setUserText(e.target.value)}
                    disabled={isSubmitting}
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        fontSize: '1.1rem',
                        lineHeight: 1.6
                      }
                    }}
                  />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Characters: {userText.length} / {placementTest.min_text_length} minimum
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((userText.length / placementTest.min_text_length) * 100, 100)}
                      sx={{ width: 200, ml: 2 }}
                    />
                  </Box>

                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}

                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSubmit}
                    disabled={isSubmitting || userText.length < placementTest.min_text_length}
                    startIcon={isSubmitting ? undefined : <PsychologyIcon />}
                    sx={{ minWidth: 200 }}
                  >
                    {isSubmitting ? 'Analyzing...' : 'Analyze My Level'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Sidebar */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ⏱️ Time Elapsed
                  </Typography>
                  <Typography variant="h3" color="primary" sx={{ mb: 2 }}>
                    {formatTime(timeElapsed)}
                  </Typography>
                  
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    📊 CEFR Levels
                  </Typography>
                  <List dense>
                    {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => (
                      <ListItem key={level}>
                        <ListItemIcon>
                          <Box 
                            sx={{ 
                              width: 20, 
                              height: 20, 
                              borderRadius: '50%',
                              bgcolor: getLevelColor(level)
                            }} 
                          />
                        </ListItemIcon>
                        <ListItemText 
                          primary={level}
                          secondary={getLevelDescription(level)}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {/* Results Dialog */}
        <Dialog 
          open={showResults} 
          onClose={() => setShowResults(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleIcon sx={{ mr: 2, color: 'success.main' }} />
              Analysis Complete!
            </Box>
          </DialogTitle>
          
          <DialogContent>
            {analysisResult && (
              <Grid container spacing={3}>
                {/* Level Result */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                    <Typography variant="h3" sx={{ mb: 1 }}>
                      {analysisResult.level}
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      {getLevelDescription(analysisResult.level)}
                    </Typography>
                    <Typography variant="body1">
                      Confidence: {Math.round(analysisResult.confidence * 100)}%
                    </Typography>
                  </Paper>
                </Grid>

                {/* Detailed Scores */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        📊 Detailed Analysis
                      </Typography>
                      {analysisResult.detailed_analysis && Object.entries(analysisResult.detailed_analysis).map(([key, value]) => (
                        <Box key={key} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                              {key.replace('_', ' ')}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {value}/100
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={value} 
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Strengths & Weaknesses */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="success.main">
                        ✅ Strengths
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {analysisResult.strengths.map((strength, index) => (
                          <Chip 
                            key={index} 
                            label={strength} 
                            color="success" 
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="warning.main">
                        ⚠️ Areas for Improvement
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {analysisResult.weaknesses.map((weakness, index) => (
                          <Chip 
                            key={index} 
                            label={weakness} 
                            color="warning" 
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Recommendations */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        🎯 Recommended Focus Areas
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {analysisResult.recommended_focus.map((focus, index) => (
                          <Chip 
                            key={index} 
                            label={focus} 
                            color="primary" 
                            variant="outlined"
                          />
                        ))}
                      </Box>
                      
                      <Typography variant="body1" sx={{ mt: 2 }}>
                        <strong>AI Analysis:</strong> {analysisResult.explanation}
                      </Typography>
                      
                      {analysisResult.estimated_study_hours && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            <strong>Estimated study time to next level:</strong> {analysisResult.estimated_study_hours} hours
                          </Typography>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          
          <DialogActions>
            <Button 
              onClick={() => setShowResults(false)} 
              variant="contained"
              startIcon={<TrendingUpIcon />}
            >
              Start Learning Journey
            </Button>
          </DialogActions>
        </Dialog>
      </Grid>
    </Box>
  );
};

export default PlacementTest; 