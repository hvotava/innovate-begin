import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Container,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Quiz as QuizIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../contexts/AuthContext';

// Types
interface DashboardStats {
  totalUsers: number;
  totalLessons: number;
  completedTests: number;
  averageScore: number;
  recentActivity: number;
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
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <CardContent sx={{ pb: 2, p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 1,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                fontWeight: 500,
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant={isMobile ? "h5" : "h4"} 
              sx={{ 
                fontWeight: 700, 
                color: 'text.primary',
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
              }}
            >
              {value}
            </Typography>
            {change && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'success.main', 
                  mt: 1,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  fontWeight: 500,
                }}
              >
                {change}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: { xs: 48, sm: 64 },
              height: { xs: 48, sm: 64 },
              borderRadius: '50%',
              background: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              ml: 2,
            }}
          >
            {React.cloneElement(icon as React.ReactElement, {
              fontSize: isMobile ? 'medium' : 'large'
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
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAdmin } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalLessons: 0,
    completedTests: 0,
    averageScore: 0,
    recentActivity: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sample data - in real app, this would come from API
  const chartData = [
    { name: 'Po', tests: 12, users: 8 },
    { name: 'Út', tests: 19, users: 12 },
    { name: 'St', tests: 15, users: 10 },
    { name: 'Čt', tests: 25, users: 18 },
    { name: 'Pá', tests: 22, users: 15 },
    { name: 'So', tests: 18, users: 12 },
    { name: 'Ne', tests: 16, users: 9 },
  ];

  const pieData = [
    { name: 'Dokončené', value: 65, color: '#22c55e' },
    { name: 'Probíhající', value: 25, color: '#f59e0b' },
    { name: 'Nedokončené', value: 10, color: '#ef4444' },
  ];

  useEffect(() => {
    // Simulate API call
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats({
          totalUsers: 1247,
          totalLessons: 89,
          completedTests: 3456,
          averageScore: 87.3,
          recentActivity: 142,
        });
      } catch (err) {
        setError('Nepodařilo se načíst data dashboardu');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: { xs: '50vh', sm: '60vh' },
          p: { xs: 2, sm: 3 },
        }}
      >
        <CircularProgress size={isMobile ? 40 : 60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const statCards = [
    {
      title: 'Celkem uživatelů',
      value: stats.totalUsers.toLocaleString(),
      icon: <PeopleIcon />,
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      change: '+12% tento měsíc',
    },
    {
      title: 'Aktivní lekce',
      value: stats.totalLessons,
      icon: <SchoolIcon />,
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      change: '+8% tento týden',
    },
    {
      title: 'Dokončené testy',
      value: stats.completedTests.toLocaleString(),
      icon: <QuizIcon />,
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      change: '+23% tento měsíc',
    },
    {
      title: 'Průměrné skóre',
      value: `${stats.averageScore}%`,
      icon: <TrendingUpIcon />,
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      change: '+5% oproti minulému měsíci',
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 } }}>
      {/* Welcome Section */}
      <Box sx={{ mb: { xs: 3, sm: 4 } }}>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          sx={{ 
            fontWeight: 700, 
            mb: 1,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Vítejte zpět, {user?.name}! 👋
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
        >
          {isAdmin 
            ? 'Zde je přehled aktivity vaší platformy.' 
            : 'Zde je přehled vašeho pokroku.'
          }
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Activity Chart */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: { xs: 300, sm: 400 } }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2, 
                  fontWeight: 600,
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                }}
              >
                Aktivita v posledních 7 dnech
              </Typography>
              <Box sx={{ width: '100%', height: { xs: 220, sm: 300 } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tick={{ fontSize: isMobile ? 12 : 14 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tick={{ fontSize: isMobile ? 12 : 14 }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: isMobile ? '12px' : '14px',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tests" 
                      stroke="#6366f1" 
                      strokeWidth={3}
                      dot={{ fill: '#6366f1', strokeWidth: 2, r: isMobile ? 4 : 6 }}
                      name="Testy"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#f59e0b" 
                      strokeWidth={3}
                      dot={{ fill: '#f59e0b', strokeWidth: 2, r: isMobile ? 4 : 6 }}
                      name="Uživatelé"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Completion Status */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: { xs: 300, sm: 400 } }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2, 
                  fontWeight: 600,
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                }}
              >
                Stav dokončení
              </Typography>
              <Box sx={{ width: '100%', height: { xs: 220, sm: 300 } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={isMobile ? 40 : 60}
                      outerRadius={isMobile ? 80 : 100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: isMobile ? '12px' : '14px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              
              {/* Legend */}
              <Box sx={{ mt: 2 }}>
                {pieData.map((entry, index) => (
                  <Box 
                    key={index}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 1,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    }}
                  >
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        backgroundColor: entry.color,
                        borderRadius: '2px',
                        mr: 1,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: 'inherit' }}>
                      {entry.name}: {entry.value}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 