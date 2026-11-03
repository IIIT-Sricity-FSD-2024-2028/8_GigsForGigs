/** Application route tree and role-aware portal layouts. */
import { Suspense, lazy, useEffect, useState } from 'react';
import {
  Navigate,
  Outlet,
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext/AuthContext';
import { ClientProvider } from './context/ClientContext/ClientContext';
import { ManagerProvider, useManager } from './context/ManagerContext/ManagerContext';
import { GigProvider } from './context/GigContext/GigContext';
import { ToastProvider } from './components/super-admin/Toast';
import { ToastProvider as AppToastProvider } from './components/common/Toast';
import { Loader } from './components/common/Loader';
import { AdminLayout } from './layouts/AdminLayout';
import { ClientLayout } from './layouts/ClientLayout/ClientLayout';
import { ManagerLayout } from './layouts/ManagerLayout/ManagerLayout';
import { GigLayout } from './layouts/GigLayout/GigLayout';
import { AdminInviteActivation } from './pages/super-admin/AdminInviteActivation/AdminInviteActivation';
import { LandingPage } from './pages/public/LandingPage/LandingPage';
import { Login } from './pages/auth/Login/Login';
import { Signup } from './pages/auth/Signup/Signup';
import { ManagerInviteSetup } from './pages/manager/ManagerInviteSetup/ManagerInviteSetup';
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
import { ManagerProfileView } from './pages/client/ClientProfileSelection/ManagerProfileView';
import { ManagerDashboard } from './pages/manager/ManagerDashboard/ManagerDashboard';
import { ManagerTasks } from './pages/manager/ManagerTasks/ManagerTasks';
import { ReviewDeliverables as ManagerReviewDeliverables } from './pages/manager/ReviewDeliverables/ReviewDeliverables';
import { ManagerProfile } from './pages/manager/ManagerProfile/ManagerProfile';
import { GigDashboard } from './pages/gig/GigDashboard/GigDashboard';
import { ExploreTasks } from './pages/gig/ExploreTasks/ExploreTasks';
import { ActiveTasks } from './pages/gig/ActiveTasks/ActiveTasks';
import { AppliedTasks } from './pages/gig/AppliedTasks/AppliedTasks';
import { ServiceRequests } from './pages/gig/ServiceRequests/ServiceRequests';
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

const Dashboard = lazy(() => import('./pages/super-admin/Dashboard').then((m) => ({ default: m.Dashboard })));
const AdminAnalytics = lazy(() => import('./pages/super-admin/AdminAnalytics').then((m) => ({ default: m.AdminAnalytics })));
const ClientManagement = lazy(() => import('./pages/super-admin/ClientManagement').then((m) => ({ default: m.ClientManagement })));
const GigProfessionalManagement = lazy(() => import('./pages/super-admin/GigProfessionalManagement').then((m) => ({ default: m.GigProfessionalManagement })));
const ManagersManagement = lazy(() => import('./pages/super-admin/ManagersManagement').then((m) => ({ default: m.ManagersManagement })));
const Projects = lazy(() => import('./pages/super-admin/Projects').then((m) => ({ default: m.Projects })));
const PaymentsRevenue = lazy(() => import('./pages/super-admin/PaymentsRevenue').then((m) => ({ default: m.PaymentsRevenue })));
const Reviews = lazy(() => import('./pages/super-admin/Reviews').then((m) => ({ default: m.Reviews })));
const DisputesReports = lazy(() => import('./pages/super-admin/DisputesReports').then((m) => ({ default: m.DisputesReports })));
const AdminManagement = lazy(() => import('./pages/super-admin/AdminManagement').then((m) => ({ default: m.AdminManagement })));
const AdminProfile = lazy(() => import('./pages/super-admin/AdminProfile').then((m) => ({ default: m.AdminProfile })));
const PlatformSettings = lazy(() => import('./pages/super-admin/PlatformSettings').then((m) => ({ default: m.PlatformSettings })));

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
  'admin-staff': { title: 'Admin Staff & Governance', subtitle: 'Multi-tier delegate admin provisioning and an append-only audit trail' },
  profile: { title: 'Administrator Profile & Security', subtitle: 'Root credentials, TOTP two-factor authentication, and session revocation' },
  settings: { title: 'Platform Configuration', subtitle: 'Commission rake percentages, minimum budgets, and maintenance controls' },
};

function HomeRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/" replace />;
  const roleHome: Record<string, string> = {
    SUPER_ADMIN: '/admin/dashboard',
    CLIENT: '/client/dashboard',
    MANAGER: '/manager/dashboard',
    GIG_PROFESSIONAL: '/gig/dashboard',
  };
  return <Navigate to={roleHome[user.role] || '/login'} replace />;
}

