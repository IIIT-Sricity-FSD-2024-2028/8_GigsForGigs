export enum UserRole {
  CLIENT = 'CLIENT',
  GIG = 'GIG',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export type CompositeKey = string;

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends Timestamps {
  user_id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface Client extends Timestamps {
  client_id: string;
  user_id: string;
}

export interface Manager extends Timestamps {
  client_id: string;
  manager_id: string;
  user_id: string;
}

export interface GigProfile extends Timestamps {
  gig_profile_id: string;
  user_id: string;
}

export interface Task extends Timestamps {
  task_id: string;
  client_id: string;
  title: string;
  description: string;
  budget: number;
  status: TaskStatus;
}

export interface Application extends Timestamps {
  application_id: string;
  gig_profile_id: string;
  task_id: string;
}

export interface Assignment extends Timestamps {
  gig_profile_id: string;
  task_id: string;
  manager_id: string;
}

export interface Deliverable extends Timestamps {
  task_id: string;
  deliverable_no: number;
  gig_profile_id: string;
  content: string;
}

export interface Payment extends Timestamps {
  payment_id: string;
  task_id: string;
  gig_profile_id: string;
  amount: number;
  paidAt: Date;
}

export interface Review extends Timestamps {
  review_id: string;
  reviewer_id: string;
  reviewee_id: string;
  task_id: string;
  rating: number;
  comment?: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface CreateClientInput {
  user_id: string;
}

export interface CreateManagerInput {
  client_id: string;
  user_id: string;
  manager_id?: string;
}

export interface CreateGigProfileInput {
  user_id: string;
}

export interface CreateTaskInput {
  client_id: string;
  title: string;
  description: string;
  budget: number;
  status?: TaskStatus;
}

export interface ApplyToTaskInput {
  gig_profile_id: string;
  task_id: string;
}

export interface AssignManagerInput {
  gig_profile_id: string;
  task_id: string;
  manager_id: string;
  client_id?: string;
}

export interface CreateDeliverableInput {
  task_id: string;
  deliverable_no?: number;
  gig_profile_id: string;
  content: string;
}

export interface CreatePaymentInput {
  task_id: string;
  gig_profile_id: string;
  amount: number;
  paidAt?: Date;
}

export interface CreateReviewInput {
  reviewer_id: string;
  reviewee_id: string;
  task_id: string;
  rating: number;
  comment?: string;
}
