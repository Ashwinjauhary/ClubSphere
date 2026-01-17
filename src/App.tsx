import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ScrollToTop } from './components/ScrollToTop';
import { Toaster } from 'sonner';
import { LandingPage } from './pages/LandingPage';

import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ClubsPage } from './pages/ClubsPage';
import { ClubDetailPage } from './pages/ClubDetailPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';


import { FormsListPage } from './pages/FormsListPage';
import { FormBuilderPage } from './pages/FormBuilderPage';
import { FormViewerPage } from './pages/FormViewerPage';
import { FormStatsPage } from './pages/FormStatsPage';
import { CreateEventPage } from './pages/CreateEventPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { SubmitReportPage } from './pages/SubmitReportPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';

import { CreateClubPage } from './pages/CreateClubPage';
import { EditClubPage } from './pages/EditClubPage';
import { ClubApplicationsPage } from './pages/ClubApplicationsPage';
import { ClubMembersPage } from './pages/ClubMembersPage';
import { ProfilePage } from './pages/ProfilePage';
import { ReportsPage } from './pages/ReportsPage';
import { ProposalsPage } from './pages/ProposalsPage';
import { EditEventPage } from './pages/EditEventPage';
import { ClubsWallPage } from './pages/ClubsWallPage';
import { ClubHighlightsPage } from './pages/ClubHighlightsPage';
import { SuperAdminPage } from './pages/SuperAdminPage';
import { GalleryManagementPage } from './pages/GalleryManagementPage';
import { EventScannerPage } from './pages/EventScannerPage';
import { FeedbackFormPage } from './pages/FeedbackFormPage';
import { FeedbackFormBuilderPage } from './pages/FeedbackFormBuilderPage';
import { EventFeedbackStatsPage } from './pages/EventFeedbackStatsPage';
import { QRScannerFormPage } from './pages/QRScannerFormPage';
import { EventRegistrationPage } from './pages/EventRegistrationPage';
import { EventMediaPage } from './pages/EventMediaPage';


function App() {
  const checkUser = useAuthStore((state) => state.checkUser);

  // Synchronous check for recovery hash to prevent LandingPage race condition
  const hash = window.location.hash;
  if (hash && hash.includes('type=recovery') && !window.location.pathname.includes('/reset-password')) {
    // Redirect to reset password page - preserving the hash
    window.location.href = '/reset-password' + hash;
    return null;
  }

  useEffect(() => {
    checkUser();

    // Listen for password recovery event
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        if (!window.location.pathname.includes('/reset-password')) {
          window.location.href = '/reset-password';
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [checkUser]);

  return (
    <Router>
      <Toaster position="top-right" richColors toastOptions={{ className: 'mt-14 sm:mt-0' }} />
      <ScrollToTop />
      <div className="min-h-screen bg-transparent text-gray-900 font-sans">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/f/:id" element={<FormViewerPage />} /> {/* Public Form Link */}

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/clubs" element={<ClubsPage />} />
              <Route path="/clubs/new" element={<CreateClubPage />} />
              <Route path="/clubs/:id" element={<ClubDetailPage />} />
              <Route path="/clubs/:id/edit" element={<EditClubPage />} />
              <Route path="/clubs/:id/gallery" element={<GalleryManagementPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/events/:id/scan" element={<EventScannerPage />} />
              <Route path="/events/:eventId/register" element={<EventRegistrationPage />} />
              <Route path="/events/:id/media" element={<EventMediaPage />} />
              <Route path="/events/:id/feedback" element={<FeedbackFormPage />} />
              <Route path="/events/:eventId/feedback-builder" element={<FeedbackFormBuilderPage />} />
              <Route path="/events/:id/feedback-stats" element={<EventFeedbackStatsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/analysis" element={<AnalyticsPage />} />
              <Route path="/reports/submit" element={<SubmitReportPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/approvals" element={<ApprovalsPage />} />
              <Route path="/applications" element={<ClubApplicationsPage />} /> {/* New Route */}

              {/* Admin Routes */}
              <Route path="/proposals" element={<ProposalsPage />} />
              <Route path="/proposals/:id/edit" element={<EditEventPage />} />
              <Route path="/wall" element={<ClubsWallPage />} />


              <Route path="/clubs/:id/highlights" element={<ClubHighlightsPage />} />

              {/* AI Forms System */}
              <Route path="/forms" element={<FormsListPage />} />
              <Route path="/forms/new" element={<FormBuilderPage />} />
              <Route path="/forms/:id/edit" element={<FormBuilderPage />} />
              <Route path="/forms/:id/stats" element={<FormStatsPage />} />
              <Route path="/scan-form" element={<QRScannerFormPage />} />

              <Route path="/events/new" element={<CreateEventPage />} />
              <Route path="/members" element={<ClubMembersPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/super-admin" element={<SuperAdminPage />} />
              {/* Add other protected routes here */}
            </Route>
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
