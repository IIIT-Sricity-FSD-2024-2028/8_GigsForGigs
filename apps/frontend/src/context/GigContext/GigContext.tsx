/**
 * @file GigContext.tsx
 * @description
 * React Context provider managing state navigation and task selections for the
 * Gig Professional portal. Holds active sub-view state, selected task references,
 * pending request counts, and triggers for dynamic data re-fetching.
 */

import React, { createContext, useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/** Every page the gig portal can show (App.tsx renders the matching component). */
export type GigViewTab =
  | 'dashboard'
  | 'explore'
  | 'my-services'
  | 'active-tasks'
  | 'applied-tasks'
  | 'service-requests'
  | 'completed-projects'
  | 'earnings'
  | 'submit-deliverables'
  | 'submission-success'
  | 'post-service'
  | 'service-published'
  | 'project-detail'
  | 'profile'
  | 'profile-completion';

interface GigContextType {
  activeTab: GigViewTab;
  setActiveTab: (tab: GigViewTab) => void;
  /** Text typed in the header search box; ExploreTasks filters the marketplace by it. */
  taskSearch: string;
  setTaskSearch: (text: string) => void;
  /** Task opened on the detail / submit pages. */
  selectedTaskId: string | null;
  navigateToTaskDetail: (taskId: string) => void;
  navigateToSubmitDeliverable: (taskId: string) => void;
  /** Service whose incoming requests page is open. */
  selectedServiceId: string | null;
  navigateToServiceRequests: (serviceId: string) => void;
  /** A counter pages can put in effect deps; bump it with triggerRefresh() to make them re-fetch. */
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const GigContextInstance = createContext<GigContextType | undefined>(undefined);

/**
 * GigProvider component wrapping Gig Professional views.
 */
export const GigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [taskSearch, setTaskSearch] = useState('');
  const pathname = location.pathname;
  const activeTab: GigViewTab = pathname.includes('/tasks/explore') ? 'explore'
    : pathname.includes('/tasks/active') ? 'active-tasks'
      : pathname.includes('/tasks/applied') ? 'applied-tasks'
      : pathname.includes('/tasks/') && pathname.endsWith('/submit') ? 'submit-deliverables'
        : pathname.includes('/tasks/') && pathname.endsWith('/submitted') ? 'submission-success'
          : pathname.includes('/tasks/') ? 'project-detail'
            : pathname.includes('/services/new') ? 'post-service'
              : pathname.includes('/services/published') ? 'service-published'
                : pathname.includes('/services/') && pathname.endsWith('/requests') ? 'service-requests'
                  : pathname.includes('/services') ? 'my-services'
                    : pathname.includes('/projects/completed') ? 'completed-projects'
                      : pathname.includes('/earnings') ? 'earnings'
                        : pathname.includes('/profile/complete') ? 'profile-completion'
                          : pathname.includes('/profile') ? 'profile' : 'dashboard';
  const setActiveTab = (tab: GigViewTab) => {
    const id = selectedTaskId;
    const serviceId = selectedServiceId;
    const paths: Record<GigViewTab, string> = {
      dashboard: '/gig/dashboard', explore: '/gig/tasks/explore', 'my-services': '/gig/services',
      'active-tasks': '/gig/tasks/active', 'applied-tasks': '/gig/tasks/applied',
      'service-requests': serviceId ? `/gig/services/${serviceId}/requests` : '/gig/services',
      'completed-projects': '/gig/projects/completed', earnings: '/gig/earnings',
      'submit-deliverables': id ? `/gig/tasks/${id}/submit` : '/gig/tasks/active',
      'submission-success': id ? `/gig/tasks/${id}/submitted` : '/gig/tasks/active',
      'post-service': '/gig/services/new', 'service-published': '/gig/services/published',
      'project-detail': id ? `/gig/tasks/${id}` : '/gig/tasks/active',
      profile: '/gig/profile', 'profile-completion': '/gig/profile/complete',
    };
    navigate(paths[tab]);
  };
  const selectedTaskId = pathname.match(/\/tasks\/(\d+)(?:\/|$)/)?.[1] || null;
  const selectedServiceId = pathname.match(/\/services\/(\d+)\/requests$/)?.[1] || null;

  // Shortcuts: remember the task, then switch page.
  const navigateToTaskDetail = (taskId: string) => {
    navigate(`/gig/tasks/${taskId}`);
  };

  const navigateToSubmitDeliverable = (taskId: string) => {
    navigate(`/gig/tasks/${taskId}/submit`);
  };

  const navigateToServiceRequests = (serviceId: string) => {
    navigate(`/gig/services/${serviceId}/requests`);
  };

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <GigContextInstance.Provider
      value={{
        activeTab,
        setActiveTab,
        taskSearch,
        setTaskSearch,
        selectedTaskId,
        navigateToTaskDetail,
        navigateToSubmitDeliverable,
        selectedServiceId,
        navigateToServiceRequests,
        refreshTrigger,
        triggerRefresh
      }}
    >
      {children}
    </GigContextInstance.Provider>
  );
};

/**
 * Custom React Hook to access GigContext state.
 */
export const useGig = () => {
  const context = useContext(GigContextInstance);
  if (context === undefined) {
    throw new Error('useGig must be used within a GigProvider');
  }
  return context;
};

export default GigProvider;
