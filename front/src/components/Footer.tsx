import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext'; 
import TeamModal from './TeamModal';

export default function Footer() {
  const { colors } = useTheme(); 
  const [showTeamModal, setShowTeamModal] = useState(false);

  return (
    <>
      <footer 
        className="text-center py-3 mt-auto"
        style={{ 
          backgroundColor: colors.ui.background, 
          color: colors.text.secondary, 
          borderTop: `1px solid ${colors.ui.border}` 
        }}
      >
        <div className="container d-flex flex-wrap justify-content-center align-items-center gap-2">
          
          {/* Copyright Text */}
          <small>© {new Date().getFullYear()} IIIT Kottayam</small>
          
          {/* Separator Dot (Hidden on very small screens if wrapped) */}
          <small className="user-select-none">•</small>

          {/* Contact Link */}
          <small 
            onClick={() => setShowTeamModal(true)} 
            style={{ 
              cursor: 'pointer', 
              color: colors.primary?.main || colors.text.primary, // Make it slightly distinct
              fontWeight: 500
            }}
            className="text-decoration-underline-hover" // You can add this class or rely on the style below
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            Contact Developers
          </small>

        </div>
      </footer>

      {/* Render Modal outside the footer layout structure */}
      <TeamModal 
        show={showTeamModal} 
        onHide={() => setShowTeamModal(false)} 
      />
    </>
  );
}