function PublicOnly() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <HomeRedirect /> : <Outlet />;
}

function LandingRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const managerToken = params.get('manager_invite');
  const adminToken = params.get('admin_invite') || params.get('token') || undefined;
  const adminInvite = Boolean(adminToken);
  if (managerToken) return <ManagerInviteSetup token={managerToken} onDone={() => navigate('/login', { replace: true })} />;
  if (adminInvite) return <AdminInviteActivation initialToken={adminToken} onActivationSuccess={() => navigate('/login', { replace: true })} />;
  return <LandingPage onNavigateToLogin={() => navigate('/login')} onNavigateToSignup={() => navigate('/signup')} />;
}

function LoginRoute() {
  const navigate = useNavigate();
  return <Login onBackToLanding={() => navigate('/')} onNavigateToSignup={() => navigate('/signup')} />;
}

function SignupRoute() {
  const navigate = useNavigate();
  return <Signup onBackToLanding={() => navigate('/')} onNavigateToLogin={() => navigate('/login')} />;
}

function InviteRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token: pathToken } = useParams();
  const query = new URLSearchParams(location.search);
  const managerToken = query.get('manager_invite');
  const adminToken = query.get('admin_invite');
  const isAdminInvite = location.pathname.startsWith('/admin/invite') || Boolean(adminToken);

  if (managerToken) {
    return <ManagerInviteSetup token={managerToken} onDone={() => navigate('/login', { replace: true })} />;
  }
  if (isAdminInvite) {
    return <AdminInviteActivation initialToken={pathToken || adminToken || undefined} onActivationSuccess={() => navigate('/login', { replace: true })} />;
  }
  return <Navigate to="/login" replace />;
}

function ClientPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { taskId } = useParams();
  const path = location.pathname;
  const currentView = path.includes('/manager/setup') ? 'add-manager-flow'
    : path.includes('/manager/add') ? 'add-manager'
      : path.includes('/manager') ? 'profile-selection'
        : path.includes('/profile') ? 'client-profile'
          : path.includes('/shortlist') ? 'review-shortlist'
            : path.includes('/review') ? 'review-deliverables'
              : path.includes('/completed') ? 'completed-projects'
                : path.includes('/spending') ? 'total-spent'
                  : path.includes('/talent') ? 'search-talent'
                    : path.includes('/new') ? 'post-gig'
                      : path.includes('/gigs') ? 'my-gigs' : 'dashboard';

  const onNavigate = (viewId: string, params?: Record<string, string>) => {
    const urls: Record<string, string> = {
      dashboard: '/client/dashboard', 'search-talent': '/client/talent', 'my-gigs': '/client/gigs',
      'active-contracts': '/client/gigs', 'active-tasks': '/client/gigs',
      'completed-projects': '/client/gigs/completed', 'total-spent': '/client/spending',
      'client-profile': '/client/profile', 'profile-selection': '/client/manager',
      'manager-profile': `/client/manager/${params?.managerId || ''}`,
      'add-manager': '/client/manager/add', 'add-manager-flow': '/client/manager/setup',
      'post-gig': '/client/gigs/new',
      'review-deliverables': `/client/gigs/${params?.taskId || taskId || ''}/review${params?.gigProfileId ? `?pro=${encodeURIComponent(params.gigProfileId)}` : ''}`,
      'review-shortlist': params?.taskId || taskId
        ? `/client/gigs/${params?.taskId || taskId}/shortlist`
        : '/client/gigs/shortlist',
      'pending-requests': '/client/gigs/shortlist',
    };
    const target = urls[viewId] || '/client/dashboard';
    const editId = params?.editId;
    navigate(editId && viewId === 'post-gig' ? `${target}?editId=${encodeURIComponent(editId)}` : target);
  };

  return (
    <ClientLayout currentView={currentView} onNavigate={(view) => onNavigate(view)}>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ClientDashboard onNavigate={onNavigate} />} />
        <Route path="talent" element={<ClientSearchTalent onNavigate={onNavigate} />} />
        <Route path="gigs" element={<MyGigs onNavigate={onNavigate} />} />
        <Route path="gigs/completed" element={<ClientCompletedProjects onNavigate={onNavigate} />} />
        <Route path="spending" element={<TotalSpent onNavigate={onNavigate} />} />
        <Route path="profile" element={<ClientProfile onNavigate={onNavigate} />} />
        <Route path="manager" element={<ClientProfileSelection onNavigate={onNavigate} />} />
        <Route path="manager/:managerId" element={<ClientManagerProfileRoute onNavigate={onNavigate} />} />
        <Route path="manager/add" element={<AddManager onNavigate={onNavigate} />} />
        <Route path="manager/setup" element={<AddManagerFlow onNavigate={onNavigate} />} />
        <Route path="gigs/new" element={<PostGig onNavigate={onNavigate} params={Object.fromEntries(new URLSearchParams(location.search))} />} />
        <Route path="gigs/:taskId/review" element={<ClientReviewRoute onNavigate={onNavigate} />} />
        <Route path="gigs/shortlist" element={<ReviewShortlist onNavigate={onNavigate} />} />
        <Route path="gigs/:taskId/shortlist" element={<ClientShortlistRoute onNavigate={onNavigate} />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </ClientLayout>
  );
}

