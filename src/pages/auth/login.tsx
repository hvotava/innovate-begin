/**
 * Login Page - User Authentication
 * TODO: Implement form validation and API integration
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = 'Email je povinný';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Neplatný formát emailu';
    }
    
    if (!formData.password) {
      newErrors.password = 'Heslo je povinné';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Heslo musí mít alespoň 6 znaků';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await login({
        email: formData.email,
        password: formData.password,
        remember: formData.remember,
      });
      
      // Redirect to app or intended destination
      navigate('/app');
      
    } catch (error: any) {
      console.error('Login error:', error);
      // Error is handled in AuthContext with toast
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="p-2 rounded-lg gradient-primary">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold">Lector AI</span>
          </Link>
        </div>
        
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Přihlášení</CardTitle>
            <p className="text-muted-foreground">
              Vstupine do své Lector AI platformy
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="vas@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              
              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Heslo</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>
              
              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    name="remember"
                    checked={formData.remember}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, remember: checked as boolean }))
                    }
                    disabled={isLoading}
                  />
                  <Label htmlFor="remember" className="text-sm">
                    Zapamatovat si mě
                  </Label>
                </div>
                
                <Link 
                  to="/auth/forgot-password" 
                  className="text-sm text-primary hover:underline"
                >
                  Zapomenuté heslo?
                </Link>
              </div>
              
              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full gradient-primary text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Přihlašování...' : 'Přihlásit se'}
              </Button>
            </form>
            
            {/* Register Link */}
            <div className="text-center mt-6 pt-6 border-t">
              <p className="text-muted-foreground">
                Nemáte účet?{' '}
                <Link to="/auth/register" className="text-primary hover:underline font-medium">
                  Zaregistrujte se
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg text-center">
          <p className="text-sm text-muted-foreground mb-2">Demo přihlášení:</p>
          <p className="text-xs text-muted-foreground">
            admin@lector.ai / admin123 (Admin)<br />
            user@lector.ai / user123 (Standard)
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;