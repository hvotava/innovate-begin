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
} from '@mui/material';
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
} from '@mui/icons-material';
import { userService, User, CreateUserData, UpdateUserData } from '../services/userService';

interface UserDialogData {
  name: string;
  phone: string;
  language: string;
  current_lesson_level: number;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [dialogData, setDialogData] = useState<UserDialogData>({
    name: '',
    phone: '',
    language: 'cs',
    current_lesson_level: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data.users);
    } catch (err) {
      setError('Nepodařilo se načíst uživatele');
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCallUser = async (userId: number) => {
    try {
      const response = await userService.callUser(userId, { lessonId: 1 });
      setSnackbar({
        open: true,
        message: response.message,
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Nepodařilo se zahájit volání',
        severity: 'error',
      });
      console.error('Call user error:', err);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setDialogData({
      name: '',
      phone: '',
      language: 'cs',
      current_lesson_level: 0,
    });
    setOpenDialog(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setDialogData({
      name: user.name,
      phone: user.phone,
      language: user.language,
      current_lesson_level: user.current_lesson_level,
    });
    setOpenDialog(true);
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Opravdu chcete smazat tohoto uživatele?')) {
      return;
    }

    try {
      await userService.deleteUser(userId);
      setUsers(users.filter(user => user.id !== userId));
      setSnackbar({
        open: true,
        message: 'Uživatel byl úspěšně smazán',
        severity: 'success',
      });
    } catch (err: any) {
      if (err.response?.status === 400) {
        const forceDelete = window.confirm(
          'Uživatel má související záznamy. Chcete vynutit smazání?'
        );
        if (forceDelete) {
          try {
            await userService.forceDeleteUser(userId);
            setUsers(users.filter(user => user.id !== userId));
            setSnackbar({
              open: true,
              message: 'Uživatel byl úspěšně smazán (včetně souvisejících záznamů)',
              severity: 'success',
            });
          } catch (forceErr) {
            setSnackbar({
              open: true,
              message: 'Nepodařilo se smazat uživatele',
              severity: 'error',
            });
          }
        }
      } else {
        setSnackbar({
          open: true,
          message: 'Nepodařilo se smazat uživatele',
          severity: 'error',
        });
      }
    }
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        // Update existing user
        const updatedUser = await userService.updateUser(editingUser.id, dialogData);
        setUsers(users.map(user => 
          user.id === editingUser.id ? updatedUser : user
        ));
        setSnackbar({
          open: true,
          message: 'Uživatel byl úspěšně aktualizován',
          severity: 'success',
        });
      } else {
        // Create new user
        const newUser = await userService.createUser(dialogData);
        setUsers([...users, newUser]);
        setSnackbar({
          open: true,
          message: 'Uživatel byl úspěšně vytvořen',
          severity: 'success',
        });
      }
      setOpenDialog(false);
    } catch (err) {
      setSnackbar({
        open: true,
        message: editingUser ? 'Nepodařilo se aktualizovat uživatele' : 'Nepodařilo se vytvořit uživatele',
        severity: 'error',
      });
      console.error('Save user error:', err);
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Správa uživatelů
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Spravujte uživatele systému a jejich nastavení
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddUser}
          sx={{ borderRadius: 2 }}
        >
          Nový uživatel
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <TextField
            fullWidth
            placeholder="Vyhledat uživatele..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredUsers}
            columns={columns}
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
            }}
            disableRowSelectionOnClick
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': {
                borderColor: 'divider',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: 'grey.50',
                borderColor: 'divider',
              },
            }}
          />
        </Box>
      </Card>

      {/* User Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editingUser ? 'Upravit uživatele' : 'Nový uživatel'}
          <IconButton onClick={() => setOpenDialog(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              fullWidth
              label="Jméno"
              value={dialogData.name}
              onChange={(e) => setDialogData({ ...dialogData, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Telefon"
              value={dialogData.phone}
              onChange={(e) => setDialogData({ ...dialogData, phone: e.target.value })}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                select
                label="Jazyk"
                value={dialogData.language}
                onChange={(e) => setDialogData({ ...dialogData, language: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="cs">Čeština</option>
                <option value="en">Angličtina</option>
              </TextField>
              <TextField
                fullWidth
                type="number"
                label="Úroveň lekce"
                value={dialogData.current_lesson_level}
                onChange={(e) => setDialogData({ ...dialogData, current_lesson_level: parseInt(e.target.value) || 0 })}
              />
            </Box>
          </Box>        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>
            Zrušit
          </Button>
          <Button variant="contained" onClick={handleSaveUser}>
            {editingUser ? 'Aktualizovat' : 'Vytvořit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Users; 