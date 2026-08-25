import { useState } from 'react';
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

// Client Portal Imports
import { useAuth } from './context/AuthContext';
import { ClientLayout } from './layouts/ClientLayout';
import { ClientDashboard } from './pages/client/ClientDashboard';
import { SearchTalent } from './pages/client/SearchTalent';
import { MyGigs } from './pages/client/MyGigs';
import { TotalSpent } from './pages/client/TotalSpent';
import { ReviewDeliverables } from './pages/client/ReviewDeliverables';
import { ReviewShortlist } from './pages/client/ReviewShortlist';
import { PostGig } from './pages/client/PostGig';
import { ClientProfileSelection } from './pages/client/ClientProfileSelection';
import { AddManager } from './pages/client/AddManager';
import { AddManagerFlow } from './pages/client/AddManagerFlow';
import { ClientProfileCompletion } from './pages/client/ClientProfileCompletion';

/**
 * @file App.tsx
 * @description
 * Root application component for GigsForGigs.
 * Mounts Super Admin Portal or Client Portal based on active session role.
 */

export function App() {
  const { user, login } = useAuth();
  
  // Super Admin view state
  const [adminView, setAdminView] = useState('dashboard');
  
  // Client view state
  const [clientView, setClientView] = useState('profile-selection');
  const [clientParams, setClientParams] = useState<Record<string, string>>({});

  const navigateClient = (view: string, params?: Record<string, string>) => {
    setClientView(view);
    if (params) {
      setClientParams(params);
    } else {
      setClientParams({});
    }
  };

  const isClientRole = user?.role === 'CLIENT' || user?.role === 'MANAGER';

  // Toggle Portal Role Helper
  const handlePortalToggle = async (role: 'SUPER_ADMIN' | 'CLIENT') => {
    if (role === 'CLIENT') {
      await login('aditya@gigsforgigs.com', 'CLIENT');
      setClientView('profile-selection');
    } else {
      await login('admin@gigsforgigs.com', 'SUPER_ADMIN');
      setAdminView('dashboard');
    }
  };

  // ──── RENDER CLIENT PORTAL ───────────────────────────────────────
  if (isClientRole) {
    const renderActiveClientView = () => {
      switch (clientView) {
        case 'dashboard':
          return <ClientDashboard onNavigate={navigateClient} />;
        case 'search-talent':
          return <SearchTalent onNavigate={navigateClient} />;
        case 'my-gigs':
          return <MyGigs onNavigate={navigateClient} />;
        case 'total-spent':
          return <TotalSpent onNavigate={navigateClient} />;
        case 'review-deliverables':
          return <ReviewDeliverables onNavigate={navigateClient} params={clientParams} />;
        case 'review-shortlist':
          return <ReviewShortlist onNavigate={navigateClient} params={clientParams} />;
        case 'post-gig':
          return <PostGig onNavigate={navigateClient} params={clientParams} />;
        case 'profile-selection':
          return <ClientProfileSelection onNavigate={navigateClient} />;
        case 'add-manager':
          return <AddManager onNavigate={navigateClient} />;
        case 'add-manager-flow':
          return <AddManagerFlow onNavigate={navigateClient} />;
        case 'profile-completion':
          return <ClientProfileCompletion onNavigate={navigateClient} />;
        default:
          return <ClientDashboard onNavigate={navigateClient} />;
      }
    };

    return (
      <>
        <ClientLayout currentView={clientView} onNavigate={navigateClient}>
          {renderActiveClientView()}
        </ClientLayout>
        {renderPortalSwitcher()}
      </>
    );
  }

  // ──── RENDER SUPER ADMIN PORTAL ──────────────────────────────────
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

  const activeMeta = viewMetadata[adminView] || { title: 'Super Admin', subtitle: 'GigsForGigs Portal' };

  const renderActiveAdminView = () => {
    switch (adminView) {
      case 'dashboard':
        return <Dashboard onNavigate={setAdminView} />;
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
        return <Dashboard onNavigate={setAdminView} />;
    }
  };

  function renderPortalSwitcher() {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: 'var(--color-primary-dark)',
          color: '#fff',
          padding: '10px 16px',
          borderRadius: '30px',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          fontSize: '0.85rem',
          fontWeight: 600,
          zIndex: 100000,
          border: '2px solid var(--color-primary-blue)'
        }}
      >
        <span>Portal:</span>
        <button
          onClick={() => handlePortalToggle('SUPER_ADMIN')}
          style={{
            background: user?.role === 'SUPER_ADMIN' ? 'var(--color-primary-blue)' : 'transparent',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '12px',
            fontWeight: 600
          }}
        >
          Super Admin
        </button>
        <button
          onClick={() => handlePortalToggle('CLIENT')}
          style={{
            background: isClientRole ? 'var(--color-primary-blue)' : 'transparent',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '12px',
            fontWeight: 600
          }}
        >
          Client
        </button>
      </div>
    );
  }

  return (
    <>
      <AdminLayout
        currentView={adminView}
        onNavigate={setAdminView}
        pageTitle={activeMeta.title}
        pageSubtitle={activeMeta.subtitle}
      >
        {renderActiveAdminView()}
      </AdminLayout>
      {renderPortalSwitcher()}
    </>
  );
}

export default App;

