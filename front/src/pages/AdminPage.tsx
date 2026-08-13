import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert, Spinner, Table, Badge } from 'react-bootstrap';
import { PlusCircle, Trash, PencilSquare, Lock, Unlock, BarChartFill, PersonBadge, Eye, EyeSlash, XCircle ,Link45deg,Check2} from 'react-bootstrap-icons';
import EventStatsModal from '../components/EventStatsModal';
import { eventsApi,refundsApi } from '../services/api';
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

interface RefundFormType {
  form_id: number;
  title: string;
  semester: string;
  year: number;
  status: 'hidden' | 'active' | 'closed';
  google_sheet_url: string | null;
  google_sheet_id?: string;
  created_at?: string;
}

const AdminPage: React.FC = () => {
  const { colors, mode } = useTheme(); 

  // --- Form State (Events) ---
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('14:00');
  const [currentStatus, setCurrentStatus] = useState<string>('active');
  const defaultFloors = [{ id: 1, floorName: '1st Floor', counterCount: 2, capacityPerCounter: 50 }];
  const [floors, setFloors] = useState<FloorConfig[]>(defaultFloors);

  // --- Data State (Events) ---
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<{type: 'success'|'danger'|'warning', text: string} | null>(null);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);

  // --- State (Refund Forms) ---
  const [refundForms, setRefundForms] = useState<RefundFormType[]>([]);
  const [fetchingRefunds, setFetchingRefunds] = useState(false);
  const [creatingRefund, setCreatingRefund] = useState(false);
  const [refundTitle, setRefundTitle] = useState('');
  const [refundSemester, setRefundSemester] = useState('Odd');
  const [refundYear, setRefundYear] = useState(new Date().getFullYear());
  const [copiedFormId, setCopiedFormId] = useState<number | null>(null);
