import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import StaffPage from './pages/StaffPage'; 
import Navbar from './components/Navbar'; 
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import StaffLoginPage from './pages/StaffLoginPage';

function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar /> 
      
      <main className="flex-grow-1">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/staff-access" element={<StaffLoginPage />} />
          
          {/* 1. STUDENT ONLY */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
             <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
          
          {/* 2. ADMIN ONLY (This is the Gatekeeper) */}
          {/* If a 'student' tries to go here, ProtectedRoute blocks them */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
             <Route path="/admin" element={<AdminPage />} />
          </Route>
          
          {/* 3. STAFF/VOLUNTEER ONLY */}
          {/* We allow 'admin' here too, so admins can test scanning */}
          <Route element={<ProtectedRoute allowedRoles={['volunteer', 'admin']} />}>
             <Route path="/staff" element={<StaffPage />} />
          </Route>
          
          <Route path="/" element={<LoginPage />} /> 
        </Routes>
      </main>

      <Footer /> 
    </div>
  )
}

export default App;