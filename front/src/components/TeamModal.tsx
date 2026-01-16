import React from 'react';
import { Modal, Row, Col, Card } from 'react-bootstrap';
import { Github, Linkedin, EnvelopeAt, Telephone, CodeSlash } from 'react-bootstrap-icons';
import { useTheme } from '../context/ThemeContext';

interface TeamModalProps {
  show: boolean;
  onHide: () => void;
}

// FIX: Updated extensions to .jpeg to match your file explorer
const teamMembers = [
  {
    name: "Ebin Thomas",
    role: "Frontend",
    image: "/team/ebin.jpeg", // CHANGED .jpg -> .jpeg
    github: "https://github.com/ebinthomas06",
    linkedin: "https://linkedin.com/in/ebin-thomas-4a7452326",
    email: "ebinthomas24bcs99@iiitkottayam.ac.in",
    phone: "+91 6282158026" 
  },
  {
    name: "Sanjay S",
    role: "Backend",
    image: "/team/sanjay.jpeg", // CHANGED .jpg -> .jpeg
    github: "https://github.com/sanjay-was-taken",
    linkedin: "https://linkedin.com/in/sanjay-s-subramaniam-778233324",
    email: "sanjaysubramaniam24bec18@iiitkottayam.ac.in",
    phone: "+91 9633892730" 
  },
  {
    name: "Nived Narayan",
    role: "DevOps & Deployment",
    image: "/team/nived.jpeg", // CHANGED .jpg -> .jpeg
    github: "https://github.com/nivednarayan",
    linkedin: "https://linkedin.com/in/nived-narayan",
    email: "nivednarayan24bcd25@iiitkottayam.ac.in",
    phone: "+91 9746043620" 
  },
];

const TeamModal: React.FC<TeamModalProps> = ({ show, onHide }) => {
  const { colors, mode } = useTheme();

  // Helper to handle image load errors (Fall back to GitHub if local file missing)
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, githubUrl: string) => {
    e.currentTarget.src = `${githubUrl}.png`; 
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="lg" 
      centered
      contentClassName={mode === 'dark' ? 'bg-dark text-white border-secondary' : ''}
    >
      <Modal.Header 
        closeButton 
        closeVariant={mode === 'dark' ? 'white' : undefined} 
        className="border-0 pb-0 justify-content-center position-relative"
      >
        <div className="w-100 text-center">
            <Modal.Title className="d-flex align-items-center justify-content-center fw-bold">
            <CodeSlash className="me-2 text-primary" size={24} />
            Contact for Bug Fixes & Support
            </Modal.Title>
        </div>
      </Modal.Header>

      <Modal.Body className="pb-4">
        <p className="text-center mb-4" style={{ color: colors.text.secondary }}>
          Found a bug or facing issues? Reach out to the team below.
        </p>

        <Row className="g-3">
          {teamMembers.map((member, idx) => (
            <Col key={idx} md={6}>
              <Card 
                className="h-100 border-0 shadow-sm"
                style={{ 
                  backgroundColor: colors.ui.background, 
                  border: `1px solid ${colors.ui.border}` 
                }}
              >
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    
                    {/* Image with Fallback Logic */}
                    <img 
                      src={member.image} 
                      alt={member.name}
                      onError={(e) => handleImageError(e, member.github)} 
                      className="rounded-circle me-3"
                      style={{ 
                        width: '60px', 
                        height: '60px', 
                        objectFit: 'cover', 
                        border: `2px solid ${colors.primary.main}`, 
                        backgroundColor: colors.ui.background
                      }}
                    />

                    <div className="flex-grow-1">
                      <h6 className="mb-0 fw-bold" style={{ color: colors.text.primary }}>{member.name}</h6>
                      <small className="fw-semibold" style={{ color: colors.primary.main }}>{member.role}</small>
                    </div>
                    
                    <div className="d-flex gap-2 ms-auto align-self-start">
                        {member.linkedin && (
                        <a href={member.linkedin} target="_blank" rel="noreferrer" className="text-decoration-none" style={{ color: colors.text.secondary }}>
                            <Linkedin size={18} />
                        </a>
                        )}
                        {member.github && (
                        <a href={member.github} target="_blank" rel="noreferrer" className="text-decoration-none" style={{ color: colors.text.secondary }}>
                            <Github size={18} />
                        </a>
                        )}
                    </div>
                  </div>

                  <div className="d-flex flex-column gap-2 ps-1">
                    {member.email && (
                        <div className="d-flex align-items-center" style={{ fontSize: '0.9rem' }}>
                            <EnvelopeAt size={16} className="me-2" style={{ color: colors.text.secondary }}/>
                            <a href={`mailto:${member.email}`} className="text-decoration-none text-truncate" style={{ color: colors.text.primary }}>
                                {member.email}
                            </a>
                        </div>
                    )}
                    
                    {member.phone && (
                        <div className="d-flex align-items-center" style={{ fontSize: '0.9rem' }}>
                            <Telephone size={16} className="me-2" style={{ color: colors.text.secondary }}/>
                            <a href={`tel:${member.phone}`} className="text-decoration-none" style={{ color: colors.text.primary }}>
                                {member.phone}
                            </a>
                        </div>
                    )}
                  </div>

                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Modal.Body>

      <Modal.Footer className="border-0 justify-content-center">
        <small style={{ color: colors.text.disabled }}>
          © {new Date().getFullYear()} IIIT Kottayam
        </small>
      </Modal.Footer>
    </Modal>
  );
};

export default TeamModal;
