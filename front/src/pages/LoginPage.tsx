import React, { useState } from "react";
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext'; 
import { useNavigate } from 'react-router-dom';
import { Container, Card } from 'react-bootstrap';
import { authApi } from '../services/api';
import { useTheme } from '../context/ThemeContext'; 

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const { colors, mode } = useTheme(); 
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const { credential } = credentialResponse;
      if (!credential) return;

      const data = await authApi.googleLogin(credential);

      login(data.token, data.user);
      
      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'volunteer') navigate('/staff');
      else navigate('/dashboard');

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Login Failed");
    }
  };

  return (
    <Container 
      className="d-flex align-items-center justify-content-center" 
      style={{ 
        minHeight: "100vh", 
        backgroundColor: colors.ui.background 
      }}
    >
      <Card 
        style={{ 
          maxWidth: 480, 
          width: "100%", 
          padding: 32, 
          // Card Border logic
          border: mode === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.2)' 
            : `1px solid ${colors.ui.border}`,
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          backgroundColor: colors.ui.card 
        }}
      >
        
        {/* Header Section */}
        <div className="text-center mb-4">
           <img 
            src="/klee-logo.png" 
            alt="FeastOn Logo" 
            style={{ width: '80px', height: 'auto' }} 
            className="mb-3"
          />
          <h4 className="fw-bold" style={{ color: colors.text.primary }}>FeastOn</h4>
          <p style={{ color: colors.text.secondary }}>Sign in with your IIIT Kottayam account</p>
        </div>

        {/* Google Login Button Container */}
        <div className="d-flex justify-content-center mb-3">
          
          {/* WRAPPER FIX: 
             1. Use 'flex' to prevent height collapse (fixes missing text).
             2. Add a strong visible border in dark mode to outline the box.
             3. Match the border radius to the button shape.
          */}
          <div style={{
             display: 'flex',
             justifyContent: 'center',
             alignItems: 'center',
             
             // High visibility border for Dark Mode
             border: mode === 'dark' ? '2px solid rgba(255, 255, 255, 0.6)' : 'none',
             borderRadius: '20px', // Matches 'pill' shape
             
             // Ensure background is solid black behind the button in dark mode
             backgroundColor: mode === 'dark' ? '#000' : 'transparent',
             
             padding: '1px', // Slight padding to show the border cleanly
             overflow: 'hidden' 
          }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google Login Failed")}
              useOneTap
              shape="pill" 
              width="200px" 
              // 'filled_black' is the best option for dark mode compliance
              theme={mode === 'dark' ? 'filled_black' : 'outline'} 
              text="signin_with"
            />
          </div>

        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center small mb-3" style={{ color: colors.error.main }}>{error}</div>
        )}

        {/* Footer Info */}
        <div className="text-center" style={{ fontSize: 12, color: colors.text.disabled }}>
          Only <strong style={{ color: colors.text.secondary }}>@iiitkottayam.ac.in</strong> accounts are allowed
        </div>
        
        {/* Hidden Staff Link */}
        <div className="mt-5 text-center">
            <a 
              href="/staff-access" 
              style={{ 
                fontSize: '10px', 
                color: colors.ui.border, 
                textDecoration: 'none' 
              }}
            >
              .
            </a>
        </div>

      </Card>
    </Container>
  );
};

export default LoginPage;