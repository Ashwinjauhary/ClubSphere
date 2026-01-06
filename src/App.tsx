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

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/clubs" element={<ClubsPage />} />
              <Route path="/clubs/new" element={<CreateClubPage />} />
              <Route path="/clubs/:id" element={<ClubDetailPage />} />
              <Route path="/clubs/:id/edit" element={<EditClubPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
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
              <Route path="/events/new" element={<CreateEventPage />} />
              <Route path="/members" element={<ClubMembersPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              {/* Add other protected routes here */}
            </Route>
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
