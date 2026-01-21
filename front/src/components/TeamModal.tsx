import React from 'react';
import { Modal, Row, Col, Card } from 'react-bootstrap';
import { Github, Linkedin, EnvelopeAt, Telephone, CodeSlash } from 'react-bootstrap-icons';
import { useTheme } from '../context/ThemeContext';

interface TeamModalProps {
  show: boolean;
  onHide: () => void;
}

const teamMembers = [
  {
    name: "Konathala Srivathsa",
    role: "Coordinator",
    image: "/team/srivatsa.png", 
    github: "https://github.com/ksrivathsa2005-hub",
    linkedin: "https://www.linkedin.com/in/srivathsa252/",
    email: "srivathsa22bcd20@iiitkottayam.ac.in",
    phone: "+91 9014004375" 
  },
  {
    name: "Ebin Thomas",
    role: "Development Team",
    image: "/team/ebin.jpeg", 
    github: "https://github.com/ebinthomas06",
    linkedin: "https://linkedin.com/in/ebin-thomas-4a7452326",
    email: "ebinthomas24bcs99@iiitkottayam.ac.in",
    phone: "+91 6282158026" 
  },
  {
    name: "Sanjay S Subramaniam",
    role: "Development Team",
    image: "/team/sanjay.png", 
    github: "https://github.com/sanjay-was-taken",
    linkedin: "https://linkedin.com/in/sanjay-s-subramaniam-778233324",
    email: "sanjaysubramaniam24bec18@iiitkottayam.ac.in",
    phone: "+91 9633892730" 
  },
  {
    name: "Nived Narayan",
    role: "Development Team",
    image: "/team/nived.jpeg", 
    github: "https://github.com/nivednarayan",
    linkedin: "https://linkedin.com/in/nived-narayan",
    email: "nivednarayan24bcd25@iiitkottayam.ac.in",
    phone: "+91 9746043620" 
  },
];

// Helper Component for consistent cards
const MemberCard: React.FC<{ member: typeof teamMembers[0], colors: any }> = ({ member, colors }) => {
    // Helper to handle image load errors
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, githubUrl: string) => {
        e.currentTarget.src = `${githubUrl}.png`; 
    };

    return (
        <Card 
            className="h-100 border-0 shadow-sm"
            style={{ 
              backgroundColor: colors.ui.background, 
              border: `1px solid ${colors.ui.border}` 
            }}
          >
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                
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
                  {/* Role label removed as per request, since section header handles it */}
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
    );
};

const TeamModal: React.FC<TeamModalProps> = ({ show, onHide }) => {
  const { colors, mode } = useTheme();

  const coordinators = teamMembers.filter(m => m.role === 'Coordinator');
  const developers = teamMembers.filter(m => m.role === 'Development Team');

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

        {/* --- COORDINATOR SECTION --- */}
        <h5 className="mb-3 fw-bold border-bottom pb-2" style={{ color: colors.primary.main, borderColor: colors.ui.border }}>
            Coordinator
        </h5>
        <Row className="g-3 mb-4">
          {coordinators.map((member, idx) => (
            <Col key={idx} md={12}> {/* Full width for single coordinator usually looks better */}
               <MemberCard member={member} colors={colors} />
            </Col>
          ))}
        </Row>

        {/* --- DEVELOPER SECTION --- */}
        <h5 className="mb-3 fw-bold border-bottom pb-2" style={{ color: colors.primary.main, borderColor: colors.ui.border }}>
            Dev Team
        </h5>
        <Row className="g-3">
          {developers.map((member, idx) => (
            <Col key={idx} md={6}>
               <MemberCard member={member} colors={colors} />
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
