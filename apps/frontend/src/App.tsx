import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext/AuthContext';
import { ClientProvider } from './context/ClientContext/ClientContext';
import { ManagerProvider, useManager } from './context/ManagerContext/ManagerContext';
import { GigProvider, useGig } from './context/GigContext/GigContext';
import { PaymentProvider } from './context/PaymentContext/PaymentContext';
import { ToastProvider } from './components/super-admin/Toast';

// 👑 Super Admin Layout & 12 Views
import { AdminLayout } from './layouts/AdminLayout';
import { Dashboard } from './pages/super-admin/Dashboard';
import { AdminAnalytics } from './pages/super-admin/AdminAnalytics';
import { ClientManagement } from './pages/super-admin/ClientManagement';
import { GigProfessionalManagement } from './pages/super-admin/GigProfessionalManagement';
import { ManagersManagement } from './pages/super-admin/ManagersManagement';
import { Projects } from './pages/super-admin/Projects';
import { PaymentsRevenue } from './pages/super-admin/PaymentsRevenue';
import { Reviews } from './pages/super-admin/Reviews';
import { DisputesReports } from './pages/super-admin/DisputesReports';
import { AdminManagement } from './pages/super-admin/AdminManagement';
import { AdminProfile } from './pages/super-admin/AdminProfile';
import { PlatformSettings } from './pages/super-admin/PlatformSettings';
import { AdminInviteActivation } from './pages/super-admin/AdminInviteActivation/AdminInviteActivation';

// 💼 Client Pages & Layout
import { ClientLayout } from './layouts/ClientLayout/ClientLayout';
import { ClientDashboard } from './pages/client/ClientDashboard/ClientDashboard';
import { SearchTalent as ClientSearchTalent } from './pages/client/SearchTalent/SearchTalent';
import { MyGigs } from './pages/client/MyGigs/MyGigs';
import { TotalSpent } from './pages/client/TotalSpent/TotalSpent';
import { ClientProfileSelection } from './pages/client/ClientProfileSelection/ClientProfileSelection';
import { AddManager } from './pages/client/AddManager/AddManager';
import { AddManagerFlow } from './pages/client/AddManagerFlow/AddManagerFlow';
import { PostGig } from './pages/client/PostGig/PostGig';
import { ReviewDeliverables as ClientReviewDeliverables } from './pages/client/ReviewDeliverables/ReviewDeliverables';
import { ReviewShortlist } from './pages/client/ReviewShortlist/ReviewShortlist';

// 👔 Manager Pages & Layout
import { ManagerLayout } from './layouts/ManagerLayout/ManagerLayout';
import { ManagerDashboard } from './pages/manager/ManagerDashboard/ManagerDashboard';
import { SearchTalent as ManagerSearchTalent } from './pages/manager/SearchTalent/SearchTalent';
import { ManagerTasks } from './pages/manager/ManagerTasks/ManagerTasks';
import { ReviewDeliverables as ManagerReviewDeliverables } from './pages/manager/ReviewDeliverables/ReviewDeliverables';
import { ManagerProfile } from './pages/manager/ManagerProfile/ManagerProfile';

// ⚡ Gig Professional Pages & Layout
import { GigLayout } from './layouts/GigLayout/GigLayout';
import { GigDashboard } from './pages/gig/GigDashboard/GigDashboard';
import { ExploreTasks } from './pages/gig/ExploreTasks/ExploreTasks';
import { ActiveTasks } from './pages/gig/ActiveTasks/ActiveTasks';
import { PendingRequests } from './pages/gig/PendingRequests/PendingRequests';
import { CompletedProjects } from './pages/gig/CompletedProjects/CompletedProjects';
import { TotalEarnings } from './pages/gig/TotalEarnings/TotalEarnings';
import { SubmitDeliverables } from './pages/gig/SubmitDeliverables/SubmitDeliverables';
import { SubmissionSuccess } from './pages/gig/SubmissionSuccess/SubmissionSuccess';
import { PostService } from './pages/gig/PostService/PostService';
import { ServicePublished } from './pages/gig/ServicePublished/ServicePublished';
import { ProjectDetail } from './pages/gig/ProjectDetail/ProjectDetail';
import { GigProfile } from './pages/gig/GigProfile/GigProfile';
import { GigProfileCompletion } from './pages/gig/GigProfileCompletion/GigProfileCompletion';
import { MyServices } from './pages/gig/MyServices/MyServices';

