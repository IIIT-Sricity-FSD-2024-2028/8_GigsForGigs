import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext/AuthContext';
import { ClientProvider } from './context/ClientContext/ClientContext';
import { ManagerProvider, useManager } from './context/ManagerContext/ManagerContext';

// Layouts
import { ClientLayout } from './layouts/ClientLayout/ClientLayout';
import { ManagerLayout } from './layouts/ManagerLayout/ManagerLayout';

// Public & Auth Pages
import { LandingPage } from './pages/public/LandingPage/LandingPage';
import { Login } from './pages/auth/Login/Login';

// Client Pages
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

// Manager Pages
import { ManagerDashboard } from './pages/manager/ManagerDashboard/ManagerDashboard';
import { SearchTalent as ManagerSearchTalent } from './pages/manager/SearchTalent/SearchTalent';
import { ManagerTasks } from './pages/manager/ManagerTasks/ManagerTasks';
import { ReviewDeliverables as ManagerReviewDeliverables } from './pages/manager/ReviewDeliverables/ReviewDeliverables';
import { ManagerProfile } from './pages/manager/ManagerProfile/ManagerProfile';

type UnauthView = 'landing' | 'login';
type ManagerTabType = 'dashboard' | 'talent' | 'tasks' | 'task-detail' | 'profile';

function MainAppContent() {
  const { user, isAuthenticated, loading: authLoading, login } = useAuth();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { selectTask } = useManager();

  // Navigation states
  const [unauthView, setUnauthView] = useState<UnauthView>('landing');
  const [clientView, setClientView] = useState<string>('dashboard');
  const [managerTab, setManagerTab] = useState<ManagerTabType>('dashboard');

  if (authLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6F7', color: '#0D568D', fontWeight: 600 }}>
        Loading GigsForGigs Workspace...
      </div>
    );
  }

  // 1. Unauthenticated Visitor Flow (Landing Page -> Login)
  // 1. Unauthenticated Visitor Flow (ALWAYS starts on Landing Page!)
  if (!isAuthenticated || !user) {
    if (unauthView === 'landing') {
      return <LandingPage onNavigateToLogin={() => setUnauthView('login')} />;
    }
    return <Login onBackToLanding={() => setUnauthView('landing')} />;
  }

  // Helper to handle Logout and return to Landing Page
  const handleLogoutToLanding = () => {
    logout();
    setUnauthView('landing');
  };

  // 2. Manager Portal Flow
  if (user.role === 'MANAGER') {
    const handleNavigateToManagerTask = (taskId: number) => {
      selectTask(taskId);
      setManagerTab('task-detail');
    };

    return (
      <ManagerLayout activeTab={managerTab} setActiveTab={setManagerTab}>
        {managerTab === 'dashboard' && (
          <ManagerDashboard
            onNavigateToTask={handleNavigateToManagerTask}
            onNavigateToQueue={() => setManagerTab('tasks')}
          />
        )}
        {managerTab === 'talent' && <ManagerSearchTalent />}
        {managerTab === 'tasks' && (
          <ManagerTasks onSelectTask={handleNavigateToManagerTask} />
        )}
        {managerTab === 'task-detail' && (
          <ManagerReviewDeliverables onBack={() => setManagerTab('tasks')} />
        )}
        {managerTab === 'profile' && <ManagerProfile />}
      </ManagerLayout>
    );
  }

  // 3. Client Portal Flow (Default for CLIENT / SUPER_ADMIN)
  // 3. Gig Professional Flow
  if (user.role === 'GIG_PROFESSIONAL') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#EFF6F7', padding: '48px', fontFamily: 'sans-serif' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '16px', border: '1px solid #D9E0E3', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '24px', color: '#0D568D', margin: 0, fontWeight: 700 }}>
              Welcome, {user.name}! (Gig Professional)
            </h1>
          </div>
          <p style={{ color: '#76594F', fontSize: '15px', lineHeight: 1.6 }}>
            You are logged in as a Gig Professional (User ID: {user.userId}, Email: {user.email}). You can browse tasks, submit deliverables, and track client reviews.
          </p>
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <button
              onClick={handleLogoutToLanding}
              style={{ padding: '10px 20px', backgroundColor: '#0D568D', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
            >
              Logout to Landing Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Super Admin Flow
  if (user.role === 'SUPER_ADMIN') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#EFF6F7', padding: '48px', fontFamily: 'sans-serif' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '16px', border: '1px solid #D9E0E3', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <h1 style={{ fontSize: '24px', color: '#0D568D', margin: '0 0 12px 0', fontWeight: 700 }}>
            Super Admin Control Center
          </h1>
          <p style={{ color: '#76594F', fontSize: '15px', lineHeight: 1.6 }}>
            Logged in as {user.name} ({user.email}) with full platform administration privileges.
          </p>
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <button
              onClick={handleLogoutToLanding}
              style={{ padding: '10px 20px', backgroundColor: '#0D568D', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
            >
              Logout to Landing Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Client Portal Flow (Default for CLIENT)
  const handleClientNavigate = (viewId: string, _params?: Record<string, string>) => {
    if (viewId === 'manager-dashboard') {
      login(user.email, 'MANAGER', 'Leo Hudson');
      return;
    }
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
      {clientView === 'review-deliverables' && <ClientReviewDeliverables onNavigate={handleClientNavigate} />}
      {clientView === 'review-shortlist' && <ReviewShortlist onNavigate={handleClientNavigate} />}
    </ClientLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ClientProvider>
        <ManagerProvider>
          <MainAppContent />
        </ManagerProvider>
      </ClientProvider>
    </AuthProvider>
  );
}
