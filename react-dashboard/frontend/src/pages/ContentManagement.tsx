import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  useMediaQuery,
  Tooltip,
  Fab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControlLabel,
  Checkbox,
  Switch
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  AutoStories as AutoStoriesIcon,
  Psychology as PsychologyIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  Add as AddIcon,
  FilePresent as FilePresentIcon,
  TextFields as TextFieldsIcon,
  Quiz as QuizIcon,
  AutoAwesome as AutoAwesomeIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface ContentSource {
  id: number;
  title: string;
  content_type: string;
  processing_status: string;
  file_size: number;
  word_count: number;
  created_at: string;
  processed_at: string | null;
  has_course: boolean;
  lesson_id?: number;
  content_preview?: string;
  generated_tests?: Array<{
    testId: number;
    title: string;
    questionCount: number;
    type: string;
  }>;
}

interface Course {
  id: number;
  title: string;
  description: string;
  total_lessons: number;
  status: string;
  estimated_duration: number;
  difficulty_levels: string[];
  created_at: string;
  lesson_count: number;
}

const ContentManagement: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState(0);
  const [contentSources, setContentSources] = useState<ContentSource[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [showTextDialog, setShowTextDialog] = useState(false);
  
  // Lesson assignment state
  const [lessons, setLessons] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [selectedTrainingId, setSelectedTrainingId] = useState<string>('');
  const [createNewLesson, setCreateNewLesson] = useState(true); // Default to creating new lesson
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [lessonCategory, setLessonCategory] = useState('General');
  const [language, setLanguage] = useState('cs'); // Add language selection
  
  // Course generation state
  const [generatingCourse, setGeneratingCourse] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [targetLessons, setTargetLessons] = useState(10);

  // NEW: Test generation options
  const [generateTests, setGenerateTests] = useState(true);
  const [generateAILesson, setGenerateAILesson] = useState(true); // NEW: AI lesson generation option
  const [availableLessons, setAvailableLessons] = useState<any[]>([]);

  // NEW: AI Lesson Generation state
  const [showAILessonDialog, setShowAILessonDialog] = useState(false);
  const [aiLessonContent, setAILessonContent] = useState('');
  const [aiLessonTitle, setAILessonTitle] = useState('');
  const [generatingAILesson, setGeneratingAILesson] = useState(false);

  // NEW: Migration state
  const [runningMigration, setRunningMigration] = useState(false);

  // Load data
  const loadContentSources = useCallback(async () => {
    const companyId = user?.companyId || 1;

    try {
      setLoading(true);
      const response = await api.get(`/ai-proxy/content/company/${companyId}`);
      setContentSources(response.data.content_sources || []);
    } catch (err: any) {
      console.error('Error loading content sources:', err);
      setError('Failed to load content sources');
    } finally {
      setLoading(false);
    }
  }, [user?.companyId]);

  const loadCourses = useCallback(async () => {
    const companyId = user?.companyId || 1;

    try {
      const response = await api.get(`/courses/company/${companyId}`);
      setCourses(response.data.courses || []);
    } catch (err: any) {
      console.error('Error loading courses:', err);
      setError('Failed to load courses');
    }
  }, [user?.companyId]);

  // Load available lessons and trainings
  useEffect(() => {
    const loadLessonsAndTrainings = async () => {
      try {
        const [lessonsResponse, trainingsResponse] = await Promise.all([
          api.get('/lessons'),
          api.get('/trainings')
        ]);
        setAvailableLessons(lessonsResponse.data);
        setTrainings(trainingsResponse.data);
        console.log('✅ Loaded lessons and trainings for content management');
      } catch (err) {
        console.error('❌ Error loading lessons and trainings:', err);
      }
    };

    loadLessonsAndTrainings();
  }, []);

  useEffect(() => {
    loadContentSources();
    loadCourses();
  }, [loadContentSources, loadCourses]);

  // File upload handling
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('🚨 onDrop CALLED!');
    console.log('📁 onDrop called with files:', acceptedFiles);
    console.log('📊 Accepted files length:', acceptedFiles.length);
    console.log('📄 File types:', acceptedFiles.map(f => f.type));
    console.log('📄 File names:', acceptedFiles.map(f => f.name));
    console.log('👤 User:', user);
    console.log('🏢 Company ID:', user?.companyId);
    
    // Use companyId from user or default to 1 if not available
    const companyId = user?.companyId || 1;
    console.log('🏢 Using company ID:', companyId);
    
    if (acceptedFiles.length === 0) {
      console.log('❌ Early return - no files');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('📤 Starting upload process...');
      const formData = new FormData();
      formData.append('company_id', companyId.toString());
      formData.append('title', uploadTitle || acceptedFiles[0].name);
      formData.append('content_type', acceptedFiles[0].type.includes('pdf') ? 'pdf' : 'text');
      
      acceptedFiles.forEach(file => {
        console.log('📎 Adding file:', file.name, file.type, file.size);
        formData.append('files', file);
      });

      // Add lesson options
      formData.append('createNewLesson', createNewLesson.toString());
      if (createNewLesson) {
        formData.append('newLessonTitle', newLessonTitle || acceptedFiles[0].name.replace(/\.[^/.]+$/, "")); // Use filename if no title
        formData.append('lessonCategory', lessonCategory);
      } else if (selectedLessonId) {
        formData.append('lessonId', selectedLessonId);
      }

      // Add training selection if provided
      if (selectedTrainingId) {
        formData.append('trainingId', selectedTrainingId);
      }

      // Add generation options
      formData.append('generateTests', generateTests.toString());
      formData.append('generateAILesson', generateAILesson.toString());
      formData.append('language', language); // Use selected language

      console.log('🚀 Making API call to /ai-proxy/content/upload');
      const response = await api.post('/ai-proxy/content/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Handle the new 202 Accepted response
      if (response.status === 202) {
        setSuccess(response.data.message || 'Upload received and is being processed in the background.');
        // Optionally, start polling for status or just let the user know to refresh
        setTimeout(() => {
          loadContentSources();
        }, 5000); // Refresh after 5 seconds
      } else if (response.data.success) {
        setSuccess('Content uploaded and processed successfully!');
        const newSources = Array.isArray(response.data.uploadedSources)
          ? response.data.uploadedSources
          : [response.data.uploadedSources];
        setContentSources(prev => [...newSources, ...prev]);
        console.log('✅ Upload successful, new sources:', newSources);
      } else {
        setError(response.data.error || 'Upload failed');
      }

    } catch (err: any) {
      console.error('❌ Upload error:', err);
      console.error('📋 Error details:', err.response?.data);
      console.error('🔢 Status code:', err.response?.status);
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      console.log('🏁 Upload process finished');
      setUploading(false);
    }
  }, [user?.companyId, uploadTitle, loadContentSources, createNewLesson, newLessonTitle, lessonCategory, selectedLessonId, selectedTrainingId, generateTests, generateAILesson, language]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    multiple: true,
    disabled: uploading,
    onDropRejected: (rejectedFiles) => {
      console.log('❌ Files rejected:', rejectedFiles);
    },
    onDragEnter: () => {
      console.log('📁 Drag enter detected');
    },
    onDragLeave: () => {
      console.log('📁 Drag leave detected');
    },
    onDropAccepted: (acceptedFiles) => {
      console.log('✅ Files accepted:', acceptedFiles);
    }
  });

  console.log('🔧 Dropzone state:', { isDragActive, uploading, disabled: uploading });

  // Text content upload
  const handleTextUpload = async () => {
    if (!textContent.trim()) return;
    
    const companyId = user?.companyId || 1;

    setUploading(true);
    setError(null);

    try {
      const blob = new Blob([textContent], { type: 'text/plain' });
      const file = new File([blob], uploadTitle || 'text-content.txt', { type: 'text/plain' });
      
      const formData = new FormData();
      formData.append('company_id', companyId.toString());
      formData.append('title', uploadTitle || 'Text Content');
      formData.append('content_type', 'text');
      formData.append('files', file);

      const response = await api.post('/ai-proxy/content/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setSuccess('Text content uploaded successfully');
        setTextContent('');
        setUploadTitle('');
        setShowTextDialog(false);
        await loadContentSources();
      }
    } catch (err: any) {
      console.error('Text upload error:', err);
      setError(err.response?.data?.error || 'Text upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Course generation
  const handleGenerateCourse = async (sourceId: number) => {
    setGeneratingCourse(true);
    setError(null);
    setSelectedSourceId(sourceId);

    try {
      const response = await api.post(`/content/${sourceId}/generate-course`, {
        target_lessons: targetLessons
      });

      if (response.data.success) {
        setSuccess('Course generated successfully!');
        await loadCourses();
        await loadContentSources();
      }
    } catch (err: any) {
      console.error('Course generation error:', err);
      setError(err.response?.data?.error || 'Course generation failed');
    } finally {
      setGeneratingCourse(false);
      setSelectedSourceId(null);
    }
  };

  const handleActivateCourse = async (courseId: number) => {
    try {
      const response = await api.post(`/courses/${courseId}/activate`);
      if (response.data.success) {
        setSuccess('Course activated successfully!');
        await loadCourses();
      }
    } catch (err: any) {
      console.error('Course activation error:', err);
      setError(err.response?.data?.error || 'Course activation failed');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'success';
      case 'processing': return 'warning';
      case 'error': return 'error';
      case 'active': return 'success';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // NEW: Handle AI Lesson Generation
  const handleGenerateAILesson = async () => {
    if (!aiLessonContent.trim() || !aiLessonTitle.trim()) {
      setError('Please provide both title and content for AI lesson generation');
      return;
    }

    setGeneratingAILesson(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('🤖 Generating AI lesson...');
      
      const response = await api.post('/ai-proxy/lesson/generate-structured', {
        content: aiLessonContent,
        title: aiLessonTitle,
        language: 'cs',
        companyId: user?.companyId || 1
      });

      if (response.data.success) {
        setSuccess(`AI lesson "${response.data.lesson.title}" generated successfully!`);
        setShowAILessonDialog(false);
        setAILessonContent('');
        setAILessonTitle('');
        
        // Refresh content sources
        loadContentSources();
        
        console.log('✅ AI lesson generated:', response.data.lesson);
      } else {
        setError(response.data.error || 'Failed to generate AI lesson');
      }

    } catch (error: any) {
      console.error('❌ AI lesson generation error:', error);
      setError(error.response?.data?.error || 'Failed to generate AI lesson');
    } finally {
      setGeneratingAILesson(false);
    }
  };

  // NEW: Handle Database Migration
  const handleRunMigration = async () => {
    setRunningMigration(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('🔄 Running database migration...');
      
      const response = await api.post('/admin/run-migration');

      if (response.data.success) {
        setSuccess(`Database migration completed successfully! ${response.data.migrations?.length || 0} operations performed.`);
        console.log('✅ Migration completed:', response.data);
      } else {
        setError(response.data.error || 'Migration failed');
      }

    } catch (error: any) {
      console.error('❌ Migration error:', error);
      setError(error.response?.data?.error || 'Failed to run database migration');
    } finally {
      setRunningMigration(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AutoStoriesIcon sx={{ mr: 2, fontSize: 40 }} />
            <Box>
              <Typography variant="h4" component="h1">
                Content Management
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Upload content and generate AI-powered courses
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Run Database Migration">
              <Fab
                color="warning"
                onClick={handleRunMigration}
                disabled={runningMigration}
                size={isMobile ? "medium" : "large"}
              >
                {runningMigration ? (
                  <LinearProgress sx={{ width: 30, height: 4, borderRadius: 2 }} />
                ) : (
                  <StorageIcon />
                )}
              </Fab>
            </Tooltip>
            <Fab
              color="secondary"
              onClick={() => setShowTextDialog(true)}
              size={isMobile ? "medium" : "large"}
            >
              <TextFieldsIcon />
            </Fab>
          </Box>
        </Box>
      </Paper>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant={isMobile ? "fullWidth" : "standard"}
        >
          <Tab label="Upload Content" icon={<CloudUploadIcon />} />
          <Tab label="Content Sources" icon={<FilePresentIcon />} />
          <Tab label="Generated Courses" icon={<AutoStoriesIcon />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* File Upload */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📁 Upload Files
                </Typography>
                
                <TextField
                  fullWidth
                  label="Content Title (optional)"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  sx={{ mb: 2 }}
                  disabled={uploading}
                />

                {/* Lesson Configuration */}
                <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    ⚙️ Lesson Configuration
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={createNewLesson}
                            onChange={(e) => setCreateNewLesson(e.target.checked)}
                            disabled={uploading}
                          />
                        }
                        label="Create new lesson"
                      />
                    </Grid>
                    
                    {createNewLesson ? (
                      <>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Lesson Title"
                            value={newLessonTitle}
                            onChange={(e) => setNewLessonTitle(e.target.value)}
                            disabled={uploading}
                            placeholder="Leave empty to use filename"
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <FormControl fullWidth>
                            <InputLabel>Category</InputLabel>
                            <Select
                              value={lessonCategory}
                              onChange={(e) => setLessonCategory(e.target.value)}
                              label="Category"
                              disabled={uploading}
                            >
                              <MenuItem value="General">General</MenuItem>
                              <MenuItem value="Technical">Technical</MenuItem>
                              <MenuItem value="Business">Business</MenuItem>
                              <MenuItem value="Safety">Safety</MenuItem>
                              <MenuItem value="Medical">Medical</MenuItem>
                              <MenuItem value="Legal">Legal</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <FormControl fullWidth>
                            <InputLabel>Language</InputLabel>
                            <Select
                              value={language}
                              onChange={(e) => setLanguage(e.target.value)}
                              label="Language"
                              disabled={uploading}
                            >
                              <MenuItem value="cs">Čeština</MenuItem>
                              <MenuItem value="en">English</MenuItem>
                              <MenuItem value="de">Deutsch</MenuItem>
                              <MenuItem value="sk">Slovenčina</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Training</InputLabel>
                            <Select
                              value={selectedTrainingId}
                              onChange={(e) => setSelectedTrainingId(e.target.value)}
                              label="Training"
                              disabled={uploading}
                            >
                              <MenuItem value="">Create new training</MenuItem>
                              {trainings.map((training) => (
                                <MenuItem key={training.id} value={training.id.toString()}>
                                  {training.title}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </>
                    ) : (
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>Existing Lesson</InputLabel>
                          <Select
                            value={selectedLessonId}
                            onChange={(e) => setSelectedLessonId(e.target.value)}
                            label="Existing Lesson"
                            disabled={uploading}
                          >
                            {availableLessons.map((lesson) => (
                              <MenuItem key={lesson.id} value={lesson.id.toString()}>
                                {lesson.title}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    )}
                    
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={generateAILesson}
                              onChange={(e) => setGenerateAILesson(e.target.checked)}
                              disabled={uploading}
                            />
                          }
                          label="Generate AI-enhanced lesson content"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={generateTests}
                              onChange={(e) => setGenerateTests(e.target.checked)}
                              disabled={uploading}
                            />
                          }
                          label="Generate test questions automatically"
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>

                <Box
                  {...getRootProps()}
                  sx={{
                    border: '2px dashed',
                    borderColor: isDragActive ? 'primary.main' : 'grey.300',
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                    bgcolor: isDragActive ? 'primary.light' : 'grey.50',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <input {...getInputProps()} />
                  <CloudUploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  
                  {uploading ? (
                    <>
                      <Typography variant="h6" gutterBottom>
                        Uploading and processing...
                      </Typography>
                      <LinearProgress sx={{ mt: 2 }} />
                    </>
                  ) : (
                    <>
                      <Typography variant="h6" gutterBottom>
                        {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        or click to select files
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Supported formats: PDF, TXT
                      </Typography>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Upload Info */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  ℹ️ How it works
                </Typography>
                
                <Stepper orientation="vertical" activeStep={-1}>
                  <Step>
                    <StepLabel>Upload Content</StepLabel>
                    <StepContent>
                      <Typography variant="body2">
                        Upload PDF documents or text files with educational content
                      </Typography>
                    </StepContent>
                  </Step>
                  
                  <Step>
                    <StepLabel>AI Processing</StepLabel>
                    <StepContent>
                      <Typography variant="body2">
                        Our AI extracts and analyzes the content structure
                      </Typography>
                    </StepContent>
                  </Step>
                  
                  <Step>
                    <StepLabel>Course Generation</StepLabel>
                    <StepContent>
                      <Typography variant="body2">
                        Generate structured lessons with learning objectives
                      </Typography>
                    </StepContent>
                  </Step>
                  
                  <Step>
                    <StepLabel>Ready to Use</StepLabel>
                    <StepContent>
                      <Typography variant="body2">
                        Activate courses for your company's users
                      </Typography>
                    </StepContent>
                  </Step>
                </Stepper>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📚 Content Sources
            </Typography>
            
            {loading ? (
              <LinearProgress />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Words</TableCell>
                      <TableCell>Uploaded</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contentSources.map((source) => (
                      <TableRow key={source.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <DescriptionIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            {source.title}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={(source.content_type || 'unknown').toUpperCase()} 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={source.processing_status} 
                            color={getStatusColor(source.processing_status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatFileSize(source.file_size)}</TableCell>
                        <TableCell>{source.word_count.toLocaleString()}</TableCell>
                        <TableCell>{new Date(source.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {source.processing_status === 'ready' && !source.has_course && (
                              <Tooltip title="Generate Course">
                                <IconButton
                                  onClick={() => handleGenerateCourse(source.id)}
                                  disabled={generatingCourse}
                                  color="primary"
                                >
                                  {generatingCourse && selectedSourceId === source.id ? (
                                    <LinearProgress sx={{ width: 20 }} />
                                  ) : (
                                    <PsychologyIcon />
                                  )}
                                </IconButton>
                              </Tooltip>
                            )}
                            
                            {source.has_course && (
                              <Chip 
                                label="Course Created" 
                                color="success" 
                                size="small"
                                icon={<CheckCircleIcon />}
                              />
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🎓 Generated Courses
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Lessons</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">
                            {course.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {course.description}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{course.total_lessons}</TableCell>
                      <TableCell>{course.estimated_duration}h</TableCell>
                      <TableCell>
                        <Chip 
                          label={course.status} 
                          color={getStatusColor(course.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{new Date(course.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {course.status === 'draft' && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => handleActivateCourse(course.id)}
                          >
                            Activate
                          </Button>
                        )}
                        
                        {course.status === 'active' && (
                          <Chip 
                            label="Active" 
                            color="success" 
                            icon={<CheckCircleIcon />}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Text Content Dialog */}
      <Dialog 
        open={showTextDialog} 
        onClose={() => setShowTextDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          📝 Add Text Content
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Content Title"
            value={uploadTitle}
            onChange={(e) => setUploadTitle(e.target.value)}
            margin="normal"
          />
          
          <TextField
            fullWidth
            multiline
            rows={12}
            label="Paste your educational content here..."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            margin="normal"
            placeholder="Paste or type your educational content here. This could be articles, lessons, documentation, or any text-based learning material."
          />
          
          <Typography variant="caption" color="text.secondary">
            Characters: {textContent.length}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTextDialog(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={handleTextUpload}
            disabled={!textContent.trim() || uploading}
            startIcon={uploading ? undefined : <AddIcon />}
          >
            {uploading ? 'Uploading...' : 'Upload Text'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* NEW: AI Lesson Generation Dialog */}
      <Dialog 
        open={showAILessonDialog} 
        onClose={() => setShowAILessonDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          🧠 Generate AI Lesson
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Lesson Title"
            value={aiLessonTitle}
            onChange={(e) => setAILessonTitle(e.target.value)}
            margin="normal"
            placeholder="Enter the title for your AI-generated lesson"
          />
          
          <TextField
            fullWidth
            multiline
            rows={12}
            label="Content for AI Processing"
            value={aiLessonContent}
            onChange={(e) => setAILessonContent(e.target.value)}
            margin="normal"
            placeholder="Paste or type the content you want AI to transform into a structured lesson. This could be raw text, notes, articles, or any educational material."
          />
          
          <Typography variant="caption" color="text.secondary">
            Characters: {aiLessonContent.length} | AI will create a structured lesson with sections, key points, and educational formatting.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAILessonDialog(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={handleGenerateAILesson}
            disabled={!aiLessonContent.trim() || !aiLessonTitle.trim() || generatingAILesson}
            startIcon={generatingAILesson ? undefined : <AutoAwesomeIcon />}
          >
            {generatingAILesson ? 'Generating AI Lesson...' : 'Generate AI Lesson'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Buttons */}
      <Fab
        color="primary"
        aria-label="add-text"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setShowTextDialog(true)}
      >
        <AddIcon />
      </Fab>
      
      <Fab
        color="secondary"
        aria-label="ai-lesson"
        sx={{ position: 'fixed', bottom: 16, right: 88 }}
        onClick={() => setShowAILessonDialog(true)}
      >
        <AutoAwesomeIcon />
      </Fab>
    </Box>
  );
};

export default ContentManagement; 