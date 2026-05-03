import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { IdGenerator } from './id-generator';
import {
  Application,
  ApplyToTaskInput,
  AssignManagerInput,
  Assignment,
  Client,
  CreateClientInput,
  CreateDeliverableInput,
  CreateGigProfileInput,
  CreateManagerInput,
  CreatePaymentInput,
  CreateReviewInput,
  CreateTaskInput,
  CreateUserInput,
  Deliverable,
  GigProfile,
  Manager,
  Payment,
  Review,
  Task,
  TaskStatus,
  User,
} from './database.types';

@Injectable()
export class DatabaseService {
  // Main tables
  readonly users = new Map<string, User>();
  readonly clients = new Map<string, Client>();
  readonly managers = new Map<string, Manager>();
  readonly gigProfiles = new Map<string, GigProfile>();
  readonly tasks = new Map<string, Task>();
  readonly applications = new Map<string, Application>();
  readonly assignments = new Map<string, Assignment>();
  readonly deliverables = new Map<string, Deliverable>();
  readonly payments = new Map<string, Payment>();
  readonly reviews = new Map<string, Review>();

  // 1NF profile data
  readonly profileSkills = new Map<string, string[]>();
  readonly profileTools = new Map<string, string[]>();
  readonly profilePortfolio = new Map<string, string[]>();

  // Unique indexes (fast lookups / constraint enforcement)
  private readonly usersByEmail = new Map<string, string>();
  private readonly applicationByGigTask = new Map<string, string>();
  private readonly paymentByTaskGig = new Map<string, string>();
  private readonly reviewByReviewerRevieweeTask = new Map<string, string>();

  private readonly ids = {
    user: new IdGenerator('usr'),
    client: new IdGenerator('cli'),
    manager: new IdGenerator('mgr'),
    gigProfile: new IdGenerator('gpr'),
    task: new IdGenerator('tsk'),
    application: new IdGenerator('app'),
    payment: new IdGenerator('pay'),
    review: new IdGenerator('rev'),
  };

  // -------------------------
  // Key helpers
  // -------------------------

  private managerKey(client_id: string, manager_id: string): string {
    return `${client_id}_${manager_id}`;
  }

  private assignmentKey(gig_profile_id: string, task_id: string): string {
    return `${gig_profile_id}_${task_id}`;
  }

  private deliverableKey(task_id: string, deliverable_no: number): string {
    return `${task_id}_${deliverable_no}`;
  }

  private applicationUniqueKey(gig_profile_id: string, task_id: string): string {
    return `${gig_profile_id}_${task_id}`;
  }

  private paymentUniqueKey(task_id: string, gig_profile_id: string): string {
    return `${task_id}_${gig_profile_id}`;
  }

  private reviewUniqueKey(reviewer_id: string, reviewee_id: string, task_id: string): string {
    return `${reviewer_id}_${reviewee_id}_${task_id}`;
  }

  // -------------------------
  // Generic helpers
  // -------------------------

  private now(): Date {
    return new Date();
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private clone<T>(value: T): T {
    const structuredCloneFn: unknown = (globalThis as unknown as { structuredClone?: unknown })
      .structuredClone;
    if (typeof structuredCloneFn === 'function') {
      return (structuredCloneFn as (v: T) => T)(value);
    }

    // Fallback: best-effort deep clone (Dates become ISO strings)
    return JSON.parse(JSON.stringify(value)) as T;
  }

  private requireNonEmptyString(field: string, value: string): void {
    if (value.trim().length === 0) {
      throw new BadRequestException(`${field} must be a non-empty string`);
    }
  }

  private requirePositiveNumber(field: string, value: number): void {
    if (!Number.isFinite(value) || value <= 0) {
      throw new BadRequestException(`${field} must be a positive number`);
    }
  }

  private requireRating(value: number): void {
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw new BadRequestException('rating must be an integer between 1 and 5');
    }
  }

