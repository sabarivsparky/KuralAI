import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import NewComplaintPage from "./pages/NewComplaintPage";
import ComplaintsPage from "./pages/ComplaintsPage";
import ComplaintDetailPage from "./pages/ComplaintDetailPage";
import TrackingPage from "./pages/TrackingPage";
import AccountPage from "./pages/AccountPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public standalone pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Unified application shell layout routes */}
          <Route element={<AppLayout />}>
            {/* Track Complaint: Available publicly and authenticated inside the shared shell */}
            <Route path="/track" element={<TrackingPage />} />

            {/* Authenticated app shell layout routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/complaints" element={<ComplaintsPage />} />

              {/* Multimodal Reporting Routes */}
              <Route path="/complaints/new" element={<NewComplaintPage />} />
              <Route path="/complaints/new/text" element={<NewComplaintPage />} />
              <Route path="/complaints/new/voice" element={<NewComplaintPage />} />
              <Route path="/complaints/new/photo" element={<NewComplaintPage />} />

              <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
              <Route path="/account" element={<AccountPage />} />
            </Route>
          </Route>

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
