import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext/AuthContext';
import { ManagerProvider, useManager } from './context/ManagerContext/ManagerContext';
import { GigProvider, useGig } from './context/GigContext/GigContext';

// Layouts
import { ManagerLayout } from './layouts/ManagerLayout/ManagerLayout';
import { GigLayout } from './layouts/GigLayout/GigLayout';

// Manager Pages
import { ManagerDashboard } from './pages/manager/ManagerDashboard/ManagerDashboard';
import { SearchTalent } from './pages/manager/SearchTalent/SearchTalent';
import { ManagerTasks } from './pages/manager/ManagerTasks/ManagerTasks';
import { ReviewDeliverables } from './pages/manager/ReviewDeliverables/ReviewDeliverables';
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

// Auth & Public Pages
import { Login } from './pages/auth/Login/Login';
import { LandingPage } from './pages/public/LandingPage/LandingPage';

type ManagerTabType = 'dashboard' | 'talent' | 'tasks' | 'task-detail' | 'profile';
type UnauthView = 'landing' | 'login';

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
      {managerActiveTab === 'talent' && <SearchTalent />}
      {managerActiveTab === 'tasks' && (
        <ManagerTasks onSelectTask={handleNavigateToTask} />
      )}
      {managerActiveTab === 'task-detail' && (
        <ReviewDeliverables onBack={() => setManagerActiveTab('tasks')} />
      )}
      {managerActiveTab === 'profile' && <ManagerProfile />}
    </ManagerLayout>
  );
}

/**
 * Main application router deciding layout and portal shell based on user role.
 */
function MainAppContent() {
  const { user } = useAuth();
  const [unauthView, setUnauthView] = useState<UnauthView>('landing');

  if (!user) {
    if (unauthView === 'landing') {
      return <LandingPage onNavigateToLogin={() => setUnauthView('login')} />;
    }
    return <Login onBackToLanding={() => setUnauthView('landing')} />;
  }

  // Role-based Layout Switcher
  if (user.role === 'GIG_PROFESSIONAL') {
    return (
      <GigProvider>
        <GigAppContent />
      </GigProvider>
    );
  }

  // Default to Manager Portal shell for Manager role or fallback
  return (
    <ManagerProvider>
      <ManagerAppContent />
    </ManagerProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
