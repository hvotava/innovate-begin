import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Avatar,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { LockOutlined } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login failed:', error);
      
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.response?.data?.errors) {
        setError(error.response.data.errors.map((e: any) => e.msg).join(', '));
      } else {
        setError('Přihlášení se nezdařilo. Zkuste to znovu.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: { xs: 2, sm: 3 },
      }}
    >
      <Container 
        component="main" 
        maxWidth="xs"
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: 400 },
        }}
      >
        <Paper
          elevation={isMobile ? 0 : 10}
          sx={{
            padding: { xs: 3, sm: 4, md: 5 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            borderRadius: { xs: 2, sm: 3 },
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: { xs: '1px solid rgba(255, 255, 255, 0.2)', sm: 'none' },
          }}
        >
          <Avatar 
            sx={{ 
              m: 1, 
              bgcolor: 'primary.main',
              width: { xs: 48, sm: 56 },
              height: { xs: 48, sm: 56 },
            }}
          >
            <LockOutlined sx={{ fontSize: { xs: 24, sm: 28 } }} />
          </Avatar>
          
          <Typography 
            component="h1" 
            variant={isMobile ? "h5" : "h4"} 
            gutterBottom
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Lecture Dashboard
          </Typography>
          
          <Typography 
            component="h2" 
            variant={isMobile ? "subtitle1" : "h6"} 
            color="text.secondary" 
            gutterBottom
            sx={{ textAlign: 'center', mb: { xs: 2, sm: 3 } }}
          >
            Přihlášení do systému
          </Typography>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                width: '100%', 
                mb: 2,
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
              }}
            >
              {error}
            </Alert>
          )}

          <Box 
            component="form" 
            onSubmit={handleSubmit} 
            sx={{ 
              mt: 1, 
              width: '100%',
              '& .MuiTextField-root': {
                mb: { xs: 2, sm: 2.5 },
              },
            }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus={!isMobile} // Prevent autofocus on mobile to avoid keyboard popup
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              size={isMobile ? "small" : "medium"}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Heslo"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              size={isMobile ? "small" : "medium"}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size={isMobile ? "medium" : "large"}
              sx={{ 
                mt: { xs: 2, sm: 3 }, 
                mb: 2,
                py: { xs: 1.5, sm: 2 },
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                },
                fontSize: { xs: '0.9rem', sm: '1rem' },
                fontWeight: 600,
              }}
              disabled={loading || !email || !password}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  <span>Přihlašování...</span>
                </Box>
              ) : (
                'Přihlásit se'
              )}
            </Button>
          </Box>

          <Box 
            sx={{ 
              mt: { xs: 2, sm: 3 }, 
              textAlign: 'center',
              p: { xs: 2, sm: 3 },
              backgroundColor: 'rgba(103, 126, 234, 0.05)',
              borderRadius: 2,
              border: '1px solid rgba(103, 126, 234, 0.1)',
              width: '100%',
            }}
          >
            <Typography 
              variant="body2" 
              color="text.secondary" 
              gutterBottom
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
              }}
            >
              Výchozí admin účet:
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontFamily: 'monospace',
                fontSize: { xs: '0.75rem', sm: '0.8rem' },
                lineHeight: 1.6,
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                p: 1,
                borderRadius: 1,
                mb: 1,
              }}
            >
              Email: <strong>admin@lecture.app</strong><br />
              Heslo: <strong>admin123</strong>
            </Typography>
            <Typography 
              variant="caption" 
              color="warning.main" 
              sx={{ 
                display: 'block',
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                fontWeight: 500,
              }}
            >
              ⚠️ Změňte heslo po prvním přihlášení!
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login; 