import React, { useState, useEffect, useCallback } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Timer as TimerIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  Insights as InsightsIcon,
  Psychology as PsychologyIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon
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
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface CompanyAnalytics {
  company_name: string;
  total_users: number;
  active_users: number;
  completion_rate: number;
  avg_progress: number;
  recent_attempts: number;
  top_performers: TopPerformer[];
  struggling_users: StrugglingUser[];
  period_days: number;
}

interface TopPerformer {
  user_id: number;
  user_name: string;
  completion_percentage: number;
  study_streak: number;
  total_study_time: number;
}

interface StrugglingUser {
  user_id: number;
  user_name: string;
  completion_percentage: number;
  weak_areas: string[];
  last_accessed: string | null;
}

interface UserAnalytics {
  user: {
    id: number;
    name: string;
    level: string;
    placement_completed: boolean;
    placement_score: number;
  };
  progress: UserProgress[];
  recent_attempts: RecentAttempt[];
  ai_analysis: AIAnalysis;
}

interface UserProgress {
  course_id: number;
  completion_percentage: number;
  lessons_completed: number;
  lesson_scores: Record<string, any>;
  weak_areas: string[];
  strong_areas: string[];
  study_streak: number;
  total_study_time: number;
  last_accessed: string;
}

interface RecentAttempt {
  lesson_id: number;
  score: number;
  status: string;
  created_at: string;
  completed_at: string | null;
}

interface AIAnalysis {
  overall_assessment: string;
  progress_trend: string;
  learning_velocity: string;
  engagement_level: string;
  recommendations: Recommendation[];
  predicted_completion_date: string | null;
  risk_factors: string[];
  celebration_points: string[];
}

interface Recommendation {
  type: string;
  priority: string;
  action: string;
  expected_impact: string;
}

