import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

// Define the User structure based on your backend response
interface User {
  user_id: number;
  name: string;
  role: 'student' | 'admin' | 'volunteer';
  batch: string | null;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check for existing session on load
  useEffect(() => {
    const storedToken = localStorage.getItem('coupon_app_token');
    const storedUser = localStorage.getItem('coupon_app_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    // Save to local storage
    localStorage.setItem('coupon_app_token', newToken);
    localStorage.setItem('coupon_app_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('coupon_app_token');
    localStorage.removeItem('coupon_app_user');
    window.location.href = '/login'; // Force redirect
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user,loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