  private requireUser(user_id: string): User {
    const user = this.users.get(user_id);
    if (!user) {
      throw new NotFoundException(`User not found: ${user_id}`);
    }
    return user;
  }

  private requireClient(client_id: string): Client {
    const client = this.clients.get(client_id);
    if (!client) {
      throw new NotFoundException(`Client not found: ${client_id}`);
    }
    return client;
  }

  private requireManager(client_id: string, manager_id: string): Manager {
    const key = this.managerKey(client_id, manager_id);
    const manager = this.managers.get(key);
    if (!manager) {
      throw new NotFoundException(`Manager not found: ${key}`);
    }
    return manager;
  }

  private requireGigProfile(gig_profile_id: string): GigProfile {
    const gig = this.gigProfiles.get(gig_profile_id);
    if (!gig) {
      throw new NotFoundException(`Gig profile not found: ${gig_profile_id}`);
    }
    return gig;
  }

  private requireTask(task_id: string): Task {
    const task = this.tasks.get(task_id);
    if (!task) {
      throw new NotFoundException(`Task not found: ${task_id}`);
    }
    return task;
  }

  private getOrInitStringArray(map: Map<string, string[]>, key: string): string[] {
    const existing = map.get(key);
    if (existing) return existing;
    const arr: string[] = [];
    map.set(key, arr);
    return arr;
  }

  private appendUniqueString(
    map: Map<string, string[]>,
    gig_profile_id: string,
    value: string,
    label: string,
  ): string[] {
    this.requireGigProfile(gig_profile_id);
    this.requireNonEmptyString(label, value);

    const normalized = value.trim();
    const list = this.getOrInitStringArray(map, gig_profile_id);

    if (!list.includes(normalized)) {
      list.push(normalized);
    }

    return this.clone(list);
  }

  // -------------------------
  // USER
  // -------------------------

