/**
 * App Index - Main Application Shell
 * Protected route that renders the main app with routing
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { RoleGate } from '@/components/RoleGate';

// App pages (TODO: Create these components)
import Dashboard from './dashboard';
import Courses from './courses';
import CourseDetail from './course_[id]';
import AdminIndex from './admin/index';
import AdminCMS from './admin/cms';
import OrgIndex from './org/index';
import Settings from './settings';

const AppIndex: React.FC = () => {
  return (
    <AppShell>
      <Routes>
        {/* Default redirect to dashboard */}
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
        
        {/* Main app routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/course/:id" element={<CourseDetail />} />
        <Route path="/settings" element={<Settings />} />
        
        {/* Organization routes (superuser/admin only) */}
        <Route 
          path="/org/*" 
          element={
            <RoleGate allow={['superuser', 'admin']}>
              <Routes>
                <Route path="/" element={<OrgIndex />} />
              </Routes>
            </RoleGate>
          } 
        />
        
        {/* Admin routes (admin only) */}
        <Route 
          path="/admin/*" 
          element={
            <RoleGate allow="admin">
              <Routes>
                <Route path="/" element={<AdminIndex />} />
                <Route path="/cms" element={<AdminCMS />} />
              </Routes>
            </RoleGate>
          } 
        />
        
        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </AppShell>
  );
};

export default AppIndex;