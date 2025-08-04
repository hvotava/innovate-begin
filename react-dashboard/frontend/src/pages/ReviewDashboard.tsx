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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Avatar,
  Tooltip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  Priority as PriorityIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Timer as TimerIcon,
  Star as StarIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface DueReview {
  lesson_id: number;
  lesson_title: string;
  course_id: number;
  last_score: number;
  review_count: number;
  due_date: string;
  priority: 'high' | 'normal';
}

interface ReviewStats {
  due_reviews: DueReview[];
  total_due: number;
  high_priority: number;
}

const ReviewDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCompletedDialog, setShowCompletedDialog] = useState(false);
  const [completedReview, setCompletedReview] = useState<DueReview | null>(null);

  // Load due reviews
  const loadDueReviews = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await api.get(`/api/users/${user.id}/due-reviews`);
      setReviewStats(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error loading due reviews:', err);
      setError('Failed to load review data');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDueReviews();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadDueReviews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadDueReviews]);

  // Start review session
  const handleStartReview = async (review: DueReview) => {
    // In a real implementation, this would start a lesson review session
    // For now, we'll simulate completing the review
    try {
      // Simulate a review score (in real app, this would come from actual test results)
      const mockScore = 0.7 + Math.random() * 0.3; // Random score between 0.7-1.0
      
      const response = await api.post(`/api/users/${user?.id}/schedule-review`, {
        lesson_id: review.lesson_id,
        performance: mockScore
      });

      if (response.data.success) {
        setCompletedReview(review);
        setShowCompletedDialog(true);
        setSuccess(`Review completed! Next review scheduled for ${response.data.interval_days} days.`);
        
        // Reload reviews
        await loadDueReviews();
      }
    } catch (err: any) {
      console.error('Error completing review:', err);
      setError('Failed to complete review');
    }
  };

  const getPriorityColor = (priority: string) => {
    return priority === 'high' ? 'error' : 'warning';
  };

  const getPriorityIcon = (priority: string) => {
    return priority === 'high' ? <PriorityIcon /> : <ScheduleIcon />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'success.main';
    if (score >= 0.6) return 'warning.main';
    return 'error.main';
  };

  const formatDueDate = (dueDateStr: string) => {
    const dueDate = new Date(dueDateStr);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else {
      return `Due in ${diffDays} days`;
    }
  };

  if (loading && !reviewStats) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Loading review schedule...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RefreshIcon sx={{ mr: 2, fontSize: 40 }} />
            <Box>
              <Typography variant="h4" component="h1">
                Review Dashboard
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Spaced repetition learning system
              </Typography>
            </Box>
          </Box>
          
          <Button
            variant="contained"
            color="secondary"
            startIcon={<RefreshIcon />}
            onClick={loadDueReviews}
            disabled={loading}
          >
            Refresh
          </Button>
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

      {/* Stats Cards */}
      {reviewStats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Due Reviews
                    </Typography>
                    <Typography variant="h4" color="primary.main">
                      {reviewStats.total_due}
                    </Typography>
                  </Box>
                  <ScheduleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      High Priority
                    </Typography>
                    <Typography variant="h4" color="error.main">
                      {reviewStats.high_priority}
                    </Typography>
                  </Box>
                  <PriorityIcon sx={{ fontSize: 40, color: 'error.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Completion Rate
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {reviewStats.total_due > 0 
                        ? Math.round(((reviewStats.due_reviews.length - reviewStats.total_due) / reviewStats.due_reviews.length) * 100) || 0
                        : 100}%
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Due Reviews */}
      {reviewStats?.total_due === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              All caught up! 🎉
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              You have no lessons due for review right now.
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Keep learning and new reviews will be scheduled automatically.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {/* High Priority Reviews */}
          {reviewStats && reviewStats.high_priority > 0 && (
            <Grid item xs={12}>
              <Card sx={{ border: 2, borderColor: 'error.main' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <PriorityIcon sx={{ mr: 1, color: 'error.main' }} />
                    High Priority Reviews
                    <Badge badgeContent={reviewStats.high_priority} color="error" sx={{ ml: 2 }} />
                  </Typography>
                  
                  <List>
                    {reviewStats.due_reviews
                      .filter(review => review.priority === 'high')
                      .map((review) => (
                        <ListItem 
                          key={review.lesson_id}
                          sx={{ 
                            border: 1, 
                            borderColor: 'error.light',
                            borderRadius: 1,
                            mb: 1,
                            bgcolor: 'error.light',
                            color: 'error.contrastText'
                          }}
                        >
                          <ListItemIcon>
                            <Avatar sx={{ bgcolor: 'error.main' }}>
                              <WarningIcon />
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={review.lesson_title}
                            secondary={
                              <Box sx={{ color: 'error.dark' }}>
                                <Typography variant="body2">
                                  {formatDueDate(review.due_date)}
                                </Typography>
                                <Typography variant="caption">
                                  Last Score: {(review.last_score * 100).toFixed(0)}% • 
                                  Reviews: {review.review_count}
                                </Typography>
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Button
                              variant="contained"
                              color="error"
                              startIcon={<PlayArrowIcon />}
                              onClick={() => handleStartReview(review)}
                            >
                              Review Now
                            </Button>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Normal Priority Reviews */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <ScheduleIcon sx={{ mr: 1, color: 'warning.main' }} />
                  Scheduled Reviews
                  <Badge 
                    badgeContent={reviewStats?.due_reviews.filter(r => r.priority === 'normal').length || 0} 
                    color="warning" 
                    sx={{ ml: 2 }} 
                  />
                </Typography>
                
                <List>
                  {reviewStats?.due_reviews
                    .filter(review => review.priority === 'normal')
                    .map((review) => (
                      <ListItem 
                        key={review.lesson_id}
                        sx={{ 
                          border: 1, 
                          borderColor: 'grey.200',
                          borderRadius: 1,
                          mb: 1,
                          '&:hover': { bgcolor: 'grey.50' }
                        }}
                      >
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'warning.main' }}>
                            <SchoolIcon />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={review.lesson_title}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                {formatDueDate(review.due_date)}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Chip 
                                  label={`Score: ${(review.last_score * 100).toFixed(0)}%`}
                                  size="small"
                                  sx={{ bgcolor: getScoreColor(review.last_score), color: 'white' }}
                                />
                                <Chip 
                                  label={`Review #${review.review_count + 1}`}
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Start Review Session">
                            <IconButton
                              color="primary"
                              onClick={() => handleStartReview(review)}
                            >
                              <PlayArrowIcon />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                </List>

                {reviewStats && reviewStats.due_reviews.filter(r => r.priority === 'normal').length === 0 && (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                    No normal priority reviews scheduled
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Completed Review Dialog */}
      <Dialog 
        open={showCompletedDialog} 
        onClose={() => setShowCompletedDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 1 }} />
          <Typography variant="h5">
            Review Completed! 🎉
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ textAlign: 'center' }}>
          {completedReview && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {completedReview.lesson_title}
              </Typography>
              
              <Typography variant="body1" color="textSecondary" paragraph>
                Great job reviewing this lesson! The spaced repetition algorithm has scheduled your next review based on your performance.
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <StarIcon sx={{ color: 'warning.main', mb: 1 }} />
                  <Typography variant="caption" display="block">
                    Previous Score
                  </Typography>
                  <Typography variant="h6">
                    {(completedReview.last_score * 100).toFixed(0)}%
                  </Typography>
                </Paper>
                
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <CalendarIcon sx={{ color: 'info.main', mb: 1 }} />
                  <Typography variant="caption" display="block">
                    Review Count
                  </Typography>
                  <Typography variant="h6">
                    #{completedReview.review_count + 1}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button 
            variant="contained" 
            onClick={() => setShowCompletedDialog(false)}
            startIcon={<TrendingUpIcon />}
          >
            Continue Learning
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewDashboard; 