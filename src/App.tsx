import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ScrollToTop } from './components/ScrollToTop';
import { LandingPage } from './pages/LandingPage';

import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ClubsPage } from './pages/ClubsPage';
import { ClubDetailPage } from './pages/ClubDetailPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';

import { AIReportStudioPage } from './pages/AIReportStudioPage';
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


function App() {
  const checkUser = useAuthStore((state) => state.checkUser);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
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

              <Route path="/reports/ai-studio" element={<AIReportStudioPage />} />
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