  createUser(input: CreateUserInput): User {
    this.requireNonEmptyString('name', input.name);
    this.requireNonEmptyString('email', input.email);
    this.requireNonEmptyString('password', input.password);

    const email = this.normalizeEmail(input.email);
    if (this.usersByEmail.has(email)) {
      throw new BadRequestException('email must be unique');
    }

    const now = this.now();
    const user: User = {
      user_id: this.ids.user.next(),
      name: input.name.trim(),
      email,
      password: input.password,
      role: input.role,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(user.user_id, user);
    this.usersByEmail.set(email, user.user_id);

    return this.clone(user);
  }

  getUserById(user_id: string): User {
    const user = this.users.get(user_id);
    if (!user) {
      throw new NotFoundException(`User not found: ${user_id}`);
    }
    return this.clone(user);
  }

  getUserByEmail(email: string): User {
    const normalized = this.normalizeEmail(email);
    const userId = this.usersByEmail.get(normalized);
    if (!userId) {
      throw new NotFoundException(`User not found for email: ${normalized}`);
    }
    return this.getUserById(userId);
  }

  // -------------------------
  // CLIENT
  // -------------------------

  createClient(input: CreateClientInput): Client {
    this.requireUser(input.user_id);

    const now = this.now();
    const client: Client = {
      client_id: this.ids.client.next(),
      user_id: input.user_id,
      createdAt: now,
      updatedAt: now,
    };

    if (this.clients.has(client.client_id)) {
      throw new BadRequestException('client_id must be unique');
    }

    this.clients.set(client.client_id, client);
    return this.clone(client);
  }

  getClient(client_id: string): Client {
    return this.clone(this.requireClient(client_id));
  }

  // -------------------------
  // MANAGER (WEAK ENTITY)
  // -------------------------

  createManager(input: CreateManagerInput): Manager {
    this.requireClient(input.client_id);
    this.requireUser(input.user_id);

    const manager_id = input.manager_id ?? this.ids.manager.next();
    this.requireNonEmptyString('manager_id', manager_id);

    const key = this.managerKey(input.client_id, manager_id);
    if (this.managers.has(key)) {
      throw new BadRequestException('manager composite key must be unique');
    }

    const now = this.now();
    const manager: Manager = {
      client_id: input.client_id,
      manager_id,
      user_id: input.user_id,
      createdAt: now,
      updatedAt: now,
    };

    this.managers.set(key, manager);
    return this.clone(manager);
  }

  // -------------------------
  // GIG PROFILE
  // -------------------------

  createGigProfile(input: CreateGigProfileInput): GigProfile {
    this.requireUser(input.user_id);

    const now = this.now();
    const gig: GigProfile = {
      gig_profile_id: this.ids.gigProfile.next(),
      user_id: input.user_id,
      createdAt: now,
      updatedAt: now,
    };

    this.gigProfiles.set(gig.gig_profile_id, gig);
    // Initialize 1NF maps (optional but avoids undefined checks later)
    this.profileSkills.set(gig.gig_profile_id, []);
    this.profileTools.set(gig.gig_profile_id, []);
    this.profilePortfolio.set(gig.gig_profile_id, []);

    return this.clone(gig);
  }

  addSkill(gig_profile_id: string, skill: string): string[] {
    return this.appendUniqueString(this.profileSkills, gig_profile_id, skill, 'skill');
  }

  addTool(gig_profile_id: string, tool: string): string[] {
    return this.appendUniqueString(this.profileTools, gig_profile_id, tool, 'tool');
  }

  addPortfolio(gig_profile_id: string, portfolioItem: string): string[] {
    return this.appendUniqueString(
      this.profilePortfolio,
      gig_profile_id,
      portfolioItem,
      'portfolio',
    );
  }

  // -------------------------
  // TASK
  // -------------------------

  createTask(input: CreateTaskInput): Task {
    this.requireClient(input.client_id);
    this.requireNonEmptyString('title', input.title);
    this.requireNonEmptyString('description', input.description);
    this.requirePositiveNumber('budget', input.budget);

    const now = this.now();
    const task: Task = {
      task_id: this.ids.task.next(),
      client_id: input.client_id,
      title: input.title.trim(),
      description: input.description.trim(),
      budget: input.budget,
      status: input.status ?? TaskStatus.OPEN,
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.set(task.task_id, task);
    return this.clone(task);
  }

  getTask(task_id: string): Task {
    return this.clone(this.requireTask(task_id));
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values()).map((t) => this.clone(t));
  }

  // -------------------------
  // APPLICATION (M:N)
  // -------------------------

  applyToTask(input: ApplyToTaskInput): Application {
    this.requireGigProfile(input.gig_profile_id);
    this.requireTask(input.task_id);

    const uniqueKey = this.applicationUniqueKey(input.gig_profile_id, input.task_id);
    if (this.applicationByGigTask.has(uniqueKey)) {
      throw new BadRequestException('UNIQUE(gig_profile_id, task_id) violated');
    }

    const now = this.now();
    const application: Application = {
      application_id: this.ids.application.next(),
      gig_profile_id: input.gig_profile_id,
      task_id: input.task_id,
      createdAt: now,
      updatedAt: now,
    };

    this.applications.set(application.application_id, application);
    this.applicationByGigTask.set(uniqueKey, application.application_id);

    return this.clone(application);
  }

  // -------------------------
  // ASSIGNMENT (TERNARY)
  // -------------------------

  assignManager(input: AssignManagerInput): Assignment {
    this.requireGigProfile(input.gig_profile_id);
    const task = this.requireTask(input.task_id);

    if (input.client_id && input.client_id !== task.client_id) {
      throw new BadRequestException('client_id does not match the task client_id');
    }

    // FK MANAGER: manager is scoped under task.client_id
    this.requireManager(task.client_id, input.manager_id);

    const key = this.assignmentKey(input.gig_profile_id, input.task_id);
    if (this.assignments.has(key)) {
      throw new BadRequestException('assignment composite key must be unique');
    }

    const now = this.now();
    const assignment: Assignment = {
      gig_profile_id: input.gig_profile_id,
      task_id: input.task_id,
      manager_id: input.manager_id,
      createdAt: now,
      updatedAt: now,
    };

    this.assignments.set(key, assignment);
    return this.clone(assignment);
  }

  // -------------------------
  // DELIVERABLE (WEAK ENTITY)
  // -------------------------

  createDeliverable(input: CreateDeliverableInput): Deliverable {
    this.requireTask(input.task_id);
    this.requireGigProfile(input.gig_profile_id);
    this.requireNonEmptyString('content', input.content);

    const assignmentKey = this.assignmentKey(input.gig_profile_id, input.task_id);
    if (!this.assignments.has(assignmentKey)) {
      throw new BadRequestException('deliverable requires an existing assignment');
    }

    const deliverable_no = input.deliverable_no ?? this.nextDeliverableNoForTask(input.task_id);
    if (!Number.isInteger(deliverable_no) || deliverable_no <= 0) {
      throw new BadRequestException('deliverable_no must be a positive integer');
    }

    const key = this.deliverableKey(input.task_id, deliverable_no);
    if (this.deliverables.has(key)) {
      throw new BadRequestException('deliverable composite key must be unique');
    }

    const now = this.now();
    const deliverable: Deliverable = {
      task_id: input.task_id,
      deliverable_no,
      gig_profile_id: input.gig_profile_id,
      content: input.content.trim(),
      createdAt: now,
      updatedAt: now,
    };

    this.deliverables.set(key, deliverable);
    return this.clone(deliverable);
  }

  private nextDeliverableNoForTask(task_id: string): number {
    let max = 0;
    for (const deliverable of this.deliverables.values()) {
      if (deliverable.task_id === task_id) {
        max = Math.max(max, deliverable.deliverable_no);
      }
    }
    return max + 1;
  }

  // -------------------------
  // PAYMENT
  // -------------------------

  createPayment(input: CreatePaymentInput): Payment {
    this.requireTask(input.task_id);
    this.requireGigProfile(input.gig_profile_id);
    this.requirePositiveNumber('amount', input.amount);

    const uniqueKey = this.paymentUniqueKey(input.task_id, input.gig_profile_id);
    if (this.paymentByTaskGig.has(uniqueKey)) {
      throw new BadRequestException('UNIQUE(task_id, gig_profile_id) violated');
    }

    const now = this.now();
    const payment: Payment = {
      payment_id: this.ids.payment.next(),
      task_id: input.task_id,
      gig_profile_id: input.gig_profile_id,
      amount: input.amount,
      paidAt: input.paidAt ?? now,
      createdAt: now,
      updatedAt: now,
    };

    this.payments.set(payment.payment_id, payment);
    this.paymentByTaskGig.set(uniqueKey, payment.payment_id);

    return this.clone(payment);
  }

  // -------------------------
  // REVIEW
  // -------------------------

  createReview(input: CreateReviewInput): Review {
    if (input.reviewer_id === input.reviewee_id) {
      throw new BadRequestException('no self-review allowed');
    }

    this.requireUser(input.reviewer_id);
    this.requireUser(input.reviewee_id);
    this.requireTask(input.task_id);
    this.requireRating(input.rating);

    const uniqueKey = this.reviewUniqueKey(input.reviewer_id, input.reviewee_id, input.task_id);
    if (this.reviewByReviewerRevieweeTask.has(uniqueKey)) {
      throw new BadRequestException('UNIQUE(reviewer_id, reviewee_id, task_id) violated');
    }

    const now = this.now();
    const review: Review = {
      review_id: this.ids.review.next(),
      reviewer_id: input.reviewer_id,
      reviewee_id: input.reviewee_id,
      task_id: input.task_id,
      rating: input.rating,
      comment: input.comment,
      createdAt: now,
      updatedAt: now,
    };

    this.reviews.set(review.review_id, review);
    this.reviewByReviewerRevieweeTask.set(uniqueKey, review.review_id);

    return this.clone(review);
  }
}
