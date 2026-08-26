import React, { createContext, useContext, useState } from 'react';
import { useAuth } from '../AuthContext';

export interface Task {
  task_id: string;
  title: string;
  description: string;
  budget: number;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'REVIEWING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  skills?: string[];
  category?: string;
  duration?: string;
}

export interface ManagerInvite {
  invite_id: string;
  client_id: string;
  name: string;
  email: string;
  status: 'PENDING' | 'ACCEPTED';
  createdAt: string;
}

export interface Service {
  service_id: string;
  title: string;
  price: number;
  description: string;
  skills: string[];
  user?: { name: string; email: string };
  gig_profile_id: string;
}

export interface Contract {
  contract_id: string;
  task_id: string;
  task_title: string;
  gig_pro_name: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'SCHEDULED' | 'REVIEWING';
  progress: number;
  budget: number;
  createdAt: string;
}

export interface Deliverable {
  task_id: string;
  deliverable_no: number;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'REVISION_REQUESTED';
  createdAt: string;
}

export interface Application {
  application_id: string;
  task_id: string;
  task_title: string;
  gig_profile_id: string;
  candidate_name: string;
  candidate_role: string;
  status: 'PENDING' | 'SHORTLISTED' | 'REJECTED';
  rating: number;
  rate: number;
  createdAt: string;
}

interface ClientContextType {
  tasks: Task[];
  managers: ManagerInvite[];
  services: Service[];
  contracts: Contract[];
  deliverables: Deliverable[];
  applications: Application[];
  addTask: (title: string, description: string, budget: number, category?: string, duration?: string, skills?: string) => Promise<void>;
  updateTask: (taskId: string, title: string, description: string, budget: number) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  inviteManager: (name: string, email: string) => Promise<void>;
  updateManager: (inviteId: string, name: string, email: string) => Promise<void>;
  deleteManager: (inviteId: string) => Promise<void>;
  approveDeliverable: (taskId: string, deliverableNo: number) => Promise<void>;
  rejectDeliverable: (taskId: string) => Promise<void>;
  hireCandidate: (applicationId: string) => Promise<void>;
  rejectCandidate: (applicationId: string) => Promise<void>;
  requestService: (serviceId: string) => Promise<void>;
  requestedServices: Set<string>;
}