function ClientReviewRoute({ onNavigate }: { onNavigate: (viewId: string, params?: Record<string, string>) => void }) {
  const { taskId } = useParams();
  const gigProfileId = new URLSearchParams(useLocation().search).get('pro') ?? undefined;
  return <ClientReviewDeliverables onNavigate={onNavigate} params={taskId ? { taskId, ...(gigProfileId ? { gigProfileId } : {}) } : undefined} />;
}

function ClientShortlistRoute({ onNavigate }: { onNavigate: (viewId: string, params?: Record<string, string>) => void }) {
  const { taskId } = useParams();
  return <ReviewShortlist onNavigate={onNavigate} params={taskId ? { taskId } : undefined} />;
}

function ClientManagerProfileRoute({ onNavigate }: { onNavigate: (viewId: string, params?: Record<string, string>) => void }) {
  const { managerId } = useParams();
  if (!managerId) return <Navigate to="/client/manager" replace />;
  return <ManagerProfileView managerId={managerId} onBack={() => onNavigate('profile-selection')} />;
}

function ManagerPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname === '/manager/tasks/completed' ? 'completed'
      : location.pathname.includes('/tasks/') ? 'task-detail'
      : location.pathname.includes('/tasks') ? 'tasks'
        : location.pathname.includes('/profile') ? 'profile' : 'dashboard';

  const go = (view: string) => navigate(({ dashboard: '/manager/dashboard', tasks: '/manager/tasks', completed: '/manager/tasks/completed', 'task-detail': '/manager/tasks', profile: '/manager/profile' } as Record<string, string>)[view] || '/manager/dashboard');
  const openTask = (id: number, from: 'tasks' | 'completed' = 'tasks') => navigate(`/manager/tasks/${id}`, { state: { from } });

  return (
    <ManagerLayout activeTab={activeTab} setActiveTab={go}>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ManagerDashboard onNavigateToTask={openTask} onNavigateToQueue={() => go('tasks')} />} />
        <Route path="tasks" element={<ManagerTasks onSelectTask={openTask} />} />
        <Route path="tasks/completed" element={<ManagerTasks showCompleted onSelectTask={id => openTask(id, 'completed')} />} />
        <Route path="tasks/:taskId" element={<ManagerTaskRoute onBack={() => go(location.state?.from === 'completed' ? 'completed' : 'tasks')} />} />
        <Route path="profile" element={<ManagerProfile />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </ManagerLayout>
  );
}

function ManagerTaskRoute({ onBack }: { onBack: () => void }) {
  const { taskId } = useParams();
  const { selectTask, selectedTask, error } = useManager();
  const numericTaskId = Number(taskId);
  const [loadState, setLoadState] = useState<{ taskId: number; status: 'loading' | 'ready' | 'failed' } | null>(null);
  useEffect(() => {
    if (!Number.isSafeInteger(numericTaskId) || numericTaskId <= 0) return;
    let active = true;
    setLoadState({ taskId: numericTaskId, status: 'loading' });
    void selectTask(numericTaskId).then(found => {
      if (active) setLoadState({ taskId: numericTaskId, status: found ? 'ready' : 'failed' });
    });
    return () => { active = false; };
  }, [numericTaskId, selectTask]);
  if (!Number.isSafeInteger(numericTaskId) || numericTaskId <= 0) {
    return <div role="alert">Invalid task ID.</div>;
  }
  const currentLoadState = loadState?.taskId === numericTaskId ? loadState.status : 'loading';
  if (currentLoadState === 'loading') {
    return <Loader label="Loading task details..." />;
  }
  if (currentLoadState === 'failed' || selectedTask?.taskId !== numericTaskId) {
    return <div role="alert" style={{ padding: '24px', color: '#9B1C1C' }}>
      <p>{error || 'Task details could not be loaded. It may have been deleted or reassigned.'}</p>
      <button type="button" onClick={onBack}>Back to Active Tasks</button>
    </div>;
  }
  return <ManagerReviewDeliverables onBack={onBack} />;
}

