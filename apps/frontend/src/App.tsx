import { useState } from 'react';
<<<<<<< HEAD
import { AuthProvider, useAuth } from './context/AuthContext/AuthContext';
import { ManagerProvider, useManager } from './context/ManagerContext/ManagerContext';
import { ManagerLayout } from './layouts/ManagerLayout/ManagerLayout';
import { ManagerDashboard } from './pages/manager/ManagerDashboard/ManagerDashboard';
import { SearchTalent } from './pages/manager/SearchTalent/SearchTalent';
import { ManagerTasks } from './pages/manager/ManagerTasks/ManagerTasks';
import { ReviewDeliverables } from './pages/manager/ReviewDeliverables/ReviewDeliverables';
import { ManagerProfile } from './pages/manager/ManagerProfile/ManagerProfile';
import { Login } from './pages/auth/Login/Login';
import { LandingPage } from './pages/public/LandingPage/LandingPage';

type TabType = 'dashboard' | 'talent' | 'tasks' | 'task-detail' | 'profile';
type UnauthView = 'landing' | 'login';

function MainAppContent() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { selectTask } = useManager();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [unauthView, setUnauthView] = useState<UnauthView>('landing');

  if (authLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6F7', color: '#0D568D', fontWeight: 600 }}>
        Loading GigsForGigs...
      </div>
    );
  }

  if (!isAuthenticated) {
    if (unauthView === 'landing') {
      return <LandingPage onNavigateToLogin={() => setUnauthView('login')} />;
    }
    return <Login onBackToLanding={() => setUnauthView('landing')} />;
  }

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
      {activeTab === 'tasks' && (
        <ManagerTasks onSelectTask={handleNavigateToTask} />
      )}
      {activeTab === 'task-detail' && (
        <ReviewDeliverables onBack={() => setActiveTab('tasks')} />
      )}
      {activeTab === 'profile' && <ManagerProfile />}
    </ManagerLayout>
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
=======
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

/**
 * @file App.tsx
 * @description
 * Root application component for GigsForGigs Super Admin Portal.
 * Mounts the high-fidelity AdminLayout shell and handles client-side state routing across all 12 views.
 */

export function App() {
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
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentView} />;
      case 'analytics':
        return <AdminAnalytics />;
      case 'clients':
        return <ClientManagement />;
      case 'gig-pros':
        return <GigProfessionalManagement />;
      case 'managers':
        return <ManagersManagement />;
      case 'projects':
        return <Projects />;
      case 'payments':
        return <PaymentsRevenue />;
      case 'reviews':
        return <Reviews />;
      case 'disputes':
        return <DisputesReports />;
      case 'admin-staff':
        return <AdminManagement />;
      case 'profile':
        return <AdminProfile />;
      case 'settings':
        return <PlatformSettings />;
      default:
        return <Dashboard onNavigate={setCurrentView} />;
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

export default App;
>>>>>>> bffc740dcf73c05e38146f5142d0d898fd4e0199
