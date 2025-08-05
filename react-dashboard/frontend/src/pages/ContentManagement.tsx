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
  Fab
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
  TextFields as TextFieldsIcon
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
  
  // Course generation state
  const [generatingCourse, setGeneratingCourse] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [targetLessons, setTargetLessons] = useState(10);

  // Load data
  const loadContentSources = useCallback(async () => {
    if (!user?.companyId) return;

    try {
      setLoading(true);
      const response = await api.get(`/api/ai-proxy/content/company/${user.companyId}`);
      setContentSources(response.data.content_sources || []);
    } catch (err: any) {
      console.error('Error loading content sources:', err);
      setError('Failed to load content sources');
    } finally {
      setLoading(false);
    }
  }, [user?.companyId]);

  const loadCourses = useCallback(async () => {
    if (!user?.companyId) return;

    try {
      const response = await api.get(`/api/courses/company/${user.companyId}`);
      setCourses(response.data.courses || []);
    } catch (err: any) {
      console.error('Error loading courses:', err);
      setError('Failed to load courses');
    }
  }, [user?.companyId]);

  useEffect(() => {
    loadContentSources();
    loadCourses();
  }, [loadContentSources, loadCourses]);

  // File upload handling
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('📁 onDrop called with files:', acceptedFiles);
    console.log('👤 User:', user);
    console.log('🏢 Company ID:', user?.companyId);
    
    if (!user?.companyId || acceptedFiles.length === 0) {
      console.log('❌ Early return - no company or files');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('📤 Starting upload process...');
      const formData = new FormData();
      formData.append('company_id', user.companyId.toString());
      formData.append('title', uploadTitle || acceptedFiles[0].name);
      formData.append('content_type', acceptedFiles[0].type.includes('pdf') ? 'pdf' : 'text');
      
      acceptedFiles.forEach(file => {
        console.log('📎 Adding file:', file.name, file.type, file.size);
        formData.append('files', file);
      });

      console.log('🚀 Making API call to /api/content/upload');
      const response = await api.post('/api/ai-proxy/content/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('✅ Upload response:', response.data);

      if (response.data.success) {
        setSuccess(`Successfully uploaded ${acceptedFiles.length} file(s)`);
        setUploadTitle('');
        await loadContentSources();
      } else {
        setError('Upload failed');
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
  }, [user?.companyId, uploadTitle, loadContentSources]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    multiple: true,
    disabled: uploading
  });

  // Text content upload
  const handleTextUpload = async () => {
    if (!textContent.trim() || !user?.companyId) return;

    setUploading(true);
    setError(null);

    try {
      const blob = new Blob([textContent], { type: 'text/plain' });
      const file = new File([blob], uploadTitle || 'text-content.txt', { type: 'text/plain' });
      
      const formData = new FormData();
      formData.append('company_id', user.companyId.toString());
      formData.append('title', uploadTitle || 'Text Content');
      formData.append('content_type', 'text');
      formData.append('files', file);

      const response = await api.post('/api/ai-proxy/content/upload', formData, {
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
      const response = await api.post(`/api/content/${sourceId}/generate-course`, {
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
      const response = await api.post(`/api/courses/${courseId}/activate`);
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
                            label={source.content_type.toUpperCase()} 
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
    </Box>
  );
};

export default ContentManagement; 