function GigPortal() {
  return (
    <GigLayout>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<GigDashboard />} />
        <Route path="tasks/explore" element={<ExploreTasks />} />
        <Route path="tasks/active" element={<ActiveTasks />} />
        <Route path="tasks/applied" element={<AppliedTasks />} />
        <Route path="tasks/:taskId/submit" element={<GigTaskRoute page="submit" />} />
        <Route path="tasks/:taskId/submitted" element={<GigTaskRoute page="submitted" />} />
        <Route path="tasks/:taskId" element={<GigTaskRoute page="detail" />} />
        <Route path="services" element={<MyServices />} />
        <Route path="services/new" element={<PostService />} />
        <Route path="services/published" element={<ServicePublished />} />
        <Route path="services/:serviceId/requests" element={<ServiceRequests />} />
        <Route path="projects/completed" element={<CompletedProjects />} />
        <Route path="earnings" element={<TotalEarnings />} />
        <Route path="profile" element={<GigProfile />} />
        <Route path="profile/complete" element={<GigProfileCompletion />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </GigLayout>
  );
}

function GigTaskRoute({ page }: { page: 'detail' | 'submit' | 'submitted' }) {
  if (page === 'submit') return <SubmitDeliverables />;
  if (page === 'submitted') return <SubmissionSuccess />;
  return <ProjectDetail />;
}

function AdminPortal() {
  const location = useLocation();
  const navigate = useNavigate();
  const segment = location.pathname.split('/')[2] || 'dashboard';
  const currentView = ({ 'gig-professionals': 'gig-pros', staff: 'admin-staff' } as Record<string, string>)[segment] || segment;
  const metadata = ADMIN_VIEW_METADATA[currentView] || ADMIN_VIEW_METADATA.dashboard;
  const go = (view: string) => navigate(`/admin/${({ 'gig-pros': 'gig-professionals', 'admin-staff': 'staff' } as Record<string, string>)[view] || view}`);

  return (
    <AdminLayout currentView={currentView} onNavigate={go} pageTitle={metadata.title} pageSubtitle={metadata.subtitle}>
      <Suspense fallback={<Loader label="Loading..." />}>
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard onNavigate={go} />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="clients" element={<ClientManagement />} />
          <Route path="gig-professionals" element={<GigProfessionalManagement />} />
          <Route path="managers" element={<ManagersManagement />} />
          <Route path="projects" element={<Projects />} />
          <Route path="payments" element={<PaymentsRevenue />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="disputes" element={<DisputesReports />} />
          <Route path="staff" element={<AdminManagement />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="settings" element={<PlatformSettings />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </Suspense>
    </AdminLayout>
  );
}

function ProtectedRole({ role }: { role: 'CLIENT' | 'MANAGER' | 'GIG_PROFESSIONAL' | 'SUPER_ADMIN' }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.role !== role) return <HomeRedirect />;
  if (role === 'CLIENT') return <ClientProvider><Outlet /></ClientProvider>;
  if (role === 'MANAGER') return <ManagerProvider><Outlet /></ManagerProvider>;
  if (role === 'GIG_PROFESSIONAL') return <GigProvider><Outlet /></GigProvider>;
  return <Outlet />;
}

function RouteTree() {
  const { user, isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/signup" element={<SignupRoute />} />
      </Route>
      <Route path="/admin/invite" element={<InviteRoutes />} />
      <Route path="/admin/invite/:token" element={<InviteRoutes />} />
      <Route path="/manager/invite" element={<InviteRoutes />} />
      <Route element={<ProtectedRole role="CLIENT" />}>
        <Route path="/client/*" element={<ClientPortal />} />
      </Route>
      <Route element={<ProtectedRole role="MANAGER" />}>
        <Route path="/manager/*" element={<ManagerPortal />} />
      </Route>
      <Route element={<ProtectedRole role="GIG_PROFESSIONAL" />}>
        <Route path="/gig/*" element={<GigPortal />} />
      </Route>
      <Route element={<ProtectedRole role="SUPER_ADMIN" />}>
        <Route path="/admin/*" element={<AdminPortal />} />
      </Route>
      {isAuthenticated && user ? <Route path="*" element={<HomeRedirect />} /> : <Route path="*" element={<Navigate to="/" replace />} />}
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppToastProvider><BrowserRouter><RouteTree /></BrowserRouter></AppToastProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
