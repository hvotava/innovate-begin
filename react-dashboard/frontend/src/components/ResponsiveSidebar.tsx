import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Avatar,
  Button,
  Chip,
  IconButton,
  AppBar,
  Toolbar,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Quiz as QuizIcon,
  Analytics as AnalyticsIcon,
  Business as BusinessIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  Person as UserIcon,
  Menu as MenuIcon,
  Assignment as AssignmentIcon,
  CloudUpload as CloudUploadIcon,
  Psychology as PsychologyIcon,
  Insights as InsightsIcon,
  PersonSearch as PersonSearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { canManageUsers, canManageCompanies, canManageTrainings, canViewAllData, getRoleDisplayName, getRoleColor } from '../utils/permissions';

const drawerWidth = 280;

// Menu items definované dynamicky podle oprávnění
const getMenuItems = (user: any) => {
  if (!user) return [];
  
  const items = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', show: true },
  ];

  // Placement test je zastaralý - AI Tutor dělá placement automaticky
  // if (!user.placement_completed) {
  //   items.push(
  //     { text: 'Placement Test', icon: <AssignmentIcon />, path: '/placement-test', show: true }
  //   );
  // }

  // Review Dashboard pro všechny uživatele (kteří už začali učení)
  if (user.placement_completed) {
    items.push(
      { text: 'Review Dashboard', icon: <RefreshIcon />, path: '/review-dashboard', show: true },
      { text: 'Výsledky testů', icon: <AnalyticsIcon />, path: '/test-results', show: true }
    );
  }

  // Role-based menu items
  if (canManageUsers(user.role)) {
    items.push(
      { text: 'Správa uživatelů', icon: <AdminIcon />, path: '/user-management', show: true }
    );
  }

  if (canManageCompanies(user.role)) {
    items.push(
      { text: 'Společnosti', icon: <BusinessIcon />, path: '/companies', show: true }
    );
  }

  if (canManageTrainings(user.role)) {
    items.push(
      { text: 'Školení', icon: <SchoolIcon />, path: '/trainings', show: true },
      { text: 'Lekce', icon: <SchoolIcon />, path: '/lessons', show: true },
      { text: 'Testy', icon: <QuizIcon />, path: '/tests', show: true },
      { text: 'Správa obsahu', icon: <CloudUploadIcon />, path: '/content-management', show: true }
    );
  }

  // Basic users section
  if (!canManageUsers(user.role)) {
    items.push(
      { text: 'Uživatelé', icon: <PeopleIcon />, path: '/users', show: true }
    );
  }

  // Moje školení pro regular users
  if (user.role === 'regular_user') {
    items.push(
      { text: 'Moje školení', icon: <SchoolIcon />, path: '/my-trainings', show: true }
    );
  }

  // Analytics jen pro admin
  if (user.role === 'admin') {
    items.push(
      { text: 'User Progress', icon: <PersonSearchIcon />, path: '/user-progress', show: true }
    );
  }

  return items.filter(item => item.show);
};

interface ResponsiveSidebarProps {
  children: React.ReactNode;
}

const ResponsiveSidebar: React.FC<ResponsiveSidebarProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Get menu items based on user permissions
  const menuItems = getMenuItems(user);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 3,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
          📚 Lecture
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
          {user ? `${getRoleDisplayName(user.role)} Panel` : 'Dashboard'}
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* User Info */}
      {user && (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 2,
            }}
          >
            <Avatar
              sx={{
                bgcolor: isAdmin ? '#f59e0b' : '#06b6d4',
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
              }}
            >
              {isAdmin ? <AdminIcon /> : <UserIcon />}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  color: 'white',
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                }}
              >
                {user.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                }}
              >
                {user.email}
              </Typography>
              <Chip
                label={getRoleDisplayName(user.role)}
                size="small"
                color={getRoleColor(user.role)}
                sx={{
                  mt: 0.5,
                  height: { xs: 16, sm: 20 },
                  fontSize: { xs: '0.6rem', sm: '0.7rem' },
                }}
              />
            </Box>
          </Box>
        </Box>
      )}

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Navigation */}
      <List sx={{ px: 2, py: 2, flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleMenuClick(item.path)}
                sx={{
                  borderRadius: 2,
                  py: { xs: 1, sm: 1.5 },
                  backgroundColor: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? '#818cf8' : 'rgba(255, 255, 255, 0.7)',
                    minWidth: { xs: 32, sm: 40 },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#e2e8f0' : 'rgba(255, 255, 255, 0.8)',
                      fontSize: { xs: '0.85rem', sm: '0.875rem' },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Logout Button */}
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          size={isMobile ? "small" : "medium"}
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            mb: 2,
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            '&:hover': {
              borderColor: 'rgba(239, 68, 68, 0.5)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#fca5a5',
            },
          }}
        >
          Odhlásit se
        </Button>

        {/* Footer */}
        <Box
          sx={{
            p: { xs: 1.5, sm: 2 },
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
            }}
          >
            SynQFlows Lecture
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
            }}
          >
            v2.0.0
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Mobile AppBar */}
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{
            width: '100%',
            backgroundColor: '#1e293b',
            zIndex: theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              📚 Lecture
            </Typography>
            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  sx={{
                    bgcolor: isAdmin ? '#f59e0b' : '#06b6d4',
                    width: 32,
                    height: 32,
                  }}
                >
                  {isAdmin ? <AdminIcon fontSize="small" /> : <UserIcon fontSize="small" />}
                </Avatar>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant="body2" sx={{ color: 'white', lineHeight: 1.2 }}>
                    {user.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1 }}>
                    {isAdmin ? 'Admin' : 'User'}
                  </Typography>
                </Box>
              </Box>
            )}
          </Toolbar>
        </AppBar>
      )}

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', lg: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#1e293b',
            color: 'white',
            borderRight: 'none',
          },
        }}
        open
      >
        {drawer}
      </Drawer>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#1e293b',
            color: 'white',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          backgroundColor: 'background.default',
          minHeight: '100vh',
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: '64px', lg: 0 }, // Account for mobile AppBar
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default ResponsiveSidebar; 