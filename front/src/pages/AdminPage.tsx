import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert, Spinner, Table, Badge } from 'react-bootstrap';
import { PlusCircle, Trash, PencilSquare, Lock, Unlock, BarChartFill, PersonBadge } from 'react-bootstrap-icons';
import EventStatsModal from '../components/EventStatsModal';
import { eventsApi } from '../services/api';
import VolunteerManagerModal from '../components/VolunteerManagerModal';
import { useTheme } from '../context/ThemeContext';

interface FloorConfig {
  id: number;
  floorName: string;
  counterCount: number;
  capacityPerCounter: number;
}

interface EventData {
  event_id: number;
  name: string;
  description: string;
  date: string;
  status: string;
  time_start?: string;
  time_end?: string;
}

const AdminPage: React.FC = () => {
  const { colors } = useTheme(); 

  // --- Form State ---
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('14:00');
  const [currentStatus, setCurrentStatus] = useState<string>('active');
  const defaultFloors = [{ id: 1, floorName: '1st Floor', counterCount: 2, capacityPerCounter: 50 }];
  const [floors, setFloors] = useState<FloorConfig[]>(defaultFloors);

  // --- Data State ---
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<{type: 'success'|'danger'|'warning', text: string} | null>(null);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);

  // --- Modal States ---
  const [showStats, setShowStats] = useState(false);
  const [selectedEventForStats, setSelectedEventForStats] = useState<{id: number, name: string} | null>(null);
  const [showVolModal, setShowVolModal] = useState(false);
  const [selectedEventForVol, setSelectedEventForVol] = useState<{id: number, name: string} | null>(null);

  // --- Helpers ---
  const formatTime = (isoString?: string) => {
    if (!isoString) return '-';
    // Display in Local Time (IST)
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    // Display in Local Date
    return new Date(isoString).toLocaleDateString('en-GB'); 
  };

  const getStatusBadge = (event: EventData) => {
    if (event.status === 'closed') return <Badge bg="secondary">Closed</Badge>;
    return <Badge bg="success">Active</Badge>;
  };

  const isTimeInPast = (dateStr: string, timeStr: string) => {
    const checkDate = new Date(`${dateStr}T${timeStr}:00`);
    const now = new Date();
    return checkDate < now;
  };

  // --- API Actions ---
  const fetchEvents = async () => {
    setFetching(true);
    try {
      const data = await eventsApi.getAll();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // --- Floor Logic ---
  const addFloor = () => setFloors([...floors, { id: Date.now(), floorName: '', counterCount: 1, capacityPerCounter: 50 }]);
  const removeFloor = (id: number) => setFloors(floors.filter(f => f.id !== id));
  const updateFloor = (id: number, field: keyof FloorConfig, value: string | number) => {
    setFloors(floors.map(f => (f.id === id ? { ...f, [field]: value } : f)));
  };

  // --- Event Actions ---
  const handleEditClick = (event: EventData) => {
    setEditingEventId(event.event_id);
    setEventName(event.name);
    setDescription(event.description);
    setCurrentStatus(event.status);
    
    // Parse Date for Input Field (YYYY-MM-DD)
    const dt = new Date(event.date);
    // Use en-CA because it reliably gives YYYY-MM-DD format
    setEventDate(dt.toLocaleDateString('en-CA')); 

    // Parse Time for Input Fields (HH:mm)
    if (event.time_start) {
        const start = new Date(event.time_start);
        // Force 'en-GB' to get 24h format (13:00) which input type="time" requires
        setStartTime(start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    }
    if (event.time_end) {
        const end = new Date(event.time_end);
        setEndTime(end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    }

    window.scrollTo(0, 0);
    setMessage({ type: 'success', text: `Editing mode: ${event.name}` });
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setEventName('');
    setEventDate('');
    setDescription('');
    setMessage(null);
    setFloors(defaultFloors);
  }

  const handleToggleStatus = async () => {
    if(!editingEventId) return;
    
    if (currentStatus === 'closed') {
        if (isTimeInPast(eventDate, endTime)) {
            alert("You cannot re-open this event because the End Time has passed.\n\nPlease extend the 'End Time' below first, then click Update.");
            return;
        }
    }

    const newStatus = currentStatus === 'active' ? 'closed' : 'active';
    const confirmMsg = newStatus === 'closed' ? "Close this event manually?" : "Re-open this event?";
    
    if(!window.confirm(confirmMsg)) return;

    try {
        await eventsApi.update(editingEventId, { status: newStatus });
        
        setCurrentStatus(newStatus);
        setMessage({ type: 'success', text: `Event marked as ${newStatus}` });
        fetchEvents();
    } catch (err) {
        setMessage({ type: 'danger', text: 'Failed to update status' });
    }
  };

  const handleDelete = async (id: number) => {
    if(!window.confirm("Are you sure you want to permanently delete this event? This will remove all student registrations and logs.")) return;
    try {
      await eventsApi.delete(id);
      
      setMessage({ type: 'success', text: 'Event deleted' });
      fetchEvents();
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to delete' });
    }
  };

  // ✅ FIXED: Safer way to get today's date for 'min' attribute
  const getTodayDate = () => {
    // 'en-CA' locale code always outputs YYYY-MM-DD format
    return new Date().toLocaleDateString('en-CA'); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple string comparison for 'min' date works fine here
    if (eventDate < getTodayDate()) {
      setMessage({ 
        type: 'danger', 
        text: 'Cannot create events for past dates. Please select today or a future date.' 
      });
      return;
    }

    // ✅ FIXED: TIME CONVERSION
    // 1. Create a Date object from the Local Input (Browser treats this as IST)
    const dateObj = new Date(eventDate);
    const startObj = new Date(`${eventDate}T${startTime}:00`);
    const endObj = new Date(`${eventDate}T${endTime}:00`);

    // 2. Convert to UTC String before sending to Backend
    // Example: 12:00 IST -> 06:30 UTC
    const isoDate = dateObj.toISOString();
    const isoStartTime = startObj.toISOString();
    const isoEndTime = endObj.toISOString();

    setLoading(true);

    try {
      if (editingEventId) {
        await eventsApi.update(editingEventId, { 
            name: eventName, 
            description, 
            date: isoDate,        // Send UTC
            time_start: isoStartTime, // Send UTC
            time_end: isoEndTime,     // Send UTC
            status: currentStatus 
        });

        setMessage({ type: 'success', text: 'Event updated successfully!' });
        setEditingEventId(null);
      } else {
        const eventData = await eventsApi.create({ 
            name: eventName, 
            description, 
            date: isoDate 
        });
        
        const slotPromises: Promise<any>[] = [];
        floors.forEach(floor => {
          for (let i = 1; i <= floor.counterCount; i++) {
            slotPromises.push(eventsApi.createSlots(eventData.event_id, {
                floor: floor.floorName,
                counter: i,
                capacity: floor.capacityPerCounter,
                time_start: isoStartTime, // Send UTC
                time_end: isoEndTime      // Send UTC
            }));
          }
        });
        await Promise.all(slotPromises);
        setMessage({ type: 'success', text: 'Event created successfully!' });
      }
      
      setEventName(''); setDescription(''); setEventDate('');
      setFloors(defaultFloors);
      fetchEvents();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'danger', text: 'Operation failed.' });
    } finally {
      setLoading(false);
    }
  };

  const openStats = (event: EventData) => {
      setSelectedEventForStats({ id: event.event_id, name: event.name });
      setShowStats(true);
  };

  const handleManageVolunteers = (event: EventData) => {
    setSelectedEventForVol({ id: event.event_id, name: event.name });
    setShowVolModal(true);
  };

  // Check if any modal is currently open
  const isModalOpen = showStats || showVolModal;

  return (
    <Container 
        className="py-4" 
        style={{ 
            backgroundColor: colors.ui.background, 
            minHeight: '100vh', 
            color: colors.text.primary,
            // Dynamic Blur Effect for Background
            filter: isModalOpen ? 'blur(5px)' : 'none',
            transition: 'filter 0.3s ease'
        }}
    >
      
      <style>
        {`
          .custom-placeholder::placeholder {
            color: ${colors.text.secondary} !important;
            opacity: 0.7;
          }
        `}
      </style>

      {/* --- Header --- */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0" style={{ color: colors.text.primary }}>{editingEventId ? 'Edit Event' : 'Create New Mess Event'}</h2>
        {editingEventId && <Button variant="outline-secondary" onClick={handleCancelEdit}>Cancel Edit</Button>}
      </div>
      
      {message && <Alert variant={message.type}>{message.text}</Alert>}

      {/* --- FORM SECTION --- */}
      <Form onSubmit={handleSubmit}>
        <Card className="mb-4 shadow-sm" style={{ backgroundColor: colors.ui.card, border: `1px solid ${colors.ui.border}` }}>
          <Card.Header className="py-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: colors.ui.card, borderBottom: `1px solid ${colors.ui.border}` }}>
            <span className="fw-bold" style={{ color: colors.text.primary }}>Event Details</span>
            {editingEventId && (
                <Button 
                    size="sm" 
                    variant={currentStatus === 'active' ? 'outline-danger' : 'outline-success'}
                    onClick={handleToggleStatus}
                >
                    {currentStatus === 'active' ? (
                        <><Lock className="me-1"/> Close Event</>
                    ) : (
                        <><Unlock className="me-1"/> Re-open Event</>
                    )}
                </Button>
            )}
          </Card.Header>

          <Card.Body>
            {editingEventId && (
                <Alert variant={currentStatus === 'active' ? 'success' : 'secondary'} className="py-2 mb-3 small">
                    <strong>Current Status: </strong> {currentStatus.toUpperCase()}
                </Alert>
            )}

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ color: colors.text.secondary }}>Event Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    required 
                    value={eventName} 
                    onChange={e => setEventName(e.target.value)} 
                    // Use new helper function
                    min={getTodayDate()} 
                    placeholder="e.g. Christmas Dinner"
                    className="custom-placeholder" 
                    style={{ backgroundColor: colors.ui.background, color: colors.text.primary, borderColor: colors.ui.border }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ color: colors.text.secondary }}>Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    required 
                    value={eventDate} 
                    onChange={e => setEventDate(e.target.value)} 
                    placeholder="Select Date"
                    className="custom-placeholder" 
                    style={{ backgroundColor: colors.ui.background, color: colors.text.primary, borderColor: colors.ui.border }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: colors.text.secondary }}>Description</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={2} 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Enter event details here..."
                className="custom-placeholder" 
                style={{ backgroundColor: colors.ui.background, color: colors.text.primary, borderColor: colors.ui.border }}
              />
            </Form.Group>
            
            <Row>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ color: colors.text.secondary }}>Start Time</Form.Label>
                    <Form.Control 
                        type="time" 
                        value={startTime} 
                        onChange={e => setStartTime(e.target.value)} 
                        required 
                        className="custom-placeholder" 
                        style={{ backgroundColor: colors.ui.background, color: colors.text.primary, borderColor: colors.ui.border }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ color: colors.text.secondary }}>End Time</Form.Label>
                    <Form.Control 
                        type="time" 
                        value={endTime} 
                        onChange={e => setEndTime(e.target.value)} 
                        required 
                        className="custom-placeholder" 
                        style={{ backgroundColor: colors.ui.background, color: colors.text.primary, borderColor: colors.ui.border }}
                    />
                  </Form.Group>
                </Col>
            </Row>
          </Card.Body>
        </Card>

        {!editingEventId && (
          <Card className="mb-4 shadow-sm" style={{ backgroundColor: colors.ui.card, border: `1px solid ${colors.ui.border}` }}>
            <Card.Header className="py-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: colors.ui.card, borderBottom: `1px solid ${colors.ui.border}` }}>
              <span className="fw-bold" style={{ color: colors.text.primary }}>Floor and Hostel Configuration</span>
              <Button variant="outline-primary" size="sm" onClick={addFloor}>
                <PlusCircle className="me-1"/> Add Mess
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table className="mb-0">
                  <thead style={{ backgroundColor: colors.ui.background }}>
                    <tr>
                      <th className="fw-bold small" style={{ minWidth: '150px', color: colors.text.secondary, backgroundColor: colors.ui.background }}>FLOOR NAME / HOSTEL NAME</th>
                      <th className="fw-bold small text-center" style={{ color: colors.text.secondary, backgroundColor: colors.ui.background }}>COUNTERS</th>
                      <th className="fw-bold small text-center" style={{ color: colors.text.secondary, backgroundColor: colors.ui.background }}>CAPACITY</th>
                      <th className="fw-bold small text-center" style={{ minWidth: '80px', color: colors.text.secondary, backgroundColor: colors.ui.background }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {floors.map((floor, index) => (
                      <tr key={floor.id}>
                        <td className="align-middle" style={{ backgroundColor: colors.ui.card }}>
                          <Form.Control 
                            type="text" 
                            value={floor.floorName} 
                            onChange={(e) => updateFloor(floor.id, 'floorName', e.target.value)} 
                            placeholder={`Mess ${index + 1}`}
                            required 
                            size="sm"
                            className="custom-placeholder" 
                            style={{ minWidth: '140px', backgroundColor: colors.ui.background, color: colors.text.primary, borderColor: colors.ui.border }}
                          />
                        </td>

                        <td className="align-middle text-center" style={{ backgroundColor: colors.ui.card }}>
                          <Form.Control 
                            type="number" 
                            min={1} 
                            value={floor.counterCount} 
                            onChange={(e) => updateFloor(floor.id, 'counterCount', parseInt(e.target.value))} 
                            size="sm"
                            placeholder="e.g. 2"
                            className="custom-placeholder" 
                            style={{ width: '80px', margin: '0 auto', backgroundColor: colors.ui.background, color: colors.text.primary, borderColor: colors.ui.border }}
                          />
                        </td>
                        <td className="align-middle text-center" style={{ backgroundColor: colors.ui.card }}>
                          <Form.Control 
                            type="number" 
                            min={1} 
                            value={floor.capacityPerCounter} 
                            onChange={(e) => updateFloor(floor.id, 'capacityPerCounter', parseInt(e.target.value))} 
                            size="sm"
                            placeholder="e.g. 50"
                            className="custom-placeholder" 
                            style={{ width: '80px', margin: '0 auto', backgroundColor: colors.ui.background, color: colors.text.primary, borderColor: colors.ui.border }}
                          />
                        </td>
                        <td className="align-middle text-center" style={{ minWidth: '80px', backgroundColor: colors.ui.card }}>
                        {floors.length > 1 ? (
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            onClick={() => removeFloor(floor.id)}
                          >
                            <Trash />
                          </Button>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        )}

        <Button variant={editingEventId ? "warning" : "success"} size="lg" type="submit" className="w-100 mb-5" disabled={loading} style={!editingEventId ? { backgroundColor: colors.primary.main, borderColor: colors.primary.main } : {}}>
          {loading ? <Spinner animation="border" size="sm" /> : (editingEventId ? 'Update Event' : 'Create Event')}
        </Button>
      </Form>

      {/* --- TABLE SECTION --- */}
      <h3 className="mb-3 fw-bold mt-5 border-top pt-4" style={{ color: colors.text.primary, borderColor: colors.ui.border }}>Manage Existing Events</h3>
      {fetching ? <div className="text-center p-5"><Spinner animation="border" variant="success" /></div> : 
       events.length === 0 ? <Alert variant="info">No events found.</Alert> : (
        <Card className="shadow-sm" style={{ backgroundColor: colors.ui.card, border: `1px solid ${colors.ui.border}` }}>
          <Table responsive hover className="mb-0 align-middle">
            <thead style={{ backgroundColor: colors.ui.background }}>
              <tr>
                <th style={{ backgroundColor: colors.ui.background, color: colors.text.secondary }}>Event Name</th>
                <th style={{ backgroundColor: colors.ui.background, color: colors.text.secondary }}>Date</th>
                <th style={{ backgroundColor: colors.ui.background, color: colors.text.secondary }}>Time Slot</th>
                <th style={{ backgroundColor: colors.ui.background, color: colors.text.secondary }}>Status</th>
                <th className="text-end" style={{ backgroundColor: colors.ui.background, color: colors.text.secondary }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => {
                return (
                  <tr key={event.event_id}>
                    <td style={{ backgroundColor: colors.ui.card }}>
                      <div 
                          className="fw-bold" 
                          style={{ cursor: 'pointer', textDecoration: 'underline', color: colors.primary.main }}
                          onClick={() => openStats(event)}
                          title="Click to view stats"
                      >
                          {event.name} <BarChartFill className="ms-1" size={14}/>
                      </div>
                      <small style={{ color: colors.text.secondary }}>{event.description}</small>
                    </td>
                    <td style={{ backgroundColor: colors.ui.card, color: colors.text.primary }}>{formatDate(event.date)}</td>
                    <td style={{ backgroundColor: colors.ui.card }}><span className="small fw-bold" style={{ color: colors.text.secondary }}>{formatTime(event.time_start)} - {formatTime(event.time_end)}</span></td>
                    <td style={{ backgroundColor: colors.ui.card }}>{getStatusBadge(event)}</td>
                    
                    <td className="text-end" style={{ backgroundColor: colors.ui.card }}>
                      <div className="d-flex flex-column flex-md-row gap-2 justify-content-md-end align-items-stretch">
                        <Button 
                          variant="outline-dark" 
                          size="sm" 
                          title="Manage Staff"
                          onClick={() => handleManageVolunteers(event)}
                          style={{ color: colors.text.primary, borderColor: colors.ui.border }}
                        >
                          <PersonBadge /> Staff
                        </Button>
                        <Button variant="outline-primary" size="sm" onClick={() => handleEditClick(event)}>
                          <PencilSquare /> Edit
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(event.event_id)}>
                          <Trash /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}

      {/* --- STATS MODAL COMPONENT --- */}
      <EventStatsModal 
        show={showStats} 
        onHide={() => setShowStats(false)} 
        eventId={selectedEventForStats?.id || null} 
        eventName={selectedEventForStats?.name || ''} 
      />

      {/* --- VOLUNTEER MODAL COMPONENT --- */}
      <VolunteerManagerModal 
        show={showVolModal} 
        onHide={() => setShowVolModal(false)} 
        eventId={selectedEventForVol?.id || null} 
        eventName={selectedEventForVol?.name || ''} 
      />
    </Container>
  );
};

export default AdminPage;
