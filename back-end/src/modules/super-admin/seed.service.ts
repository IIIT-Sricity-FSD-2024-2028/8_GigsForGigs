import { Injectable, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { UserRole, TaskStatus } from '../../common/database/database.types';

/**
 * Seeds the in-memory database with realistic demo data on application startup.
 * Lives inside the super-admin module to avoid coupling with other team modules.
 */
@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private readonly db: DatabaseService) {}

  onModuleInit() {
    this.seed();
  }

  private seed(): void {
    // ── Users ──────────────────────────────────────────────
    const admin = this.db.createUser({
      name: 'Alex Rivera',
      email: 'admin@gigsforge.com',
      password: 'admin123',
      role: UserRole.SUPER_ADMIN,
    });

    const clientUser1 = this.db.createUser({
      name: 'Aditya Deshmukh',
      email: 'aditya@techstart.io',
      password: 'password1',
      role: UserRole.CLIENT,
    });

    const clientUser2 = this.db.createUser({
      name: 'Priya Sharma',
      email: 'priya@designco.in',
      password: 'password2',
      role: UserRole.CLIENT,
    });

    const gigUser1 = this.db.createUser({
      name: 'Arham Kansal',
      email: 'arham@dev.com',
      password: 'password3',
      role: UserRole.GIG,
    });

    const gigUser2 = this.db.createUser({
      name: 'Elena Torres',
      email: 'elena@code.dev',
      password: 'password4',
      role: UserRole.GIG,
    });

    const mgrUser = this.db.createUser({
      name: 'Leo Hudson',
      email: 'leo@techstart.io',
      password: 'password5',
      role: UserRole.MANAGER,
    });

    // ── Client profiles ───────────────────────────────────
    const client1 = this.db.createClient({ user_id: clientUser1.user_id });
    const client2 = this.db.createClient({ user_id: clientUser2.user_id });

    // ── Manager (weak entity) ─────────────────────────────
    const manager = this.db.createManager({
      client_id: client1.client_id,
      user_id: mgrUser.user_id,
    });

    // ── Gig Profiles ──────────────────────────────────────
    const gig1 = this.db.createGigProfile({ user_id: gigUser1.user_id });
    const gig2 = this.db.createGigProfile({ user_id: gigUser2.user_id });

    // ── Skills / Tools ────────────────────────────────────
    this.db.addSkill(gig1.gig_profile_id, 'JavaScript');
    this.db.addSkill(gig1.gig_profile_id, 'React');
    this.db.addSkill(gig1.gig_profile_id, 'Node.js');
    this.db.addTool(gig1.gig_profile_id, 'VS Code');
    this.db.addTool(gig1.gig_profile_id, 'Figma');

    this.db.addSkill(gig2.gig_profile_id, 'Python');
    this.db.addSkill(gig2.gig_profile_id, 'Django');
    this.db.addSkill(gig2.gig_profile_id, 'PostgreSQL');
    this.db.addTool(gig2.gig_profile_id, 'PyCharm');

    // ── Tasks ─────────────────────────────────────────────
    const task1 = this.db.createTask({
      client_id: client1.client_id,
      title: 'Build Landing Page',
      description: 'Create a responsive landing page for our new SaaS product with hero section, features grid, and CTA.',
      budget: 15000,
      status: TaskStatus.OPEN,
    });

    const task2 = this.db.createTask({
      client_id: client1.client_id,
      title: 'REST API Development',
      description: 'Develop a RESTful API for user management, authentication, and CRUD operations using NestJS.',
      budget: 25000,
      status: TaskStatus.IN_PROGRESS,
    });

    const task3 = this.db.createTask({
      client_id: client2.client_id,
      title: 'Mobile App UI Design',
      description: 'Design UI screens for an iOS fitness tracking app including onboarding, dashboard, and profile.',
      budget: 12000,
      status: TaskStatus.COMPLETED,
    });

    const task4 = this.db.createTask({
      client_id: client2.client_id,
      title: 'Data Pipeline Setup',
      description: 'Set up an ETL pipeline using Python and Apache Airflow for real-time analytics dashboard.',
      budget: 30000,
      status: TaskStatus.OPEN,
    });

    // ── Applications ──────────────────────────────────────
    this.db.applyToTask({ gig_profile_id: gig1.gig_profile_id, task_id: task1.task_id });
    this.db.applyToTask({ gig_profile_id: gig2.gig_profile_id, task_id: task1.task_id });
    this.db.applyToTask({ gig_profile_id: gig2.gig_profile_id, task_id: task4.task_id });

    // ── Assignments ───────────────────────────────────────
    this.db.assignManager({
      gig_profile_id: gig1.gig_profile_id,
      task_id: task2.task_id,
      manager_id: manager.manager_id,
    });

    // ── Deliverables ──────────────────────────────────────
    this.db.createDeliverable({
      task_id: task2.task_id,
      gig_profile_id: gig1.gig_profile_id,
      content: 'Completed user authentication module with JWT tokens, password hashing, and refresh token rotation.',
    });

    // ── Payments ──────────────────────────────────────────
    this.db.createPayment({
      task_id: task3.task_id,
      gig_profile_id: gig2.gig_profile_id,
      amount: 12000,
    });

    // ── Reviews ───────────────────────────────────────────
    this.db.createReview({
      reviewer_id: clientUser2.user_id,
      reviewee_id: gigUser2.user_id,
      task_id: task3.task_id,
      rating: 5,
      comment: 'Outstanding UI designs. Elena delivered pixel-perfect screens ahead of schedule.',
    });

    this.db.createReview({
      reviewer_id: gigUser2.user_id,
      reviewee_id: clientUser2.user_id,
      task_id: task3.task_id,
      rating: 4,
      comment: 'Great client to work with. Clear requirements and prompt feedback.',
    });

    this.db.createReview({
      reviewer_id: clientUser1.user_id,
      reviewee_id: gigUser1.user_id,
      task_id: task2.task_id,
      rating: 5,
      comment: 'Arham is an excellent developer. Clean code, well-documented API.',
    });

    // ── Additional Seed Data for Charts ─────────────────────
    
    // More Users
    const u7 = this.db.createUser({ name: 'Sam Chen', email: 'sam@design.io', password: 'pass', role: UserRole.CLIENT });
    const u8 = this.db.createUser({ name: 'Jordan Lee', email: 'jordan@code.dev', password: 'pass', role: UserRole.GIG });
    const u9 = this.db.createUser({ name: 'Taylor Swift', email: 'taylor@music.com', password: 'pass', role: UserRole.GIG });
    const u10 = this.db.createUser({ name: 'Casey Smith', email: 'casey@mgmt.com', password: 'pass', role: UserRole.MANAGER });
    
    const c3 = this.db.createClient({ user_id: u7.user_id });
    const g3 = this.db.createGigProfile({ user_id: u8.user_id });
    const g4 = this.db.createGigProfile({ user_id: u9.user_id });

    // More Tasks
    const t5 = this.db.createTask({
      client_id: c3.client_id,
      title: 'Logo Redesign',
      description: 'Modernize our current company logo.',
      budget: 5000,
      status: TaskStatus.COMPLETED,
    });
    const t6 = this.db.createTask({
      client_id: c3.client_id,
      title: 'SEO Optimization',
      description: 'Optimize landing pages for better search rankings.',
      budget: 8000,
      status: TaskStatus.OPEN,
    });
    const t7 = this.db.createTask({
      client_id: client1.client_id,
      title: 'Cancel this task',
      description: 'This task was cancelled.',
      budget: 1000,
      status: TaskStatus.CANCELLED,
    });

    // More Payments
    this.db.createPayment({ task_id: t5.task_id, gig_profile_id: g3.gig_profile_id, amount: 5000 });
    this.db.createPayment({ task_id: task2.task_id, gig_profile_id: gig1.gig_profile_id, amount: 25000 });
    this.db.createPayment({ task_id: task4.task_id, gig_profile_id: gig2.gig_profile_id, amount: 15000 }); // Partial payment

    // More Reviews
    this.db.createReview({ reviewer_id: u7.user_id, reviewee_id: u8.user_id, task_id: t5.task_id, rating: 5, comment: 'Great logo.' });
    this.db.createReview({ reviewer_id: u8.user_id, reviewee_id: u7.user_id, task_id: t5.task_id, rating: 4, comment: 'Good clear requirements.' });
    this.db.createReview({ reviewer_id: clientUser1.user_id, reviewee_id: gigUser2.user_id, task_id: task4.task_id, rating: 3, comment: 'Okay work, but missed a deadline.' });

    console.log('[SeedService] Database seeded with demo data.');
  }
}
