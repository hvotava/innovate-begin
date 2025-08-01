import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Paper,
  useMediaQuery,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  Assignment as LessonIcon,
  Quiz as QuizIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI } from '../services/api';

// Types
interface DashboardStats {
  overview: {
    totalUsers: number;
    totalCompanies: number;
    totalTrainings: number;
    totalLessons: number;
    totalTests: number;
    recentUsers: number;
    recentTrainings: number;
  };
  usersByRole: Array<{ role: string; count: number }>;
  topCompanies: Array<{ id: number; name: string; userCount: number }>;
  activityChart: Array<{ date: string; users: number; trainings: number; lessons: number; tests: number }>;
  growth: {
    usersGrowth: string;
    trainingsGrowth: string;
  };
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  change?: string;
}

// Responsive Stat Card Component
const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, change }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        position: 'relative', 
        overflow: 'visible',
        border: `2px solid ${color}20`,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
          transition: 'all 0.3s ease-in-out',
        }
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                mb: 1,
                fontWeight: 500
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                color: color,
                fontSize: { xs: '1.8rem', sm: '2.2rem' },
                mb: change ? 0.5 : 0
              }}
            >
              {value}
            </Typography>
            {change && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: change.startsWith('+') ? 'success.main' : 'error.main',
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  fontWeight: 600
                }}
              >
                {change} za 30 dní
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}15`,
              borderRadius: '50%',
              p: { xs: 1.5, sm: 2 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: { xs: 48, sm: 56 },
              minHeight: { xs: 48, sm: 56 },
            }}
          >
            {React.cloneElement(icon as React.ReactElement, {
              sx: { 
                color: color, 
                fontSize: { xs: 24, sm: 32 } 
              }
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Kontrola oprávnění - pouze admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    console.log('🔍 Dashboard useEffect - User data:', user);
    console.log('🔍 Dashboard useEffect - isAdmin:', isAdmin);
    console.log('🔍 Dashboard useEffect - user?.role:', user?.role);
    
    if (!isAdmin) {
      console.log('❌ Dashboard access denied - user is not admin');
      setError('Přístup k Dashboard je povolen pouze administrátorům');
      setLoading(false);
      return;
    }

    console.log('✅ Dashboard access granted - calling fetchDashboardStats');
    fetchDashboardStats();
  }, [isAdmin]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching dashboard stats...');
      
      // Debug info first
      try {
        const debugResponse = await dashboardAPI.getDebug();
        console.log('🔍 Debug info:', debugResponse.data);
      } catch (debugError) {
        console.error('🔍 Debug error:', debugError);
      }
      
      const response = await dashboardAPI.getStats();
      console.log('📊 Dashboard stats response:', response);
      setStats(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      let errorMessage = 'Nepodařilo se načíst statistiky';
      if (err.response?.status === 403) {
        errorMessage = 'Nemáte oprávnění pro přístup k dashboard statistikám';
      } else if (err.response?.status === 401) {
        errorMessage = 'Nejste přihlášen nebo vypršela vaše relace';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Dashboard je přístupný pouze administrátorům systému.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Typography>Načítám dashboard...</Typography>
      </Box>
    );
  }

  if (error || !stats) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <button onClick={fetchDashboardStats}>Zkusit znovu</button>
        }>
          {error || 'Nepodařilo se načíst data'}
        </Alert>
      </Box>
    );
  }

  // Definice karet s daty ze serveru
  const statCards = [
    {
      title: 'Celkem uživatelů',
      value: stats.overview.totalUsers,
      icon: <PeopleIcon />,
      color: theme.palette.primary.main,
      change: stats.growth.usersGrowth
    },
    {
      title: 'Společnosti',
      value: stats.overview.totalCompanies,
      icon: <BusinessIcon />,
      color: theme.palette.success.main,
    },
    {
      title: 'Školení',
      value: stats.overview.totalTrainings,
      icon: <SchoolIcon />,
      color: theme.palette.warning.main,
      change: stats.growth.trainingsGrowth
    },
    {
      title: 'Lekce',
      value: stats.overview.totalLessons,
      icon: <LessonIcon />,
      color: theme.palette.info.main,
    },
    {
      title: 'Testy',
      value: stats.overview.totalTests,
      icon: <QuizIcon />,
      color: theme.palette.secondary.main,
    }
  ];

  // Barvy pro pie chart
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
          📊 Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Přehled systému a klíčových metrik
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        {statCards.map((card, index) => (
          <Grid key={index} xs={12} sm={6} lg={2.4}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Activity Chart */}
        <Grid xs={12} lg={8}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, height: { xs: 300, sm: 400 } }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <TrendingUpIcon sx={{ mr: 1 }} />
              Aktivita za posledních 7 dní
            </Typography>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={stats.activityChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  fontSize={isMobile ? 10 : 12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('cs-CZ', { month: 'short', day: 'numeric' })}
                />
                <YAxis fontSize={isMobile ? 10 : 12} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('cs-CZ')}
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke={theme.palette.primary.main} 
                  strokeWidth={2}
                  name="Noví uživatelé"
                />
                <Line 
                  type="monotone" 
                  dataKey="trainings" 
                  stroke={theme.palette.warning.main} 
                  strokeWidth={2}
                  name="Nová školení"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Users by Role Chart */}
        <Grid xs={12} lg={4}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, height: { xs: 300, sm: 400 } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Uživatelé podle rolí
            </Typography>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={stats.usersByRole}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ role, count, percent }) => 
                    isMobile ? `${(percent * 100).toFixed(0)}%` : `${role}: ${count}`
                  }
                  outerRadius={isMobile ? 60 : 80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="role"
                >
                  {stats.usersByRole.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Top Companies */}
        <Grid xs={12}>
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Top 5 společností podle počtu uživatelů
            </Typography>
            <Grid container spacing={2}>
              {stats.topCompanies.map((company, index) => (
                <Grid key={company.id} xs={12} sm={6} md={2.4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                        #{index + 1}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                        {company.name}
                      </Typography>
                      <Typography variant="h5" color="text.secondary">
                        {company.userCount} uživatelů
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 