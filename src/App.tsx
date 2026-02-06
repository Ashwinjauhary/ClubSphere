import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { ScrollToTop } from './components/ScrollToTop';
import { Toaster } from 'sonner';
import { SEO } from './components/SEO';
import { useEffect, lazy, Suspense } from 'react';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CircularProgress, Box } from '@mui/material';

// Eager load Landing Page for best FCP
import { LandingPage } from './pages/LandingPage';

// Lazy Load Layouts & Pages with Named Exports
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout').then(module => ({ default: module.DashboardLayout })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(module => ({ default: module.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(module => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(module => ({ default: module.ResetPasswordPage })));
const FormViewerPage = lazy(() => import('./pages/FormViewerPage').then(module => ({ default: module.FormViewerPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })));
const ClubsPage = lazy(() => import('./pages/ClubsPage').then(module => ({ default: module.ClubsPage })));
const ClubDetailPage = lazy(() => import('./pages/ClubDetailPage').then(module => ({ default: module.ClubDetailPage })));
const ClubTeamManagementPage = lazy(() => import('./pages/ClubTeamManagementPage').then(module => ({ default: module.ClubTeamManagementPage })));
const EventsPage = lazy(() => import('./pages/EventsPage').then(module => ({ default: module.EventsPage })));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage').then(module => ({ default: module.EventDetailPage })));
const FormsListPage = lazy(() => import('./pages/FormsListPage').then(module => ({ default: module.FormsListPage })));
const FormBuilderPage = lazy(() => import('./pages/FormBuilderPage').then(module => ({ default: module.FormBuilderPage })));
const FormStatsPage = lazy(() => import('./pages/FormStatsPage').then(module => ({ default: module.FormStatsPage })));
const CreateEventPage = lazy(() => import('./pages/CreateEventPage').then(module => ({ default: module.CreateEventPage })));
const ApprovalsPage = lazy(() => import('./pages/ApprovalsPage').then(module => ({ default: module.ApprovalsPage })));
const SubmitReportPage = lazy(() => import('./pages/SubmitReportPage').then(module => ({ default: module.SubmitReportPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(module => ({ default: module.AnalyticsPage })));
const CreateClubPage = lazy(() => import('./pages/CreateClubPage').then(module => ({ default: module.CreateClubPage })));
const EditClubPage = lazy(() => import('./pages/EditClubPage').then(module => ({ default: module.EditClubPage })));
const ClubApplicationsPage = lazy(() => import('./pages/ClubApplicationsPage').then(module => ({ default: module.ClubApplicationsPage })));
const ClubMembersPage = lazy(() => import('./pages/ClubMembersPage').then(module => ({ default: module.ClubMembersPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(module => ({ default: module.ProfilePage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(module => ({ default: module.ReportsPage })));
const ProposalsPage = lazy(() => import('./pages/ProposalsPage').then(module => ({ default: module.ProposalsPage })));
const EditEventPage = lazy(() => import('./pages/EditEventPage').then(module => ({ default: module.EditEventPage })));
const ClubsWallPage = lazy(() => import('./pages/ClubsWallPage').then(module => ({ default: module.ClubsWallPage })));
const ClubHighlightsPage = lazy(() => import('./pages/ClubHighlightsPage').then(module => ({ default: module.ClubHighlightsPage })));
const SuperAdminPage = lazy(() => import('./pages/SuperAdminPage').then(module => ({ default: module.SuperAdminPage })));
const GalleryManagementPage = lazy(() => import('./pages/GalleryManagementPage').then(module => ({ default: module.GalleryManagementPage })));
const EventScannerPage = lazy(() => import('./pages/EventScannerPage').then(module => ({ default: module.EventScannerPage })));
const AttendanceScannerPage = lazy(() => import('./pages/AttendanceScannerPage').then(module => ({ default: module.AttendanceScannerPage })));
const FeedbackFormPage = lazy(() => import('./pages/FeedbackFormPage').then(module => ({ default: module.FeedbackFormPage })));
const FeedbackFormBuilderPage = lazy(() => import('./pages/FeedbackFormBuilderPage').then(module => ({ default: module.FeedbackFormBuilderPage })));
const EventFeedbackStatsPage = lazy(() => import('./pages/EventFeedbackStatsPage').then(module => ({ default: module.EventFeedbackStatsPage })));
const QRScannerFormPage = lazy(() => import('./pages/QRScannerFormPage').then(module => ({ default: module.QRScannerFormPage })));
const EventRegistrationPage = lazy(() => import('./pages/EventRegistrationPage').then(module => ({ default: module.EventRegistrationPage })));
const EventMediaPage = lazy(() => import('./pages/EventMediaPage').then(module => ({ default: module.EventMediaPage })));
const AIEventManagerPage = lazy(() => import('./pages/AIEventManagerPage').then(module => ({ default: module.AIEventManagerPage })));
const DailyQuizPage = lazy(() => import('./pages/DailyQuizPage').then(module => ({ default: module.DailyQuizPage })));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage').then(module => ({ default: module.LeaderboardPage })));

// Loading Screen
const LoadingScreen = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'transparent' }}>
    <CircularProgress size={40} thickness={4} sx={{ color: '#0ea5e9' }} />
  </Box>
);

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
        <SEO />
        <Suspense fallback={<LoadingScreen />}>
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
                <Route path="/clubs/:id/team" element={<ClubTeamManagementPage />} />
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
                <Route path="/applications" element={<ClubApplicationsPage />} />

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
                <Route path="/attendance-scanner" element={<AttendanceScannerPage />} />

                <Route path="/events/new" element={<CreateEventPage />} />
                <Route path="/members" element={<ClubMembersPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/super-admin" element={<SuperAdminPage />} />
                <Route path="/club-admin/ai-events" element={<AIEventManagerPage />} />

                {/* Daily Quiz & Gamification */}
                <Route path="/daily-quiz" element={<DailyQuizPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
