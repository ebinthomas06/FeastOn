import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Container, Card, Form, Button, Alert, InputGroup } from "react-bootstrap";
import { ShieldLock, Eye, EyeSlash } from "react-bootstrap-icons";
import { authApi } from '../services/api';
import { useTheme } from '../context/ThemeContext'; 

const StaffLoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const { colors } = useTheme(); 
  const navigate = useNavigate();

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError("Please enter username and password");
      return;
    }

    try {
      setLoading(true);
      const data = await authApi.volunteerLogin({ 
        username: username.trim(), 
        password 
      });

      login(data.token, data.user);

      if (data.user.role === 'admin') {
        navigate('/admin');
      } else if (data.user.role === 'volunteer') {
        navigate('/staff');
      } else {
        throw new Error('Invalid user role');
      }

    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    padding: "12px",
    backgroundColor: colors.ui.background,
    color: colors.text.primary,
    borderColor: colors.ui.border
  };

  return (
    <Container 
      className="d-flex align-items-center justify-content-center" 
      style={{ 
        minHeight: "100vh", 
        backgroundColor: colors.ui.background 
      }}
    >
      {/* FIX: Inject dynamic CSS to target the placeholder text. 
          This ensures the placeholder uses your secondary text color (readable in both modes).
      */}
      <style>
        {`
          .custom-placeholder::placeholder {
            color: ${colors.text.secondary} !important;
            opacity: 0.7;
          }
        `}
      </style>

      <Card 
        style={{ 
          maxWidth: 480, 
          width: "100%", 
          padding: 32, 
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          backgroundColor: colors.ui.card, 
          border: `1px solid ${colors.ui.border}` 
        }}
      >
        
        <div className="text-center mb-4">
          <div 
            className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
            style={{ 
                width: 60, 
                height: 60, 
                backgroundColor: colors.primary.main, 
                color: '#fff' 
            }}
          >
            <ShieldLock size={30} />
          </div>
          <h4 className="fw-bold" style={{ color: colors.text.primary }}>FeastOn Staff Access</h4>
          <p style={{ color: colors.text.secondary }}>Authorized personnel only</p>
        </div>

        {error && <Alert variant="danger" className="py-2 text-center small">{error}</Alert>}

        <Form onSubmit={handleStaffSubmit}>
          <Form.Group className="mb-3">
            <Form.Control 
              type="text" 
              placeholder="Username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="custom-placeholder" // Added Class
              style={inputStyle} 
            />
          </Form.Group>
          
          <Form.Group className="mb-4">
            <InputGroup>
              <Form.Control 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="custom-placeholder" // Added Class
                style={{ ...inputStyle, borderRight: "none" }} 
              />
              <InputGroup.Text 
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  cursor: "pointer", 
                  backgroundColor: colors.ui.background, 
                  borderColor: colors.ui.border,
                  borderLeft: "none",
                  color: colors.text.secondary
                }}
              >
                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </InputGroup.Text>
            </InputGroup>
          </Form.Group>

          <Button 
            type="submit" 
            className="w-100 py-2 fw-bold" 
            disabled={loading}
            style={{ 
                backgroundColor: colors.primary.main, 
                borderColor: colors.primary.main,
                color: '#fff'
            }}
          >
            {loading ? "Verifying..." : "Login"}
          </Button>
        </Form>
        
        <div className="text-center mt-4">
          <a 
            href="/" 
            className="text-decoration-none small" 
            style={{ color: colors.text.secondary }}
          >
            ← Back to Student Login
          </a>
        </div>
      
      </Card>
    </Container>
  );
};

export default StaffLoginPage;