const [validationError, setValidationError] = useState('');

  // --- Modal States ---
  const [showStats, setShowStats] = useState(false);
  const [selectedEventForStats, setSelectedEventForStats] = useState<{id: number, name: string} | null>(null);
  const [showVolModal, setShowVolModal] = useState(false);
  const [selectedEventForVol, setSelectedEventForVol] = useState<{id: number, name: string} | null>(null);

  // --- Helpers ---
  const formatTime = (isoString?: string) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string) => {
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

  const getTodayDate = () => {
    return new Date().toLocaleDateString('en-CA'); 
  };

  // --- API Actions (Events) ---
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

  // --- API Actions (Refund Forms) ---
 const fetchRefundForms = async () => {
    setFetchingRefunds(true);
    try {
      const data = await refundsApi.getAllForms();
      setRefundForms(data);
    } catch (err: any) {
      console.error('Failed to fetch forms:', err.message);
    } finally {
      setFetchingRefunds(false);
    }
};

  useEffect(() => {
    fetchEvents();
    fetchRefundForms();
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
    
    const dt = new Date(event.date);
    setEventDate(dt.toLocaleDateString('en-CA')); 

    if (event.time_start) {
        const start = new Date(event.time_start);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (eventDate < getTodayDate()) {
      setMessage({ type: 'danger', text: 'Cannot create events for past dates. Please select today or a future date.' });
      return;
    }

    const dateObj = new Date(eventDate);
    const startObj = new Date(`${eventDate}T${startTime}:00`);
    const endObj = new Date(`${eventDate}T${endTime}:00`);

    const isoDate = dateObj.toISOString();
    const isoStartTime = startObj.toISOString();
    const isoEndTime = endObj.toISOString();

    setLoading(true);

    try {
      if (editingEventId) {
        await eventsApi.update(editingEventId, { 
            name: eventName, 
            description, 
            date: isoDate,        
            time_start: isoStartTime, 
            time_end: isoEndTime,     
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
                time_start: isoStartTime, 
                time_end: isoEndTime      
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

  // --- Refund Handlers ---
  const handleCreateRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingRefund(true);
    try {
      // Clean, centralized call that automatically includes 'coupon_app_token'
      await refundsApi.createForm({
        title: refundTitle,
        semester: refundSemester,
        year: refundYear
      });

      setMessage({ type: 'success', text: 'Refund form created successfully! It is hidden by default.' });
      setRefundTitle('');
      fetchRefundForms();
    } catch (err: any) {
      // Cast 'err' to 'any' (or 'Error') to safely access err.message
      setMessage({ type: 'danger', text: err.message || 'Error communicating with server.' });
    } finally {
      setCreatingRefund(false);
    }
  };

  const handleUpdateRefundStatus = async (id: number | number, newStatus: string) => {
    try {
      await refundsApi.updateStatus(id, newStatus);
      setMessage({ type: 'success', text: `Refund form is now ${newStatus}.` });
      fetchRefundForms();
    } catch (err: any) {
       // Cast 'err' to 'any' (or 'Error') to safely access err.message
      setMessage({ type: 'danger', text: err.message || 'Failed to change form status.' });
    }
  };
const handleCopyLink = async (formId: number) => {
  const link = `${window.location.origin}/refund/${formId}`;
  try {
    await navigator.clipboard.writeText(link);
    setCopiedFormId(formId);
    setTimeout(() => setCopiedFormId(null), 2000); // reset after 2s
  } catch (err) {
    setMessage({ type: 'danger', text: 'Failed to copy link. Please copy it manually.' });
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

  const isModalOpen = showStats || showVolModal;

  return (
    <Container 
        className="py-4" 
        style={{ 
            backgroundColor: colors.ui.background, 
            minHeight: '100vh', 
            color: colors.text.primary,
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
          ${mode === 'dark' ? `
            ::-webkit-calendar-picker-indicator {
                filter: invert(1);
                opacity: 0.8;
                cursor: pointer;
            }
          ` : ''}
        `}
      </style>

      {/* --- Header --- */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0" style={{ color: colors.text.primary }}>{editingEventId ? 'Edit Event' : 'Create New Mess Event'}</h2>
        {editingEventId && <Button variant="outline-secondary" onClick={handleCancelEdit}>Cancel Edit</Button>}
      </div>
      
      {message && <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>{message.text}</Alert>}

      {/* --- EVENT FORM SECTION --- */}
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

      {/* --- TABLE SECTION (EVENTS) --- */}
      <h3 className="mb-3 fw-bold mt-5 border-top pt-4" style={{ color: colors.text.primary, borderColor: colors.ui.border }}>Manage Existing Events</h3>
      {fetching ? <div className="text-center p-5"><Spinner animation="border" variant="success" /></div> : 
       events.length === 0 ? <Alert variant="info">No events found.</Alert> : (
        <Card className="shadow-sm mb-5" style={{ backgroundColor: colors.ui.card, border: `1px solid ${colors.ui.border}` }}>
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

      {/* --- REFUND FORMS SECTION --- */}
      <h3 className="mb-3 fw-bold mt-5 border-top pt-4" style={{ color: colors.text.primary, borderColor: colors.ui.border }}>Manage Refund Forms</h3>
      
      <Card className="mb-4 shadow-sm" style={{ backgroundColor: colors.ui.card, border: `1px solid ${colors.ui.border}` }}>
        <Card.Header className="py-3" style={{ backgroundColor: colors.ui.card, borderBottom: `1px solid ${colors.ui.border}` }}>
          <span className="fw-bold" style={{ color: colors.text.primary }}>Create New Refund Form</span>
          <span className="ms-2 small fw-normal" style={{ color: colors.text.secondary }}>
    (Title + Semester + Year must be unique)
  </span>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleCreateRefundSubmit}>
            <Row className="align-items-end">
              <Col md={5} className="mb-3 mb-md-0">
                <Form.Group>
                  <Form.Label style={{ color: colors.text.secondary }}>Title</Form.Label>
                  <Form.Control 
                    type="text" 
                    required 
                    value={refundTitle}
                    onChange={(e) => setRefundTitle(e.target.value)}
                    placeholder="e.g. Mess Refund"
                    className="custom-placeholder" 
                    style={{ backgroundColor: colors.ui.background, color: colors.text.primary, borderColor: colors.ui.border }}
                  />
                </Form.Group>
              </Col>
              <Col md={3} className="mb-3 mb-md-0">
                <Form.Group>
                  <Form.Label style={{ color: colors.text.secondary }}>Semester</Form.Label>
                  <Form.Select 
                    value={refundSemester}
                    onChange={(e) => setRefundSemester(e.target.value)}
                    style={{ backgroundColor: colors.ui.background, color: colors.text.primary, borderColor: colors.ui.border }}
                  >
                    <option value="Odd">Odd Semester</option>
                    <option value="Even">Even Semester</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2} className="mb-3 mb-md-0">
                <Form.Group>
                  <Form.Label style={{ color: colors.text.secondary }}>Year</Form.Label>
                  <Form.Control 
                    type="number" 
                    required 
                    value={refundYear}
                    onChange={(e) => setRefundYear(Number(e.target.value))}
                    style={{ backgroundColor: colors.ui.background, color: colors.text.primary, borderColor: colors.ui.border }}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Button type="submit" variant="success" className="w-100" disabled={creatingRefund} style={{ backgroundColor: colors.primary.main, borderColor: colors.primary.main }}>
                  {creatingRefund ? <Spinner animation="border" size="sm" /> : <><PlusCircle className="me-1"/> Create</>}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {fetchingRefunds ? <div className="text-center p-5"><Spinner animation="border" variant="success" /></div> : 
       refundForms.length === 0 ? <Alert variant="info">No refund forms found.</Alert> : (
        <Card className="shadow-sm mb-5" style={{ backgroundColor: colors.ui.card, border: `1px solid ${colors.ui.border}` }}>
          <Table responsive hover className="mb-0 align-middle">
            <thead style={{ backgroundColor: colors.ui.background }}>
              <tr>
                <th style={{ backgroundColor: colors.ui.background, color: colors.text.secondary }}>Title</th>
                <th style={{ backgroundColor: colors.ui.background, color: colors.text.secondary }}>Semester</th>
                <th style={{ backgroundColor: colors.ui.background, color: colors.text.secondary }}>Year</th>
                <th style={{ backgroundColor: colors.ui.background, color: colors.text.secondary }}>Visibility Status</th>
                <th style={{ backgroundColor: colors.ui.background, color: colors.text.secondary }}>Sheet</th>
                <th className="text-end" style={{ backgroundColor: colors.ui.background, color: colors.text.secondary }}>Toggle View For Students</th>
              </tr>
            </thead>
            <tbody>
              {refundForms.map(form => (
  <tr key={form.form_id}>
    <td className="fw-bold" style={{ backgroundColor: colors.ui.card, color: colors.text.primary }}>{form.title}</td>
    <td style={{ backgroundColor: colors.ui.card, color: colors.text.primary }}>{form.semester}</td>
    <td style={{ backgroundColor: colors.ui.card, color: colors.text.primary }}>{form.year}</td>
    <td style={{ backgroundColor: colors.ui.card }}>
      {form.google_sheet_url ? (
        <a href={form.google_sheet_url} target="_blank" rel="noopener noreferrer">
          Open Sheet
        </a>
      ) : (
        <span style={{ color: colors.text.secondary }}>—</span>
      )}
    </td>
    <td style={{ backgroundColor: colors.ui.card }}>
      {form.status === 'hidden' && <Badge bg="secondary">Hidden</Badge>}
      {form.status === 'active' && <Badge bg="success">Active (Collecting)</Badge>}
      {form.status === 'closed' && <Badge bg="danger">Closed</Badge>}
    </td>
    <td className="text-end" style={{ backgroundColor: colors.ui.card }}>
      <div className="d-flex flex-wrap gap-2 justify-content-md-end">
        {form.status === 'active' && (
          <Button
            variant={copiedFormId === form.form_id ? 'success' : 'outline-primary'}
            size="sm"
            onClick={() => handleCopyLink(form.form_id)}
          >
            {copiedFormId === form.form_id ? (
              <><Check2 className="me-1" /> Copied!</>
            ) : (
              <><Link45deg className="me-1" /> Copy Link</>
            )}
          </Button>
        )}
        {form.status !== 'active' && (
          <Button variant="outline-success" size="sm" onClick={() => handleUpdateRefundStatus(form.form_id, 'active')}>
            <Eye className="me-1"/> Enable View (Active)
          </Button>
        )}
        {form.status === 'active' && (
          <Button variant="outline-warning" size="sm" onClick={() => handleUpdateRefundStatus(form.form_id, 'closed')}>
            <XCircle className="me-1"/> Close Submissions
          </Button>
        )}
        {form.status === 'active' && (
          <Button variant="outline-secondary" size="sm" onClick={() => handleUpdateRefundStatus(form.form_id, 'hidden')} style={{ color: colors.text.primary, borderColor: colors.ui.border }}>
            <EyeSlash className="me-1"/> Disable View (Hide)
          </Button>
        )}
      </div>
    </td>
  </tr>
))}

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