import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext/AuthContext';
import { ManagerProvider, useManager } from './context/ManagerContext/ManagerContext';
import { ToastProvider } from './components/super-admin/Toast';

// Super Admin Layout & 12 Views
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

// Manager Portal Components
import { ManagerLayout } from './layouts/ManagerLayout/ManagerLayout';
import { ManagerDashboard } from './pages/manager/ManagerDashboard/ManagerDashboard';
import { SearchTalent } from './pages/manager/SearchTalent/SearchTalent';
import { ManagerTasks } from './pages/manager/ManagerTasks/ManagerTasks';
import { ReviewDeliverables } from './pages/manager/ReviewDeliverables/ReviewDeliverables';
import { ManagerProfile } from './pages/manager/ManagerProfile/ManagerProfile';

// Public & Auth Views
import { Login } from './pages/auth/Login/Login';
import { LandingPage } from './pages/public/LandingPage/LandingPage';

// Client Portal Components & Context
import { ClientProvider } from './context/ClientContext/ClientContext';
import { ClientLayout } from './layouts/ClientLayout/ClientLayout';
import { ClientDashboard } from './pages/client/ClientDashboard/ClientDashboard';
import { MyGigs } from './pages/client/MyGigs/MyGigs';
import { PostGig } from './pages/client/PostGig/PostGig';
import { SearchTalent as ClientSearchTalent } from './pages/client/SearchTalent/SearchTalent';
import { TotalSpent } from './pages/client/TotalSpent/TotalSpent';
import { ReviewDeliverables as ClientReviewDeliverables } from './pages/client/ReviewDeliverables/ReviewDeliverables';
import { ReviewShortlist } from './pages/client/ReviewShortlist/ReviewShortlist';
import { AddManagerFlow } from './pages/client/AddManagerFlow/AddManagerFlow';

type ManagerTabType = 'dashboard' | 'talent' | 'tasks' | 'task-detail' | 'profile';
type UnauthView = 'landing' | 'login';

function SuperAdminPortal() {
  const [currentView, setCurrentView] = useState('dashboard');

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
      case 'dashboard': return <Dashboard onNavigate={setCurrentView} />;
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
      default: return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <AdminLayout
      currentView={currentView}
      onNavigate={setCurrentView}
      pageTitle={activeMeta.title}
      pageSubtitle={activeMeta.subtitle}
    >
      {renderActiveView()}
    </AdminLayout>
  );
}

function ManagerPortal() {
  const { selectTask } = useManager();
  const [activeTab, setActiveTab] = useState<ManagerTabType>('dashboard');

  const handleNavigateToTask = (taskId: number) => {
    selectTask(taskId);
    setActiveTab('task-detail');
  };

  return (
    <ManagerLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && (
        <ManagerDashboard
          onNavigateToTask={handleNavigateToTask}
          onNavigateToQueue={() => setActiveTab('tasks')}
        />
      )}
      {activeTab === 'talent' && <SearchTalent />}
      {activeTab === 'tasks' && <ManagerTasks onSelectTask={handleNavigateToTask} />}
      {activeTab === 'task-detail' && <ReviewDeliverables onBack={() => setActiveTab('tasks')} />}
      {activeTab === 'profile' && <ManagerProfile />}
    </ManagerLayout>
  );
}

function ClientPortal() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [navParams, setNavParams] = useState<Record<string, string> | undefined>();

  const handleNavigate = (viewId: string, params?: Record<string, string>) => {
    setCurrentView(viewId);
    setNavParams(params);
  };

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return <ClientDashboard onNavigate={handleNavigate} />;
      case 'my-gigs':
        return <MyGigs onNavigate={handleNavigate} />;
      case 'post-gig':
        return <PostGig onNavigate={handleNavigate} />;
      case 'search-talent':
        return <ClientSearchTalent onNavigate={handleNavigate} />;
      case 'total-spent':
        return <TotalSpent onNavigate={handleNavigate} />;
      case 'review-deliverables':
        return <ClientReviewDeliverables onNavigate={handleNavigate} params={navParams} />;
      case 'review-shortlist':
        return <ReviewShortlist onNavigate={handleNavigate} />;
      case 'add-manager-flow':
      case 'add-manager':
        return <AddManagerFlow onNavigate={handleNavigate} />;
      default:
        return <ClientDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <ClientLayout currentView={currentView} onNavigate={handleNavigate}>
      {renderActiveView()}
    </ClientLayout>
  );
}