// 🌐 Public & Auth Pages
import { LandingPage } from './pages/public/LandingPage/LandingPage';
import { Login } from './pages/auth/Login/Login';
import { Signup } from './pages/auth/Signup/Signup';

type UnauthView = 'landing' | 'login' | 'signup';
type ManagerTabType = 'dashboard' | 'talent' | 'tasks' | 'task-detail' | 'profile';

/**
 * 👑 Super Admin Platform Portal (12 Views Suite)
 */
function SuperAdminPortal() {
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gfg_admin_tab');
      if (saved) return saved;
    }
    return 'dashboard';
  });

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gfg_admin_tab', view);
    }
  };

  const viewMetadata: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Executive Overview', subtitle: 'Real-time platform health, KPIs, and operational activity' },
    analytics: { title: 'Business Intelligence & Trends', subtitle: 'Marketplace volume velocity, rake take rates, and cohort retention' },
    clients: { title: 'Client Organizations', subtitle: 'Client master directory, KYC approvals, and enterprise spend oversight' },
    'gig-pros': { title: 'Gig Professionals & Talent', subtitle: 'Freelancer directory, skill verification, and badge moderation' },
    managers: { title: 'Manager Oversight', subtitle: 'Organizational hierarchy linkages and RBAC permission enforcement' },
    projects: { title: 'Projects & Tasks Monitor', subtitle: 'Platform-wide task lifecycle tracking and emergency milestone overrides' },
    payments: { title: 'Financial Ledger & Escrow', subtitle: 'Milestone escrow tracking, commission rake accounting, and disbursements' },
    reviews: { title: 'Reviews & Reputation Moderation', subtitle: 'Marketplace feedback queue, profanity detection, and rating recalculation' },
    disputes: { title: 'Arbitration Court & Disputes', subtitle: 'Evidence inspector and 1-click binding dispute settlement engine' },
    'admin-staff': { title: 'Admin Staff & Governance', subtitle: 'Multi-tier delegate admin provisioning and SOC-2 compliant audit trails' },
    profile: { title: 'Administrator Profile & Security', subtitle: 'Root credentials, TOTP two-factor authentication, and session revocation' },
    settings: { title: 'Platform Configuration', subtitle: 'Commission rake percentages, minimum budgets, and maintenance controls' }
  };

  const activeMeta = viewMetadata[currentView] || { title: 'Super Admin', subtitle: 'GigsForGigs Portal' };

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard onNavigate={handleNavigate} />;
      case 'analytics': return <AdminAnalytics />;
      case 'clients': return <ClientManagement />;
      case 'gig-pros': return <GigProfessionalManagement />;
      case 'managers': return <ManagersManagement />;
      case 'projects': return <Projects />;
      case 'payments': return <PaymentsRevenue />;
      case 'reviews': return <Reviews />;
      case 'disputes': return <DisputesReports />;
      case 'admin-staff': return <AdminManagement />;
      case 'profile': return <AdminProfile />;
      case 'settings': return <PlatformSettings />;
      default: return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <AdminLayout
      currentView={currentView}
      onNavigate={handleNavigate}
      pageTitle={activeMeta.title}
      pageSubtitle={activeMeta.subtitle}
    >
      {renderActiveView()}
    </AdminLayout>
  );
}

/**
 * ⚡ Gig Professional Portal
 */
function GigAppContent() {
  const { activeTab } = useGig();

  return (
    <GigLayout>
      {activeTab === 'dashboard' && <GigDashboard />}
      {activeTab === 'explore' && <ExploreTasks />}
      {activeTab === 'my-services' && <MyServices />}
      {activeTab === 'active-tasks' && <ActiveTasks />}
      {activeTab === 'pending-requests' && <PendingRequests />}
      {activeTab === 'completed-projects' && <CompletedProjects />}
      {activeTab === 'earnings' && <TotalEarnings />}
      {activeTab === 'submit-deliverables' && <SubmitDeliverables />}
      {activeTab === 'submission-success' && <SubmissionSuccess />}
      {activeTab === 'post-service' && <PostService />}
      {activeTab === 'service-published' && <ServicePublished />}
      {activeTab === 'project-detail' && <ProjectDetail />}
      {activeTab === 'profile' && <GigProfile />}
      {activeTab === 'profile-completion' && <GigProfileCompletion />}
    </GigLayout>
  );
}

/**
 * 👔 Manager Portal
 */
