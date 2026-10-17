/**
 * @file App.tsx
 * @description Top-level "router" for the whole frontend.
 *
 * The app does not use a routing library. Instead:
 *  - Logged-out visitors switch between Landing / Login / Signup via local state.
 *  - Logged-in users get one "portal" per role (Super Admin, Manager, Client, Gig Pro).
 *    Each portal keeps the currently visible page in state and renders it by name.
 *  - Two special one-time flows (admin invite, manager invite) are detected from the URL.
 */
import { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext/AuthContext';
import { ClientProvider } from './context/ClientContext/ClientContext';
import { ManagerProvider, useManager } from './context/ManagerContext/ManagerContext';
import { GigProvider, useGig } from './context/GigContext/GigContext';
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
import { ClientCompletedProjects } from './pages/client/CompletedProjects/ClientCompletedProjects';
import { ClientProfile } from './pages/client/ClientProfile/ClientProfile';

// 👔 Manager Pages & Layout
import { ManagerLayout } from './layouts/ManagerLayout/ManagerLayout';
import { ManagerDashboard } from './pages/manager/ManagerDashboard/ManagerDashboard';
import { SearchTalent as ManagerSearchTalent } from './pages/manager/SearchTalent/SearchTalent';
import { ManagerTasks } from './pages/manager/ManagerTasks/ManagerTasks';
import { ReviewDeliverables as ManagerReviewDeliverables } from './pages/manager/ReviewDeliverables/ReviewDeliverables';
import { ManagerProfile } from './pages/manager/ManagerProfile/ManagerProfile';
import { ManagerInviteSetup } from './pages/manager/ManagerInviteSetup/ManagerInviteSetup';

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

/** Pages a logged-out visitor can see. */
type UnauthView = 'landing' | 'login' | 'signup';
/** Pages inside the manager portal. */
type ManagerTabType = 'dashboard' | 'talent' | 'tasks' | 'task-detail' | 'profile';

/** sessionStorage key that remembers the last open admin page across refreshes. */
const ADMIN_TAB_KEY = 'gfg_admin_tab';

/** Header title/subtitle shown by AdminLayout for each admin page. */
const ADMIN_VIEW_METADATA: Record<string, { title: string; subtitle: string }> = {
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

/**
 * 👑 Super Admin portal: sidebar layout + one of 12 admin pages.
 * The open page is remembered in sessionStorage so a refresh keeps you where you were.
 */
function SuperAdminPortal() {
  const [currentView, setCurrentView] = useState(() => sessionStorage.getItem(ADMIN_TAB_KEY) || 'dashboard');

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    sessionStorage.setItem(ADMIN_TAB_KEY, view);
  };

  // Fallback header for an unknown view name (e.g. stale value in sessionStorage).
  const activeMeta = ADMIN_VIEW_METADATA[currentView] || { title: 'Super Admin', subtitle: 'GigsForGigs Portal' };

  // Pick the page component for the current view (unknown views fall back to the dashboard).
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
 * ⚡ Gig Professional portal. The active page lives in GigContext (`activeTab`)
 * so any gig page can navigate by calling `setActiveTab`.
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
 * 👔 Manager portal. Opening a task stores it in ManagerContext (`selectTask`)
 * and switches to the task-detail (review deliverables) page.
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
 * 💼 Client portal. Pages navigate with `onNavigate(viewId, params?)`;
 * `params` (e.g. a task id) are kept here and handed to the pages that need them.
 */
function ClientAppContent() {
  const [clientView, setClientView] = useState<string>('dashboard');
  const [clientParams, setClientParams] = useState<Record<string, string>>({});

  const handleClientNavigate = (viewId: string, params?: Record<string, string>) => {
    if (params) setClientParams(params);
    // Old view names that now live on the "My Gigs" page.
    const resolvedView = viewId === 'active-contracts' || viewId === 'active-tasks' ? 'my-gigs' : viewId;
    setClientView(resolvedView);
  };

  return (
    <ClientLayout currentView={clientView} onNavigate={handleClientNavigate}>
      {clientView === 'dashboard' && <ClientDashboard onNavigate={handleClientNavigate} />}
      {clientView === 'search-talent' && <ClientSearchTalent onNavigate={handleClientNavigate} />}
      {clientView === 'my-gigs' && <MyGigs onNavigate={handleClientNavigate} />}
      {clientView === 'completed-projects' && <ClientCompletedProjects onNavigate={handleClientNavigate} />}
      {clientView === 'total-spent' && <TotalSpent onNavigate={handleClientNavigate} />}
      {clientView === 'client-profile' && <ClientProfile onNavigate={handleClientNavigate} />}
      {clientView === 'profile-selection' && <ClientProfileSelection onNavigate={handleClientNavigate} />}
      {clientView === 'add-manager' && <AddManager onNavigate={handleClientNavigate} />}
      {clientView === 'add-manager-flow' && <AddManagerFlow onNavigate={handleClientNavigate} />}
      {clientView === 'post-gig' && <PostGig onNavigate={handleClientNavigate} params={clientParams} />}
      {clientView === 'review-deliverables' && <ClientReviewDeliverables onNavigate={handleClientNavigate} params={clientParams} />}
      {clientView === 'review-shortlist' && <ReviewShortlist onNavigate={handleClientNavigate} params={clientParams} />}
    </ClientLayout>
  );
}

/** URL prefixes that belong to a logged-in portal; visiting one while logged out shows Login. */
const PROTECTED_PATH_PREFIXES = ['/admin', '/client', '/manager', '/gig', '/dashboard'];

/** Decide which logged-out page to show first, based on the URL the visitor opened. */
function initialUnauthView(): UnauthView {
  const path = window.location.pathname.toLowerCase();
  if (path === '/login' || path.startsWith('/login/')) return 'login';
  if (path === '/signup' || path.startsWith('/signup/')) return 'signup';
  if (PROTECTED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))) return 'login';
  return 'landing';
}