const ClientContextInstance = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Tasks state
  const [tasks, setTasks] = useState<Task[]>(() => [
    { task_id: 'task-1', title: 'Brand Identity Redesign', description: 'Redesign website and marketing material logos.', budget: 2400, status: 'IN_PROGRESS', createdAt: '2026-08-10', category: 'design', skills: ['Figma', 'Vector'] },
    { task_id: 'task-2', title: 'Q3 Marketing Strategy', description: 'Formulate search engine advertising campaigns.', budget: 1850, status: 'REVIEWING', createdAt: '2026-08-12', category: 'marketing', skills: ['Ads', 'SEO'] },
    { task_id: 'task-3', title: 'Mobile App Development', description: 'Create React Native client portal screens.', budget: 5000, status: 'OPEN', createdAt: '2026-08-20', category: 'dev', skills: ['React Native', 'Firebase'] },
  ]);

  // Managers state
  const [managers, setManagers] = useState<ManagerInvite[]>(() => [
    { invite_id: 'inv-1', client_id: 'cli-01', name: 'David Vance', email: 'david@prismaventures.io', status: 'ACCEPTED', createdAt: '2026-08-01' },
    { invite_id: 'inv-2', client_id: 'cli-01', name: 'Chloe Dubois', email: 'chloe@kineticmedia.com', status: 'ACCEPTED', createdAt: '2026-08-05' },
  ]);

  // Services state
  const [services] = useState<Service[]>([
    { service_id: 'srv-1', title: 'Interactive WebGL 3D Product Configurator', price: 4200, description: 'High performance interactive configurator with shaders.', skills: ['ThreeJS', 'WebGL', 'React'], gig_profile_id: 'gig-03', user: { name: 'Mateo Rossi', email: 'mateo@rossi.dev' } },
    { service_id: 'srv-2', title: 'Full Stack Dashboard & API', price: 6200, description: 'Node.js, Express, React, PostgreSQL production-ready dashboard.', skills: ['React', 'Node.js', 'PostgreSQL'], gig_profile_id: 'gig-01', user: { name: 'Vikram Joshi', email: 'vikram@joshi.com' } },
    { service_id: 'srv-3', title: 'Technical Copywriting & Landing Copy', price: 800, description: 'Conversion focused copy and product briefs.', skills: ['Copywriting', 'SEO', 'Strategy'], gig_profile_id: 'gig-02', user: { name: 'Sarah Jenkins', email: 'sarah@jenkins.io' } },
  ]);

  // Contracts state
  const [contracts, setContracts] = useState<Contract[]>(() => [
    { contract_id: 'con-1', task_id: 'task-1', task_title: 'Brand Identity Redesign', gig_pro_name: 'Elena Rodriguez', status: 'IN_PROGRESS', progress: 65, budget: 2400, createdAt: '2026-08-10' },
    { contract_id: 'con-2', task_id: 'task-3', task_title: 'Mobile App Development', gig_pro_name: 'David Lau', status: 'SCHEDULED', progress: 8, budget: 5000, createdAt: '2026-08-21' },
    { contract_id: 'con-3', task_id: 'task-2', task_title: 'Q3 Marketing Strategy', gig_pro_name: 'Sarah Jenkins', status: 'REVIEWING', progress: 100, budget: 1850, createdAt: '2026-08-12' },
  ]);

  // Deliverables state
  const [deliverables, setDeliverables] = useState<Deliverable[]>(() => [
    { task_id: 'task-2', deliverable_no: 1, content: 'Hi Team! I have attached the final brand guidelines PDF as well as the ZIP file containing all vector formats for the new logo. Let me know if you need any adjustments before approval. Thanks for the great project!', status: 'PENDING', createdAt: '2026-08-25' }
  ]);

  // Applications state (shortlist page candidate list)
  const [applications, setApplications] = useState<Application[]>(() => [
    { application_id: 'app-1', task_id: 'task-3', task_title: 'Mobile App Development', gig_profile_id: 'gig-03', candidate_name: 'Alex Rivera', candidate_role: 'Full Stack Developer', status: 'SHORTLISTED', rating: 4.9, rate: 85, createdAt: '2026-08-22' },
    { application_id: 'app-2', task_id: 'task-2', task_title: 'Q3 Marketing Strategy', gig_profile_id: 'gig-02', candidate_name: 'Sarah Jenkins', candidate_role: 'Digital Marketing Specialist', status: 'SHORTLISTED', rating: 4.7, rate: 60, createdAt: '2026-08-24' }
  ]);

  // Requested services tracking
  const [requestedServices, setRequestedServices] = useState<Set<string>>(new Set());

  const addTask = async (title: string, description: string, budget: number, category?: string, duration?: string, skills?: string) => {
    const newTask: Task = {
      task_id: 'task-' + Date.now(),
      title,
      description,
      budget,
      status: 'OPEN',
      createdAt: new Date().toISOString().split('T')[0],
      category: category || 'dev',
      duration: duration || '1-3-months',
      skills: skills ? skills.split(',').map(s => s.trim()) : [],
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const updateTask = async (taskId: string, title: string, description: string, budget: number) => {
    setTasks(prev => prev.map(t => t.task_id === taskId ? { ...t, title, description, budget } : t));
  };

  const deleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.task_id !== taskId));
    setContracts(prev => prev.filter(c => c.task_id !== taskId));
  };

  const inviteManager = async (name: string, email: string) => {
    const newInvite: ManagerInvite = {
      invite_id: 'inv-' + Date.now(),
      client_id: user?.userId || 'cli-01',
      name,
      email,
      status: 'PENDING',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setManagers(prev => [...prev, newInvite]);
  };

  const updateManager = async (inviteId: string, name: string, email: string) => {
    setManagers(prev => prev.map(m => m.invite_id === inviteId ? { ...m, name, email } : m));
  };

  const deleteManager = async (inviteId: string) => {
    setManagers(prev => prev.filter(m => m.invite_id !== inviteId));
  };

  const approveDeliverable = async (taskId: string, deliverableNo: number) => {
    setDeliverables(prev => prev.map(d => (d.task_id === taskId && d.deliverable_no === deliverableNo) ? { ...d, status: 'APPROVED' } : d));
    // Set task to completed
    setTasks(prev => prev.map(t => t.task_id === taskId ? { ...t, status: 'COMPLETED' } : t));
    // Update contract status
    setContracts(prev => prev.map(c => c.task_id === taskId ? { ...c, status: 'COMPLETED', progress: 100 } : c));
  };

  const rejectDeliverable = async (taskId: string) => {
    setDeliverables(prev => prev.map(d => d.task_id === taskId ? { ...d, status: 'REVISION_REQUESTED' } : d));
    setTasks(prev => prev.map(t => t.task_id === taskId ? { ...t, status: 'IN_PROGRESS' } : t));
  };

  const hireCandidate = async (applicationId: string) => {
    setApplications(prev => prev.map(a => a.application_id === applicationId ? { ...a, status: 'PENDING' } : a));
    // Hire professional: update task state, contract, etc.
    const app = applications.find(a => a.application_id === applicationId);
    if (app) {
      setTasks(prev => prev.map(t => t.task_id === app.task_id ? { ...t, status: 'IN_PROGRESS' } : t));
      // Update contract state to In Progress
      setContracts(prev => prev.map(c => c.task_id === app.task_id ? { ...c, status: 'IN_PROGRESS', gig_pro_name: app.candidate_name } : c));
    }
  };

  const rejectCandidate = async (applicationId: string) => {
    setApplications(prev => prev.filter(a => a.application_id !== applicationId));
  };

  const requestService = async (serviceId: string) => {
    setRequestedServices(prev => {
      const next = new Set(prev);
      next.add(serviceId);
      return next;
    });
  };

  return (
    <ClientContextInstance.Provider value={{
      tasks,
      managers,
      services,
      contracts,
      deliverables,
      applications,
      addTask,
      updateTask,
      deleteTask,
      inviteManager,
      updateManager,
      deleteManager,
      approveDeliverable,
      rejectDeliverable,
      hireCandidate,
      rejectCandidate,
      requestService,
      requestedServices,
    }}>
      {children}
    </ClientContextInstance.Provider>
  );
};

export const useClient = () => {
  const context = useContext(ClientContextInstance);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
};

export default ClientProvider;
