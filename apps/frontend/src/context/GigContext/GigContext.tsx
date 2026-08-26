/**
 * @file GigContext.tsx
 * @description
 * React Context provider managing state navigation and task selections for the
 * Gig Professional portal. Holds active sub-view state, selected task references,
 * pending request counts, and triggers for dynamic data re-fetching.
 */

import React, { createContext, useContext, useState } from 'react';

export type GigViewTab =
  | 'dashboard'
  | 'explore'
  | 'active-tasks'
  | 'pending-requests'
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
  selectedTaskId: string | null;
  setSelectedTaskId: (taskId: string | null) => void;
  navigateToTaskDetail: (taskId: string) => void;
  navigateToSubmitDeliverable: (taskId: string) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const GigContextInstance = createContext<GigContextType | undefined>(undefined);

/**
 * GigProvider component wrapping Gig Professional views.
 */
export const GigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<GigViewTab>('dashboard');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const navigateToTaskDetail = (taskId: string) => {
    setSelectedTaskId(taskId);
    setActiveTab('project-detail');
  };

  const navigateToSubmitDeliverable = (taskId: string) => {
    setSelectedTaskId(taskId);
    setActiveTab('submit-deliverables');
  };

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <GigContextInstance.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedTaskId,
        setSelectedTaskId,
        navigateToTaskDetail,
        navigateToSubmitDeliverable,
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
