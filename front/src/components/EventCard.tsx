import React from 'react';
import { Card } from 'react-bootstrap';
import { CalendarEvent, Clock } from 'react-bootstrap-icons';
import QrButton from './common/QrButton'; 
import { useTheme } from '../context/ThemeContext'; 

export interface EventData {
  id: string;
  title: string;
  description: string;
  validDate: string;
  assignedSlot?: {
    floor: string;
    time: string;
  };
  registrationStatus?: 'not_registered' | 'registered' | 'served';
  servedAt?: string | null; 
}

interface EventCardProps {
  event: EventData;
  onGetQR: (eventId: string) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onGetQR }) => {
  const { colors, mode } = useTheme(); 
  
  // Helper to format the served time
  const getServedTimeStr = (timeStr?: string | null) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return ''; 
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' , hour12: true }).replace(' ', '\u00A0');
  };

  // --- STYLE CONFIGURATION ---
  const timeBoxStyle = {
    // Background: Mint for light mode, Dark Green for dark mode
    backgroundColor: mode === 'light' ? '#e8f5e9' : colors.success.background,
    
    // Text: Dark Green (#198754) for light, Theme Success for dark
    color: mode === 'light' ? '#198754' : colors.success.main,
    
    // Border: Lighter opacity to match the 'Served' box
    // Light Mode: #198754 with 50% opacity
    // Dark Mode: Theme Success color with 50% opacity
    border: mode === 'light' 
      ? '1px solid rgba(25, 135, 84, 0.5)' 
      : `1px solid ${colors.success.main}80` 
  };

  return (
    <Card 
      className="shadow-sm mb-3 h-100" 
      style={{ 
        borderRadius: '15px', 
        backgroundColor: colors.ui.card, 
        border: `1px solid ${colors.ui.border}` 
      }}
    >
      <Card.Body className="p-4 d-flex flex-column">
        
        {/* Title */}
        <Card.Title className="h5 fw-bold mb-2" style={{ color: colors.text.primary }}>
          {event.title}
        </Card.Title>
        
        {/* Description */}
        <Card.Text className="small mb-3" style={{ color: colors.text.secondary }}>
          {event.description}
        </Card.Text>
        
        {/* Date Info */}
        <div className="d-flex align-items-center small mb-3" style={{ color: colors.text.secondary }}>
          <CalendarEvent className="me-2" />
          <span>Valid: {event.validDate}</span>
        </div>

        {/* TIME SLOT BOX */}
        {event.assignedSlot && (
          <div 
            className="mt-auto mb-3 p-3 rounded" 
            style={{ 
                backgroundColor: timeBoxStyle.backgroundColor, 
                border: timeBoxStyle.border 
            }}
          >
            <div 
                className="d-flex align-items-center fw-bold" 
                style={{ fontSize: '0.9rem', color: timeBoxStyle.color }}
            >
              <Clock className="me-2" style={{ color: timeBoxStyle.color }} /> 
              {event.assignedSlot.time}
            </div>
          </div>
        )}
        
        {/* Button Section */}
        <div className="mt-auto">
          {(() => {
            if (event.registrationStatus === 'served') {
              const timeStr = getServedTimeStr(event.servedAt);
              const buttonText = timeStr 
                ? `You have been served at ${timeStr}` 
                : "You have been served";

              return (
                <QrButton 
                  text={buttonText} 
                  onClick={() => {}} 
                  variant="claimed"
                  disabled={true}
                />
              );
            } else if (event.registrationStatus === 'registered' || event.assignedSlot) {
              return (
                <QrButton 
                  text="Show QR Code" 
                  onClick={() => onGetQR(event.id)}
                  variant="show"
                />
              );
            } else {
              return (
                <QrButton 
                  text=" Register and show QR Code" 
                  onClick={() => onGetQR(event.id)}
                  variant="get"
                />
              );
            }
          })()}
        </div>

      </Card.Body>
    </Card>
  );
};

export default EventCard;
