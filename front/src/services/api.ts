const API_BASE_URL = '/api';

// Helper to handle headers and errors
const request = async (endpoint: string, options: RequestInit = {}, retries = 2) => {
const token = localStorage.getItem('coupon_app_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  } as HeadersInit;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // changed from 10000 to 4000
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Request Failed`);
      }

      return data;
    } catch (err: any) {
      if (attempt === retries) {
        if (err.name === 'AbortError') {
          throw new Error('Request timeout - please try again');
        }
        throw new Error(err.message || 'Network error - please check your connection');
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
};

// ==========================================
// 2. AUTH API
// ==========================================
export const authApi = {
  login: (credentials: { username: string; password?: string }) => 
    request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),

  googleLogin: (token: string) => 
    request('/auth/google', { method: 'POST', body: JSON.stringify({ token }) }),

  // Add this new method
  volunteerLogin: (credentials: { username: string; password: string }) => 
    request('/auth/volunteer-login', { method: 'POST', body: JSON.stringify(credentials) }),
};


// ==========================================
// 3. EVENTS API (Admin & Shared)
// ==========================================
export const eventsApi = {
  getAll: () => 
    request('/events'),

  create: (eventData: any) => 
    request('/events', { method: 'POST', body: JSON.stringify(eventData) }),

  update: (id: number, eventData: any) => 
    request(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(eventData) }),

  delete: (id: number) => 
    request(`/events/${id}`, { method: 'DELETE' }),

  createSlots: (eventId: number, slotData: any) => 
    request(`/events/${eventId}/slots`, { method: 'POST', body: JSON.stringify(slotData) }),
  
  getScanHistory: (eventId: number, limit: number = 50, offset: number = 0) => 
    request(`/events/${eventId}/scan-history?limit=${limit}&offset=${offset}`),

  getVolunteerScanHistory: (eventId: number, volunteerId: number) => 
    request(`/events/${eventId}/scan-history/volunteer/${volunteerId}`),
    

  // Stats
  getStats: (eventId: number) => 
    request(`/events/${eventId}/stats`),
    
  getVolunteerStats: (eventId: number, volunteerId: number) => 
    request(`/events/${eventId}/stats/volunteer/${volunteerId}`),

  // ⚠️ UPDATED: This now fetches ALL events (Past + Active)
  // The DashboardPage will filter them based on date/time.
  getActiveForStudent: (studentId: number) => 
    request(`/events/student/${studentId}/all`),

  getVolunteers: (eventId: number) => 
    request(`/events/${eventId}/volunteers`),

  getAllForStudent: (studentId: number) => 
    request(`/events/all-for-student?student_id=${studentId}`),

  addVolunteer: (eventId: number, data: any) => 
    request(`/events/${eventId}/volunteers`, { method: 'POST', body: JSON.stringify(data) }),

  deleteVolunteer: (volunteerId: number) => 
  request(`/events/volunteers/${volunteerId}`, { method: 'DELETE' }),


getEventSlots: (eventId: number) => 
    request(`/events/${eventId}/slots`),

  updateVolunteerAssignment: (volunteerId: number, assignment: { floor: string; counter: string }) => 
    request(`/events/volunteers/${volunteerId}/assignment`, { 
      method: 'PATCH', 
      body: JSON.stringify(assignment) 
    }),
  
};

// ==========================================
// 4. REGISTRATION / SCANNER API
// ==========================================
export const registrationApi = {
  scan: async (qrToken: string, volunteerId: number) => {
    try {
      return await request('/registrations/scan', { 
        method: 'POST', 
        body: JSON.stringify({ qr_token: qrToken, volunteer_id: volunteerId }) 
      });
    } catch (err: any) {
      // Enhanced error messages
      if (err.message.includes('already served')) {
        throw new Error('This student has already been served');
      }
      if (err.message.includes('Invalid QR')) {
        throw new Error('Invalid QR code - please try scanning again');
      }
      throw err;
    }
  },

  register: (studentId: number, eventId: number) => 
    request('/registrations', { 
        method: 'POST', 
        body: JSON.stringify({ student_id: studentId, event_id: eventId }) 
    }),
};
