import React from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AppwriteAuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { PinnedFlightProvider } from '@/contexts/PinnedFlightContext';
import { FlightUpdaterProvider } from '@/contexts/FlightUpdaterContext';
import { LoadingProvider, useLoading } from '@/contexts/LoadingContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AnnouncementProvider } from '@/contexts/AnnouncementContext';
import { FlightInsightsCacheProvider } from '@/contexts/FlightInsightsCacheContext';
// Layout components
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PremiumRoute from '@/components/auth/PremiumRoute';
import OnboardingRedirect from '@/components/OnboardingRedirect';

// Common components
import Hero from '@/components/common/Hero';
import DemoVideoSection from '@/components/common/DemoVideoSection';
import Features from '@/components/common/Features';
import ComingSoon from '@/components/common/ComingSoon';
import Newsletter from '@/components/common/Newsletter';
import About from '@/components/common/About';
import Pricing from '@/components/common/Pricing';

// Pages
import FlightSearchPage from '@/pages/flights/FlightSearchPage';
import FlightTrackerPage from '@/pages/flights/FlightTrackerPage';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import FlightNewsAlertsPage from '@/pages/flights/FlightNewsAlertsPage';
import TripPlannerPage from '@/pages/others/TripPlannerPage';
import GuestTripPage from '@/pages/others/GuestTripPage';
import TripDetailPageWrapper from '@/pages/others/TripDetailPageWrapper';
import AccountProfilePage from '@/pages/account/AccountProfilePage';
import AviationEducationPage from '@/pages/AviationEducationPage';
import GuideDetailPage from '@/components/GuideDetailPage';
import AircraftDetailPage from '@/components/AircraftDetailPage';
import TravelGuideDetailPage from '@/components/TravelGuideDetailPage';
import NewsDetailPage from '@/components/NewsDetailPage';
import AirportDetailPage from '@/components/AirportDetailPage';
import QuizDetailPage from '@/components/QuizDetailPage';
import ResourceDetailPage from '@/components/ResourceDetailPage';
import TravelAdvisoryDetailPage from '@/components/TravelAdvisoryDetailPage';
import VisaCheckerPage from '@/pages/VisaCheckerPage';
import AIChatAssistantPage from '@/pages/EnhancedAITripPlannerPage';
import DiscoveryPage from '@/pages/DiscoveryPage';
import NotificationsPage from '@/pages/notifications/NotificationsPage';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfUse from '@/pages/TermsOfUse';
import RefundPolicyPage from '@/pages/RefundPolicyPage';
import CookiePolicyPage from '@/pages/CookiePolicyPage';
import AIUsePolicyPage from '@/pages/AIUsePolicyPage';
import FeatureRequestPage from '@/pages/FeatureRequestPage';
import RoadmapPage from '@/pages/RoadmapPage';
import ChangelogPage from '@/pages/ChangelogPage';
import AboutPage from '@/pages/AboutPage';
import AuthSuccess from '@/pages/AuthSuccess';
import AuthFailure from '@/pages/AuthFailure';
import ComparisonSection from '@/components/common/ComparisonSection';
import UserReviewCarousel from '@/components/common/UserReviewCarousel';
import FAQ from '@/components/common/FAQ';
import ScrollToTop from '@/components/common/ScrollToTop';
import LoadingScreen from '@/components/common/LoadingScreen';
import AnnouncementBanner from '@/components/AnnouncementBanner';
// import AnnouncementContainer from '@/components/AnnouncementContainer';
import SEOHead from '@/components/seo/SEOHead';

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

