import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext/AuthContext';
import { ManagerProvider, useManager } from './context/ManagerContext/ManagerContext';

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
      {user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER' && <SuperAdminPortal />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ManagerProvider>
        <MainAppContent />
      </ManagerProvider>
    </AuthProvider>
  );
}
