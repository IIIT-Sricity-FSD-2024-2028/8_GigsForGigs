import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import {
  CreateUserInput,
  CreateClientInput,
  CreateManagerInput,
  CreateGigProfileInput,
  CreateTaskInput,
  ApplyToTaskInput,
  AssignManagerInput,
  CreateDeliverableInput,
  CreatePaymentInput,
  CreateReviewInput,
  User,
  Client,
  Manager,
  GigProfile,
  Task,
  Application,
  Assignment,
  Deliverable,
  Payment,
  Review,
  TaskStatus,
  UserRole,
} from '../../common/database/database.types';

@Injectable()
export class AdminService {
  constructor(private readonly db: DatabaseService) {}

  // ── Dashboard Stats ────────────────────────────────────────

  getDashboardStats() {
    const users = this.db.getAllUsers();
    const clients = this.db.getAllClients();
    const managers = this.db.getAllManagers();
    const gigProfiles = this.db.getAllGigProfiles();
    const tasks = this.db.getAllTasks();
    const applications = this.db.getAllApplications();
    const assignments = this.db.getAllAssignments();
    const deliverables = this.db.getAllDeliverables();
    const payments = this.db.getAllPayments();
    const reviews = this.db.getAllReviews();

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const avgRating =
      reviews.length > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
        : 0;

    return {
      counts: {
        users: users.length,
        clients: clients.length,
        managers: managers.length,
        gigProfiles: gigProfiles.length,
        tasks: tasks.length,
        applications: applications.length,
        assignments: assignments.length,
        deliverables: deliverables.length,
        payments: payments.length,
        reviews: reviews.length,
      },
      tasksByStatus: {
        open: tasks.filter((t) => t.status === TaskStatus.OPEN).length,
        inProgress: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
        completed: tasks.filter((t) => t.status === TaskStatus.COMPLETED).length,
        cancelled: tasks.filter((t) => t.status === TaskStatus.CANCELLED).length,
      },
      usersByRole: {
        clients: users.filter((u) => u.role === UserRole.CLIENT).length,
        gigs: users.filter((u) => u.role === UserRole.GIG).length,
        managers: users.filter((u) => u.role === UserRole.MANAGER).length,
        admins: users.filter((u) => u.role === UserRole.ADMIN || u.role === UserRole.SUPER_ADMIN).length,
      },
      totalRevenue,
      avgRating,
      recentUsers: users
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
      recentTasks: tasks
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    };
  }

  // ── Users ──────────────────────────────────────────────────

  getAllUsers(): User[] {
    return this.db.getAllUsers();
  }

  getUserById(id: string): User {
    return this.db.getUserById(id);
  }

  createUser(input: CreateUserInput): User {
    return this.db.createUser(input);
  }

  updateUser(id: string, updates: Partial<Pick<User, 'name' | 'email' | 'password' | 'role'>>): User {
    return this.db.updateUser(id, updates);
  }

  deleteUser(id: string): void {
    this.db.deleteUser(id);
  }

  // ── Clients ────────────────────────────────────────────────

  getAllClients(): (Client & { user?: User })[] {
    const clients = this.db.getAllClients();
    return clients.map((c) => {
      try {
        const user = this.db.getUserById(c.user_id);
        return { ...c, user };
      } catch {
        return { ...c, user: undefined };
      }
    });
  }

  createClient(input: CreateClientInput): Client {
    return this.db.createClient(input);
  }

  deleteClient(id: string): void {
    this.db.deleteClient(id);
  }

  // ── Managers ───────────────────────────────────────────────

  getAllManagers(): (Manager & { user?: User })[] {
    const managers = this.db.getAllManagers();
    return managers.map((m) => {
      try {
        const user = this.db.getUserById(m.user_id);
        return { ...m, user };
      } catch {
        return { ...m, user: undefined };
      }
    });
  }

  createManager(input: CreateManagerInput): Manager {
    return this.db.createManager(input);
  }

  deleteManager(clientId: string, managerId: string): void {
    this.db.deleteManager(clientId, managerId);
  }

  // ── Gig Profiles ───────────────────────────────────────────

  getAllGigProfiles(): (GigProfile & { user?: User; skills: string[]; tools: string[]; portfolio: string[] })[] {
    const profiles = this.db.getAllGigProfiles();
    return profiles.map((g) => {
      let user: User | undefined;
      try {
        user = this.db.getUserById(g.user_id);
      } catch {
        user = undefined;
      }
      return {
        ...g,
        user,
        skills: this.db.getSkills(g.gig_profile_id),
        tools: this.db.getTools(g.gig_profile_id),
        portfolio: this.db.getPortfolio(g.gig_profile_id),
      };
    });
  }

  createGigProfile(input: CreateGigProfileInput): GigProfile {
    return this.db.createGigProfile(input);
  }

  deleteGigProfile(id: string): void {
    this.db.deleteGigProfile(id);
  }

  // ── Tasks ──────────────────────────────────────────────────

  getAllTasks(): Task[] {
    return this.db.getAllTasks();
  }

  getTaskById(id: string): Task {
    return this.db.getTask(id);
  }

  createTask(input: CreateTaskInput): Task {
    return this.db.createTask(input);
  }

  updateTask(id: string, updates: Partial<Pick<Task, 'title' | 'description' | 'budget' | 'status'>>): Task {
    return this.db.updateTask(id, updates);
  }

  deleteTask(id: string): void {
    this.db.deleteTask(id);
  }

  // ── Applications ───────────────────────────────────────────

  getAllApplications(): Application[] {
    return this.db.getAllApplications();
  }

  createApplication(input: ApplyToTaskInput): Application {
    return this.db.applyToTask(input);
  }

  deleteApplication(id: string): void {
    this.db.deleteApplication(id);
  }

  // ── Assignments ────────────────────────────────────────────

  getAllAssignments(): Assignment[] {
    return this.db.getAllAssignments();
  }

  createAssignment(input: AssignManagerInput): Assignment {
    return this.db.assignManager(input);
  }

  deleteAssignment(gigProfileId: string, taskId: string): void {
    this.db.deleteAssignment(gigProfileId, taskId);
  }

  // ── Deliverables ───────────────────────────────────────────

  getAllDeliverables(): Deliverable[] {
    return this.db.getAllDeliverables();
  }

  createDeliverable(input: CreateDeliverableInput): Deliverable {
    return this.db.createDeliverable(input);
  }

  deleteDeliverable(taskId: string, deliverableNo: number): void {
    this.db.deleteDeliverable(taskId, deliverableNo);
  }

  // ── Payments ───────────────────────────────────────────────

  getAllPayments(): Payment[] {
    return this.db.getAllPayments();
  }

  createPayment(input: CreatePaymentInput): Payment {
    return this.db.createPayment(input);
  }

  deletePayment(id: string): void {
    this.db.deletePayment(id);
  }

  // ── Reviews ────────────────────────────────────────────────

  getAllReviews(): Review[] {
    return this.db.getAllReviews();
  }

  createReview(input: CreateReviewInput): Review {
    return this.db.createReview(input);
  }

  deleteReview(id: string): void {
    this.db.deleteReview(id);
  }
}