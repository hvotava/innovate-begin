import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
  Fab,
  Paper,
  Divider,
  Stack,
  Tooltip,
  LinearProgress,
  Tabs,
  Tab
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  FilterList as FilterIcon,
  Analytics as AnalyticsIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  Email as EmailIcon,
  School as SchoolIcon,
  Group as GroupIcon,
  Search as SearchIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as SuperuserIcon,
  ContactPhone as ContactIcon,
  PersonOutline as UserIcon,
  Engineering as EngineeringIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { usersManagementAPI, companiesAPI, userService, lessonsAPI } from '../services/api';
import { User, Company, UserStats, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { canManageUsers } from '../utils/permissions';
import { getRoleColor, getRoleDisplayName } from '../utils/permissions';

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  companyId: string;
  phone: string;
  language: string;
  training_type: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`user-management-tabpanel-${index}`}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const UserManagement: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'regular_user',
    companyId: '',
    phone: '',
    language: 'cs',
    training_type: ''
  });
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('regular_user');
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  // Kontrola oprávnění
  const canManage = user?.role === 'admin';

  useEffect(() => {
    if (!canManage) {
      setSnackbar({
        open: true,
        message: 'Nemáte oprávnění k správě uživatelů',
        severity: 'error'
      });
      return;
    }
    
    fetchUsers();
    fetchCompanies();
    fetchLessons();
    fetchStats();
  }, [canManage, searchTerm, roleFilter, companyFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersManagementAPI.getUsers({
        search: searchTerm,
        role: roleFilter,
        company: companyFilter
      });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      showSnackbar('Nepodařilo se načíst uživatele', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await companiesAPI.getCompanies();
      setCompanies(response.data.companies);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchLessons = async () => {
    try {
      const response = await lessonsAPI.getLessons();
      console.log('🔍 Fetched lessons for training_type selector:', response.data);
      setLessons(response.data.lessons || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      showSnackbar('Nepodařilo se načíst lekce', 'error');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await usersManagementAPI.getUserStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // User Edit/Create Dialog handlers
  const handleOpenDialog = (targetUser?: User) => {
    if (targetUser) {
      setEditingUser(targetUser);
      setFormData({
        name: targetUser.name,
        email: targetUser.email,
        password: '', // Necháme prázdné pro bezpečnost
        role: targetUser.role,
        companyId: targetUser.companyId ? String(targetUser.companyId) : '',
        phone: targetUser.phone || '',
        language: targetUser.language || 'cs',
        training_type: targetUser.training_type || ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'regular_user',
        companyId: '',
        phone: '',
        language: 'cs',
        training_type: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'regular_user',
      companyId: '',
      phone: '',
      language: 'cs',
      training_type: ''
    });
  };

  const handleSubmitUser = async () => {
    try {
      if (editingUser) {
        // Update existing user - password je optional
        const updateData: {
          name: string;
          email: string;
          role: UserRole;
          companyId: number;
          language: string;
          password?: string;
          phone?: string;
          training_type?: string;
        } = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          companyId: Number(formData.companyId),
          language: formData.language
        };

        // Přidej heslo pouze pokud není prázdné
        if (formData.password && formData.password.trim()) {
          updateData.password = formData.password;
        }

        // Přidej telefon pouze pokud není prázdný - neposílej prázdný string
        if (formData.phone && formData.phone.trim()) {
          updateData.phone = formData.phone;
        }
        // Pokud je prázdný, tak vůbec neposíláme phone field

        if (formData.training_type !== editingUser.training_type) {
          updateData.training_type = formData.training_type;
        }

        console.log('🔄 UserManagement updating user:', editingUser.id, 'with data:', updateData);
        await userService.updateUser(editingUser.id, updateData);
        console.log('✅ UserManagement update successful');
        showSnackbar('Uživatel byl úspěšně aktualizován', 'success');
      } else {
        // Create new user - password je povinné
        if (!formData.password || !formData.password.trim()) {
          showSnackbar('Heslo je povinné pro nového uživatele', 'error');
          return;
        }

        const createData: {
          name: string;
          email: string;
          password: string;
          role: UserRole;
          companyId: number;
          language: string;
          training_type: string;
          phone?: string;
        } = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          companyId: Number(formData.companyId),
          language: formData.language,
          training_type: formData.training_type
        };

        // Přidej telefon pouze pokud není prázdný
        if (formData.phone && formData.phone.trim()) {
          createData.phone = formData.phone;
        }

        console.log('🔄 UserManagement creating user with data:', createData);
        await userService.createUser(createData);
        console.log('✅ UserManagement create successful');
        showSnackbar('Nový uživatel byl úspěšně vytvořen', 'success');
      }

      handleCloseDialog();
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      console.error('❌ UserManagement error saving user:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      let errorMessage = 'Nepodařilo se uložit uživatele';
      
      if (error.response?.status === 400) {
        if (error.response.data?.errors) {
          // Validation errors array
          const validationErrors = error.response.data.errors.map((err: any) => err.msg).join(', ');
          errorMessage = `Chyby ve formuláři: ${validationErrors}`;
        } else {
          errorMessage = error.response.data?.error || 'Neplatná data - zkontrolujte všechna pole';
        }
      } else if (error.response?.status === 404) {
        errorMessage = 'Uživatel nebyl nalezen';
      } else if (error.response?.status === 403) {
        errorMessage = 'Nemáte oprávnění k této operaci';
      } else if (error.response?.status === 401) {
        errorMessage = 'Nejste přihlášeni';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      showSnackbar(errorMessage, 'error');
    }
  };

  // Twilio calling functionality
  const handleCallUser = async (targetUser: User) => {
    try {
      await userService.callUser(targetUser.id, { lessonId: 1 });
      showSnackbar(`Volání zahájeno pro uživatele ${targetUser.name}`, 'success');
    } catch (error: any) {
      console.error('Error calling user:', error);
      showSnackbar('Nepodařilo se zahájit volání', 'error');
    }
  };

  const handleOpenRoleDialog = (targetUser: User) => {
    setEditingUser(targetUser);
    setNewRole(targetUser.role);
    setRoleDialogOpen(true);
  };

  const handleChangeRole = async () => {
    if (!editingUser) return;

    try {
      await usersManagementAPI.updateUserRole(editingUser.id, newRole);
      showSnackbar('Role uživatele byla úspěšně změněna', 'success');
      setRoleDialogOpen(false);
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      console.error('Error changing role:', error);
      const errorMessage = error.response?.data?.error || 'Nepodařilo se změnit roli';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleDeleteUser = async (targetUser: User) => {
    if (!window.confirm(`Opravdu chcete smazat uživatele "${targetUser.name}"?`)) {
      return;
    }

    try {
      await usersManagementAPI.deleteUser(targetUser.id);
      showSnackbar('Uživatel byl úspěšně smazán', 'success');
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      const errorMessage = error.response?.data?.error || 'Nepodařilo se smazat uživatele';
      showSnackbar(errorMessage, 'error');
    }
  };

  // Desktop DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Jméno',
      flex: 1,
      minWidth: isMobile ? 120 : 150
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: isMobile ? 150 : 200
    },
    {
      field: 'role',
      headerName: 'Role',
      width: isMobile ? 100 : 150,
      renderCell: (params) => (
        <Chip 
          label={getRoleDisplayName(params.value)} 
          color={getRoleColor(params.value)} 
          size="small" 
        />
      )
    },
    {
      field: 'Company',
      headerName: 'Společnost',
      width: isMobile ? 140 : 180,
      valueGetter: (params) => params.row.Company?.name || 'Bez společnosti',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon fontSize="small" color="action" />
          <Typography variant="body2">
            {params.row.Company?.name || 'Bez společnosti'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'phone',
      headerName: 'Telefon',
      width: isMobile ? 100 : 140,
      renderCell: (params) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhoneIcon fontSize="small" color="action" />
          <Typography variant="body2">
            {params.value || '-'}
          </Typography>
          </Box>
      )
    },
    {
      field: 'training_type',
      headerName: 'Školení',
      width: isMobile ? 120 : 160,
      renderCell: (params) => {
        const getTrainingDisplay = (lessonId: string) => {
          if (!lessonId) {
            return { name: 'Nezařazen', icon: <SchoolIcon />, color: 'disabled' };
          }
          
          // Najdi lekci podle ID z databáze
          const lesson = lessons.find(l => l.id.toString() === lessonId);
          if (lesson) {
            return { name: lesson.title, icon: <SchoolIcon />, color: 'primary' };
          }
          
          return { name: 'Nezařazen', icon: <SchoolIcon />, color: 'disabled' };
        };
        const display = getTrainingDisplay(params.value);
        return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ color: `${display.color}.main` }}>
              {React.cloneElement(display.icon, { fontSize: 'small' })}
            </Box>
            <Typography variant="body2" color={display.color}>
              {display.name}
          </Typography>
        </Box>
        );
      }
    },
    {
      field: 'language',
      headerName: 'Jazyk',
      width: isMobile ? 70 : 90,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LanguageIcon fontSize="small" color="action" />
          <Typography variant="body2">
            {params.value === 'cs' ? 'CZ' : params.value === 'sk' ? 'SK' : 'EN'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Akce',
      width: isMobile ? 120 : 200,
      getActions: (params) => {
        const actions = [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Upravit"
          onClick={() => handleOpenDialog(params.row)}
          color="primary"
          />
        ];

        // Přidat další akce pouze na desktop
        if (!isMobile) {
          actions.push(
        <GridActionsCellItem
          icon={<GroupIcon />}
          label="Role"
          onClick={() => handleOpenRoleDialog(params.row)}
          color="secondary"
        />,
        <GridActionsCellItem
          icon={<PhoneIcon />}
              label="Volat"
          onClick={() => handleCallUser(params.row)}
          color="success"
          disabled={!params.row.phone}
            />
          );
        }

        // Delete akce vždy
        actions.push(
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Smazat"
            onClick={() => handleDeleteUser(params.row)}
          color="error"
          disabled={params.row.id === user?.id}
        />
        );

        return actions;
      }
    }
  ];

  // Statistics Component
  const StatsPanel: React.FC = () => (
    <Grid container spacing={3}>
      {/* Role Statistics */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <AnalyticsIcon sx={{ mr: 1 }} />
            Uživatelé podle rolí
          </Typography>
          {stats?.roleStats.map((stat) => (
            <Box key={stat.role} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    label={getRoleDisplayName(stat.role as UserRole)} 
                    color={getRoleColor(stat.role as UserRole)} 
                    size="small" 
                  />
                </Box>
                <Typography variant="body2" fontWeight="bold">
                  {stat.count}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(stat.count / users.length) * 100} 
                color={getRoleColor(stat.role as UserRole)}
              />
            </Box>
          ))}
        </Paper>
      </Grid>

      {/* Company Statistics */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <BusinessIcon sx={{ mr: 1 }} />
            Uživatelé podle společností
          </Typography>
          {stats?.companyStats.map((stat) => (
            <Box key={stat.companyName} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" noWrap>
                  {stat.companyName}
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {stat.userCount}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(stat.userCount / users.length) * 100}
                color="primary"
              />
            </Box>
          ))}
        </Paper>
      </Grid>
    </Grid>
  );

  if (!canManage) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Nemáte oprávnění k přístupu na tuto stránku. Pouze administrátoři mohou spravovat uživatele.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        mb: 3,
        gap: 2
      }}>
        <Typography variant="h4" component="h1">
          Správa uživatelů
        </Typography>
        
        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Přidat uživatele
          </Button>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Všichni uživatelé" />
          <Tab label="Statistiky" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                placeholder="Hledat uživatele..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  label="Role"
                >
                  <MenuItem value="">Všechny role</MenuItem>
                  <MenuItem value="admin">Administrátori</MenuItem>
                  <MenuItem value="superuser">Superuživatelé</MenuItem>
                  <MenuItem value="contact_person">Kontaktní osoby</MenuItem>
                  <MenuItem value="regular_user">Běžní uživatelé</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Společnost</InputLabel>
                <Select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  label="Společnost"
                >
                  <MenuItem value="">Všechny společnosti</MenuItem>
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={fetchUsers}
                disabled={loading}
              >
                Hledat
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Content */}
        {isMobile ? (
          <>
            {/* User Cards for Mobile */}
            <Box sx={{ 
              maxHeight: '70vh',
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '4px'
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#f1f1f1'
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#c1c1c1',
                borderRadius: '4px'
              }
            }}>
            {users.map((user) => (
                <Card key={user.id} sx={{ 
                  mb: 2,
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-1px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <PersonIcon color="primary" />
                        <Typography variant="h6" component="h3">
                          {user.name}
                        </Typography>
                        <Chip 
                          label={getRoleDisplayName(user.role)} 
                          color={getRoleColor(user.role)} 
                          size="small" 
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                      
                      {user.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <PhoneIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {user.phone}
                          </Typography>
                        </Box>
                      )}
                      
                      {user.Company && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <BusinessIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {user.Company.name}
                          </Typography>
                        </Box>
                      )}

                      {/* Nové informace: Lesson Level & Language */}
                      <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                        {user.training_type && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <SchoolIcon fontSize="small" color="primary" />
                            <Typography variant="caption" color="primary">
                              Úroveň: {user.training_type}
                            </Typography>
                          </Box>
                        )}
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LanguageIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {user.language === 'cs' ? 'Čeština' : user.language === 'sk' ? 'Slovenština' : 'English'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 1, 
                        flexWrap: 'wrap',
                        justifyContent: { xs: 'flex-start', sm: 'flex-end' }
                      }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(user)}
                          color="primary"
                          title="Upravit uživatele"
                        >
                          <EditIcon />
                        </IconButton>
                        
                        <IconButton
                          size="small"
                          onClick={() => handleOpenRoleDialog(user)}
                          color="secondary"
                          title="Změnit role"
                        >
                          <GroupIcon />
                        </IconButton>
                        
                        <IconButton
                          size="small"
                          onClick={() => handleCallUser(user)}
                          color="success"
                          title="Zavolat přes Twilio"
                          disabled={!user.phone}
                        >
                          <PhoneIcon />
                        </IconButton>
                        
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteUser(user)}
                          color="error"
                          title="Smazat uživatele"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      
                      {/* Status indicators */}
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 1, 
                        mt: 1,
                        justifyContent: { xs: 'flex-start', sm: 'flex-end' }
                      }}>
                        {user.phone ? (
                          <Chip 
                            icon={<PhoneIcon />} 
                            label="Telefon OK" 
                            color="success" 
                            variant="outlined" 
                            size="small" 
                          />
                        ) : (
                          <Chip 
                            icon={<PhoneIcon />} 
                            label="Bez telefonu" 
                            color="warning" 
                            variant="outlined" 
                            size="small" 
                          />
                        )}
                        
                        {user.Company ? (
                          <Chip 
                            icon={<BusinessIcon />} 
                            label="Přiřazen" 
                            color="success" 
                            variant="outlined" 
                            size="small" 
                          />
                        ) : (
                          <Chip 
                            icon={<BusinessIcon />} 
                            label="Bez firmy" 
                            color="error" 
                            variant="outlined" 
                            size="small" 
                          />
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
              </Box>
            
            {/* Mobile FAB */}
            <Fab
              color="primary"
              aria-label="add"
              sx={{ position: 'fixed', bottom: 16, right: 16 }}
              onClick={() => handleOpenDialog()}
            >
              <AddIcon />
            </Fab>
          </>
        ) : (
          // Desktop DataGrid
          <Paper sx={{ 
            height: 600, 
            width: '100%',
            '& .MuiDataGrid-root': {
              border: 'none'
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #e0e0e0'
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f5f5',
              borderBottom: '2px solid #e0e0e0'
            }
          }}>
            <DataGrid
              rows={users}
              columns={columns}
              loading={loading}
              checkboxSelection
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 25 }
                }
              }}
              sx={{
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none'
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: '#f8f9fa'
                }
              }}
            />
          </Paper>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <StatsPanel />
      </TabPanel>

      {/* User Edit/Create Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        fullScreen={isMobile}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingUser ? 'Upravit uživatele' : 'Přidat uživatele'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Jméno"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Heslo"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                margin="normal"
                required={!editingUser}
                helperText={editingUser ? "Ponechte prázdné pro zachování současného hesla" : ""}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefon"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  label="Role"
                >
                  <MenuItem value="admin">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AdminIcon />
                      Administrátor
                    </Box>
                  </MenuItem>
                  <MenuItem value="superuser">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SuperuserIcon />
                      Superuživatel
                    </Box>
                  </MenuItem>
                  <MenuItem value="contact_person">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ContactIcon />
                      Kontaktní osoba
                    </Box>
                  </MenuItem>
                  <MenuItem value="regular_user">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <UserIcon />
                      Běžný uživatel
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Společnost</InputLabel>
                <Select
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value as string })}
                  label="Společnost"
                  required
                >
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id.toString()}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon fontSize="small" />
                        <Typography>{company.name}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Jazyk</InputLabel>
                <Select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  label="Jazyk"
                >
                  <MenuItem value="cs">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LanguageIcon fontSize="small" />
                      Čeština
                    </Box>
                  </MenuItem>
                  <MenuItem value="sk">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LanguageIcon fontSize="small" />
                      Slovenština
                    </Box>
                  </MenuItem>
                  <MenuItem value="en">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LanguageIcon fontSize="small" />
                      English
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Typ školení</InputLabel>
                <Select
                  value={formData.training_type}
                  onChange={(e) => setFormData({ ...formData, training_type: e.target.value })}
                  label="Typ školení"
                >
                  <MenuItem value="">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SchoolIcon fontSize="small" color="disabled" />
                      Nezařazen
                    </Box>
                  </MenuItem>
                  
                  {/* Vaše lekce z databáze */}
                  {lessons.map((lesson) => (
                    <MenuItem key={lesson.id} value={lesson.id.toString()}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SchoolIcon fontSize="small" color="primary" />
                        {lesson.title}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Zrušit</Button>
          <Button 
            onClick={handleSubmitUser} 
            variant="contained"
            disabled={!formData.name.trim() || !formData.email.trim() || !formData.companyId || (!editingUser && !formData.password.trim())}
          >
            {editingUser ? 'Uložit změny' : 'Vytvořit uživatele'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)}>
        <DialogTitle>
          Změnit roli uživatele: {editingUser?.name}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Nová role</InputLabel>
            <Select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              label="Nová role"
            >
              <MenuItem value="admin">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AdminIcon />
                  Administrátor
                </Box>
              </MenuItem>
              <MenuItem value="superuser">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SuperuserIcon />
                  Superuživatel
                </Box>
              </MenuItem>
              <MenuItem value="contact_person">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ContactIcon />
                  Kontaktní osoba
                </Box>
              </MenuItem>
              <MenuItem value="regular_user">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <UserIcon />
                  Běžný uživatel
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
          
          {editingUser?.role === 'admin' && newRole !== 'admin' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Pozor! Odebíráte admin práva. Ujistěte se, že existuje alespoň jeden další administrátor.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Zrušit</Button>
          <Button 
            onClick={handleChangeRole} 
            variant="contained"
            disabled={newRole === editingUser?.role}
          >
            Změnit roli
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement; 