function ManagerAppContent() {
  const { selectTask } = useManager();
  const [managerActiveTab, setManagerActiveTab] = useState<ManagerTabType>('dashboard');

  const handleNavigateToTask = (taskId: number) => {
    selectTask(taskId);
    setManagerActiveTab('task-detail');
  };

  return (
    <ManagerLayout activeTab={managerActiveTab} setActiveTab={setManagerActiveTab}>
      {managerActiveTab === 'dashboard' && (
        <ManagerDashboard
          onNavigateToTask={handleNavigateToTask}
          onNavigateToQueue={() => setManagerActiveTab('tasks')}
        />
      )}
      {managerActiveTab === 'talent' && <ManagerSearchTalent />}
      {managerActiveTab === 'tasks' && (
        <ManagerTasks onSelectTask={handleNavigateToTask} />
      )}
      {managerActiveTab === 'task-detail' && (
        <ManagerReviewDeliverables onBack={() => setManagerActiveTab('tasks')} />
      )}
      {managerActiveTab === 'profile' && <ManagerProfile />}
    </ManagerLayout>
  );
}

/**
 * 💼 Client Portal
 */
function ClientAppContent() {
  const [clientView, setClientView] = useState<string>('dashboard');
  const [clientParams, setClientParams] = useState<Record<string, string>>({});

  const handleClientNavigate = (viewId: string, params?: Record<string, string>) => {
    if (params) setClientParams(params);
    setClientView(viewId);
  };

  return (
    <ClientLayout currentView={clientView} onNavigate={handleClientNavigate}>
      {clientView === 'dashboard' && <ClientDashboard onNavigate={handleClientNavigate} />}
      {clientView === 'search-talent' && <ClientSearchTalent onNavigate={handleClientNavigate} />}
      {clientView === 'my-gigs' && <MyGigs onNavigate={handleClientNavigate} />}
      {clientView === 'total-spent' && <TotalSpent onNavigate={handleClientNavigate} />}
      {clientView === 'profile-selection' && <ClientProfileSelection onNavigate={handleClientNavigate} />}
      {clientView === 'add-manager' && <AddManager onNavigate={handleClientNavigate} />}
      {clientView === 'add-manager-flow' && <AddManagerFlow onNavigate={handleClientNavigate} />}
      {clientView === 'post-gig' && <PostGig onNavigate={handleClientNavigate} />}
      {clientView === 'review-deliverables' && <ClientReviewDeliverables onNavigate={handleClientNavigate} params={clientParams} />}
      {clientView === 'review-shortlist' && <ReviewShortlist onNavigate={handleClientNavigate} />}
    </ClientLayout>
  );
}

/**
 * Main application router deciding layout and portal shell based on user role.
 */
function MainAppContent() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [unauthView, setUnauthView] = useState<UnauthView>('landing');
  const [isInviteFlowActive, setIsInviteFlowActive] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.location.pathname.startsWith('/admin/invite') || window.location.search.includes('token=inv_');
  });

  if (authLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6F7', color: '#0D568D', fontWeight: 600 }}>
        Loading GigsForGigs Workspace...
      </div>
    );
  }

  if (isInviteFlowActive) {
    return (
      <AdminInviteActivation
        onActivationSuccess={() => {
          setIsInviteFlowActive(false);
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, '/');
          }
        }}
      />
    );
  }

  // 1. Unauthenticated Visitor Flow (ALWAYS starts on Landing Page!)
  if (!isAuthenticated || !user) {
    if (unauthView === 'landing') {
      return (
        <LandingPage
          onNavigateToLogin={() => setUnauthView('login')}
          onNavigateToSignup={() => setUnauthView('signup')}
        />
      );
    }
    if (unauthView === 'signup') {
      return (
        <Signup
          onBackToLanding={() => setUnauthView('landing')}
          onNavigateToLogin={() => setUnauthView('login')}
        />
      );
    }
    return (
      <Login
        onBackToLanding={() => setUnauthView('landing')}
        onNavigateToSignup={() => setUnauthView('signup')}
      />
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {user.role === 'SUPER_ADMIN' && <SuperAdminPortal />}
      {user.role === 'MANAGER' && (
        <ManagerProvider>
          <ManagerAppContent />
        </ManagerProvider>
      )}
      {user.role === 'CLIENT' && (
        <ClientProvider>
          <ClientAppContent />
        </ClientProvider>
      )}
      {user.role === 'GIG_PROFESSIONAL' && (
        <GigProvider>
          <GigAppContent />
        </GigProvider>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PaymentProvider>
        <ToastProvider>
          <MainAppContent />
        </ToastProvider>
      </PaymentProvider>
    </AuthProvider>
  );
}
