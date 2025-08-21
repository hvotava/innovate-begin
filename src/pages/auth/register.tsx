/**
 * Register Page - User Registration
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
import { BookOpen, Mail, Lock, User, Building, Eye, EyeOff } from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    
    if (!formData.name.trim()) {
      newErrors.name = 'Jméno je povinné';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email je povinný';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Neplatný formát emailu';
    }
    
    if (!formData.password) {
      newErrors.password = 'Heslo je povinné';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Heslo musí mít alespoň 8 znaků';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Potvrzení hesla je povinné';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Hesla se neshodují';
    }
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Musíte souhlasit s podmínkami';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        organizationName: formData.organizationName || undefined,
        acceptTerms: formData.acceptTerms,
      });
      
      // Redirect to app or onboarding
      navigate('/app');
      
    } catch (error: any) {
      console.error('Registration error:', error);
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
            <CardTitle className="text-2xl">Registrace</CardTitle>
            <p className="text-muted-foreground">
              Vytvořte si účet a začněte s Lector AI
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Celé jméno</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Jan Novák"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`pl-10 ${errors.name ? 'border-destructive' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
              
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="jan@priklad.cz"
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
              
              {/* Organization Name (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="organizationName">
                  Název organizace <span className="text-muted-foreground">(volitelné)</span>
                </Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="organizationName"
                    name="organizationName"
                    type="text"
                    placeholder="Moje firma s.r.o."
                    value={formData.organizationName}
                    onChange={handleInputChange}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
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
              
              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Potvrzení hesla</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
              
              {/* Terms Acceptance */}
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="acceptTerms"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, acceptTerms: checked as boolean }))
                    }
                    disabled={isLoading}
                    className="mt-1"
                  />
                  <Label htmlFor="acceptTerms" className="text-sm leading-relaxed">
                    Souhlasím s{' '}
                    <Link to="/terms" className="text-primary hover:underline">
                      obchodními podmínkami
                    </Link>
                    {' '}a{' '}
                    <Link to="/privacy" className="text-primary hover:underline">
                      zásadami ochrany osobních údajů
                    </Link>
                  </Label>
                </div>
                {errors.acceptTerms && (
                  <p className="text-sm text-destructive">{errors.acceptTerms}</p>
                )}
              </div>
              
              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full gradient-primary text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Registrování...' : 'Vytvořit účet'}
              </Button>
            </form>
            
            {/* Login Link */}
            <div className="text-center mt-6 pt-6 border-t">
              <p className="text-muted-foreground">
                Už máte účet?{' '}
                <Link to="/auth/login" className="text-primary hover:underline font-medium">
                  Přihlaste se
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;