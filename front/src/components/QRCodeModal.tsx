import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { QRCodeSVG } from 'qrcode.react'; 
import { ClockFill } from 'react-bootstrap-icons'; 
import { useTheme } from '../context/ThemeContext'; // 1. Import Theme Hook

interface QRCodeModalProps {
  show: boolean;
  onHide: () => void;
  eventName: string;
  qrToken: string;
  slotDetails?: {
    floor: string;
    time: string;
  };
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ show, onHide, eventName, qrToken, slotDetails }) => {
  const { colors, mode } = useTheme(); // 2. Get dynamic colors AND mode

  return (
    <>
      {/* Inject dynamic CSS to handle Bootstrap internals that inline styles can't reach easily.
        1. .modal-content: The actual container wrapper. We add the requested border here.
        2. .btn-close: The 'X' button. We invert colors in dark mode to make it white.
      */}
      <style type="text/css">
        {`
          .qr-modal-custom .modal-content {
            border: 1px solid ${mode === 'dark' ? '#ffffff' : '#000000'} !important;
          }
          ${mode === 'dark' ? `
            .qr-modal-custom .btn-close {
              filter: invert(1) grayscale(100%) brightness(200%);
              opacity: 1;
            }
          ` : ''}
        `}
      </style>

      <Modal 
        show={show} 
        onHide={onHide} 
        centered 
        className="qr-modal-custom" // Apply our custom class
      >
        <Modal.Header 
          closeButton 
          style={{ 
              backgroundColor: colors.ui.card, 
              color: colors.text.primary,
              borderBottom: `1px solid ${colors.ui.border}`
          }}
        >
          <Modal.Title style={{ fontWeight: 'bold' }}>Your Entry Pass</Modal.Title>
        </Modal.Header>
        
        <Modal.Body className="text-center p-4" style={{ backgroundColor: colors.ui.card }}>
          <h5 className="mb-4 fw-bold" style={{ color: colors.primary.main }}>{eventName}</h5>
          
          {/* QR Code Container */}
          <div 
              className="p-3 border rounded d-inline-block shadow-sm mb-4" 
              style={{ backgroundColor: '#ffffff', borderColor: colors.ui.border }}
          >
            <QRCodeSVG 
              value={qrToken} 
              size={200}
              level="H" 
              includeMargin={true}
            />
          </div>
          
          {/* Slot Details Box */}
          {slotDetails && (
            <div 
              className="p-3 rounded mb-3 border d-inline-block w-100"
              style={{ 
                  backgroundColor: colors.ui.background, 
                  borderColor: colors.ui.border 
              }}
            >
              <div>
                <small 
                  className="d-block text-uppercase fw-bold" 
                  style={{ fontSize: '0.75rem', color: colors.text.secondary }}
                >
                  Assigned Time
                </small>
                <div className="fw-bold fs-5 mt-1" style={{ color: colors.text.primary }}>
                  <ClockFill className="me-2" style={{ color: colors.primary.main }} /> 
                  {slotDetails.time}
                </div>
              </div>
            </div>
          )}
          
          <p className="small mb-3" style={{ color: colors.text.secondary }}>
            Show this QR code at the counter.
          </p>
          
          {/* Updated "Valid for one-time use" text */}
          <div 
              className="fw-bold" 
              style={{ 
                  fontSize: '0.85rem', 
                  color: colors.text.secondary, // Lighter grey/white in dark mode
                  // Removed backgroundColor as requested
              }}
          >
            Valid for one-time use only.
          </div>
        </Modal.Body>
        
        <Modal.Footer style={{ backgroundColor: colors.ui.card, borderTop: `1px solid ${colors.ui.border}` }}>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default QRCodeModal;