/**
 * Picks what to show based on auth state:
 *  1. Manager invite link (/?manager_invite=TOKEN) -> password setup page
 *  2. Session still being checked -> loading screen
 *  3. Admin invite link (/admin/invite or ?admin_invite) -> admin activation page
 *  4. Logged out -> Landing / Login / Signup
 *  5. Logged in -> the portal for the user's role
 */
function MainAppContent() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [unauthView, setUnauthView] = useState<UnauthView>(initialUnauthView);

  // When the user logs out (or the session expires), send them to Login instead of Landing.
  const prevAuthRef = useRef(isAuthenticated);
  useEffect(() => {
    if (prevAuthRef.current && !isAuthenticated) {
      setUnauthView('login');
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const [isInviteFlowActive, setIsInviteFlowActive] = useState(() =>
    window.location.pathname.startsWith('/admin/invite') || new URLSearchParams(window.location.search).has('admin_invite'),
  );

  // Manager invite links look like /?manager_invite=<signed token>.
  const [managerInviteToken, setManagerInviteToken] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get('manager_invite'),
  );

  if (managerInviteToken && !user) {
    return (
      <ManagerInviteSetup
        token={managerInviteToken}
        onDone={() => {
          setManagerInviteToken(null);
          setUnauthView('login');
          // Strip the token from the address bar so a refresh doesn't reopen the invite.
          window.history.replaceState({}, document.title, '/');
        }}
      />
    );
  }

  if (authLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F6F8', color: '#0D568D', fontWeight: 600 }}>
        Loading GigsForGigs Workspace...
      </div>
    );
  }

  if (isInviteFlowActive) {
    return (
      <AdminInviteActivation
        onActivationSuccess={() => {
          setIsInviteFlowActive(false);
          window.history.replaceState({}, document.title, '/');
        }}
      />
    );
  }

  // Logged-out visitor: Landing, Signup, or (default) Login.
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

  // Logged in: each role gets its own data provider + portal.
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

/** Root component: auth + toast notifications wrap everything. */
export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainAppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