const AppContent: React.FC = () => {
  const { isLoading } = useLoading();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Get current page for announcements
  const getCurrentPage = () => {
    const path = location.pathname;
    
    // Map routes to page identifiers
    if (path === '/') return 'home';
    if (path.startsWith('/changelog')) return 'changelog';
    if (path.startsWith('/roadmap')) return 'roadmap';
    if (path.startsWith('/aviation-education') || path.startsWith('/guides')) return 'guides';
    if (path.startsWith('/quiz')) return 'quizzes';
    if (path.startsWith('/resources')) return 'resources';
    
    return 'all'; // Default to show on all pages
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-200">
      <ScrollToTop />
      
      {/* Global Announcement Banner - positioned above everything */}
      <AnnouncementBanner page={getCurrentPage()} />
      
      <Header />

      <main className="flex-1 announcement-content">
              <div className="py-8">
                <Routes>
                  <Route path="/" element={<>
                    <SEOHead
                      title="SkyNeu - AI-Powered Travel & Aviation Platform | Flight Search, Trip Planning & Discovery"
                      description="SkyNeu is your complete AI-powered travel companion. Search flights, plan trips, discover places, track flights, check visas, and stay updated with aviation news. Smart travel made simple."
                      canonical="https://skyneu.com/"
                      keywords="skyneu, travel app, ai travel, flight search, trip planner, flight tracker, visa checker, discover places, aviation news"
                    />
                    <Hero />
                    <DemoVideoSection />
                    <Features />
                    <About />
                    <Pricing />
                    <ComparisonSection />
                    <UserReviewCarousel />
                    <ComingSoon />
                    <FAQ />
                    <Newsletter />
                  </>} />

                  <Route path="/flight-search" element={<PremiumRoute feature="Flight Search"><FlightSearchPage /></PremiumRoute>} />
                  <Route path="/flight-tracker" element={<PremiumRoute feature="Flight Tracker"><ErrorBoundary><FlightTrackerPage /></ErrorBoundary></PremiumRoute>} />
                  <Route path="/news-alerts" element={<PremiumRoute feature="News & Alerts"><FlightNewsAlertsPage /></PremiumRoute>} />
                  <Route path="/trip-planner" element={<ProtectedRoute><TripPlannerPage /></ProtectedRoute>} />
                  <Route path="/trip/guest/:joinCode" element={<GuestTripPage />} />
                  <Route path="/trip/:tripId" element={<TripDetailPageWrapper />} />

                  <Route path="/profile" element={<PremiumRoute feature="Profile"><ProtectedRoute><AccountProfilePage /></ProtectedRoute></PremiumRoute>} />
                  <Route path="/onboarding" element={<OnboardingRedirect />} />

                  <Route path="/aviation-education" element={<AviationEducationPage />} />
                  <Route path="/aviation-education/guides/:slug" element={<GuideDetailPage />} />
                  <Route path="/aviation-education/aircraft/:slug" element={<AircraftDetailPage />} />
                  <Route path="/aviation-education/travel/:slug" element={<TravelGuideDetailPage />} />
                  <Route path="/aviation-education/news/:slug" element={<NewsDetailPage />} />
                  <Route path="/aviation-education/airports/:code" element={<AirportDetailPage />} />
                  <Route path="/aviation-education/quiz/:id" element={<QuizDetailPage />} />
                  <Route path="/aviation-education/resource/:slug" element={<ResourceDetailPage />} />
                  <Route path="/aviation-education/advisory/:slug" element={<TravelAdvisoryDetailPage />} />
                  <Route path="/visa-checker" element={<PremiumRoute feature="Visa Checker"><VisaCheckerPage /></PremiumRoute>} />
                  <Route path="/ai-chat" element={<PremiumRoute feature="AI Assistant"><AIChatAssistantPage /></PremiumRoute>} />
                  <Route path="/discover" element={<PremiumRoute feature="Discover"><ErrorBoundary><DiscoveryPage /></ErrorBoundary></PremiumRoute>} />
                  <Route path="/notifications" element={<PremiumRoute feature="Notifications"><ProtectedRoute><NotificationsPage /></ProtectedRoute></PremiumRoute>} />
                  
                  
                  
                  {/* OAuth Callback Routes */}
                  <Route path="/auth/success" element={<AuthSuccess />} />
                  <Route path="/auth/failure" element={<AuthFailure />} />
                  
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-use" element={<TermsOfUse />} />
                  <Route path="/refund-policy" element={<RefundPolicyPage />} />
                  <Route path="/cookie-policy" element={<CookiePolicyPage />} />
                  <Route path="/ai-use-policy" element={<AIUsePolicyPage />} />
                  <Route path="/feature-requests" element={<FeatureRequestPage />} />
                  <Route path="/roadmap" element={<RoadmapPage />} />
                  <Route path="/changelog" element={<ChangelogPage />} />
                  <Route path="/about" element={<AboutPage />} />

                  {/* backwards-compatible hash redirects */}
                  <Route path="/flights" element={<Navigate to="/flight-search" replace />} />
                  <Route path="/visa" element={<Navigate to="/visa-checker" replace />} />
                  <Route path="/tracker" element={<Navigate to="/flight-tracker" replace />} />
                  <Route path="/aviation" element={<Navigate to="/aviation-education" replace />} />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </main>

            <Footer />
            <Toaster position="bottom-right" />
          </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <PinnedFlightProvider>
            <FlightUpdaterProvider>
              <LoadingProvider>
                <Router>
                  <AnnouncementProvider>
                    <FlightInsightsCacheProvider>
                      <AppContent />
                    </FlightInsightsCacheProvider>
                  </AnnouncementProvider>
                </Router>
              </LoadingProvider>
            </FlightUpdaterProvider>
          </PinnedFlightProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;