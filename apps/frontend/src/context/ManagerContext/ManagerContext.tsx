import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { managerApi } from '../../services/api/manager';
import type {
  ManagerProfile,
  ManagerTask,
  Deliverable,
  TalentProfile,
  CreateDeliverableDto,
  ReviewDeliverableDto,
  UpdateManagerProfileDto
} from '../../types/manager';
import { useAuth } from '../AuthContext/AuthContext';

interface ManagerContextType {
  profile: ManagerProfile | null;
  tasks: ManagerTask[];
  selectedTask: ManagerTask | null;
  deliverables: Deliverable[];
  talents: TalentProfile[];
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  selectTask: (taskId: number) => Promise<void>;
  addDeliverable: (taskId: number, dto: CreateDeliverableDto) => Promise<boolean>;
  reviewDeliverable: (taskId: number, deliverableNo: number, dto: ReviewDeliverableDto) => Promise<boolean>;
  closeDeliverable: (taskId: number, deliverableNo: number) => Promise<boolean>;
  searchTalent: (query?: string) => Promise<void>;
  updateProfile: (dto: UpdateManagerProfileDto) => Promise<boolean>;
}

const ManagerContext = createContext<ManagerContextType | undefined>(undefined);

export const ManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [profile, setProfile] = useState<ManagerProfile | null>(null);
  const [tasks, setTasks] = useState<ManagerTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<ManagerTask | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [talents, setTalents] = useState<TalentProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    try {
      const p = await managerApi.getProfile();
      setProfile(p);
    } catch (err: any) {
      setError(err.message || 'Failed to load manager profile');
    }
  }, []);

  const refreshTasks = useCallback(async () => {
    try {
      const tList = await managerApi.getAssignedTasks();
      setTasks(tList);
    } catch (err: any) {
      setError(err.message || 'Failed to load assigned tasks');
    }
  }, []);

  const selectTask = useCallback(async (taskId: number) => {
    setLoading(true);
    try {
      const task = await managerApi.getTaskById(taskId);
      setSelectedTask(task);
      if (task) {
        const dels = await managerApi.getTaskDeliverables(taskId);
        setDeliverables(dels);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  }, []);

  const addDeliverable = async (taskId: number, dto: CreateDeliverableDto): Promise<boolean> => {
    setLoading(true);
    try {
      await managerApi.createDeliverable(taskId, dto);
      await selectTask(taskId);
      await refreshTasks();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to create deliverable');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const reviewDeliverable = async (taskId: number, deliverableNo: number, dto: ReviewDeliverableDto): Promise<boolean> => {
    setLoading(true);
    try {
      await managerApi.reviewDeliverable(taskId, deliverableNo, dto);
      await selectTask(taskId);
      await refreshTasks();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to review deliverable');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const closeDeliverable = async (taskId: number, deliverableNo: number): Promise<boolean> => {
    setLoading(true);
    try {
      await managerApi.closeDeliverable(taskId, deliverableNo);
      await selectTask(taskId);
      await refreshTasks();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to close deliverable');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const searchTalent = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      const results = await managerApi.searchTalent(query);
      setTalents(results);
    } catch (err: any) {
      setError(err.message || 'Failed to search talent');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = async (dto: UpdateManagerProfileDto): Promise<boolean> => {
    setLoading(true);
    try {
      const updated = await managerApi.updateProfile(dto);
      setProfile(updated);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      Promise.all([refreshProfile(), refreshTasks(), searchTalent()]).finally(() => setLoading(false));
    }
  }, [isAuthenticated, refreshProfile, refreshTasks, searchTalent]);

  return (
    <ManagerContext.Provider
      value={{
        profile,
        tasks,
        selectedTask,
        deliverables,
        talents,
        loading,
        error,
        refreshProfile,
        refreshTasks,
        selectTask,
        addDeliverable,
        reviewDeliverable,
        closeDeliverable,
        searchTalent,
        updateProfile
      }}
    >
      {children}
    </ManagerContext.Provider>
  );
};

export const useManager = () => {
  const context = useContext(ManagerContext);
  if (!context) {
    throw new Error('useManager must be used within a ManagerProvider');
  }
  return context;
};

export default ManagerContext;
