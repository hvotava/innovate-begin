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
  Business as BusinessIcon,
  Person as PersonIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { companiesAPI } from '../services/api';
import { Company, ContactPerson } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { canManageCompanies } from '../utils/permissions';
import { getRoleColor, getRoleDisplayName } from '../utils/permissions';

interface CompanyFormData {
  name: string;
  ico: string;
  contactPersonId: number | '';
}

const Companies: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    ico: '',
    contactPersonId: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  // Kontrola oprávnění
  const canManage = user ? canManageCompanies(user.role) : false;

  useEffect(() => {
    if (!canManage) {
      setSnackbar({
        open: true,
        message: 'Nemáte oprávnění k správě společností',
        severity: 'error'
      });
      return;
    }
    
    fetchCompanies();
    fetchContactPersons();
  }, [canManage]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await companiesAPI.getCompanies({ search: searchTerm });
      setCompanies(response.data.companies);
    } catch (error) {
      console.error('Error fetching companies:', error);
      showSnackbar('Nepodařilo se načíst společnosti', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchContactPersons = async () => {
    try {
      const response = await companiesAPI.getAvailableContactPersons();
      setContactPersons(response.data.contactPersons);
    } catch (error) {
      console.error('Error fetching contact persons:', error);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name,
        ico: company.ico || '',
        contactPersonId: company.contactPersonId || ''
      });
    } else {
      setEditingCompany(null);
      setFormData({
        name: '',
        ico: '',
        contactPersonId: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCompany(null);
    setFormData({
      name: '',
      ico: '',
      contactPersonId: ''
    });
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        name: formData.name,
        ico: formData.ico || undefined,
        contactPersonId: formData.contactPersonId || undefined
      };

      if (editingCompany) {
        await companiesAPI.updateCompany(editingCompany.id, submitData);
        showSnackbar('Společnost byla úspěšně aktualizována', 'success');
      } else {
        await companiesAPI.createCompany(submitData);
        showSnackbar('Společnost byla úspěšně vytvořena', 'success');
      }

      handleCloseDialog();
      fetchCompanies();
      fetchContactPersons(); // Refresh contact persons availability
    } catch (error: any) {
      console.error('Error saving company:', error);
      const errorMessage = error.response?.data?.error || 'Nepodařilo se uložit společnost';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleDelete = async (company: Company) => {
    if (!window.confirm(`Opravdu chcete smazat společnost "${company.name}"?`)) {
      return;
    }

    try {
      await companiesAPI.deleteCompany(company.id);
      showSnackbar('Společnost byla úspěšně smazána', 'success');
      fetchCompanies();
      fetchContactPersons();
    } catch (error: any) {
      console.error('Error deleting company:', error);
      const errorMessage = error.response?.data?.error || 'Nepodařilo se smazat společnost';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleSearch = () => {
    fetchCompanies();
  };

  // Desktop DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Název společnosti',
      flex: 1,
      minWidth: 200
    },
    {
      field: 'ico',
      headerName: 'IČO',
      width: 120,
      renderCell: (params) => params.value || '—'
    },
    {
      field: 'contactPerson',
      headerName: 'Kontaktní osoba',
      width: 200,
      renderCell: (params) => {
        const contactPerson = params.row.ContactPerson;
        if (!contactPerson) return '—';
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon fontSize="small" />
            <Box>
              <Typography variant="body2">{contactPerson.name}</Typography>
              <Chip 
                label={getRoleDisplayName(contactPerson.role)}
                color={getRoleColor(contactPerson.role)}
                size="small"
                sx={{ fontSize: '0.75rem', height: 20 }}
              />
            </Box>
          </Box>
        );
      }
    },
    {
      field: 'userCount',
      headerName: 'Počet uživatelů',
      width: 130,
      renderCell: (params) => params.row.Users?.length || 0
    },
    {
      field: 'trainingCount',
      headerName: 'Počet školení',
      width: 130,
      renderCell: (params) => params.row.Trainings?.length || 0
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Akce',
      width: 100,
      getActions: (params) => [
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
  const CompanyCard: React.FC<{ company: Company }> = ({ company }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="div">
            {company.name}
          </Typography>
        </Box>
        
        {company.ico && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>IČO:</strong> {company.ico}
          </Typography>
        )}
        
        {company.ContactPerson && (
          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon fontSize="small" />
            <Typography variant="body2">
              {company.ContactPerson.name}
            </Typography>
            <Chip 
              label={getRoleDisplayName(company.ContactPerson.role)}
              color={getRoleColor(company.ContactPerson.role)}
              size="small"
            />
          </Box>
        )}
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            {company.Users?.length || 0} uživatelů, {company.Trainings?.length || 0} školení
          </Typography>
        </Box>
      </CardContent>
      
      <CardActions>
        <Button 
          size="small" 
          startIcon={<EditIcon />}
          onClick={() => handleOpenDialog(company)}
        >
          Upravit
        </Button>
        <Button 
          size="small" 
          startIcon={<DeleteIcon />}
          color="error"
          onClick={() => handleDelete(company)}
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
          Správa společností
        </Typography>
        
        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Přidat společnost
          </Button>
        )}
      </Box>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Hledat společnosti..."
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
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
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
            rows={companies}
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
          {editingCompany ? 'Upravit společnost' : 'Přidat společnost'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Název společnosti"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="IČO"
            value={formData.ico}
            onChange={(e) => setFormData({ ...formData, ico: e.target.value })}
            margin="normal"
            inputProps={{ maxLength: 8, pattern: '[0-9]*' }}
            helperText="8 číslic"
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Kontaktní osoba</InputLabel>
            <Select
              value={formData.contactPersonId}
              onChange={(e) => setFormData({ ...formData, contactPersonId: e.target.value as number })}
              label="Kontaktní osoba"
            >
              <MenuItem value="">
                <em>Žádná</em>
              </MenuItem>
              {contactPersons.map((person) => (
                <MenuItem 
                  key={person.id} 
                  value={person.id}
                  disabled={!person.isAvailable && person.id !== formData.contactPersonId}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2">{person.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {person.email}
                      </Typography>
                    </Box>
                    <Chip 
                      label={getRoleDisplayName(person.role)}
                      color={getRoleColor(person.role)}
                      size="small"
                    />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Zrušit</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name.trim()}
          >
            {editingCompany ? 'Uložit' : 'Vytvořit'}
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

export default Companies; 