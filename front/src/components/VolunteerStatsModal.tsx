import React, { useEffect, useState } from 'react';
import { Modal, Button, Card, ProgressBar, Spinner, Alert } from 'react-bootstrap';
import { BarChartFill, PeopleFill } from 'react-bootstrap-icons';
import { useAuth } from '../context/AuthContext';
import { eventsApi } from '../services/api';
import { useTheme } from '../context/ThemeContext'; // 1. Import Theme Hook

interface VolunteerStatsModalProps {
  show: boolean;
  onHide: () => void;
  eventId: number | null;
  eventName: string;
}

interface VolunteerStats {
  total: number;
  byBatch: { batch: string; count: string }[];
}

const VolunteerStatsModal: React.FC<VolunteerStatsModalProps> = ({ show, onHide, eventId, eventName }) => {
  const { user } = useAuth();
  const { colors } = useTheme(); // 2. Get dynamic colors
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<VolunteerStats | null>(null);

  useEffect(() => {
    if (show && eventId && user) {
      fetchStats();
    }
  }, [show, eventId, user]);


  const fetchStats = async () => {
    setLoading(true);
    try {
      if (!eventId) return;

      // Get the correct volunteer ID (for volunteers, use 'id' not 'user_id')
      const volunteerUser = user as any;
      const volunteerId = volunteerUser?.id || volunteerUser?.user_id;
      
      if (!volunteerId) {
        console.error('No volunteer ID found');
        return;
      }

      // API CALL: Use the volunteer ID
      const data = await eventsApi.getVolunteerStats(eventId, volunteerId);
      setStats(data);
    } catch (err) {
      console.error('❌ Volunteer stats error:', err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton style={{ backgroundColor: colors.primary.main, color: '#fff' }}>
        <Modal.Title className="h5"><BarChartFill className="me-2"/>My Stats: {eventName}</Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ backgroundColor: colors.ui.background }}>
        {loading ? (
          <div className="text-center p-4">
              <Spinner animation="border" style={{ color: colors.primary.main }} />
          </div>
        ) : stats ? (
          <div>
            {/* Total Count */}
            <Card className="mb-3 text-center border-0 shadow-sm" style={{ backgroundColor: colors.ui.card }}>
                <Card.Body>
                    <h6 className="text-uppercase small" style={{ color: colors.text.secondary }}>Total Served by You</h6>
                    <h1 className="display-4 fw-bold" style={{ color: colors.primary.main }}>{stats.total}</h1>
                </Card.Body>
            </Card>

            {/* Batch Breakdown */}
            <Card className="border-0 shadow-sm" style={{ backgroundColor: colors.ui.card }}>
                <Card.Header className="fw-bold" style={{ backgroundColor: colors.ui.card, color: colors.text.primary }}>
                    <PeopleFill className="me-2" style={{ color: colors.primary.main }}/>
                    Batch Breakdown
                </Card.Header>
                <Card.Body>
                    {stats.byBatch.length === 0 ? (
                        <p className="small" style={{ color: colors.text.secondary }}>No scans yet.</p>
                    ) : (
                        stats.byBatch.map((item, idx) => (
                            <div key={idx} className="mb-2">
                                <div className="d-flex justify-content-between small fw-bold mb-1" style={{ color: colors.text.primary }}>
                                    <span>Batch {item.batch}</span>
                                    <span>{item.count}</span>
                                </div>
                                <ProgressBar 
                                    now={(parseInt(item.count) / stats.total) * 100} 
                                    style={{ height: '6px' }} 
                                    // You can use a standard variant or custom color if needed
                                    variant="info" 
                                />
                            </div>
                        ))
                    )}
                </Card.Body>
            </Card>
          </div>
        ) : (
          <Alert variant="warning">Could not load stats.</Alert>
        )}
      </Modal.Body>
      <Modal.Footer style={{ backgroundColor: colors.ui.card }}>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default VolunteerStatsModal;