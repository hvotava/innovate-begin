/**
 * Authentication Context Provider
 * Manages user authentication state, login/logout functionality
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthUser, AuthContextType, LoginForm, RegisterForm } from '@/lib/types';
import { 
  login as apiLogin, 
  register as apiRegister, 
  logout as apiLogout,
  getCurrentUser,
  getUser,
  isAuthenticated as checkIsAuthenticated,
  initializeTokenRefresh,
} from '@/lib/auth';
import { useToast } from '@/components/ui/use-toast';

// ============= Context Creation =============
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============= Provider Component =============
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // ============= Authentication State =============
  const isAuthenticated = !!user && checkIsAuthenticated();

  // ============= Initialize Auth State =============
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is stored locally
        const storedUser = getUser();
        if (storedUser && checkIsAuthenticated()) {
          setUser(storedUser);
          
          // Refresh user data from server
          try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
          } catch (error) {
            console.error('Failed to refresh user data:', error);
            // Keep local user data if server refresh fails
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid auth state
        await handleLogout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
    
    // Initialize automatic token refresh
    initializeTokenRefresh();
  }, []);

  // ============= Login Function =============
  const handleLogin = useCallback(async (credentials: LoginForm) => {
    setIsLoading(true);
    
    try {
      const loggedInUser = await apiLogin(credentials);
      setUser(loggedInUser);
      
      toast({
        title: "Přihlášení úspěšné",
        description: `Vítejte zpět, ${loggedInUser.name}!`,
      });
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Přihlášení se nezdařilo';
      
      toast({
        title: "Chyba při přihlašování",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // ============= Register Function =============
  const handleRegister = useCallback(async (data: RegisterForm) => {
    setIsLoading(true);
    
    try {
      const newUser = await apiRegister(data);
      setUser(newUser);
      
      toast({
        title: "Registrace úspěšná",
        description: `Vítejte v Lector AI, ${newUser.name}!`,
      });
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registrace se nezdařila';
      
      toast({
        title: "Chyba při registraci",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // ============= Logout Function =============
  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    
    try {
      await apiLogout();
      setUser(null);
      
      toast({
        title: "Odhlášení úspěšné",
        description: "Byli jste úspěšně odhlášeni.",
      });
      
    } catch (error) {
      console.error('Logout error:', error);
      // Clear user state even if API call fails
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // ============= Refresh User Function =============
  const refreshUser = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If refresh fails, the user might need to log in again
      await handleLogout();
    }
  }, [isAuthenticated, handleLogout]);

  // ============= Context Value =============
  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============= Hook =============
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// ============= Higher-Order Component =============
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> => {
  const WrappedComponent = (props: P) => {
    const auth = useAuth();
    
    return <Component {...props} {...auth} />;
  };
  
  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};
