import React, { useEffect, useState, useCallback } from 'react';
import EventCard from '../components/EventCard'; 
import type { EventData } from '../components/EventCard';
import QRCodeModal from '../components/QRCodeModal'; 
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; 
import { Spinner, Container, Badge, Modal, Button, Form, Card, Row, Col } from 'react-bootstrap';
import { eventsApi, registrationApi } from '../services/api';
import { ExclamationCircleFill, ClockHistory, CheckCircleFill, XCircleFill } from 'react-bootstrap-icons';

// 1. Updated Interface to include 'served_at'
interface BackendEvent {
  event_id: number;
  name: string;
  description: string;
  date: string;
  status: string;
  registration_id: number | null;
  registration_status: string | null;
  floor: string | null;
  time_start: string | null;
  time_end: string | null;
  served_at: string | null;
}

// --- FIXED COMPONENT: PAST EVENT CARD ---
const PastEventCard: React.FC<{ event: BackendEvent }> = ({ event }) => {
  // Destructure mode to check for 'dark'
  const { colors, mode } = useTheme(); 

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const renderStatus = () => {
    if (event.registration_status === 'served') {
      return (
        <div className="d-flex align-items-center" style={{ color: colors.success.main }}>
          <CheckCircleFill className="me-2" size={20} />
          <div>
            <div className="fw-bold">Coupon Claimed</div>
            <small style={{ color: colors.text.secondary }}>
              Served at {formatTime(event.served_at)}
            </small>
          </div>
        </div>
      );
    } else if (event.registration_status === 'registered') {
      return (
        <div className="d-flex align-items-center" style={{ color: colors.error.main }}>
          <XCircleFill className="me-2" size={20} />
          <div>
            <div className="fw-bold">Coupon Unused</div>
            <small style={{ color: colors.text.secondary }}>You registered but didn't eat.</small>
          </div>
        </div>
      );
    } else {
      return (
        <div className="d-flex align-items-center" style={{ color: colors.text.disabled }}>
          <ExclamationCircleFill className="me-2" size={20} />
          <div>
            <div className="fw-bold">Not Registered</div>
            <small style={{ color: colors.text.secondary }}>Missed this event.</small>
          </div>
        </div>
      );
    }
  };

  // Define styles based on mode
  const cardStyle = mode === 'dark' 
    ? {
        backgroundColor: colors.ui.card, // Use card color instead of background for better contrast
        opacity: 1, // Full opacity for clarity in dark mode
        border: `1px solid ${colors.ui.border}`, // Distinct border
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)' // Deeper shadow for dark mode
      }
    : {
        backgroundColor: colors.ui.background,
        opacity: 0.9,
        border: 'none', // No border for light mode
        boxShadow: '0 .125rem .25rem rgba(0,0,0,.075)' // Standard Bootstrap shadow-sm
      };

  return (
    <Card className="h-100" style={cardStyle}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5 className="fw-bold mb-0" style={{ color: colors.text.primary }}>{event.name}</h5>
          <Badge bg="secondary" pill>{formatDate(event.date)}</Badge>
        </div>
        
        <p className="small mb-3" style={{ color: colors.text.secondary }}>{event.description}</p>
        
        <div className="p-3 rounded-3" style={{ 
            backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : colors.ui.card, 
            border: `1px solid ${colors.ui.border}` 
        }}>
          {renderStatus()}
        </div>
      </Card.Body>
    </Card>
  );
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { colors } = useTheme(); 
  
  // --- UI State ---
  const [activeEvents, setActiveEvents] = useState<EventData[]>([]);
  const [pastEvents, setPastEvents] = useState<BackendEvent[]>([]); 
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // --- View Filter State ---
  const [viewFilter, setViewFilter] = useState<'active' | 'past'>('active');

  // --- Modal States ---
  const [showQrModal, setShowQrModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [qrToken, setQrToken] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [apiErrorMessage, setApiErrorMessage] = useState("");
  
  const selectedEvent = activeEvents.find(e => e.id === selectedEventId);

  // --- Helpers ---
  const getCleanName = (fullName: string | undefined) => {
    if (!fullName) return "Student";
    return fullName.split('-')[0].trim();
  };

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // --- 1. Fetch Events ---
  const fetchEvents = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      const data: BackendEvent[] = await eventsApi.getAllForStudent(user.user_id);

      const activeList: EventData[] = [];
      const pastList: BackendEvent[] = [];

      data.forEach(item => {
        if (item.status === 'active') {
          let slotInfo = undefined;
          if (item.floor && item.time_start && item.time_end) {
            const start = new Date(item.time_start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit' , hour12: true});
            const end = new Date(item.time_end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit' , hour12: true});
            slotInfo = { floor: item.floor, time: `${start} - ${end}` };
          }
          
          activeList.push({
            id: item.event_id.toString(),
            title: item.name,
            description: item.description,
            validDate: new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            assignedSlot: slotInfo,
            registrationStatus: item.registration_status === 'served' ? 'served' : 
                                item.registration_id ? 'registered' : 'not_registered',
            servedAt: item.served_at 
          });

        } else if (item.status === 'closed') {
          pastList.push(item);
        }
      });

      pastList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setActiveEvents(activeList);
      setPastEvents(pastList);

    } catch (err) {
      console.error(err);
      setError('Could not load events.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // --- Handlers ---
  const handleGetQR = async (eventId: string) => {
    if (!user) return;
    setSelectedEventId(eventId);
    try {
      const result = await registrationApi.register(user.user_id, parseInt(eventId));
      setQrToken(result.data.qr_token);
      setShowQrModal(true);
      fetchEvents(); 
    } catch (err: any) {
      setApiErrorMessage(err.message || "Registration failed.");
      setShowErrorModal(true);
    }
  };

  const handleCloseQrModal = () => {
    setShowQrModal(false);
    setQrToken('');
    setSelectedEventId(null);
  };

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
    setApiErrorMessage("");
  };

  if (loading && activeEvents.length === 0 && pastEvents.length === 0) return (
    <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: colors.ui.background }}>
      <Spinner animation="border" variant="success" />
    </div>
  );

  return (
    <Container className="py-5" style={{ backgroundColor: colors.ui.background, minHeight: '100vh' }}>
      
      {/* BLUR EFFECT CSS INJECTION */}
      <style type="text/css">
        {`
          .modal-backdrop {
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px); 
            background-color: rgba(0, 0, 0, 0.5); 
          }
          .modal-backdrop.show {
            opacity: 1 !important; 
          }
        `}
      </style>

      {/* Welcome Banner */}
      <div 
        className="p-5 rounded-4 mb-5 shadow-sm text-center text-md-start"
        style={{ 
          background: `linear-gradient(135deg, ${colors.primary.light} 0%, ${colors.ui.card} 100%)`,
          borderLeft: `5px solid ${colors.primary.main}`,
          color: colors.text.primary
        }}
      >
        <h1 className="fw-bold display-6 mb-2" style={{ color: colors.text.primary }}>
          Welcome back, <span style={{ color: colors.primary.main }}>{getCleanName(user?.name)}!</span> 
        </h1>
        <p className="mb-0" style={{ fontSize: '1.1rem', color: colors.text.secondary }}>
          {todayDate}
        </p>
      </div>

      {/* Control Header */}
      <Row className="align-items-center justify-content-between mb-4 g-3">
        <Col xs={12} md="auto" className="d-flex align-items-center">
          <h4 className="fw-bold mb-0 me-3" style={{ color: colors.text.primary }}>
            {viewFilter === 'active' ? 'Upcoming Meals' : 'Past History'}
          </h4>
          <Badge bg={viewFilter === 'active' ? 'success' : 'secondary'} pill>
            {viewFilter === 'active' ? activeEvents.length : pastEvents.length}
          </Badge>
        </Col>

        <Col xs={12} md="auto">
          {/* UPDATED: Added glow effect back to the dropdown */}
          <Form.Select 
            value={viewFilter} 
            onChange={(e) => setViewFilter(e.target.value as 'active' | 'past')}
            className="shadow-sm"
            style={{ 
                fontWeight: 'bold', 
                minWidth: '180px',
                backgroundColor: colors.ui.card,
                color: colors.text.primary,
                // FIX: Use Primary Color for Border & Add Glow Shadow
                border: `2px solid ${colors.primary.main}`, 
                boxShadow: `0 0 8px ${colors.primary.main}40`, // 25% opacity glow
                cursor: 'pointer'
            }}
          >
            <option value="active">Active Events</option>
            <option value="past">Past Events</option>
          </Form.Select>
        </Col>
      </Row>
      
      {/* CONTENT AREA */}
      {viewFilter === 'active' ? (
        <Row className="g-4">
          {activeEvents.length === 0 ? (
            <div className="text-center py-5 rounded-3" style={{ backgroundColor: colors.ui.card }}>
              <p className="mb-0" style={{ color: colors.text.secondary }}>No active events found for today.</p>
            </div>
          ) : (
            activeEvents.map((event) => (
              <Col key={event.id} md={6} lg={4}>
                <EventCard 
                  event={event} 
                  onGetQR={handleGetQR} 
                />
              </Col>
            ))
          )}
        </Row>
      ) : (
        <Row className="g-4">
          {pastEvents.length === 0 ? (
            <div className="text-center py-5 rounded-3" style={{ backgroundColor: colors.ui.card }}>
              <ClockHistory size={32} className="mb-3" style={{ color: colors.text.secondary }}/>
              <p className="mb-0" style={{ color: colors.text.secondary }}>No history available yet.</p>
            </div>
          ) : (
            pastEvents.map((event) => (
              <Col key={event.event_id} md={6} lg={4}>
                <PastEventCard event={event} />
              </Col>
            ))
          )}
        </Row>
      )}

      {/* Modals */}
      <QRCodeModal 
        show={showQrModal}
        onHide={handleCloseQrModal}
        eventName={selectedEvent?.title || ''}
        qrToken={qrToken}
        slotDetails={selectedEvent?.assignedSlot}
      />

      <Modal 
        show={showErrorModal} 
        onHide={handleCloseErrorModal} 
        centered
        contentClassName={colors.ui.card === '#1E1E1E' ? 'bg-dark text-white' : ''}
      >
        <Modal.Header closeButton className="border-0 pb-0" closeVariant={colors.ui.card === '#1E1E1E' ? 'white' : undefined}>
          <Modal.Title className="text-danger d-flex align-items-center">
            <ExclamationCircleFill className="me-2" />
            Registration Issue
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4 text-center">
          <h5 className="mb-3">Could not generate QR Code</h5>
          <p className="mb-0" style={{ color: colors.text.secondary }}>{apiErrorMessage}</p>
        </Modal.Body>
        <Modal.Footer className="border-0 justify-content-center pt-0 pb-4">
          <Button variant="secondary" onClick={handleCloseErrorModal} className="px-4 rounded-pill">
            Close
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
};

export default DashboardPage; 
