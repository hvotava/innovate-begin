/**
 * Core Types for Lector AI Platform
 * Unified with backend data models
 */

// ============= RBAC Types =============
export type RoleKey = 'standard' | 'superuser' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: RoleKey;
  organizationId?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  
  // Relations
  organization?: Organization;
  subscriptions?: Subscription[];
  attempts?: Attempt[];
}

// ============= Organization Types =============
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  settings: OrganizationSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  users?: User[];
  courses?: Course[];
  subscriptions?: Subscription[];
}

export interface OrganizationSettings {
  allowSelfRegistration: boolean;
  defaultRole: RoleKey;
  customBranding: boolean;
  features: string[];
}

// ============= Subscription Types =============
export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: PlanLimits;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanLimits {
  maxUsers: number;
  maxCourses: number;
  maxLessonsPerCourse: number;
  maxStorageGB: number;
  hasAnalytics: boolean;
  hasCustomBranding: boolean;
  hasPrioritySupport: boolean;
}

export interface Subscription {
  id: string;
  organizationId: string;
  planId: string;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  organization?: Organization;
  plan?: SubscriptionPlan;
}

// ============= Learning Content Types =============
export interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  price?: number;
  isPublished: boolean;
  isFeatured: boolean;
  organizationId?: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  organization?: Organization;
  author?: User;
  lessons?: Lesson[];
  tests?: Test[];
  enrollments?: Enrollment[];
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  slug: string;
  content: string;
  videoUrl?: string;
  audioUrl?: string;
  duration: number; // in minutes
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  course?: Course;
  tests?: Test[];
}

export interface Test {
  id: string;
  courseId?: string;
  lessonId?: string;
  title: string;
  description?: string;
  timeLimit?: number; // in minutes
  passingScore: number; // percentage
  maxAttempts?: number;
  questions: Question[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  course?: Course;
  lesson?: Lesson;
  attempts?: Attempt[];
}

export interface Question {
  id: string;
  testId: string;
  type: 'multiple_choice' | 'true_false' | 'fill_in_blank' | 'essay';
  question: string;
  options?: string[]; // for multiple choice
  correctAnswer: string | number;
  explanation?: string;
  points: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ============= Progress Tracking Types =============
export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped';
  progress: number; // percentage
  startedAt: string;
  completedAt?: string;
  lastAccessedAt?: string;
  
  // Relations
  user?: User;
  course?: Course;
  lessonProgress?: LessonProgress[];
}

export interface LessonProgress {
  id: string;
  enrollmentId: string;
  lessonId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  timeSpent: number; // in seconds
  completedAt?: string;
  
  // Relations
  enrollment?: Enrollment;
  lesson?: Lesson;
}

export interface Attempt {
  id: string;
  userId: string;
  testId: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  answers: AttemptAnswer[];
  startedAt: string;
  completedAt?: string;
  timeSpent: number; // in seconds
  
  // Relations
  user?: User;
  test?: Test;
}

export interface AttemptAnswer {
  questionId: string;
  answer: string | number;
  isCorrect: boolean;
  points: number;
}

// ============= API Response Types =============
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============= Form Types =============
export interface LoginForm {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  organizationName?: string;
  acceptTerms: boolean;
}

export interface CourseForm {
  title: string;
  description?: string;
  category: string;  
  level: 'beginner' | 'intermediate' | 'advanced';
  price?: number;
  thumbnail?: File;
}

export interface LessonForm {
  title: string;
  content: string;
  videoUrl?: string;
  audioUrl?: string;
  duration?: number;
}

// ============= Auth Context Types =============
export interface AuthUser extends User {
  permissions: string[];
}

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginForm) => Promise<void>;
  register: (data: RegisterForm) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// ============= Component Props Types =============
export interface RoleGateProps {
  allow: RoleKey | RoleKey[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export interface DataTableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  actions?: {
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    onView?: (item: T) => void;
  };
}