function GigProfessionalPortal() {
  const { user, logout } = useAuth();
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f6f6', fontFamily: 'Inter, sans-serif', padding: '40px 24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #dbdfdf' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #dbdfdf', paddingBottom: '20px', marginBottom: '24px' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#bf6900', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GIG PROFESSIONAL TALENT PORTAL</span>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#084b83', margin: '4px 0 0 0' }}>Welcome, {user?.name || 'Elena Rodriguez'}</h1>
          </div>
          <button
            onClick={() => logout()}
            style={{ padding: '8px 16px', backgroundColor: '#fce8e6', color: '#c5221f', border: '1px solid #fad2cf', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
          >
            Sign Out
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div style={{ padding: '20px', backgroundColor: '#EFF6FC', borderRadius: '12px', border: '1px solid #D5DDE0' }}>
            <span style={{ fontSize: '13px', color: '#805c54', fontWeight: 600 }}>Active Deliverables</span>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#084b83', marginTop: '6px' }}>4 Tasks</div>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#e6f4ea', borderRadius: '12px', border: '1px solid #ceead6' }}>
            <span style={{ fontSize: '13px', color: '#137333', fontWeight: 600 }}>Escrow Locked Earnings</span>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#137333', marginTop: '6px' }}>$12,450</div>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#fef7e0', borderRadius: '12px', border: '1px solid #feefc3' }}>
            <span style={{ fontSize: '13px', color: '#b06000', fontWeight: 600 }}>Reputation Rating</span>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#b06000', marginTop: '6px' }}>⭐ 4.95 / 5.0</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#FAFBFB', borderRadius: '12px', padding: '24px', border: '1px dashed #D5DDE0', textAlign: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#502419', margin: '0 0 8px 0' }}>Gig Deliverables & Submission Pipeline</h3>
          <p style={{ fontSize: '14px', color: '#805c54', maxWidth: '540px', margin: '0 auto 20px auto' }}>
            Freelancer task exploration, bid submission, and milestone deliverable submission module is actively synchronized across team verticals.
          </p>
        </div>
      </div>
    </div>
  );
}

function MainAppContent() {
  const { user, isAuthenticated, loading: authLoading, login } = useAuth();
  const [unauthView, setUnauthView] = useState<UnauthView>('login');

  if (authLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6F7', color: '#0D568D', fontWeight: 600 }}>
        Loading GigsForGigs...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    if (unauthView === 'landing') {
      return <LandingPage onNavigateToLogin={() => setUnauthView('login')} />;
    }
    return <Login onBackToLanding={() => setUnauthView('landing')} />;
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Universal Floating Role Switcher for Cross-Device Evaluation */}
      <div
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          zIndex: 9999,
          backgroundColor: '#084b83',
          color: '#ffffff',
          padding: '6px 12px',
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif'
        }}
      >
        <span style={{ fontWeight: 600, opacity: 0.8 }}>ROLE:</span>
        <select
          value={user.role}
          onChange={(e) => login(user.email, e.target.value)}
          style={{
            background: '#ffffff',
            color: '#084b83',
            border: 'none',
            borderRadius: '12px',
            padding: '2px 8px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <option value="SUPER_ADMIN">👑 Super Admin</option>
          <option value="MANAGER">👔 Manager</option>
          <option value="CLIENT">💼 Client</option>
          <option value="GIG_PROFESSIONAL">⚡ Gig Professional</option>
        </select>
      </div>

      {user.role === 'SUPER_ADMIN' && <SuperAdminPortal />}
      {user.role === 'MANAGER' && <ManagerPortal />}
      {user.role === 'CLIENT' && <ClientPortal />}
      {user.role === 'GIG_PROFESSIONAL' && <GigProfessionalPortal />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ManagerProvider>
        <ClientProvider>
          <ToastProvider>
            <MainAppContent />
          </ToastProvider>
        </ClientProvider>
      </ManagerProvider>
    </AuthProvider>
  );
}
