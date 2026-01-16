import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Spinner, Alert, Button } from 'react-bootstrap';
import { useTheme } from '../context/ThemeContext'; // 1. Import Theme Hook

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (errorMessage: string) => void;
}

const scannerRegionId = 'qr-scanner-region';

export const QrScanner = ({ onScanSuccess, onScanFailure }: QrScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const { colors } = useTheme(); // 2. Get dynamic colors

  useEffect(() => {
    // 1. Initialize the Core Scanner
    const html5QrCode = new Html5Qrcode(scannerRegionId, {
        formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ],
        verbose: false
    });
    
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        // 2. Start Camera Automatically
        await html5QrCode.start(
          { facingMode: "environment" }, 
          {
            fps: 10,
            qrbox: function(viewfinderWidth, viewfinderHeight) {
            let minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            let qrboxSize = Math.floor(minEdge * 0.7);
            return { width: qrboxSize, height: qrboxSize };
          },

            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Success Callback
            // We pause immediately to stop multiple scans of the same code
            html5QrCode.pause();
            onScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Error Callback (Scanning...)
          }
        );
        setHasPermission(true);
      } catch (err: any) {
        console.error("Camera Start Error:", err);
        setStartError("Camera permission denied or camera not found.");
        if (onScanFailure) onScanFailure(err.message);
      }
    };

    // Kick off the start process
    startScanner();

    // 3. Cleanup on Unmount
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
        }).catch(err => console.error("Stop failed", err));
      }
    };
  }, []); // Run once on mount

  const handleRetry = () => {
     if (scannerRef.current && scannerRef.current.isScanning === false) {
         scannerRef.current.resume();
     } else {
         window.location.reload(); 
     }
  }

  return (
    <div 
        className="qr-scanner-container position-relative rounded-3 overflow-hidden" 
        style={{ minHeight: '300px', backgroundColor: '#000' }} // Keep background black for camera feed container
    >
      
      {/* The actual video element container */}
      <div id={scannerRegionId} className="w-100 h-100" />

      {/* Loading Overlay */}
      {!hasPermission && !startError && (
        <div 
            className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
            style={{ 
                backgroundColor: colors.ui.card, // Dynamic BG
                color: colors.text.primary      // Dynamic Text
            }}
        >
            <Spinner animation="border" style={{ color: colors.primary.main }} className="mb-3"/>
            <p>Starting Camera...</p>
        </div>
      )}

      {/* Error Overlay */}
      {startError && (
          <div 
            className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center p-4 text-center"
            style={{ backgroundColor: colors.ui.card }}
          >
              <Alert variant="danger">{startError}</Alert>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={handleRetry}
                style={{ color: colors.text.primary, borderColor: colors.ui.border }}
              >
                Try Again
              </Button>
          </div>
      )}

      {/* Guide Box - Kept largely same as it needs to overlay video */}
      {hasPermission && (
          <div className="position-absolute top-50 start-50 translate-middle pointer-events-none" 
               style={{ 
                   width: '250px', 
                   height: '250px', 
                   border: `2px solid ${colors.primary.main}`, // Use primary color for the scanning frame
                   borderRadius: '12px',
                   boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
               }}>
          </div>
      )}
      
      <style>{`
        #qr-scanner-region video { 
        object-fit: contain; 
        width: 100% !important; 
        height: 100% !important; 
        background: #000;
      }

      `}</style>
    </div>
  );
};
