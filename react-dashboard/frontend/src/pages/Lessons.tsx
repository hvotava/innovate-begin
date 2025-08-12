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
  Assignment as LessonIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  Search as SearchIcon,
  PlayArrow as StartIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { lessonsAPI, trainingsAPI } from '../services/api';
import { Lesson, Training } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { canManageTrainings, canViewAllData } from '../utils/permissions';

interface LessonFormData {
  title: string;
  content: string;
  trainingId: number | '';
  lesson_number?: number;
  language?: string;
  level?: string;
}

const Lessons: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState<LessonFormData>({
    title: '',
    content: '',
    trainingId: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [trainingFilter, setTrainingFilter] = useState('');
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
        message: 'Nemáte oprávnění k správě lekcí',
        severity: 'error'
      });
      return;
    }
    
    fetchLessons();
    fetchTrainings();
  }, [canManage, searchTerm, trainingFilter]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await lessonsAPI.getLessons({ 
        search: searchTerm,
        trainingId: trainingFilter
      });
      setLessons(response.data.lessons);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      showSnackbar('Nepodařilo se načíst lekce', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainings = async () => {
    try {
      const response = await trainingsAPI.getTrainings();
      setTrainings(response.data.trainings);
    } catch (error) {
      console.error('Error fetching trainings:', error);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson);
      setFormData({
        title: lesson.title,
        content: lesson.content,
        trainingId: lesson.trainingId,
        lesson_number: lesson.lesson_number,
        language: lesson.language || 'cs',
        level: lesson.level || 'beginner'
      });
    } else {
      setEditingLesson(null);
      setFormData({
        title: '',
        content: '',
        trainingId: '',
        lesson_number: undefined,
        language: 'cs',
        level: 'beginner'
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingLesson(null);
    setFormData({
      title: '',
      content: '',
      trainingId: '',
      lesson_number: undefined,
      language: 'cs',
      level: 'beginner'
    });
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        title: formData.title,
        content: formData.content,
        trainingId: Number(formData.trainingId),
        lesson_number: formData.lesson_number,
        language: formData.language,
        level: formData.level
      };

      if (editingLesson) {
        await lessonsAPI.updateLesson(editingLesson.id, submitData);
        showSnackbar('Lekce byla úspěšně aktualizována', 'success');
      } else {
        await lessonsAPI.createLesson(submitData);
        showSnackbar('Lekce byla úspěšně vytvořena', 'success');
      }

      handleCloseDialog();
      fetchLessons();
    } catch (error: any) {
      console.error('Error saving lesson:', error);
      const errorMessage = error.response?.data?.error || 'Nepodařilo se uložit lekci';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleDelete = async (lesson: Lesson) => {
    if (!window.confirm(`Opravdu chcete smazat lekci "${lesson.title}"?`)) {
      return;
    }

    try {
      await lessonsAPI.deleteLesson(lesson.id);
      showSnackbar('Lekce byla úspěšně smazána', 'success');
      fetchLessons();
    } catch (error: any) {
      console.error('Error deleting lesson:', error);
      const errorMessage = error.response?.data?.error || 'Nepodařilo se smazat lekci';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleSearch = () => {
    fetchLessons();
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
      field: 'lesson_number',
      headerName: '#',
      width: 60,
      renderCell: (params) => (
        <Chip 
          label={params.value || '—'} 
          size="small" 
          color="primary"
          variant="outlined"
        />
      )
    },
    {
      field: 'title',
      headerName: 'Název lekce',
      flex: 1,
      minWidth: 200
    },
    {
      field: 'training',
      headerName: 'Školení',
      width: 200,
      renderCell: (params) => {
        const training = params.row.Training;
        return training ? (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SchoolIcon fontSize="small" />
              <Typography variant="body2" noWrap>
                {training.title}
              </Typography>
            </Box>
            {training.category && (
              <Chip 
                label={training.category}
                color={getCategoryColor(training.category)}
                size="small"
                sx={{ fontSize: '0.7rem', height: 18, mt: 0.5 }}
              />
            )}
          </Box>
        ) : '—';
      }
    },
    {
      field: 'company',
      headerName: 'Společnost',
      width: 150,
      renderCell: (params) => {
        const company = params.row.Training?.Company;
        return company ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon fontSize="small" />
            <Typography variant="body2" noWrap>
              {company.name}
            </Typography>
          </Box>
        ) : '—';
      }
    },
    {
      field: 'content',
      headerName: 'Obsah',
      width: 250,
      renderCell: (params) => (
        <Typography variant="body2" noWrap>
          {params.value || '—'}
        </Typography>
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
            // Navigate to lesson detail/start
            console.log('Start lesson:', params.row.id);
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
  const LessonCard: React.FC<{ lesson: Lesson }> = ({ lesson }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <LessonIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {lesson.title}
          </Typography>
        </Box>
        
        {lesson.content && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {lesson.content}
          </Typography>
        )}
        
        {lesson.Training && (
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <SchoolIcon fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2" fontWeight="medium">
                {lesson.Training.title}
              </Typography>
            </Box>
            
            {lesson.Training.category && (
              <Chip 
                label={lesson.Training.category}
                color={getCategoryColor(lesson.Training.category)}
                size="small"
                sx={{ mr: 1 }}
              />
            )}
            
            {lesson.Training.Company && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <BusinessIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {lesson.Training.Company.name}
                </Typography>
              </Box>
            )}
          </Box>
        )}
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
          onClick={() => handleOpenDialog(lesson)}
        >
          Upravit
        </Button>
        <Button 
          size="small" 
          startIcon={<DeleteIcon />}
          color="error"
          onClick={() => handleDelete(lesson)}
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
          Správa lekcí
        </Typography>
        
        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Přidat lekci
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              placeholder="Hledat lekce..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              size="small"
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Školení</InputLabel>
              <Select
                value={trainingFilter}
                onChange={(e) => setTrainingFilter(e.target.value)}
                label="Školení"
              >
                <MenuItem value="">Všechna školení</MenuItem>
                {trainings.map((training) => (
                  <MenuItem key={training.id} value={training.id.toString()}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SchoolIcon fontSize="small" />
                      <Typography noWrap>{training.title}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleSearch}
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
          {/* Mobile Card View */}
          {lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
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
            rows={lessons}
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
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingLesson ? 'Upravit lekci' : 'Přidat lekci'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Název lekce"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            margin="normal"
            required
          />
          
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Školení</InputLabel>
            <Select
              value={formData.trainingId}
              onChange={(e) => setFormData({ ...formData, trainingId: e.target.value as number })}
              label="Školení"
            >
              {trainings.map((training) => (
                <MenuItem key={training.id} value={training.id}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SchoolIcon fontSize="small" />
                      <Typography>{training.title}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      {training.category && (
                        <Chip 
                          label={training.category}
                          color={getCategoryColor(training.category)}
                          size="small"
                          sx={{ fontSize: '0.7rem', height: 18 }}
                        />
                      )}
                      {training.Company && (
                        <Typography variant="caption" color="text.secondary">
                          {training.Company.name}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Pořadí lekce"
                type="number"
                value={formData.lesson_number || ''}
                onChange={(e) => setFormData({ ...formData, lesson_number: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Auto (další číslo)"
                helperText="Nechte prázdné pro automatické pořadí"
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Jazyk</InputLabel>
                <Select
                  value={formData.language || 'cs'}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  label="Jazyk"
                >
                  <MenuItem value="cs">Čeština</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="de">Deutsch</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="fr">Français</MenuItem>
                  <MenuItem value="zh">中文</MenuItem>
                  <MenuItem value="sk">Slovenčina</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Úroveň</InputLabel>
                <Select
                  value={formData.level || 'beginner'}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  label="Úroveň"
                >
                  <MenuItem value="beginner">Začátečník</MenuItem>
                  <MenuItem value="intermediate">Pokročilý</MenuItem>
                  <MenuItem value="advanced">Expert</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <TextField
            fullWidth
            label="Obsah lekce"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            margin="normal"
            multiline
            rows={6}
            required
            placeholder="Zadejte obsah lekce, instrukce, poznámky..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Zrušit</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.title.trim() || !formData.content.trim() || !formData.trainingId}
          >
            {editingLesson ? 'Uložit' : 'Vytvořit'}
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

export default Lessons; 