import React, { useEffect, useState } from 'react';
import { Modal, Button, Card, Row, Col, Table, ProgressBar, Spinner, Alert, Badge } from 'react-bootstrap';
import { BarChartFill, PeopleFill, Shop, ClockHistory, ChevronLeft, ChevronRight } from 'react-bootstrap-icons'; 
import { eventsApi } from '../services/api';
import { useTheme } from '../context/ThemeContext'; // 1. Import Theme Hook

interface EventStatsModalProps {
  show: boolean;
  onHide: () => void;
  eventId: number | null;
  eventName: string;
}

interface EventStats {
  total: number;
  byBatch: { batch: string; count: string }[];
  byCounter: { counter_name: string; count: string }[];
}

interface ScanLog {
  student_name: string;
  roll_number: string; 
  batch: string;
  counter_name: string;
  scanned_at: string;
}

const ITEMS_PER_PAGE = 50;

const EventStatsModal: React.FC<EventStatsModalProps> = ({ show, onHide, eventId, eventName }) => {
  const { colors } = useTheme(); // 2. Get dynamic colors
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false); 
  const [stats, setStats] = useState<EventStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // --- Pagination State ---
  const [scanHistory, setScanHistory] = useState<ScanLog[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // 1. Reset on open
  useEffect(() => {
    if (show && eventId) {
      setPage(1); 
      fetchOverallStats();
      fetchHistory(1); 
    }
  }, [show, eventId]);

  // 2. Fetch Graphs and Totals (Run once on open)
  const fetchOverallStats = async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const statsData = await eventsApi.getStats(eventId);
      setStats(statsData);
    } catch (err) {
      console.error(err);
      setError('Could not load statistics.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Fetch History Table (Runs on page change)
  const fetchHistory = async (pageNum: number) => {
    if (!eventId) return;
    setHistoryLoading(true);
    try {
      const offset = (pageNum - 1) * ITEMS_PER_PAGE;
      const data = await eventsApi.getScanHistory(eventId, ITEMS_PER_PAGE, offset);
      
      setScanHistory(data.scanHistory || []);
      setHasMore(data.hasMore); 
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      const newPage = page + 1;
      setPage(newPage);
      fetchHistory(newPage);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      const newPage = page - 1;
      setPage(newPage);
      fetchHistory(newPage);
    }
  };

  const formatScanTime = (timeStr: string) => {
    if (!timeStr) return '-';
    const standardDate = new Date(timeStr);
    if (!isNaN(standardDate.getTime()) && (timeStr.includes('T') || timeStr.includes('-'))) {
       return standardDate.toLocaleTimeString('en-IN', { 
           hour: '2-digit', 
           minute: '2-digit', 
           hour12: true, 
           timeZone: 'Asia/Kolkata' 
       });
    }
    return timeStr;
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton style={{ backgroundColor: colors.primary.main, color: '#fff' }}>
        <Modal.Title className="d-flex align-items-center">
          <BarChartFill className="me-2" />
          Analytics: {eventName}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ backgroundColor: colors.ui.background }}>
        {loading ? (
          <div className="text-center p-5">
            <Spinner animation="border" style={{ color: colors.primary.main }} />
            <p className="mt-2" style={{ color: colors.text.secondary }}>Loading Analytics...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : stats ? (
          <div>
            {/* 1. Total Served Card */}
            <Card className="mb-4 text-center border-0 shadow-sm" style={{ backgroundColor: colors.ui.card }}>
              <Card.Body className="py-4">
                <h6 className="text-uppercase fw-bold mb-2" style={{ color: colors.text.secondary, letterSpacing: '1px' }}>Total Students Served</h6>
                <h1 className="display-3 fw-bold mb-0" style={{ color: colors.success.main }}>{stats.total}</h1>
              </Card.Body>
            </Card>

            <Row className="g-4">
              {/* 2. Breakdown by Batch */}
              <Col md={6}>
                <Card className="h-100 border-0 shadow-sm" style={{ backgroundColor: colors.ui.card }}>
                  <Card.Header className="py-3 border-bottom-0" style={{ backgroundColor: colors.ui.card, color: colors.text.primary }}>
                    <PeopleFill className="me-2" style={{ color: colors.primary.main }} />
                    <span className="fw-bold">By Batch (Year)</span>
                  </Card.Header>
                  <Card.Body>
                    {stats.byBatch.length === 0 ? (
                      <p className="small text-center my-4" style={{ color: colors.text.secondary }}>No data yet.</p>
                    ) : (
                      stats.byBatch.map((item, idx) => {
                        const percent = stats.total > 0 ? (parseInt(item.count) / stats.total) * 100 : 0;
                        return (
                          <div key={idx} className="mb-3">
                            <div className="d-flex justify-content-between small fw-bold mb-1" style={{ color: colors.text.primary }}>
                              <span>Batch {item.batch || 'Unknown'}</span>
                              <span>{item.count}</span>
                            </div>
                            <ProgressBar 
                              now={percent} 
                              // Use custom color if needed, or stick to bootstrap variants if they look ok
                              variant="info" 
                              style={{ height: '6px', borderRadius: '10px' }} 
                            />
                          </div>
                        );
                      })
                    )}
                  </Card.Body>
                </Card>
              </Col>

              {/* 3. Breakdown by Counter */}
              <Col md={6}>
                <Card className="h-100 border-0 shadow-sm" style={{ backgroundColor: colors.ui.card }}>
                  <Card.Header className="py-3 border-bottom-0" style={{ backgroundColor: colors.ui.card, color: colors.text.primary }}>
                    <Shop className="me-2" style={{ color: colors.warning.main }} />
                    <span className="fw-bold">By Counter</span>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <Table hover borderless className="mb-0 align-middle">
                      <thead style={{ backgroundColor: colors.ui.background }}>
                        <tr>
                          <th className="ps-3 fw-normal" style={{ color: colors.text.secondary, backgroundColor: colors.ui.background }}>Counter Name</th>
                          <th className="text-end pe-3 fw-normal" style={{ color: colors.text.secondary, backgroundColor: colors.ui.background }}>Served</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.byCounter.length === 0 ? (
                          <tr><td colSpan={2} className="text-center small py-4" style={{ color: colors.text.secondary }}>No data yet.</td></tr>
                        ) : (
                          stats.byCounter.map((item, idx) => (
                            <tr key={idx}>
                              <td className="ps-3 fw-semibold" style={{ color: colors.text.primary, backgroundColor: colors.ui.card }}>{item.counter_name}</td>
                              <td className="text-end pe-3 fw-bold" style={{ color: colors.success.main, backgroundColor: colors.ui.card }}>{item.count}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* 4. Scan History with Pagination */}
            <Card className="mt-4 border-0 shadow-sm" style={{ backgroundColor: colors.ui.card }}>
              <Card.Header className="py-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: colors.ui.card, color: colors.text.primary }}>
                <span className="fw-bold">
                  <ClockHistory className="me-2" style={{ color: colors.text.secondary }} />
                  Scan History
                </span>
                <Badge bg="light" text="dark" className="border">
                    Page {page}
                </Badge>
              </Card.Header>
              
              <Card.Body className="p-0" style={{ minHeight: '200px' }}>
                {historyLoading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" size="sm" style={{ color: colors.primary.main }}/>
                    </div>
                ) : scanHistory.length === 0 ? (
                    <div className="text-center py-5 small" style={{ color: colors.text.secondary }}>No records found.</div>
                ) : (
                    <Table hover borderless className="mb-0 align-middle">
                    <thead style={{ backgroundColor: colors.ui.background }}>
                        <tr>
                        <th className="ps-3" style={{ backgroundColor: colors.ui.background, color: colors.text.primary }}>Name</th>
                        <th style={{ backgroundColor: colors.ui.background, color: colors.text.primary }}>Roll No</th>
                        <th style={{ backgroundColor: colors.ui.background, color: colors.text.primary }}>Batch</th>
                        <th style={{ backgroundColor: colors.ui.background, color: colors.text.primary }}>Counter</th>
                        <th style={{ backgroundColor: colors.ui.background, color: colors.text.primary }}>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scanHistory.map((scan, idx) => (
                        <tr key={idx}>
                            <td className="ps-3 fw-medium" style={{ backgroundColor: colors.ui.card, color: colors.text.primary }}>{scan.student_name}</td>
                            <td className="small" style={{ backgroundColor: colors.ui.card, color: colors.text.secondary }}>{scan.roll_number}</td>
                            <td style={{ backgroundColor: colors.ui.card }}><span className="badge border" style={{ backgroundColor: colors.ui.background, color: colors.text.primary, borderColor: colors.ui.border }}>{scan.batch}</span></td>
                            <td style={{ backgroundColor: colors.ui.card, color: colors.text.primary }}>{scan.counter_name}</td>
                            <td className="small" style={{ backgroundColor: colors.ui.card, color: colors.text.secondary }}>{formatScanTime(scan.scanned_at)}</td>
                        </tr>
                        ))}
                    </tbody>
                    </Table>
                )}
              </Card.Body>

              {/* PAGINATION FOOTER */}
              <Card.Footer className="border-top-0 py-3" style={{ backgroundColor: colors.ui.card }}>
                  <div className="d-flex justify-content-between align-items-center">
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        onClick={handlePrevPage} 
                        disabled={page === 1 || historyLoading}
                        style={{ color: colors.text.primary, borderColor: colors.ui.border }}
                      >
                          <ChevronLeft className="me-1"/> Previous
                      </Button>
                      
                      <small style={{ color: colors.text.secondary }}>
                        Showing {(page - 1) * ITEMS_PER_PAGE + 1} - {(page - 1) * ITEMS_PER_PAGE + scanHistory.length}
                      </small>

                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        onClick={handleNextPage} 
                        disabled={!hasMore || historyLoading}
                        style={{ color: colors.text.primary, borderColor: colors.ui.border }}
                      >
                          Next <ChevronRight className="ms-1"/>
                      </Button>
                  </div>
              </Card.Footer>
            </Card>

          </div>
        ) : (
          <Alert variant="info">No statistics available for this event yet.</Alert>
        )}
      </Modal.Body>
      <Modal.Footer className="border-top-0" style={{ backgroundColor: colors.ui.background }}>
        <Button variant="outline-secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EventStatsModal;