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
} from '@mui/icons-material';
import { userService, User, CreateUserData, UpdateUserData } from '../services/userService';

interface UserDialogData {
  name: string;
  phone: string;
  language: string;
  current_lesson_level: number;
}

// Mobile User Card Component
interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
  onCall: (id: number) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onEdit, onDelete, onCall }) => (
  <Card 
    sx={{ 
      mb: 2,
      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: 4,
      },
    }}
  >
    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <Avatar 
            sx={{ 
              bgcolor: 'primary.main', 
              mr: 2,
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 },
            }}
          >
            <PersonIcon />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1rem', sm: '1.25rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.name}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                display: 'flex',
                alignItems: 'center',
                mt: 0.5,
              }}
            >
              <PhoneIcon sx={{ fontSize: 16, mr: 0.5 }} />
              {user.phone}
            </Typography>
          </Box>
        </Box>
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
        >
          #{user.id}
        </Typography>
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
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
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
    phone: '',
    language: 'cs',
    current_lesson_level: 1,
  });

  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

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
      phone: '',
      language: 'cs',
      current_lesson_level: 1,
    });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
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
  };

  const handleSubmit = async () => {
    try {
      setFormLoading(true);
      
      if (editingUser) {
        const updateData: UpdateUserData = {
          name: formData.name,
          phone: formData.phone,
          language: formData.language as 'cs' | 'en',
          current_lesson_level: formData.current_lesson_level,
        };
        await userService.updateUser(editingUser.id, updateData);
        showSnackbar('Uživatel byl úspěšně aktualizován', 'success');
      } else {
        const createData: CreateUserData = {
          name: formData.name,
          phone: formData.phone,
          language: formData.language as 'cs' | 'en',
          current_lesson_level: formData.current_lesson_level,
        };
        await userService.createUser(createData);
        showSnackbar('Uživatel byl úspěšně vytvořen', 'success');
      }
      
      handleCloseDialog();
      fetchUsers();
    } catch (err: any) {
      console.error('Error saving user:', err);
      const errorMessage = err.message || 'Nastala chyba při ukládání uživatele';
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
      const errorMessage = err.message || 'Nastala chyba při mazání uživatele';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleCallUser = async (userId: number) => {
    try {
      await userService.callUser(userId, { lessonId: 1 });
      showSnackbar('Hovor byl zahájen', 'success');
    } catch (err: any) {
      console.error('Error calling user:', err);
      const errorMessage = err.message || 'Nastala chyba při zahájení hovoru';
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
    user.phone.includes(searchTerm)
  );

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

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        mb: { xs: 3, sm: 4 },
        gap: { xs: 2, sm: 0 },
      }}>
        <Box>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            sx={{ 
              mb: 1,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Správa uživatelů
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
          >
            Celkem {users.length} uživatelů
          </Typography>
        </Box>
        
        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            size={isSmallMobile ? "small" : "medium"}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              },
            }}
          >
            Přidat uživatele
          </Button>
        )}
      </Box>

      {/* Search */}
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <TextField
          fullWidth
          placeholder="Vyhledat uživatele..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size={isMobile ? "small" : "medium"}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{
            maxWidth: { xs: '100%', md: 400 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />
      </Box>

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
            disabled={formLoading || !formData.name.trim() || !formData.phone.trim()}
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