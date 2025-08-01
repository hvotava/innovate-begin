import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
  Tooltip,
  InputAdornment,
  Container,
  Grid,
  Avatar,
  Divider,
  useMediaQuery,
  Stack,
  Fab,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as CallIcon,
  Analytics as AnalyticsIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Search as SearchIcon,
  Language as LanguageIcon,
  School as SchoolIcon,
  AccountCircle as AccountIcon,
  Email as EmailIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  VpnKey as PasswordIcon,
} from '@mui/icons-material';
import { userService, User, CreateUserData, UpdateUserData } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';

interface UserDialogData {
  name: string;
  email: string;
  password: string;
  phone: string;
  language: string;
  current_lesson_level: number;
}

// Mobile User Card Component
interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (userId: number) => void;
  onCall: (userId: number) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onEdit, onDelete, onCall }) => (
  <Card 
    sx={{ 
      mb: 2,
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        boxShadow: (theme) => theme.shadows[4],
        transform: 'translateY(-2px)',
      },
    }}
  >
    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
        <Avatar 
          sx={{ 
            width: { xs: 40, sm: 48 }, 
            height: { xs: 40, sm: 48 }, 
            mr: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <PersonIcon />
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              fontSize: { xs: '1rem', sm: '1.1rem' },
              mb: 0.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user.name}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mb: 0.5,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            }}
          >
            <EmailIcon sx={{ fontSize: 14, mr: 0.5 }} />
            {user.email}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            }}
          >
            <PhoneIcon sx={{ fontSize: 14, mr: 0.5 }} />
            {user.phone}
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ 
              display: 'block',
              mt: 1,
              fontSize: { xs: '0.7rem', sm: '0.75rem' }
            }}
          >
            #{user.id}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip
          icon={<LanguageIcon />}
          label={user.language === 'cs' ? 'Čeština' : 'Angličtina'}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
        />
        <Chip
          icon={<SchoolIcon />}
          label={`Level ${user.current_lesson_level}`}
          size="small"
          color="secondary"
          variant="outlined"
          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Tooltip title="Zavolat">
          <IconButton 
            size="small" 
            onClick={() => onCall(user.id)}
            sx={{ 
              bgcolor: 'success.main',
              color: 'white',
              '&:hover': { bgcolor: 'success.dark' },
            }}
          >
            <CallIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Upravit">
          <IconButton 
            size="small" 
            onClick={() => onEdit(user)}
            sx={{ 
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Smazat">
          <IconButton 
            size="small" 
            onClick={() => onDelete(user.id)}
            sx={{ 
              bgcolor: 'error.main',
              color: 'white',
              '&:hover': { bgcolor: 'error.dark' },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </CardContent>
  </Card>
);

const Users: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [formData, setFormData] = useState<UserDialogData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    language: 'cs',
    current_lesson_level: 1,
  });

  const [formLoading, setFormLoading] = useState(false);

  // Kontrola oprávnění - pouze admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      setError('Nemáte oprávnění pro správu uživatelů. Tato sekce je pouze pro administrátory.');
      setLoading(false);
      return;
    }
    fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data.users);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Nepodařilo se načíst uživatele');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      language: 'cs',
      current_lesson_level: 1,
    });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Prázdné pro bezpečnost
      phone: user.phone,
      language: user.language,
      current_lesson_level: user.current_lesson_level,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormLoading(false);
    setShowPassword(false);
  };

  const handleSubmit = async () => {
    try {
      setFormLoading(true);
      
      if (editingUser) {
        const updateData: UpdateUserData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          language: formData.language as 'cs' | 'en',
          current_lesson_level: formData.current_lesson_level,
        };
        
        // Přidej heslo pouze pokud je vyplněné
        if (formData.password.trim()) {
          updateData.password = formData.password;
        }
        
        console.log('🔄 Updating user:', editingUser.id, 'with data:', updateData);
        const result = await userService.updateUser(editingUser.id, updateData);
        console.log('✅ Update result:', result);
        showSnackbar('Uživatel byl úspěšně aktualizován', 'success');
      } else {
        const createData: CreateUserData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          language: formData.language as 'cs' | 'en',
          current_lesson_level: formData.current_lesson_level,
        };
        console.log('🔄 Creating user with data:', createData);
        const result = await userService.createUser(createData);
        console.log('✅ Create result:', result);
        showSnackbar('Uživatel byl úspěšně vytvořen', 'success');
      }
      
      handleCloseDialog();
      fetchUsers();
    } catch (err: any) {
      console.error('❌ Error saving user:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      
      let errorMessage = 'Nastala chyba při ukládání uživatele';
      
      if (err.response?.status === 400) {
        errorMessage = err.response.data?.error || 'Neplatná data - zkontrolujte všechna pole';
      } else if (err.response?.status === 404) {
        errorMessage = 'Uživatel nebyl nalezen';
      } else if (err.response?.status === 403) {
        errorMessage = 'Nemáte oprávnění k této operaci';
      } else if (err.response?.status === 401) {
        errorMessage = 'Nejste přihlášeni';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      showSnackbar(errorMessage, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Opravdu chcete smazat tohoto uživatele?')) {
      return;
    }
    
    try {
      await userService.deleteUser(userId);
      showSnackbar('Uživatel byl úspěšně smazán', 'success');
      fetchUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      const errorMessage = err.response?.data?.error || 'Nepodařilo se smazat uživatele';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleCallUser = async (userId: number) => {
    try {
      const callData = { lessonId: 1 }; // Default lesson
      await userService.callUser(userId, callData);
      showSnackbar('Volání bylo zahájeno', 'success');
    } catch (err: any) {
      console.error('Error calling user:', err);
      const errorMessage = err.response?.data?.error || 'Nepodařilo se zahájit volání';
      showSnackbar(errorMessage, 'error');
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 70,
    },
    {
      field: 'name',
      headerName: 'Jméno',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
          {params.value}
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 220,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
          {params.value}
        </Box>
      ),
    },
    {
      field: 'password',
      headerName: 'Heslo',
      width: 120,
      renderCell: () => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PasswordIcon sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            ••••••••
          </Typography>
        </Box>
      ),
    },
    {
      field: 'phone',
      headerName: 'Telefon',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
          {params.value}
        </Box>
      ),
    },
    {
      field: 'language',
      headerName: 'Jazyk',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value === 'cs' ? 'Čeština' : 'Angličtina'}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      field: 'current_lesson_level',
      headerName: 'Úroveň',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={`Level ${params.value}`}
          size="small"
          color="secondary"
          variant="outlined"
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Akce',
      width: 180,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<CallIcon />}
          label="Zavolat"
          onClick={() => handleCallUser(params.row.id)}
        />,
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Upravit"
          onClick={() => handleEditUser(params.row)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Smazat"
          onClick={() => handleDeleteUser(params.row.id)}
        />,
      ],
    },
  ];

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px' 
        }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 },
        mb: 4 
      }}>
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '1.75rem', sm: '2.125rem' },
              mb: 1
            }}
          >
            Správa uživatelů
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Celkem {users.length} uživatelů
          </Typography>
        </Box>
        
        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              },
              px: 3,
              py: 1.5,
            }}
          >
            Přidat uživatele
          </Button>
        )}
      </Box>

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Hledat podle jména, emailu nebo telefonu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ 
            maxWidth: { xs: '100%', md: 400 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        />
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Content */}
      {isMobile ? (
        // Mobile: Cards View
        <Box>
          {filteredUsers.length === 0 ? (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 8,
                color: 'text.secondary',
              }}
            >
              <AccountIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" gutterBottom>
                {searchTerm ? 'Žádní uživatelé nenalezeni' : 'Zatím žádní uživatelé'}
              </Typography>
              <Typography variant="body2">
                {searchTerm ? 'Zkuste změnit vyhledávací kritéria' : 'Přidejte prvního uživatele'}
              </Typography>
            </Box>
          ) : (
            filteredUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                onCall={handleCallUser}
              />
            ))
          )}
        </Box>
      ) : (
        // Desktop: DataGrid View
        <Card>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={filteredUsers}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 },
                },
              }}
              pageSizeOptions={[5, 10, 25]}
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  borderBottom: '2px solid rgba(224, 224, 224, 0.8)',
                },
              }}
            />
          </Box>
        </Card>
      )}

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={handleOpenDialog}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
            },
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isSmallMobile}
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 2 },
            m: { xs: 0, sm: 2 },
          },
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1,
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {editingUser ? 'Upravit uživatele' : 'Přidat nového uživatele'}
          </Typography>
          <IconButton onClick={handleCloseDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Jméno"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              size={isSmallMobile ? "small" : "medium"}
            />
            
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              size={isSmallMobile ? "small" : "medium"}
            />
            
            <TextField
              fullWidth
              label="Heslo"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUser}
              helperText={editingUser ? "Ponechte prázdné pro zachování současného hesla" : ""}
              size={isSmallMobile ? "small" : "medium"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              label="Telefon"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              size={isSmallMobile ? "small" : "medium"}
            />
            
            <TextField
              fullWidth
              label="Jazyk"
              select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              SelectProps={{ native: true }}
              size={isSmallMobile ? "small" : "medium"}
            >
              <option value="cs">Čeština</option>
              <option value="en">Angličtina</option>
            </TextField>
            
            <TextField
              fullWidth
              label="Úroveň lekce"
              type="number"
              value={formData.current_lesson_level}
              onChange={(e) => setFormData({ ...formData, current_lesson_level: parseInt(e.target.value) || 1 })}
              inputProps={{ min: 1, max: 100 }}
              size={isSmallMobile ? "small" : "medium"}
            />
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={handleCloseDialog}
            size={isSmallMobile ? "small" : "medium"}
          >
            Zrušit
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              formLoading || 
              !formData.name.trim() || 
              !formData.email.trim() || 
              !formData.phone.trim() ||
              (!editingUser && !formData.password.trim()) // Pro nového uživatele je heslo povinné
            }
            size={isSmallMobile ? "small" : "medium"}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              },
            }}
          >
            {formLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              editingUser ? 'Uložit změny' : 'Přidat uživatele'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Users; 