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
  Call as CallIcon,
  Analytics as AnalyticsIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { userService, User, CreateUserData, UpdateUserData } from '../services/userService';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [callLoading, setCallLoading] = useState<number | null>(null);

  // Fetch users from API
  const fetchUsers = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await userService.getUsers(page, 10, search);
      setUsers(response.users);
      setTotalUsers(response.totalUsers);
      setCurrentPage(response.currentPage);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Nepodařilo se načíst uživatele');
      // Fallback to mock data if API fails
      setUsers([
        { id: 1, name: 'Jan Novák', phone: '+420 123 456 789', language: 'cs', current_lesson_level: 2 },
        { id: 2, name: 'Marie Svobodová', phone: '+420 987 654 321', language: 'cs', current_lesson_level: 1 },
        { id: 3, name: 'Petr Dvořák', phone: '+420 555 666 777', language: 'cs', current_lesson_level: 3 },
        { id: 4, name: 'Anna Nováková', phone: '+420 111 222 333', language: 'cs', current_lesson_level: 0 },
        { id: 5, name: 'Tomáš Procházka', phone: '+420 444 555 666', language: 'cs', current_lesson_level: 1 },
      ]);
      setTotalUsers(5);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, searchTerm);
  }, [searchTerm]);

  const handleAddUser = () => {
    setEditingUser(null);
    setOpenDialog(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setOpenDialog(true);
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Opravdu chcete smazat tohoto uživatele?')) {
      try {
        await userService.deleteUser(userId);
        setSuccess('Uživatel byl úspěšně smazán');
        fetchUsers(currentPage, searchTerm);
      } catch (err: any) {
        if (err.response?.data?.forceDeleteUrl) {
          // User has related records, ask for force delete
          const forceDelete = window.confirm(
            `Uživatel má související záznamy (${err.response.data.details.testSessions} testů, ${err.response.data.details.attempts} pokusů). Chcete vynutit smazání včetně všech souvisejících dat?`
          );
          if (forceDelete) {
            handleForceDeleteUser(userId);
          }
        } else {
          setError(err.response?.data?.error || 'Nepodařilo se smazat uživatele');
        }
      }
    }
  };

  const handleForceDeleteUser = async (userId: number) => {
    try {
      await userService.forceDeleteUser(userId);
      setSuccess('Uživatel a všechna související data byla úspěšně smazána');
      fetchUsers(currentPage, searchTerm);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Nepodařilo se vynutit smazání uživatele');
    }
  };

  const handleCallUser = async (userId: number) => {
    try {
      setCallLoading(userId);
      const response = await userService.callUser(userId);
      setSuccess(response.message);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Nepodařilo se zahájit hovor');
    } finally {
      setCallLoading(null);
    }
  };

  const handleSaveUser = async (userData: CreateUserData | UpdateUserData) => {
    try {
      if (editingUser) {
        // Update existing user
        await userService.updateUser(editingUser.id, userData as UpdateUserData);
        setSuccess('Uživatel byl úspěšně aktualizován');
      } else {
        // Create new user
        await userService.createUser(userData as CreateUserData);
        setSuccess('Nový uživatel byl úspěšně vytvořen');
      }
      setOpenDialog(false);
      fetchUsers(currentPage, searchTerm);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Nepodařilo se uložit uživatele');
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
          color={params.value === 0 ? 'default' : 'success'}
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Akce',
      width: 200,
      getActions: (params) => [
        <GridActionsCellItem
          icon={
            callLoading === params.row.id ? (
              <CircularProgress size={16} />
            ) : (
              <CallIcon />
            )
          }
          label="Zavolat"
          onClick={() => handleCallUser(params.row.id)}
          disabled={callLoading === params.row.id}
        />,
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Upravit"
          onClick={() => handleEditUser(params.row)}
        />,
        <GridActionsCellItem
          icon={<AnalyticsIcon />}
          label="Pokrok"
          onClick={() => {
            // TODO: Navigate to user progress page
            console.log('Show progress for user:', params.row.id);
          }}
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

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Správa uživatelů
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Celkem {totalUsers} uživatelů
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

      {/* Data Grid */}
      <Card>
        <DataGrid
          rows={filteredUsers}
          columns={columns}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f1f5f9',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
            },
          }}
        />
      </Card>

      {/* User Dialog */}
      <UserDialog
        open={openDialog}
        user={editingUser}
        onClose={() => setOpenDialog(false)}
        onSave={handleSaveUser}
      />

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// User Dialog Component
interface UserDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (user: CreateUserData | UpdateUserData) => void;
}

const UserDialog: React.FC<UserDialogProps> = ({ open, user, onClose, onSave }) => {
  const [dialogData, setDialogData] = useState({
    name: '',
    phone: '',
    language: 'cs',
    current_lesson_level: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setDialogData({
        name: user.name,
        phone: user.phone,
        language: user.language,
        current_lesson_level: user.current_lesson_level,
      });
    } else {
      setDialogData({
        name: '',
        phone: '',
        language: 'cs',
        current_lesson_level: 0,
      });
    }
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(dialogData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {user ? 'Upravit uživatele' : 'Nový uživatel'}
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Zrušit
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {user ? 'Uložit' : 'Vytvořit'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default Users; 