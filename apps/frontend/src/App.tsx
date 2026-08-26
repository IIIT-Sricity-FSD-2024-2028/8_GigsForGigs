import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext/AuthContext';
import { ClientProvider } from './context/ClientContext/ClientContext';
import { ManagerProvider, useManager } from './context/ManagerContext/ManagerContext';
import { GigProvider, useGig } from './context/GigContext/GigContext';

// Layouts
import { ClientLayout } from './layouts/ClientLayout/ClientLayout';
import { ManagerLayout } from './layouts/ManagerLayout/ManagerLayout';
import { GigLayout } from './layouts/GigLayout/GigLayout';

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

// Gig Professional Pages
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

type UnauthView = 'landing' | 'login';
type ManagerTabType = 'dashboard' | 'talent' | 'tasks' | 'task-detail' | 'profile';

/**
 * Inner view component rendered when active user is a Gig Professional.
 */
function GigAppContent() {
  const { activeTab } = useGig();

  return (
    <GigLayout>
      {activeTab === 'dashboard' && <GigDashboard />}
      {activeTab === 'explore' && <ExploreTasks />}
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
 * Inner view component rendered when active user is a Manager.
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
 * Main application router deciding layout and portal shell based on user role.
 */
function MainAppContent() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [unauthView, setUnauthView] = useState<UnauthView>('landing');
  const [clientView, setClientView] = useState<string>('dashboard');

  if (authLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6F7', color: '#0D568D', fontWeight: 600 }}>
        Loading GigsForGigs Workspace...
      </div>
    );
  }

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
    return (
      <ManagerProvider>
        <ManagerAppContent />
      </ManagerProvider>
    );
  }

  // 3. Gig Professional Flow (Incoming branch flow)
  if (user.role === 'GIG_PROFESSIONAL') {
    return (
      <GigProvider>
        <GigAppContent />
      </GigProvider>
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
    setClientView(viewId);
  };

  return (
    <ClientProvider>
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
    </ClientProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
