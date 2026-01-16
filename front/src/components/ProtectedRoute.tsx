import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; // 1. Import Theme Hook
import { Spinner } from 'react-bootstrap';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const { colors } = useTheme(); // 2. Get dynamic colors

  // 1. Wait for Auth check to finish
  if (loading) {
    return (
      <div 
        className="d-flex justify-content-center align-items-center vh-100"
        style={{ backgroundColor: colors.ui.background }} // 3. Dynamic Background
      >
        <Spinner 
            animation="border" 
            style={{ color: colors.primary.main }} // 4. Dynamic Spinner Color
        />
      </div>
    );
  }

  // 2. Not Logged In? -> Go to Login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Wrong Role? -> Go to Home/Error
  if (!allowedRoles.includes(user.role)) {
    // Note: Alerts are blocking and not theme-able. 
    // Consider replacing this with a custom error page or toast in the future.
    alert("Access Denied: You are not authorized to view this page.");
    return <Navigate to="/" replace />;
  }

  // 4. Success -> Render the page
  return <Outlet />;
};

export default ProtectedRoute;