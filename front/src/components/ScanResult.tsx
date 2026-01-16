import React from 'react';
import { Button, Container } from 'react-bootstrap';
import { 
  CheckCircleFill, 
  ExclamationTriangleFill, 
  XCircleFill 
} from 'react-bootstrap-icons';
import { useTheme } from '../context/ThemeContext'; // 1. Import Theme Hook

export interface ScanResult {
  status: 'success' | 'error' | 'warning';
  title: string;
  message: string;
}

interface ScanResultPageProps {
  result: ScanResult;
  onScanNext: () => void;
}

const ScanResult: React.FC<ScanResultPageProps> = ({ result, onScanNext }) => {
  const { colors } = useTheme(); // 2. Get dynamic colors
  
  let IconComponent;
  let iconColor = '';
  let backgroundColor = '';
  let textColor = '';
  let btnVariant = '';

  switch (result.status) {
    case 'success':
      IconComponent = CheckCircleFill;
      iconColor = colors.success.main; // Dynamic Success Green
      backgroundColor = colors.success.background; // Dynamic Light Green/Dark Green
      textColor = colors.success.main; // Use main color for text contrast
      btnVariant = 'success';
      break;

    case 'warning': 
      // 🟡 WARNING STATE (Yellow)
      IconComponent = ExclamationTriangleFill;
      iconColor = colors.warning.main; // Dynamic Warning Yellow
      backgroundColor = colors.warning.background; 
      textColor = colors.warning.main;
      btnVariant = 'warning'; 
      break;

    case 'error':
    default:
      IconComponent = XCircleFill;
      iconColor = colors.error.main; // Dynamic Error Red
      backgroundColor = colors.error.background; 
      textColor = colors.error.main;
      btnVariant = 'danger';
      break;
  }

  return (
    <Container 
      fluid
      className="d-flex flex-column justify-content-center align-items-center"
      style={{ 
        height: '100vh', 
        backgroundColor: backgroundColor, // Dynamic BG
        padding: '1rem',
        transition: 'background-color 0.3s ease'
      }}
    >
      {/* Icon */}
      <IconComponent 
        size={90} 
        color={iconColor}
      />

      {/* Title */}
      <h1 className="mt-4 text-center fw-bold" style={{ color: textColor }}>
        {result.title}
      </h1>

      {/* Message */}
      <p className="h5 mt-2 text-center px-3" style={{ color: textColor, opacity: 0.9 }}>
        {result.message}
      </p>

      {/* Scan Next Button */}
      <Button 
        variant={btnVariant} 
        size="lg"
        className="mt-5 text-white fw-bold shadow-sm"
        style={{ minWidth: '200px' }}
        onClick={onScanNext} 
      >
        Scan Next
      </Button>
    </Container>
  );
};

export default ScanResult;