const ProgressAnalytics: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  const [companyAnalytics, setCompanyAnalytics] = useState<CompanyAnalytics | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserAnalytics | null>(null);
  const [periodDays, setPeriodDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);

  // Load company analytics
  const loadCompanyAnalytics = useCallback(async () => {
    if (!user?.companyId) return;

    try {
      setLoading(true);
      const response = await api.get(`/api/analytics/company/${user.companyId}/overview?days=${periodDays}`);
      setCompanyAnalytics(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [user?.companyId, periodDays]);

  useEffect(() => {
    loadCompanyAnalytics();
  }, [loadCompanyAnalytics]);

  // Load user analytics
  const loadUserAnalytics = async (userId: number) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/analytics/user/${userId}/progress`);
      setSelectedUser(response.data);
      setShowUserDialog(true);
    } catch (err: any) {
      console.error('Error loading user analytics:', err);
      setError('Failed to load user analytics');
    } finally {
      setLoading(false);
    }
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'high': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'low': return '#f44336';
      default: return '#757575';
    }
  };

  const getAssessmentIcon = (assessment: string) => {
    switch (assessment) {
      case 'excellent': return <StarIcon sx={{ color: '#4caf50' }} />;
      case 'good': return <TrendingUpIcon sx={{ color: '#2196f3' }} />;
      case 'fair': return <WarningIcon sx={{ color: '#ff9800' }} />;
      case 'needs_improvement': return <TrendingDownIcon sx={{ color: '#f44336' }} />;
      default: return <InsightsIcon sx={{ color: '#757575' }} />;
    }
  };

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading && !companyAnalytics) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Loading analytics...
        </Typography>
      </Box>
    );
  }

  if (!companyAnalytics) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          No analytics data available. Make sure users have started learning.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AnalyticsIcon sx={{ mr: 2, fontSize: 40 }} />
            <Box>
              <Typography variant="h4" component="h1">
                Progress Analytics
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                {companyAnalytics.company_name} - Learning Insights
              </Typography>
            </Box>
          </Box>

          <FormControl variant="filled" sx={{ minWidth: 120, bgcolor: 'rgba(255,255,255,0.1)' }}>
            <InputLabel sx={{ color: 'white' }}>Period</InputLabel>
            <Select
              value={periodDays}
              onChange={(e) => setPeriodDays(e.target.value as number)}
              sx={{ color: 'white' }}
            >
              <MenuItem value={7}>7 days</MenuItem>
              <MenuItem value={30}>30 days</MenuItem>
              <MenuItem value={90}>90 days</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h4">
                    {companyAnalytics.total_users}
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Users
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {companyAnalytics.active_users}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {companyAnalytics.total_users > 0 
                      ? Math.round((companyAnalytics.active_users / companyAnalytics.total_users) * 100)
                      : 0}% of total
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Avg. Progress
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {companyAnalytics.avg_progress.toFixed(1)}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={companyAnalytics.avg_progress} 
                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                  />
                </Box>
                <SchoolIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Completion Rate
                  </Typography>
                  <Typography variant="h4" color="secondary.main">
                    {companyAnalytics.completion_rate.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {companyAnalytics.recent_attempts} recent attempts
                  </Typography>
                </Box>
                <StarIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Performers & Struggling Users */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <StarIcon sx={{ mr: 1, color: 'success.main' }} />
                Top Performers
              </Typography>
              
              <List>
                {companyAnalytics.top_performers.map((performer, index) => (
                  <ListItem 
                    key={performer.user_id}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'grey.50' },
                      borderRadius: 1,
                      mb: 1
                    }}
                    onClick={() => loadUserAnalytics(performer.user_id)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: index === 0 ? 'gold' : index === 1 ? 'silver' : '#cd7f32' }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={performer.user_name}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            Progress: {performer.completion_percentage.toFixed(1)}%
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Streak: {performer.study_streak} days • 
                            Time: {formatStudyTime(performer.total_study_time)}
                          </Typography>
                        </Box>
                      }
                    />
                    <Tooltip title="View Details">
                      <IconButton size="small">
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItem>
                ))}
              </List>
              
              {companyAnalytics.top_performers.length === 0 && (
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                  No performance data available yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
                Users Needing Support
              </Typography>
              
              <List>
                {companyAnalytics.struggling_users.map((user) => (
                  <ListItem 
                    key={user.user_id}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'grey.50' },
                      borderRadius: 1,
                      mb: 1
                    }}
                    onClick={() => loadUserAnalytics(user.user_id)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'warning.main' }}>
                        <WarningIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.user_name}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            Progress: {user.completion_percentage.toFixed(1)}%
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {user.weak_areas.slice(0, 3).map((area, index) => (
                              <Chip 
                                key={index}
                                label={area} 
                                size="small" 
                                color="warning" 
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                      }
                    />
                    <Tooltip title="View Details">
                      <IconButton size="small">
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItem>
                ))}
              </List>
              
              {companyAnalytics.struggling_users.length === 0 && (
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                  All users are progressing well! 🎉
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* User Detail Dialog */}
      <Dialog 
        open={showUserDialog} 
        onClose={() => setShowUserDialog(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PsychologyIcon sx={{ mr: 2 }} />
            {selectedUser ? `${selectedUser.user.name} - AI Analysis` : 'User Analytics'}
          </Box>
          <IconButton onClick={() => setShowUserDialog(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {selectedUser && (
            <Grid container spacing={3}>
              {/* User Overview */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {getAssessmentIcon(selectedUser.ai_analysis.overall_assessment)}
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="h6">
                          Overall Assessment: {selectedUser.ai_analysis.overall_assessment.replace('_', ' ').toUpperCase()}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Level: {selectedUser.user.level} | 
                          Placement Score: {selectedUser.user.placement_score?.toFixed(2) || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="textSecondary">
                            Progress Trend
                          </Typography>
                          <Typography variant="h6" sx={{ color: getEngagementColor(selectedUser.ai_analysis.progress_trend) }}>
                            {selectedUser.ai_analysis.progress_trend}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="textSecondary">
                            Learning Velocity  
                          </Typography>
                          <Typography variant="h6" sx={{ color: getEngagementColor(selectedUser.ai_analysis.learning_velocity) }}>
                            {selectedUser.ai_analysis.learning_velocity}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="textSecondary">
                            Engagement Level
                          </Typography>
                          <Typography variant="h6" sx={{ color: getEngagementColor(selectedUser.ai_analysis.engagement_level) }}>
                            {selectedUser.ai_analysis.engagement_level}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* AI Recommendations */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      🎯 AI Recommendations
                    </Typography>
                    <List dense>
                      {selectedUser.ai_analysis.recommendations.map((rec, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip 
                                  label={rec.priority} 
                                  size="small" 
                                  color={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'default'}
                                />
                                <Chip label={rec.type} size="small" variant="outlined" />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2">{rec.action}</Typography>
                                <Typography variant="caption" color="success.main">
                                  Expected: {rec.expected_impact}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Progress Details */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📈 Progress Details
                    </Typography>
                    {selectedUser.progress.map((prog, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Course Progress</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {prog.completion_percentage.toFixed(1)}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={prog.completion_percentage} 
                          sx={{ height: 8, borderRadius: 4, mb: 1 }}
                        />
                        <Typography variant="caption" color="textSecondary">
                          Lessons: {prog.lessons_completed} | 
                          Streak: {prog.study_streak} days | 
                          Time: {formatStudyTime(prog.total_study_time)}
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              {/* Risk Factors & Celebrations */}
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="error">
                          ⚠️ Risk Factors
                        </Typography>
                        {selectedUser.ai_analysis.risk_factors.map((risk, index) => (
                          <Chip 
                            key={index}
                            label={risk} 
                            color="error" 
                            variant="outlined" 
                            sx={{ m: 0.5 }}
                          />
                        ))}
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="success.main">
                          🎉 Achievements
                        </Typography>
                        {selectedUser.ai_analysis.celebration_points.map((point, index) => (
                          <Chip 
                            key={index}
                            label={point} 
                            color="success" 
                            variant="outlined" 
                            sx={{ m: 0.5 }}
                          />
                        ))}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ProgressAnalytics; 