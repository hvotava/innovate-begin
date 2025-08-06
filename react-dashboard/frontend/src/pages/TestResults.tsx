import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  LinearProgress,
  Chip,
  Alert,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  School as SchoolIcon,
  Psychology as PsychologyIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface TestResponse {
  id: number;
  userId: number;
  trainingType: string;
  lessonTitle: string;
  questionNumber: number;
  question: string;
  userResponse: string;
  completionPercentage: number;
  qualityScore: number;
  aiEvaluation: {
    feedback: string;
    strengths: string[];
    improvements: string[];
    keywordMatches: string[];
    responseLength: {
      characters: number;
      words: number;
      sentences: number;
      averageWordsPerSentence: number;
    };
  };
  callSid: string;
  testSession: string;
  isCompleted: boolean;
  createdAt: string;
  User: {
    name: string;
    email: string;
  };
}

interface TestSession {
  sessionId: string;
  trainingType: string;
  lessonTitle: string;
  startTime: string;
  responses: TestResponse[];
  totalQuestions: number;
  completedQuestions: number;
  averageCompletion: number;
  averageQuality: number;
  overallFeedback: string[];
}

interface UserTestResults {
  userId: number;
  totalSessions: number;
  totalResponses: number;
  sessions: TestSession[];
}

const TestResults: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userResults, setUserResults] = useState<UserTestResults | null>(null);
  const [overviewStats, setOverviewStats] = useState<any>(null);
  const [selectedSession, setSelectedSession] = useState<TestSession | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<TestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUserResults();
      loadOverviewStats();
    }
  }, [user]);

  const loadUserResults = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📊 Loading test results for user:', user.id);
      const response = await axios.get(`/api/test-results/user/${user.id}`);
      console.log('✅ User test results loaded:', response.data);
      setUserResults(response.data);
    } catch (error: any) {
      console.error('❌ Error loading user results:', error);
      setError('Nepodařilo se načíst výsledky testů');
    } finally {
      setLoading(false);
    }
  };

  const loadOverviewStats = async () => {
    try {
      console.log('📈 Loading overview statistics');
      const response = await axios.get('/api/test-results/stats/overview');
      console.log('✅ Overview stats loaded:', response.data);
      setOverviewStats(response.data);
    } catch (error: any) {
      console.error('❌ Error loading overview stats:', error);
    }
  };

  const exportToCsv = async () => {
    try {
      console.log('📁 Exporting test results to CSV');
      const response = await axios.get(`/api/test-results/export/csv?userId=${user?.id}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `test-results-${user?.name}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      console.log('✅ CSV export completed');
    } catch (error) {
      console.error('❌ CSV export failed:', error);
    }
  };

  const getTrainingTypeDisplay = (trainingType: string) => {
    const types = {
      'english_basic': { name: 'Základní Školení', color: '#4caf50' },
      'english_business': { name: 'Business Školení', color: '#2196f3' },
      'english_technical': { name: 'Technické Školení', color: '#ff9800' },
      'german_basic': { name: 'Speciální Školení', color: '#9c27b0' },
      'safety_training': { name: 'Bezpečnostní Školení', color: '#f44336' }
    };
    return types[trainingType as keyof typeof types] || { name: trainingType, color: '#666' };
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return '#4caf50';
    if (percentage >= 60) return '#ff9800';
    return '#f44336';
  };

  const handleResponseDetail = (response: TestResponse) => {
    setSelectedResponse(response);
    setDetailDialogOpen(true);
  };

  const renderOverviewTab = () => {
    if (!userResults) return <Typography>Načítání...</Typography>;

    const chartData = userResults.sessions.map(session => ({
      name: session.lessonTitle?.substring(0, 15) + '...' || 'Test',
      completion: session.averageCompletion,
      quality: session.averageQuality,
      questions: session.totalQuestions
    }));

    return (
      <Box>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <SchoolIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Box>
                    <Typography variant="h4">{userResults.totalSessions}</Typography>
                    <Typography color="text.secondary">Celkem testů</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <PsychologyIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                  <Box>
                    <Typography variant="h4">{userResults.totalResponses}</Typography>
                    <Typography color="text.secondary">Celkem odpovědí</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrendingUpIcon sx={{ mr: 1, color: theme.palette.info.main }} />
                  <Box>
                    <Typography variant="h4">
                      {userResults.sessions.length > 0 
                        ? Math.round(userResults.sessions.reduce((sum, s) => sum + s.averageCompletion, 0) / userResults.sessions.length)
                        : 0}%
                    </Typography>
                    <Typography color="text.secondary">Průměrná úspěšnost</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <AssessmentIcon sx={{ mr: 1, color: theme.palette.warning.main }} />
                  <Box>
                    <Typography variant="h4">
                      {userResults.sessions.length > 0 
                        ? Math.round(userResults.sessions.reduce((sum, s) => sum + s.averageQuality, 0) / userResults.sessions.length)
                        : 0}%
                    </Typography>
                    <Typography color="text.secondary">Průměrná kvalita</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {chartData.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Progression přehled testů
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completion" fill="#4caf50" name="Úplnost %" />
                  <Bar dataKey="quality" fill="#2196f3" name="Kvalita %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  };

  const renderSessionsTab = () => {
    if (!userResults) return <Typography>Načítání...</Typography>;

    return (
      <Box>
        {userResults.sessions.map((session, index) => {
          const typeInfo = getTrainingTypeDisplay(session.trainingType);
          
          return (
            <Accordion key={session.sessionId} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item>
                    <Chip
                      label={typeInfo.name}
                      size="small"
                      sx={{ backgroundColor: typeInfo.color, color: 'white' }}
                    />
                  </Grid>
                  <Grid item xs>
                    <Typography variant="h6">
                      {session.lessonTitle || `Test ${index + 1}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(session.startTime).toLocaleDateString('cs-CZ')} • {session.totalQuestions} otázek
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box textAlign="center">
                        <Typography variant="body2" color="text.secondary">Úplnost</Typography>
                        <Typography 
                          variant="h6" 
                          sx={{ color: getCompletionColor(session.averageCompletion) }}
                        >
                          {session.averageCompletion}%
                        </Typography>
                      </Box>
                      <Box textAlign="center">
                        <Typography variant="body2" color="text.secondary">Kvalita</Typography>
                        <Typography 
                          variant="h6" 
                          sx={{ color: getCompletionColor(session.averageQuality) }}
                        >
                          {session.averageQuality}%
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </AccordionSummary>
              
              <AccordionDetails>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Otázka</TableCell>
                        <TableCell align="center">Úplnost</TableCell>
                        <TableCell align="center">Kvalita</TableCell>
                        <TableCell align="center">Dokončeno</TableCell>
                        <TableCell align="center">Akce</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {session.responses.map((response, responseIndex) => (
                        <TableRow key={response.id}>
                          <TableCell>
                            <Typography variant="body2">
                              {`${responseIndex + 1}. ${response.question.substring(0, 50)}${response.question.length > 50 ? '...' : ''}`}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <LinearProgress
                              variant="determinate"
                              value={response.completionPercentage || 0}
                              sx={{
                                width: 60,
                                mx: 'auto',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getCompletionColor(response.completionPercentage || 0)
                                }
                              }}
                            />
                            <Typography variant="caption">
                              {response.completionPercentage || 0}%
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {response.qualityScore || 0}%
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {response.isCompleted ? (
                              <CheckCircleIcon sx={{ color: 'success.main' }} />
                            ) : (
                              <WarningIcon sx={{ color: 'warning.main' }} />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              startIcon={<VisibilityIcon />}
                              onClick={() => handleResponseDetail(response)}
                            >
                              Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {session.overallFeedback.length > 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Celkové hodnocení:</Typography>
                    {session.overallFeedback.map((feedback, idx) => (
                      <Typography key={idx} variant="body2">• {feedback}</Typography>
                    ))}
                  </Alert>
                )}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    );
  };

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          📊 Výsledky testů
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={exportToCsv}
          disabled={!userResults || userResults.totalResponses === 0}
        >
          Export CSV
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Přehled" />
            <Tab label="Detailní výsledky" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {tabValue === 0 && renderOverviewTab()}
              {tabValue === 1 && renderSessionsTab()}
            </>
          )}
        </Box>
      </Paper>

      {/* Response Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detail odpovědi - Test {selectedResponse?.questionNumber}
        </DialogTitle>
        <DialogContent dividers>
          {selectedResponse && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Otázka:
              </Typography>
              <Typography paragraph sx={{ fontStyle: 'italic', backgroundColor: 'grey.100', p: 2, borderRadius: 1 }}>
                {selectedResponse.question}
              </Typography>

              <Typography variant="h6" gutterBottom>
                Odpověď uživatele:
              </Typography>
              <Typography paragraph sx={{ backgroundColor: 'grey.50', p: 2, borderRadius: 1 }}>
                {selectedResponse.userResponse || 'Žádná odpověď'}
              </Typography>

              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <CircularProgress
                      variant="determinate"
                      value={selectedResponse.completionPercentage || 0}
                      size={80}
                      sx={{ color: getCompletionColor(selectedResponse.completionPercentage || 0) }}
                    />
                    <Typography variant="h6" sx={{ mt: 1 }}>
                      {selectedResponse.completionPercentage || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Úplnost odpovědi
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <CircularProgress
                      variant="determinate"
                      value={selectedResponse.qualityScore || 0}
                      size={80}
                      sx={{ color: getCompletionColor(selectedResponse.qualityScore || 0) }}
                    />
                    <Typography variant="h6" sx={{ mt: 1 }}>
                      {selectedResponse.qualityScore || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Kvalita odpovědi
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {selectedResponse.aiEvaluation && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    AI Hodnocení:
                  </Typography>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {selectedResponse.aiEvaluation.feedback}
                  </Alert>

                  <Grid container spacing={2}>
                    {selectedResponse.aiEvaluation.strengths?.length > 0 && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" sx={{ color: 'success.main' }}>
                          ✅ Silné stránky:
                        </Typography>
                        <Box component="ul" sx={{ pl: 2 }}>
                          {selectedResponse.aiEvaluation.strengths.map((strength, idx) => (
                            <Typography key={idx} component="li" variant="body2">
                              {strength}
                            </Typography>
                          ))}
                        </Box>
                      </Grid>
                    )}

                    {selectedResponse.aiEvaluation.improvements?.length > 0 && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" sx={{ color: 'warning.main' }}>
                          🔧 Možné zlepšení:
                        </Typography>
                        <Box component="ul" sx={{ pl: 2 }}>
                          {selectedResponse.aiEvaluation.improvements.map((improvement, idx) => (
                            <Typography key={idx} component="li" variant="body2">
                              {improvement}
                            </Typography>
                          ))}
                        </Box>
                      </Grid>
                    )}
                  </Grid>

                  {selectedResponse.aiEvaluation.responseLength && (
                    <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        📏 Statistiky odpovědi:
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={3}>
                          <Typography variant="body2">
                            Znaky: {selectedResponse.aiEvaluation.responseLength.characters}
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="body2">
                            Slova: {selectedResponse.aiEvaluation.responseLength.words}
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="body2">
                            Věty: {selectedResponse.aiEvaluation.responseLength.sentences}
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="body2">
                            Slova/věta: {selectedResponse.aiEvaluation.responseLength.averageWordsPerSentence}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            Zavřít
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestResults; 