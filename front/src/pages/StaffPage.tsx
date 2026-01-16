import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, ListGroup } from 'react-bootstrap';
import { QrScanner } from '../components/QrScanner';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; 
import ScanResult from '../components/ScanResult';
import VolunteerStatsModal from '../components/VolunteerStatsModal'; 
import { CalendarEvent, GeoAltFill } from 'react-bootstrap-icons'; // Added GeoAltFill for badge
import { registrationApi, eventsApi } from '../services/api';
import VolunteerAssignmentModal from '../components/VolunteerAssignmentModal';

interface ScanLog {
  student_name: string;
  roll_number: string;
  batch: string;
  counter_name: string;
  scanned_at: string;
}

const formatScanTime = (timeStr: string) => {
  if (!timeStr) return '-';
  try {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return 'Invalid time';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
  } catch (err) {
    return 'Error';
  }
};

// --- RECENT SCANS COMPONENT ---
const RecentScansSection: React.FC<{ eventId: number }> = ({ eventId }) => {
  const { user } = useAuth();
  const { colors } = useTheme(); 
  const [recentScans, setRecentScans] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentScans = async () => {
      setLoading(true);
      setError(null);
      try {
        const volunteerUser = user as any;
        const volunteerId = volunteerUser?.id;
        
        if (!volunteerId) {
          setError('Volunteer not found');
          return;
        }

        const data = await eventsApi.getVolunteerScanHistory(eventId, volunteerId);
        setRecentScans(data.scanHistory.slice(0, 10));
      } catch (err) {
        console.error('Failed to fetch recent scans:', err);
        setError('Unable to load recent scans');
        setRecentScans([]); 
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchRecentScans();
    }
  }, [eventId, user]);

  if (loading) {
    return (
      <Card className="shadow-sm border-0" style={{ backgroundColor: colors.ui.card }}>
        <Card.Body className="text-center py-4">
          <Spinner animation="border" size="sm" variant="success" />
          <p className="mt-2 mb-0 small" style={{ color: colors.text.secondary }}>Loading recent scans...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm" style={{ backgroundColor: colors.ui.card, border: `1px solid ${colors.ui.border}` }}>
      <Card.Header className="border-0" style={{ backgroundColor: colors.ui.background }}>
        <h6 className="mb-0 fw-bold" style={{ color: colors.text.primary }}>Recent Scans (Last 10)</h6>
      </Card.Header>
      <Card.Body className="p-0">
        {error ? (
          <div className="text-center py-4">
            <p className="mb-0 small" style={{ color: colors.text.secondary }}>{error}</p>
            <p className="mb-0 small" style={{ color: colors.text.secondary }}>Start scanning to see history</p>
          </div>
        ) : recentScans.length === 0 ? (
          <div className="text-center py-4">
            <p className="mb-0 small" style={{ color: colors.text.secondary }}>No scans yet</p>
          </div>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <ListGroup variant="flush">
              {recentScans.map((scan, idx) => (
                <ListGroup.Item 
                    key={idx} 
                    className="py-3" 
                    style={{ 
                        backgroundColor: colors.ui.card, 
                        borderBottom: `1px solid ${colors.ui.border}`,
                        color: colors.text.primary 
                    }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-semibold" style={{ color: colors.text.primary }}>{scan.student_name}</div>
                      <div className="small" style={{ color: colors.text.secondary }}>{scan.roll_number}</div>
                      <span className="badge border small" style={{ backgroundColor: colors.ui.background, color: colors.text.primary, borderColor: colors.ui.border }}>Batch {scan.batch}</span>
                    </div>
                    <div className="text-end">
                      <div className="small fw-semibold" style={{ color: colors.success.main }}>{scan.counter_name}</div>
                      <div className="small" style={{ color: colors.text.secondary }}>
                        {formatScanTime(scan.scanned_at)}
                      </div>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

interface EventData {
  event_id: number;
  name: string;
  date: string;
  status: string;
}

export const StaffPage = () => {
  const { user } = useAuth();
  const { colors } = useTheme(); 
  
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<{ status: 'success' | 'error' | 'warning', message: string, studentId?: string } | null>(null);
  const [events, setEvents] = useState<EventData[]>([]);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<{id: number, name: string} | null>(null);
  
  // Assignment State
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  // FIX: Start null to ensure we force selection
  const [volunteerAssignment, setVolunteerAssignment] = useState<{floor: string, counter: string} | null>(null);

  useEffect(() => {
    const fetchCurrentEvent = async () => {
        try {
            const volunteerUser = user as any;
            if (volunteerUser?.event_id) {
                const allEvents = await eventsApi.getAll();
                const currentEvent = allEvents.find((e: EventData) => e.event_id === volunteerUser.event_id);
                
                if (currentEvent) {
                    setEvents([currentEvent]);
                }
            }
        } catch(err) { 
            console.error("Failed to load event", err); 
        }
    };
    
    if (user) {
        fetchCurrentEvent();
    }
  }, [user]);

  // FIX: Force modal on mount if assignment isn't set in LOCAL state
  useEffect(() => {
    const volunteerUser = user as any;
    if (volunteerUser && volunteerUser.role === 'volunteer') {
      
      // If we haven't selected an assignment in this session yet, open modal.
      // We explicitly ignore the persisted `volunteerUser.current_floor` for initialization
      // so that the user is forced to confirm their spot every time they log in or refresh.
      if (!volunteerAssignment) {
        setShowAssignmentModal(true);
      }
    }
  }, [user, volunteerAssignment]);

  const handleOpenStats = (event: EventData) => {
      setSelectedEvent({ id: event.event_id, name: event.name });
      setShowStatsModal(true);
  };

  const handleAssignmentComplete = (assignment: {floor: string, counter: string}) => {
    setVolunteerAssignment(assignment);
    setShowAssignmentModal(false);
  };

  const handleScanSuccess = async (decodedText: string) => {
    setShowScanner(false);
    setLoading(true);
    setScanResult(null);

    try {
      const volunteerUser = user as any;
      const volunteerId = volunteerUser?.id; 
      
      if (!volunteerId) throw new Error("Volunteer not authenticated");

      await registrationApi.scan(decodedText, volunteerId);
      
      setScanResult({
        status: 'success',
        message: 'Coupon Verified. You can serve the food.',
      });

    } catch (err: any) {
      console.error('Scan error:', err);
      const errorMessage = err.message || 'Invalid Token';
      const isWarning = errorMessage.toLowerCase().includes("served") || 
                        errorMessage.toLowerCase().includes("redeemed");

      setScanResult({
        status: isWarning ? 'warning' : 'error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setScanResult(null);
    setShowScanner(true);
  };

  if (scanResult) {
    let title = 'Scan Failed';
    if (scanResult.status === 'success') title = 'Scan Successful!';
    if (scanResult.status === 'warning') title = 'Already Served';

    return (
      <ScanResult 
        result={{
          status: scanResult.status,
          title: title,
          message: scanResult.studentId 
            ? `${scanResult.message} (${scanResult.studentId})` 
            : scanResult.message
        }} 
        onScanNext={handleReset} 
      />
    );
  }

  return (
    <Container className="py-5" style={{ backgroundColor: colors.ui.background, minHeight: '100vh' }}>
      
      <div className="text-center mb-5">
        <h2 className="fw-bold" style={{ color: colors.text.primary }}>Volunteer Scanner</h2>
        <p style={{ color: colors.text.secondary }}>Scan student QR codes to mark them as served.</p>
        
        {/* Show current assignment badge only if selected */}
        {volunteerAssignment && (
            <div className="mt-2">
                <span className="badge bg-success px-3 py-2">
                    <GeoAltFill className="me-2"/>
                    {volunteerAssignment.floor} - Counter {volunteerAssignment.counter}
                </span>
            </div>
        )}
      </div>

      <Row className="justify-content-center">
        <Col xs={12} md={8} lg={6}>
          
          {/* LOGIC FIX: HIDE DASHBOARD IF NO ASSIGNMENT
              This prevents the user from using the scanner until they complete the modal. 
          */}
          {!volunteerAssignment ? (
             <div className="text-center py-5">
                <Spinner animation="border" style={{ color: colors.primary.main }} className="mb-3"/>
                <p style={{ color: colors.text.secondary }}>Please select your work station...</p>
             </div>
          ) : (
             <>
                {!showScanner && !loading && (
                    <Card className="text-center p-5 shadow-sm border-0 mb-5" style={{ backgroundColor: colors.ui.card }}>
                    <div className="mb-3" style={{ color: colors.primary.main }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1v6zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2z"/>
                        <path d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z"/>
                        </svg>
                    </div>
                    <h4 style={{ color: colors.text.primary }}>Ready to Serve?</h4>
                    <Button 
                        variant="primary" 
                        size="lg" 
                        className="mt-3 px-5 rounded-pill" 
                        onClick={() => setShowScanner(true)}
                        style={{ backgroundColor: colors.primary.main, borderColor: colors.primary.main }}
                    >
                        Start Camera
                    </Button>
                    </Card>
                )}

                {loading && (
                    <div className="text-center p-5">
                        <Spinner animation="border" style={{ color: colors.primary.main }} />
                        <p className="mt-3 fw-bold" style={{ color: colors.text.secondary }}>Verifying Coupon...</p>
                    </div>
                )}

                {showScanner && (
                    <Card className="shadow-lg border-0 overflow-hidden mb-5">
                    <Card.Header className="text-center py-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: colors.ui.card, borderBottom: `1px solid ${colors.ui.border}` }}>
                        <span className="fw-bold" style={{ color: colors.text.primary }}>Scanning...</span>
                        <Button variant="outline-secondary" size="sm" onClick={() => setShowScanner(false)}>Close</Button>
                    </Card.Header>
                    <Card.Body className="p-0 bg-black">
                        <QrScanner 
                        onScanSuccess={handleScanSuccess}
                        />
                    </Card.Body>
                    </Card>
                )}

                {!showScanner && !loading && (
                    <div className="mt-4">
                        <h5 className="fw-bold mb-3 border-bottom pb-2" style={{ color: colors.text.secondary, borderColor: colors.ui.border }}>Current Event</h5>
                        {events.length === 0 ? (
                            <p className="small" style={{ color: colors.text.secondary }}>No event assigned.</p>
                        ) : (
                            <Card className="shadow-sm border-0 mb-4" style={{ backgroundColor: colors.ui.card }}>
                                <Card.Body className="p-4">
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="rounded-circle d-flex align-items-center justify-content-center me-3" 
                                            style={{ width: '48px', height: '48px', minWidth: '48px', backgroundColor: colors.ui.background, color: colors.primary.main }}>
                                            <CalendarEvent size={20} />
                                        </div>
                                        <div className="flex-grow-1">
                                            <h6 className="fw-bold mb-1" style={{ color: colors.text.primary }}>{events[0].name}</h6>
                                            <small style={{ color: colors.text.secondary }}>Your assigned event</small>
                                        </div>
                                    </div>
                                    
                                    <Button 
                                        variant="outline-success" 
                                        size="sm" 
                                        onClick={() => handleOpenStats(events[0])}
                                        className="w-100"
                                        style={{ color: colors.primary.main, borderColor: colors.primary.main }}
                                    >
                                        View Your Stats
                                    </Button>
                                </Card.Body>
                            </Card>
                        )}
                        
                        {/* Recent Scans Section */}
                        <RecentScansSection eventId={(user as any)?.event_id} />
                    </div>
                )}
             </>
          )}

        </Col>
      </Row>
      
      <VolunteerStatsModal 
        show={showStatsModal} 
        onHide={() => setShowStatsModal(false)} 
        eventId={selectedEvent?.id || null} 
        eventName={selectedEvent?.name || ''} 
      />

      <VolunteerAssignmentModal
        show={showAssignmentModal}
        onAssignmentComplete={handleAssignmentComplete}
        volunteerId={(user as any)?.id}
        eventId={(user as any)?.event_id}
        volunteerName={(user as any)?.name || 'Volunteer'}
      />

    </Container>
  );
};

export default StaffPage;
