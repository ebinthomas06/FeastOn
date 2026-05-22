import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Alert, InputGroup, Badge, Toast, ToastContainer } from 'react-bootstrap';
import { PersonPlusFill, Trash, Clipboard, Check } from 'react-bootstrap-icons';
import { eventsApi } from '../services/api';
import { useTheme } from '../context/ThemeContext'; 

interface VolunteerManagerModalProps {
  show: boolean;
  onHide: () => void;
  eventId: number | null;
  eventName: string;
}

interface Volunteer {
  id: number;
  name: string;
  username: string;
  is_active: boolean;
}

const VolunteerManagerModal: React.FC<VolunteerManagerModalProps> = ({ show, onHide, eventId, eventName }) => {
  const { colors, mode } = useTheme(); 
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Success State
  // UPDATED: Added 'n' (name) to the state interface
  const [createdCreds, setCreatedCreds] = useState<{n: string, u: string, p: string} | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Toast State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'danger'>('success');

  // 1. Load Volunteers
  useEffect(() => {
    if (show && eventId) {
      fetchVolunteers();
      generateSuggestedCredentials();
      setCreatedCreds(null);
    }
  }, [show, eventId]);

  const fetchVolunteers = async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const data = await eventsApi.getVolunteers(eventId);
      setVolunteers(data);
    } catch (err) {
      console.error("Failed to load volunteers");
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestedCredentials = () => {
    if (!eventName) return;
    const prefix = eventName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toLowerCase();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setNewUsername(`${prefix}_staff${randomSuffix}`);
    setNewPassword(Math.random().toString(36).slice(-6));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    try {
      await eventsApi.addVolunteer(eventId, {
        name: newName,
        username: newUsername,
        password: newPassword
      });

      // UPDATED: Save name to state so we can copy it later
      setCreatedCreds({ n: newName, u: newUsername, p: newPassword });
      
      fetchVolunteers();
      setNewName('');
      generateSuggestedCredentials();
      
      setToastVariant('success');
      setToastMessage('Volunteer added successfully');
      setShowToast(true);
    } catch (err: any) {
      alert(err.message || "Failed to create volunteer.");
    }
  };

  const handleDelete = async (volId: number, volName: string) => {
    const previousVolunteers = [...volunteers];
    setVolunteers(prev => prev.filter(v => v.id !== volId));

    try {
      await eventsApi.deleteVolunteer(volId);
      setToastVariant('success');
      setToastMessage(`Deleted ${volName} successfully.`);
      setShowToast(true);
    } catch (err: any) {
      console.error("Delete failed:", err);
      setVolunteers(previousVolunteers);
      setToastVariant('danger');
      setToastMessage(`Could not delete: ${err.message || "Server Error"}`);
      setShowToast(true);
    }
  };

  const copyToClipboard = () => {
    if (createdCreds) {
      // UPDATED: Added Volunteer Name to the copied text
      const text = `🔑 *FeastOn Volunteer Access*\nEvent: ${eventName}\nVolunteer: ${createdCreds.n}\nUsername: ${createdCreds.u}\nPassword: ${createdCreds.p}`;
      navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const inputStyle = {
    backgroundColor: colors.ui.background,
    color: colors.text.primary,
    borderColor: colors.ui.border
  };

  return (
    <>
      <style>
        {`
          .custom-placeholder::placeholder {
            color: ${colors.text.secondary} !important;
            opacity: 0.7;
          }
          ${mode === 'dark' ? `
            .volunteer-modal-custom .btn-close {
              filter: invert(1) grayscale(100%) brightness(200%);
              opacity: 1;
            }
          ` : ''}
        `}
      </style>

      <Modal 
        show={show} 
        onHide={onHide} 
        size="lg" 
        centered
        className="volunteer-modal-custom" 
      >
        <Modal.Header 
            closeButton 
            style={{ 
                backgroundColor: colors.ui.card, 
                color: colors.text.primary, 
                borderBottom: `1px solid ${colors.ui.border}` 
            }}
        >
          <Modal.Title>Manage Staff: <span style={{ color: colors.primary.main }}>{eventName}</span></Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: colors.ui.background }}>
          
          {/* CREATION FORM */}
          <div className="p-3 rounded mb-4" style={{ backgroundColor: colors.ui.card, border: `1px solid ${colors.ui.border}` }}>
              <h6 className="fw-bold mb-3" style={{ color: colors.text.primary }}><PersonPlusFill className="me-2"/> Add New Volunteer</h6>
              <Form onSubmit={handleCreate}>
                  <div className="row g-2">
                      <div className="col-md-4">
                          <Form.Control 
                              placeholder="Name (e.g. John)" 
                              value={newName} 
                              onChange={e => setNewName(e.target.value)} 
                              required 
                              style={inputStyle}
                              className="custom-placeholder" 
                          />
                      </div>
                      <div className="col-md-3">
                          <InputGroup>
                              <InputGroup.Text style={{ backgroundColor: colors.ui.background, color: colors.text.secondary, borderColor: colors.ui.border }}>@</InputGroup.Text>
                              <Form.Control 
                                  placeholder="Username" 
                                  value={newUsername} 
                                  onChange={e => setNewUsername(e.target.value)} 
                                  required 
                                  style={inputStyle}
                                  className="custom-placeholder" 
                              />
                          </InputGroup>
                      </div>
                      <div className="col-md-3">
                            <Form.Control 
                                  placeholder="Password" 
                                  value={newPassword} 
                                  onChange={e => setNewPassword(e.target.value)} 
                                  required 
                                  style={inputStyle}
                                  className="custom-placeholder" 
                            />
                      </div>
                      <div className="col-md-2">
                          <Button 
                            variant="success" 
                            type="submit" 
                            className="w-100"
                            style={{ backgroundColor: colors.primary.main, borderColor: colors.primary.main }}
                          >
                            Add
                          </Button>
                      </div>
                  </div>
                  <Form.Text className="small" style={{ color: colors.text.secondary }}>
                      Username and password are auto-generated for ease, but you can edit them.
                  </Form.Text>
              </Form>
          </div>

          {/* CREDENTIALS ALERT */}
          {createdCreds && (
              <Alert 
                className="d-flex justify-content-between align-items-center"
                style={{ 
                    backgroundColor: colors.success.background, 
                    color: colors.success.main, 
                    borderColor: colors.success.main 
                }}
              >
                  <div>
                      <strong>User Created!</strong> Share details:<br/>
                      {/* UPDATED: Display name here as well for confirmation */}
                      Name: <span className="fw-bold" style={{ color: colors.text.primary }}>{createdCreds.n}</span> &nbsp;|&nbsp;
                      Username: <code className="fw-bold fs-6" style={{ color: colors.text.primary }}>{createdCreds.u}</code> &nbsp;|&nbsp; 
                      Password: <code className="fw-bold fs-6" style={{ color: colors.text.primary }}>{createdCreds.p}</code>
                  </div>
                  <Button 
                    variant="outline-success" 
                    size="sm" 
                    onClick={copyToClipboard}
                    style={{ 
                        color: copySuccess ? colors.success.main : colors.text.primary, 
                        borderColor: colors.success.main 
                    }}
                  >
                      {copySuccess ? <><Check/> Copied</> : <><Clipboard/> Copy info</>}
                  </Button>
              </Alert>
          )}

          {/* VOLUNTEER LIST */}
          <h6 className="fw-bold mt-4" style={{ color: colors.text.primary }}>Current Volunteers ({volunteers.length})</h6>
          <div className="table-responsive">
            <Table hover size="sm" className="align-middle mt-2">
                <thead style={{ backgroundColor: colors.ui.card }}>
                    <tr>
                        <th style={{ backgroundColor: colors.ui.card, color: colors.text.secondary }}>Name</th>
                        <th style={{ backgroundColor: colors.ui.card, color: colors.text.secondary }}>Username</th>
                        <th style={{ backgroundColor: colors.ui.card, color: colors.text.secondary }}>Status</th>
                        <th className="text-end" style={{ backgroundColor: colors.ui.card, color: colors.text.secondary }}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {volunteers.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-3" style={{ backgroundColor: colors.ui.background, color: colors.text.secondary }}>No volunteers assigned yet.</td></tr>
                    ) : (
                        volunteers.map(v => (
                            <tr key={v.id}>
                                <td style={{ backgroundColor: colors.ui.background, color: colors.text.primary }}>{v.name}</td>
                                <td style={{ backgroundColor: colors.ui.background }}>
                                    <Badge bg="light" text="dark" className="border" style={{ backgroundColor: colors.ui.card, color: colors.text.primary, borderColor: colors.ui.border }}>@{v.username}</Badge>
                                </td>
                                <td style={{ backgroundColor: colors.ui.background }}>
                                    <Badge bg="success" style={{ backgroundColor: colors.success.main }}>Active</Badge>
                                </td>
                                <td className="text-end" style={{ backgroundColor: colors.ui.background }}>
                                    <Button 
                                      variant="link" 
                                      className="p-0" 
                                      style={{ color: colors.error.main }}
                                      onClick={() => handleDelete(v.id, v.name)}
                                    >
                                        <Trash/>
                                    </Button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>
          </div>

        </Modal.Body>
      </Modal>

      {/* TOAST NOTIFICATION */}
      <ToastContainer 
        position="top-end" 
        className="p-3" 
        style={{ 
          zIndex: 9999,  
          position: 'fixed'  
        }}
      >
        <Toast 
            onClose={() => setShowToast(false)} 
            show={showToast} 
            delay={4000} 
            autohide 
            bg={toastVariant} 
        >
          <Toast.Header closeButton>
            <strong className="me-auto">
              {toastVariant === 'success' ? ' Success' : ' Error'}
            </strong>
          </Toast.Header>
          <Toast.Body className="text-white">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>

    </>
  );
};

export default VolunteerManagerModal;
