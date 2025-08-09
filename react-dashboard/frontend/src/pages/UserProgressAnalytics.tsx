import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Badge,
  useTheme
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Star as StarIcon,
  AccessTime as AccessTimeIcon,
  Quiz as QuizIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as LanguageIcon,
  Business as BusinessIcon,
  Analytics as AnalyticsIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import api from '../services/api';

interface UserProgress {
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
    training_type: string;
    language: string;
    companyId: number;
    createdAt: string;
  };
  progress: {
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
    lastActivity: string | null;
    trend: 'improving' | 'declining' | 'stable';
    completedLessons: number;
    totalStudyTime: number;
  };
  lessonProgress: Array<{
    lessonTitle: string;
    trainingType: string;
    attempts: number;
    bestScore: number;
    lastAttempt: string;
    totalQuestions: number;
    averageScore: number;
  }>;
  recentSessions: Array<{
    sessionId: string;
    lessonTitle: string;
    trainingType: string;
    startTime: string;
    questions: Array<{
      question: string;
      userAnswer: string;
      isCorrect: boolean;
      timestamp: string;
    }>;
    totalQuestions: number;
    correctAnswers: number;
    score: number;
    duration: number;
  }>;
  performanceHistory: Array<{
    date: string;
    score: number;
    lessonTitle: string;
    totalQuestions: number;
  }>;
}

