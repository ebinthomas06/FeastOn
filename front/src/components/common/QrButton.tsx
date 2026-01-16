import React from 'react';
import { Button } from 'react-bootstrap';
import { QrCodeScan, CheckCircleFill } from 'react-bootstrap-icons';
import { useTheme } from '../../context/ThemeContext'; // 1. Import Theme Hook

interface QrButtonProps {
  text: string;
  onClick: () => void;
  variant?: 'get' | 'show' | 'claimed';
  disabled?: boolean;
}

const QrButton: React.FC<QrButtonProps> = ({ text, onClick, variant = 'get', disabled = false }) => {
  const { colors } = useTheme(); // 2. Get dynamic colors
  
  // Define styles for each state
  const getButtonStyle = () => {
    switch (variant) {
      case 'get':
      case 'show':
        return {
          backgroundColor: colors.primary.main, 
          border: `1px solid ${colors.primary.main}`,
          color: colors.primary.text // Ensures text is readable (White)
        };
      case 'claimed':
        return {
          backgroundColor: colors.ui.card, // Blends with the card background in Dark/Light mode
          border: `1px solid ${colors.success.main}`, // Green Border
          color: colors.success.main // Green Text
        };
      default:
        return {
          backgroundColor: colors.primary.main,
          border: 'none',
          color: colors.primary.text
        };
    }
  };

  const getIcon = () => {
    if (variant === 'claimed') {
      return <CheckCircleFill className="me-2" />;
    }
    return <QrCodeScan className="me-2" />;
  };

  return (
    <Button
      variant="success" // Keep base variant for shape/padding defaults
      size="lg"
      className="w-100 d-flex align-items-center justify-content-center"
      style={getButtonStyle()} // Override colors dynamically
      onClick={onClick}
      disabled={disabled}
    >
      {getIcon()}
      <span>{text}</span>
    </Button>
  );
};

export default QrButton;