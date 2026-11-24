/**
 * @file useGigNavigation.ts
 * @description Route-derived navigation for the gig portal (replaces the navigation half of
 * the removed GigContext). It holds no state: the current page and selected task/service come
 * from the URL, and the helpers just navigate.
 */
import { useLocation, useNavigate } from 'react-router-dom';

/** Every page the gig portal can show (App.tsx renders the matching component). */
export type GigViewTab =
  | 'dashboard' | 'explore' | 'my-services' | 'active-tasks' | 'applied-tasks' | 'service-requests'
  | 'completed-projects' | 'earnings' | 'submit-deliverables' | 'submission-success' | 'post-service'
  | 'service-published' | 'project-detail' | 'client-profile' | 'profile' | 'profile-completion';

/** Page the Client Profile was opened from, so its back button returns there. */
export type ClientProfileOrigin = 'applied-tasks' | 'project-detail';

export function gigTabFromPath(pathname: string): GigViewTab {
  return pathname.includes('/tasks/explore') ? 'explore'
    : pathname.includes('/tasks/active') ? 'active-tasks'
      : pathname.includes('/tasks/applied') ? 'applied-tasks'
        : pathname.includes('/tasks/') && pathname.endsWith('/submit') ? 'submit-deliverables'
          : pathname.includes('/tasks/') && pathname.endsWith('/submitted') ? 'submission-success'
            : pathname.includes('/tasks/') && pathname.endsWith('/client') ? 'client-profile'
              : pathname.includes('/tasks/') ? 'project-detail'
                : pathname.includes('/services/new') ? 'post-service'
                  : pathname.includes('/services/published') ? 'service-published'
                    : pathname.includes('/services/') && pathname.endsWith('/requests') ? 'service-requests'
                      : pathname.includes('/services') ? 'my-services'
                        : pathname.includes('/projects/completed') ? 'completed-projects'
                          : pathname.includes('/earnings') ? 'earnings'
                            : pathname.includes('/profile/complete') ? 'profile-completion'
                              : pathname.includes('/profile') ? 'profile' : 'dashboard';
}

export function useGigNavigation() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const activeTab = gigTabFromPath(pathname);
  const selectedTaskId = pathname.match(/\/tasks\/(\d+)(?:\/|$)/)?.[1] || null;
  const selectedServiceId = pathname.match(/\/services\/(\d+)\/requests$/)?.[1] || null;

  const setActiveTab = (tab: GigViewTab) => {
    const id = selectedTaskId;
    const paths: Record<GigViewTab, string> = {
      dashboard: '/gig/dashboard', explore: '/gig/tasks/explore', 'my-services': '/gig/services',
      'active-tasks': '/gig/tasks/active', 'applied-tasks': '/gig/tasks/applied',
      'service-requests': selectedServiceId ? `/gig/services/${selectedServiceId}/requests` : '/gig/services',
      'completed-projects': '/gig/projects/completed', earnings: '/gig/earnings',
      'submit-deliverables': id ? `/gig/tasks/${id}/submit` : '/gig/tasks/active',
      'submission-success': id ? `/gig/tasks/${id}/submitted` : '/gig/tasks/active',
      'post-service': '/gig/services/new', 'service-published': '/gig/services/published',
      'project-detail': id ? `/gig/tasks/${id}` : '/gig/tasks/active',
      'client-profile': id ? `/gig/tasks/${id}/client` : '/gig/tasks/applied',
      profile: '/gig/profile', 'profile-completion': '/gig/profile/complete',
    };
    navigate(paths[tab]);
  };

  return {
    activeTab,
    setActiveTab,
    selectedTaskId,
    selectedServiceId,
    navigateToTaskDetail: (taskId: string) => navigate(`/gig/tasks/${taskId}`),
    navigateToSubmitDeliverable: (taskId: string) => navigate(`/gig/tasks/${taskId}/submit`),
    navigateToClientProfile: (taskId: string, from: ClientProfileOrigin) => navigate(`/gig/tasks/${taskId}/client`, { state: { from } }),
    navigateToServiceRequests: (serviceId: string) => navigate(`/gig/services/${serviceId}/requests`),
  };
}
