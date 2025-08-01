// User types
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'superuser' | 'contact_person' | 'regular_user';
  companyId?: number;
  phone?: string;
  language?: string;
  current_lesson_level?: number;
  created_at?: string;
  Company?: Company;
}

// Company types
export interface Company {
  id: number;
  name: string;
  ico?: string;
  contactPersonId?: number;
  created_at?: string;
  Users?: User[];
  ContactPerson?: User;
  Trainings?: Training[];
}

// Training types
export interface Training {
  id: number;
  title: string;
  description?: string;
  category?: string;
  companyId: number;
  created_at?: string;
  Company?: Company;
  Lessons?: Lesson[];
  Tests?: Test[];
  UserTrainings?: UserTraining[];
}

// Lesson types
export interface Lesson {
  id: number;
  title: string;
  content: string;
  trainingId: number;
  created_at?: string;
  Training?: Training;
}

// Test types
export interface Test {
  id: number;
  title: string;
  lessonId: number;
  orderNumber: number;
  questions: Question[];
  trainingId: number;
  created_at?: string;
  Training?: Training;
  Lesson?: Lesson;
}

// Question types
export interface Question {
  id?: number;
  question: string;
  options: string[];
  correctAnswer: number; // Index správné odpovědi v options array
  explanation?: string;
}

// UserTraining types
export interface UserTraining {
  id: number;
  userId: number;
  trainingId: number;
  progress: number; // 0-100
  completed: boolean;
  started_at: string;
  completed_at?: string;
  User?: User;
  Training?: Training;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'user';
  companyId?: number;
}

// API Response types
export interface ApiResponse<T> {
  message?: string;
  data?: T;
  error?: string;
  errors?: Array<{ msg: string; param: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

// Users API response types
export interface UsersResponse extends PaginatedResponse<User> {
  users: User[];
  totalUsers: number;
}

// Companies API response types
export interface CompaniesResponse extends PaginatedResponse<Company> {
  companies: Company[];
  totalCompanies: number;
}

// Trainings API response types
export interface TrainingsResponse extends PaginatedResponse<Training> {
  trainings: Training[];
  totalTrainings: number;
}

// Form types
export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'user';
  companyId?: number;
  phone?: string;
}

export interface CompanyFormData {
  name: string;
}

export interface TrainingFormData {
  title: string;
  description?: string;
  companyId: number;
}

export interface LessonFormData {
  title: string;
  content: string;
  trainingId: number;
}

export interface TestFormData {
  title: string;
  questions: Question[];
  trainingId: number;
}

// Auth Context types
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

// Component props types
export interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

// Contact Person types
export interface ContactPerson {
  id: number;
  name: string;
  email: string;
  role: 'contact_person' | 'superuser' | 'admin';
  companyName?: string;
  isAvailable: boolean;
}

// User Management types
export interface UserStats {
  roleStats: Array<{
    role: string;
    count: number;
  }>;
  companyStats: Array<{
    companyName: string;
    userCount: number;
  }>;
}

// Extended User types with additional fields
export interface ExtendedUser extends User {
  ManagedCompanies?: Company[];
}

// Role definitions
export type UserRole = 'admin' | 'superuser' | 'contact_person' | 'regular_user';

// Permissions helper
export interface RolePermissions {
  canManageUsers: boolean;
  canManageCompanies: boolean;
  canManageTrainings: boolean;
  canManageTests: boolean;
  canViewAllData: boolean;
  canOnlyViewOwnCompany: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    label: string;
    render?: (value: any, item: T) => React.ReactNode;
  }>;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  loading?: boolean;
}

// Dashboard types
export interface DashboardStats {
  totalUsers: number;
  totalCompanies: number;
  totalTrainings: number;
  activeTrainings: number;
  completedTrainings: number;
} 