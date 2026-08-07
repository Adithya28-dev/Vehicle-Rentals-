import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VehicleList from './pages/VehicleList';
import VehicleDetail from './pages/VehicleDetail';
import Booking from './pages/Booking';
import Payment from './pages/Payment';
import BookingConfirmation from './pages/BookingConfirmation';
import BookingHistory from './pages/BookingHistory';
import AdminDashboard from './pages/AdminDashboard';
import ManageVehicles from './pages/ManageVehicles';
import ManageBookings from './pages/ManageBookings';
import ManagePayments from './pages/ManagePayments';
import ManageLocations from './pages/ManageLocations';
import Profile from './pages/Profile';
import Calendar from './pages/Calendar';
import Settings from './pages/Settings';
import AdminSupport from './pages/AdminSupport';

// Layouts
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SupportChat from './components/SupportChat';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="spinner"/><p>Loading...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="spinner"/></div>;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
}

function AppLayout({ children }) {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  useEffect(() => {
    document.body.className = theme === 'light' ? 'light' : '';
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isAuthPage && <Navbar theme={theme} setTheme={setTheme} />}
      <div style={{ flex: 1 }}>
        {children}
      </div>
      {!isAuthPage && <SupportChat />}
      {!isAuthPage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#F9FAFB',
              border: '1px solid rgba(124,58,237,0.3)',
              borderRadius: '12px',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />

        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* User routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout><Dashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/vehicles" element={
            <ProtectedRoute>
              <AppLayout><VehicleList /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/vehicles/:id" element={
            <ProtectedRoute>
              <AppLayout><VehicleDetail /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/booking/:vehicleId" element={
            <ProtectedRoute>
              <AppLayout><Booking /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/payment/:bookingId" element={
            <ProtectedRoute>
              <AppLayout><Payment /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/booking-confirmation/:bookingId" element={
            <ProtectedRoute>
              <AppLayout><BookingConfirmation /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/bookings" element={
            <ProtectedRoute>
              <AppLayout><BookingHistory /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <AppLayout><Profile /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <AppLayout><Calendar /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <AppLayout><Settings /></AppLayout>
            </ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AppLayout><AdminDashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/vehicles" element={
            <ProtectedRoute adminOnly>
              <AppLayout><ManageVehicles /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/bookings" element={
            <ProtectedRoute adminOnly>
              <AppLayout><ManageBookings /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/payments" element={
            <ProtectedRoute adminOnly>
              <AppLayout><ManagePayments /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/locations" element={
            <ProtectedRoute adminOnly>
              <AppLayout><ManageLocations /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/support" element={
            <ProtectedRoute adminOnly>
              <AppLayout><AdminSupport /></AppLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