const UserProgressAnalytics: React.FC = () => {
  const theme = useTheme();
  const [users, setUsers] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProgress | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    companyId: '',
    userId: '',
    search: ''
  });

  const fetchUserProgress = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.companyId) params.append('companyId', filters.companyId);
      if (filters.userId) params.append('userId', filters.userId);
      // Cache busting
      params.append('t', Date.now().toString());
      
      const response = await api.get(`/analytics/users/progress?${params}`);
      if (response.data.success) {
        let userData = response.data.users;
        
        // Apply search filter
        if (filters.search) {
          userData = userData.filter((user: UserProgress) => 
            user.user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            user.user.email.toLowerCase().includes(filters.search.toLowerCase())
          );
        }
        
        setUsers(userData);
      } else {
        setError('Nepodařilo se načíst data uživatelů');
      }
    } catch (err) {
      console.error('Error fetching user progress:', err);
      setError('Chyba při načítání dat');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProgress();
  }, [filters.companyId, filters.userId]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUpIcon color="success" />;
      case 'declining': return <TrendingDownIcon color="error" />;
      default: return <TrendingFlatIcon color="action" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'success';
      case 'declining': return 'error';
      default: return 'default';
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const handleUserDetail = (user: UserProgress) => {
    setSelectedUser(user);
    setDetailDialogOpen(true);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Načítání analytics uživatelů...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AnalyticsIcon />
        Progress Analytics Uživatelů
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Hledat uživatele"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && fetchUserProgress()}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Company ID"
              type="number"
              value={filters.companyId}
              onChange={(e) => setFilters({ ...filters, companyId: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="User ID"
              type="number"
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={fetchUserProgress}
            >
              Obnovit
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* User Cards */}
      <Grid container spacing={3}>
        {users.map((userProgress) => (
          <Grid item xs={12} md={6} lg={4} key={userProgress.user.id}>
            <Card sx={{ height: '100%', position: 'relative' }}>
              <CardContent>
                {/* User Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.main }}>
                    <PersonIcon />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" noWrap>
                      {userProgress.user.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {userProgress.user.email}
                    </Typography>
                  </Box>
                  <Chip
                    icon={getTrendIcon(userProgress.progress.trend)}
                    label={userProgress.progress.trend}
                    size="small"
                    color={getTrendColor(userProgress.progress.trend) as any}
                  />
                </Box>

                {/* Progress Stats */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {userProgress.progress.averageScore}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Průměrné skóre
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {userProgress.progress.bestScore}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Nejlepší skóre
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Quick Stats */}
                <List dense sx={{ py: 0 }}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <QuizIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`${userProgress.progress.totalAttempts} pokusů`}
                      secondary="Celkem testů"
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <SchoolIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`${userProgress.progress.completedLessons} lekcí`}
                      secondary="Dokončeno"
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <AccessTimeIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={formatDuration(userProgress.progress.totalStudyTime)}
                      secondary="Celkový čas studia"
                    />
                  </ListItem>
                </List>

                {/* Last Activity */}
                {userProgress.progress.lastActivity && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Poslední aktivita: {format(new Date(userProgress.progress.lastActivity), 'dd.MM.yyyy HH:mm', { locale: cs })}
                  </Typography>
                )}

                {/* Action Button */}
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<VisibilityIcon />}
                  onClick={() => handleUserDetail(userProgress)}
                  sx={{ mt: 2 }}
                >
                  Zobrazit detail
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {users.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Žádní uživatelé nenalezeni
          </Typography>
        </Paper>
      )}

      {/* User Detail Dialog */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon />
          Detail uživatele: {selectedUser?.user.name}
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              {/* User Info */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><EmailIcon /></ListItemIcon>
                        <ListItemText primary={selectedUser.user.email} secondary="Email" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><PhoneIcon /></ListItemIcon>
                        <ListItemText primary={selectedUser.user.phone} secondary="Telefon" />
                      </ListItem>
                    </List>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><LanguageIcon /></ListItemIcon>
                        <ListItemText primary={selectedUser.user.language} secondary="Jazyk" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><BusinessIcon /></ListItemIcon>
                        <ListItemText primary={selectedUser.user.training_type} secondary="Typ školení" />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              </Paper>

              {/* Performance Chart */}
              {selectedUser.performanceHistory.length > 0 && (
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Vývoj výkonnosti
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={selectedUser.performanceHistory.slice().reverse()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(new Date(value), 'dd.MM')}
                      />
                      <YAxis domain={[0, 100]} />
                      <RechartsTooltip 
                        labelFormatter={(value) => format(new Date(value), 'dd.MM.yyyy HH:mm')}
                        formatter={(value: any, name: string) => [
                          `${value}%`, 
                          name === 'score' ? 'Skóre' : name
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={{ fill: '#8884d8' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              )}

              {/* Lesson Progress */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Pokrok v lekcích
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Lekce</TableCell>
                        <TableCell align="center">Pokusy</TableCell>
                        <TableCell align="center">Nejlepší skóre</TableCell>
                        <TableCell align="center">Průměr</TableCell>
                        <TableCell align="center">Otázky</TableCell>
                        <TableCell>Poslední pokus</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedUser.lessonProgress.map((lesson, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {lesson.lessonTitle}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {lesson.trainingType}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Badge badgeContent={lesson.attempts} color="primary">
                              <QuizIcon />
                            </Badge>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${lesson.bestScore}%`}
                              color={getScoreColor(lesson.bestScore)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${lesson.averageScore}%`}
                              color={getScoreColor(lesson.averageScore)}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            {lesson.totalQuestions}
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {format(new Date(lesson.lastAttempt), 'dd.MM.yyyy HH:mm')}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Recent Sessions */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Nedávné pokusy
                </Typography>
                {selectedUser.recentSessions.map((session, index) => (
                  <Accordion key={session.sessionId} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                        <Typography variant="subtitle2">
                          {session.lessonTitle}
                        </Typography>
                        <Chip
                          label={`${session.score}%`}
                          color={getScoreColor(session.score)}
                          size="small"
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                          {format(new Date(session.startTime), 'dd.MM.yyyy HH:mm')}
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {session.correctAnswers}/{session.totalQuestions} správných odpovědí
                        {session.duration > 0 && ` • ${formatDuration(session.duration)}`}
                      </Typography>
                      <List dense>
                        {session.questions.map((question, qIndex) => (
                          <ListItem key={qIndex}>
                            <ListItemIcon>
                              {question.isCorrect ? 
                                <CheckCircleIcon color="success" /> : 
                                <CancelIcon color="error" />
                              }
                            </ListItemIcon>
                            <ListItemText
                              primary={question.question}
                              secondary={`Odpověď: "${question.userAnswer}"`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Paper>
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

export default UserProgressAnalytics; 