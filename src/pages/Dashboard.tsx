import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Quiz as QuizIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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

// Stat Card Component
const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, change }) => (
  <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
    <CardContent sx={{ pb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {value}
          </Typography>
          {change && (
            <Typography variant="body2" sx={{ color: 'success.main', mt: 1 }}>
              {change}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            backgroundColor: `${color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for development - později nahradíme API calls
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Simulace API call
        setTimeout(() => {
          setStats({
            totalUsers: 125,
            totalLessons: 8,
            completedTests: 342,
            averageScore: 87.5,
            recentActivity: 23,
          });
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Nepodařilo se načíst statistiky');
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Mock data for charts
  const progressData = [
    { date: '2024-01-01', tests: 12, score: 85 },
    { date: '2024-01-02', tests: 15, score: 88 },
    { date: '2024-01-03', tests: 8, score: 82 },
    { date: '2024-01-04', tests: 22, score: 90 },
    { date: '2024-01-05', tests: 18, score: 87 },
    { date: '2024-01-06', tests: 25, score: 91 },
    { date: '2024-01-07', tests: 20, score: 89 },
  ];

  const scoreDistribution = [
    { name: 'Výborné (90-100%)', value: 45, color: '#10b981' },
    { name: 'Dobré (80-89%)', value: 30, color: '#f59e0b' },
    { name: 'Průměrné (70-79%)', value: 20, color: '#ef4444' },
    { name: 'Slabé (<70%)', value: 5, color: '#6b7280' },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Přehled výkonnosti a statistik
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
        <StatCard
          title="Celkem uživatelů"
          value={stats?.totalUsers || 0}
          icon={<PeopleIcon fontSize="large" />}
          color="#6366f1"
          change="+12% tento měsíc"
        />
        <StatCard
          title="Aktivní lekce"
          value={stats?.totalLessons || 0}
          icon={<SchoolIcon fontSize="large" />}
          color="#10b981"
        />
        <StatCard
          title="Dokončené testy"
          value={stats?.completedTests || 0}
          icon={<QuizIcon fontSize="large" />}
          color="#f59e0b"
          change="+8% tento týden"
        />
        <StatCard
          title="Průměrné skóre"
          value={`${stats?.averageScore?.toFixed(1) || 0}%`}
          icon={<TrendingUpIcon fontSize="large" />}
          color="#ef4444"
          change="+2.3% oproti minulému měsíci"
        />
      </Box>

      {/* Charts */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Pokrok v čase
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Rozložení skóre
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={scoreDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {scoreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Box sx={{ mt: 2 }}>
              {scoreDistribution.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      backgroundColor: item.color,
                      borderRadius: '50%',
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {item.name}: {item.value}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Dashboard; 