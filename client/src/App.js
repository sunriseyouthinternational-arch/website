import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import './App.css';

// Pages
import Login from './pages/Login';
import MemberPortal from './pages/MemberPortal';
import CheckoutPage from './components/checkout/CheckoutPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import CouponClaim from './pages/CouponClaim';

function AppContent() {
  return (
    <Router>
      <div className="App">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/member" element={<MemberPortal />} />
            <Route path="/checkout/:itemType/:itemId" element={<CheckoutPage />} />
            <Route path="/claim" element={<CouponClaim />} />
            <Route path="/claim/:token" element={<CouponClaim />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
