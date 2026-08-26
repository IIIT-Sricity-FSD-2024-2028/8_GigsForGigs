import { useState } from 'react';
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

