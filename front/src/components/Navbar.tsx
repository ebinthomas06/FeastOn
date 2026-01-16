import React, { useState } from 'react'; // 1. Import useState
import { Navbar, Container, Dropdown, Button } from 'react-bootstrap'; 
import { PersonCircle, BoxArrowRight, ShieldLock, Moon, Sun, Bug } from 'react-bootstrap-icons'; // 2. Import Bug Icon
import { Link, useNavigate } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; 
import TeamModal from './TeamModal'; // 3. Import TeamModal

const AppNavbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { mode, toggleTheme, colors } = useTheme(); 
  const navigate = useNavigate();
  
  // 4. State for the modal
  const [showTeamModal, setShowTeamModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getCleanName = (fullName: string | undefined) => {
    if (!fullName) return "User";
    return fullName.split('-')[0].trim();
  };

  const getHomeRoute = () => {
    if (!isAuthenticated || !user) return "/login";
    if (user.role === 'admin') return "/admin";
    if (user.role === 'volunteer') return "/staff";
    return "/dashboard"; 
  };

  return (
    <>
      <Navbar 
        style={{ 
          minHeight: '90px', 
          padding: '12px 0',
          backgroundColor: colors.ui.card, 
          borderBottom: `1px solid ${colors.ui.border}`
        }} 
        className="shadow-sm sticky-top"
      >
        <Container className="d-flex justify-content-between align-items-center">
          
          {/* LOGO (Left Side) */}
          <Navbar.Brand 
              as={Link} 
              to={getHomeRoute()} 
              className="fw-bold d-flex align-items-center p-0"
              style={{ color: colors.text.primary }} 
          >
            <img 
              src="/klee-logo.png" 
              alt="Klee Logo" 
              style={{ height: '42px', width: 'auto' }} 
              className="me-3"
            />
            <span style={{ letterSpacing: '-0.5px', fontSize: '1.5rem' }}>FeastOn</span>
          </Navbar.Brand>
          
          {/* RIGHT SIDE CONTENT */}
          <div className="d-flex align-items-center gap-3">
            
            {/* Theme Toggle Button */}
            <Button 
              variant="link" 
              onClick={toggleTheme}
              style={{ color: colors.text.secondary, fontSize: '1.2rem' }}
              className="p-1"
            >
              {mode === 'light' ? <Moon /> : <Sun />}
            </Button>

            {isAuthenticated && user && (
              <Dropdown align="end">
                <Dropdown.Toggle 
                  variant="light" 
                  id="dropdown-basic" 
                  className="d-flex align-items-center border rounded-pill px-3 py-2 shadow-sm"
                  style={{ 
                      transition: 'all 0.2s',
                      backgroundColor: colors.ui.background,
                      borderColor: colors.ui.border,
                      color: colors.text.primary
                  }}
                >
                  <div className="rounded-circle p-1 d-flex align-items-center justify-content-center" 
                       style={{ color: colors.primary.main, backgroundColor: colors.ui.card }}>
                    <PersonCircle size={30}/>
                  </div>
                  
                  <span className="fw-semibold ms-3 d-none d-sm-block" style={{ fontSize: '1rem', color: colors.text.primary }}>
                    {getCleanName(user.name)}
                  </span>
                </Dropdown.Toggle>

                <Dropdown.Menu 
                  className="shadow-lg mt-3 p-2 rounded-4" 
                  style={{ 
                      minWidth: '260px', 
                      position: 'absolute',
                      backgroundColor: colors.ui.card,
                      borderColor: colors.ui.border
                  }}
                >
                  
                  {/* Mobile Name */}
                  <div className="px-3 py-2 border-bottom mb-2 d-block d-sm-none" style={{ borderColor: colors.ui.border }}>
                    <p className="mb-0 fw-bold" style={{ fontSize: '1.1rem', color: colors.text.primary }}>{getCleanName(user.name)}</p>
                  </div>

                  {/* Desktop Name */}
                  <div className="px-3 py-2 border-bottom mb-2 d-none d-sm-block" style={{ borderColor: colors.ui.border }}>
                    <p className="mb-0 fw-bold" style={{ fontSize: '1.1rem', color: colors.text.primary }}>{getCleanName(user.name)}</p>
                    <small style={{ fontSize: '0.85rem', color: colors.text.secondary }}>{user.email}</small>
                  </div>

                  <Dropdown.ItemText className="mb-2">
                    <span 
                      className="badge border rounded-pill px-3 py-2" 
                      style={{ 
                          fontSize: '0.85rem',
                          backgroundColor: colors.primary.light, 
                          color: colors.primary.dark,
                          borderColor: colors.primary.main
                      }}
                    >
                      {user.role.toUpperCase()}
                    </span>
                  </Dropdown.ItemText>

                  {/* --- NEW: REPORT ISSUE ITEM --- */}
                  <Dropdown.Item 
                    onClick={() => setShowTeamModal(true)} 
                    className="rounded-3 py-2" 
                    style={{ fontSize: '1rem', color: colors.text.primary }}
                    onMouseOver={(e: any) => e.currentTarget.style.backgroundColor = colors.ui.background}
                    onMouseOut={(e: any) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Bug className="me-2" /> Report Issue
                  </Dropdown.Item>
                  {/* ----------------------------- */}

                  {user.role === 'admin' && (
                    <Dropdown.Item 
                      as={Link} 
                      to="/admin" 
                      className="rounded-3 py-2" 
                      style={{ fontSize: '1rem', color: colors.text.primary }}
                      onMouseOver={(e: any) => e.currentTarget.style.backgroundColor = colors.ui.background}
                      onMouseOut={(e: any) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <ShieldLock className="me-2" /> Admin Panel
                    </Dropdown.Item>
                  )}

                  <Dropdown.Divider className="my-2" style={{ borderColor: colors.ui.border }} />

                  <Dropdown.Item 
                      onClick={handleLogout} 
                      className="rounded-3 py-2 fw-semibold" 
                      style={{ fontSize: '1rem', color: colors.error.main }}
                      onMouseOver={(e: any) => e.currentTarget.style.backgroundColor = colors.error.background}
                      onMouseOut={(e: any) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <BoxArrowRight className="me-2" /> Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}
          </div>

        </Container>
      </Navbar>

      {/* 5. Render Modal */}
      <TeamModal 
        show={showTeamModal} 
        onHide={() => setShowTeamModal(false)} 
      />
    </>
  );
};

export default AppNavbar;
