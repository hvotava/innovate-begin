import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  Paper,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  CardActions,
  Fab,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  Category as CategoryIcon,
  Search as SearchIcon,
  PlayArrow as StartIcon,
  Assignment as LessonIcon,
  Quiz as TestIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { trainingsAPI, companiesAPI } from '../services/api';
import { Training, Company } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { canManageTrainings, canViewAllData } from '../utils/permissions';

interface TrainingFormData {
  title: string;
  description: string;
  category: string;
  companyId: number | '';
}

const Trainings: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [formData, setFormData] = useState<TrainingFormData>({
    title: '',
    description: '',
    category: '',
    companyId: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  // Kontrola oprávnění
  const canManage = user ? canManageTrainings(user.role) : false;
  const canViewAll = user ? canViewAllData(user.role) : false;

  useEffect(() => {
    if (!canManage) {
      setSnackbar({
        open: true,
        message: 'Nemáte oprávnění k správě školení',
        severity: 'error'
      });
      return;
    }
    
    fetchTrainings();
    if (canViewAll) {
      fetchCompanies();
    }
  }, [canManage, canViewAll]);

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const response = await trainingsAPI.getTrainings({ search: searchTerm });
      setTrainings(response.data.trainings);
    } catch (error) {
      console.error('Error fetching trainings:', error);
      showSnackbar('Nepodařilo se načíst školení', 'error');
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

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (training?: Training) => {
    if (training) {
      setEditingTraining(training);
      setFormData({
        title: training.title,
        description: training.description || '',
        category: training.category || '',
        companyId: training.companyId
      });
    } else {
      setEditingTraining(null);
      setFormData({
        title: '',
        description: '',
        category: '',
        companyId: user?.companyId || ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTraining(null);
    setFormData({
      title: '',
      description: '',
      category: '',
      companyId: ''
    });
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        title: formData.title,
        description: formData.description || undefined,
        category: formData.category || undefined,
        companyId: Number(formData.companyId)
      };

      if (editingTraining) {
        await trainingsAPI.updateTraining(editingTraining.id, submitData);
        showSnackbar('Školení bylo úspěšně aktualizováno', 'success');
      } else {
        await trainingsAPI.createTraining(submitData);
        showSnackbar('Školení bylo úspěšně vytvořeno', 'success');
      }

      handleCloseDialog();
      fetchTrainings();
    } catch (error: any) {
      console.error('Error saving training:', error);
      const errorMessage = error.response?.data?.error || 'Nepodařilo se uložit školení';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleDelete = async (training: Training) => {
    if (!window.confirm(`Opravdu chcete smazat školení "${training.title}"?`)) {
      return;
    }

    try {
      await trainingsAPI.deleteTraining(training.id);
      showSnackbar('Školení bylo úspěšně smazáno', 'success');
      fetchTrainings();
    } catch (error: any) {
      console.error('Error deleting training:', error);
      const errorMessage = error.response?.data?.error || 'Nepodařilo se smazat školení';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleSearch = () => {
    fetchTrainings();
  };

  // Category color mapping
  const getCategoryColor = (category?: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
    if (!category) return 'secondary';
    
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('bezpečnost') || lowerCategory.includes('security')) return 'error';
    if (lowerCategory.includes('technik') || lowerCategory.includes('technical')) return 'primary';
    if (lowerCategory.includes('soft') || lowerCategory.includes('komunikace')) return 'success';
    if (lowerCategory.includes('prodej') || lowerCategory.includes('sales')) return 'warning';
    return 'secondary';
  };

  // Desktop DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'title',
      headerName: 'Název školení',
      flex: 1,
      minWidth: 200
    },
    {
      field: 'category',
      headerName: 'Kategorie',
      width: 150,
      renderCell: (params) => params.value ? (
        <Chip 
          label={params.value}
          color={getCategoryColor(params.value)}
          size="small"
          icon={<CategoryIcon />}
        />
      ) : '—'
    },
    {
      field: 'company',
      headerName: 'Společnost',
      width: 180,
      renderCell: (params) => {
        const company = params.row.Company;
        return company ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon fontSize="small" />
            <Typography variant="body2">{company.name}</Typography>
          </Box>
        ) : '—';
      }
    },
    {
      field: 'lessonCount',
      headerName: 'Lekce',
      width: 80,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <LessonIcon fontSize="small" />
          <Typography variant="body2">
            {params.row.Lessons?.length || 0}
          </Typography>
        </Box>
      )
    },
    {
      field: 'testCount',
      headerName: 'Testy',
      width: 80,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <TestIcon fontSize="small" />
          <Typography variant="body2">
            {params.row.Tests?.length || 0}
          </Typography>
        </Box>
      )
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Akce',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<StartIcon />}
          label="Spustit"
          onClick={() => {
            // Navigate to training detail/start
            console.log('Start training:', params.row.id);
          }}
        />,
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Upravit"
          onClick={() => handleOpenDialog(params.row)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Smazat"
          onClick={() => handleDelete(params.row)}
        />
      ]
    }
  ];

  // Mobile Card Component
  const TrainingCard: React.FC<{ training: Training }> = ({ training }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {training.title}
          </Typography>
          {training.category && (
            <Chip 
              label={training.category}
              color={getCategoryColor(training.category)}
              size="small"
            />
          )}
        </Box>
        
        {training.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {training.description}
          </Typography>
        )}
        
        {training.Company && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <BusinessIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2">
              {training.Company.name}
            </Typography>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LessonIcon fontSize="small" color="primary" />
            <Typography variant="body2">
              {training.Lessons?.length || 0} lekce
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TestIcon fontSize="small" color="secondary" />
            <Typography variant="body2">
              {training.Tests?.length || 0} testy
            </Typography>
          </Box>
        </Box>
      </CardContent>
      
      <CardActions>
        <Button 
          size="small" 
          startIcon={<StartIcon />}
          color="primary"
        >
          Spustit
        </Button>
        <Button 
          size="small" 
          startIcon={<EditIcon />}
          onClick={() => handleOpenDialog(training)}
        >
          Upravit
        </Button>
        <Button 
          size="small" 
          startIcon={<DeleteIcon />}
          color="error"
          onClick={() => handleDelete(training)}
        >
          Smazat
        </Button>
      </CardActions>
    </Card>
  );

  if (!canManage) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Nemáte oprávnění k přístupu na tuto stránku.
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
          Správa školení
        </Typography>
        
        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Přidat školení
          </Button>
        )}
      </Box>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Hledat školení..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            size="small"
          />
          <Button
            variant="outlined"
            onClick={handleSearch}
            startIcon={<SearchIcon />}
          >
            Hledat
          </Button>
        </Box>
      </Paper>

      {/* Content */}
      {isMobile ? (
        <>
          {/* Mobile Card View */}
          {trainings.map((training) => (
            <TrainingCard key={training.id} training={training} />
          ))}
          
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
        /* Desktop DataGrid */
        <Paper sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={trainings}
            columns={columns}
            loading={loading}
            checkboxSelection
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 }
              }
            }}
          />
        </Paper>
      )}

      {/* Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingTraining ? 'Upravit školení' : 'Přidat školení'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Název školení"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Popis školení"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          
          <TextField
            fullWidth
            label="Kategorie"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            margin="normal"
            placeholder="např. Bezpečnost, Technické dovednosti, Soft skills"
          />
          
          {canViewAll && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Společnost</InputLabel>
              <Select
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value as number })}
                label="Společnost"
                required
              >
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon fontSize="small" />
                      <Typography>{company.name}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          {!canViewAll && user?.Company && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Školení bude vytvořeno pro společnost: <strong>{user.Company.name}</strong>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Zrušit</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.title.trim() || !formData.companyId}
          >
            {editingTraining ? 'Uložit' : 'Vytvořit'}
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

export default Trainings; 