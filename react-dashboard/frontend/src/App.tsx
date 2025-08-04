import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Contexts
import { AuthProvider } from './contexts/AuthContext';

// Components
import ResponsiveSidebar from './components/ResponsiveSidebar';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserManagement from './pages/UserManagement';
import Companies from './pages/Companies';
import Trainings from './pages/Trainings';
import Lessons from './pages/Lessons';
import Tests from './pages/Tests';
import Analytics from './pages/Analytics';
import PlacementTest from './pages/PlacementTest';
import ContentManagement from './pages/ContentManagement';
import ProgressAnalytics from './pages/ProgressAnalytics';
import QuestionManager from './pages/QuestionManager';
import ReviewDashboard from './pages/ReviewDashboard';

// Enhanced responsive theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366f1', // Indigo
      light: '#818cf8',
      dark: '#4f46e5',
    },
    secondary: {
      main: '#f59e0b', // Amber
      light: '#fbbf24',
      dark: '#d97706',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      color: '#1e293b',
    },
    h5: {
      fontWeight: 600,
      color: '#1e293b',
    },
    h6: {
      fontWeight: 500,
      color: '#1e293b',
    },
  },
  shape: {
    borderRadius: 12,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    // Responsive typography
    MuiTypography: {
      styleOverrides: {
        h1: {
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
        },
        h2: {
          fontSize: 'clamp(1.75rem, 4vw, 3rem)',
        },
        h3: {
          fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
        },
        h4: {
          fontSize: 'clamp(1.25rem, 2.5vw, 2rem)',
        },
        h5: {
          fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
        },
        h6: {
          fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes with ResponsiveSidebar */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <ResponsiveSidebar>
                    <Dashboard />
                  </ResponsiveSidebar>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/users"
              element={
                <ProtectedRoute adminOnly>
                  <ResponsiveSidebar>
                    <Users />
                  </ResponsiveSidebar>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/user-management"
              element={
                <ProtectedRoute adminOnly>
                  <ResponsiveSidebar>
                    <UserManagement />
                  </ResponsiveSidebar>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/companies"
              element={
                <ProtectedRoute adminOnly>
                  <ResponsiveSidebar>
                    <Companies />
                  </ResponsiveSidebar>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/trainings"
              element={
                <ProtectedRoute>
                  <ResponsiveSidebar>
                    <Trainings />
                  </ResponsiveSidebar>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/lessons"
              element={
                <ProtectedRoute>
                  <ResponsiveSidebar>
                    <Lessons />
                  </ResponsiveSidebar>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/tests"
              element={
                <ProtectedRoute>
                  <ResponsiveSidebar>
                    <Tests />
                  </ResponsiveSidebar>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/analytics"
              element={
                <ProtectedRoute adminOnly>
                  <ResponsiveSidebar>
                    <Analytics />
                  </ResponsiveSidebar>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/placement-test"
              element={
                <ProtectedRoute>
                  <ResponsiveSidebar>
                    <PlacementTest />
                  </ResponsiveSidebar>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/content-management"
              element={
                <ProtectedRoute adminOnly>
                  <ResponsiveSidebar>
                    <ContentManagement />
                  </ResponsiveSidebar>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/progress-analytics"
              element={
                <ProtectedRoute adminOnly>
                  <ResponsiveSidebar>
                    <ProgressAnalytics />
                  </ResponsiveSidebar>
                </ProtectedRoute>
              }
            />

            <Route
              path="/question-manager"
              element={
                <ProtectedRoute adminOnly>
                  <ResponsiveSidebar>
                    <QuestionManager />
                  </ResponsiveSidebar>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/review-dashboard"
              element={
                <ProtectedRoute>
                  <ResponsiveSidebar>
                    <ReviewDashboard />
                  </ResponsiveSidebar>
                </ProtectedRoute>
              }
            />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
