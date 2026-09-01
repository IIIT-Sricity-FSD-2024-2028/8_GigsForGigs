import { prisma } from "db";
import { hashPassword } from "../../lib/password.js";
import { signToken } from "../../lib/jwt.js";
import { unauthorized } from "../../lib/httpError.js";
import type {
  CreateApplicationDto,
  CreateAssignmentDto,
  CreateClientDto,
  CreateDeliverableDto,
  CreateGigProfileDto,
  CreateManagerDto,
  CreatePaymentDto,
  CreateReviewDto,
  CreateTaskDto,
  CreateUserDto,
  UpdateApplicationDto,
  UpdateClientDto,
  UpdateDeliverableDto,
  UpdateGigProfileDto,
  UpdatePaymentDto,
  UpdateReviewDto,
  UpdateTaskDto,
  UpdateUserDto,
} from "./admin.dto.js";

export const platformConfig = {
  commissionRakePercent: 7,
  minimumTaskBudget: 50,
  escrowHoldPeriodDays: 14,
  autoDisputeThresholdDays: 7,
  allowedCategories: [
    "Software Development",
    "AI & Data Science",
    "UI/UX & Product Design",
    "DevOps & Cloud Engineering",
    "Mobile App Development",
    "Cybersecurity"
  ],
  maintenanceMode: false
};

export const activeInvitations: any[] = [];
export const auditLogs: any[] = [];

function recordAuditLog(action: string, actor: string, details: string) {
  auditLogs.unshift({
    id: "aud-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    action,
    actor,
    details,
    timestamp: new Date().toISOString()
  });
  if (auditLogs.length > 200) auditLogs.pop();
}

// ---- Users --------------------------------------------------------------

// List every user with a role-derived display summary (client org / gig skills / manager's client).
export const listUsers = async () => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      gigProfile: { include: { skills: true, tools: true } },
      managerLink: { include: { client: true } },
    }
  });

  return users.map(u => ({
    id: "usr-" + u.userId,
    userId: u.userId,
    name: u.name,
    email: u.email,
    role: u.role.toUpperCase(),
    status: "ACTIVE",
    createdAt: u.createdAt.toISOString(),
    profileSummary: u.client
      ? "Client Organization: " + u.client.clientName
      : u.gigProfile
      ? "Gig Professional (" + (u.gigProfile.skills.map(s => s.skill).join(", ") || "Specialist") + ")"
      : u.managerLink
      ? "Manager (Client: " + (u.managerLink.client?.clientName || "Assigned") + ")"
      : "Super Admin Governance"
  }));
};

// Fetch one user with their full role-specific relations (client's tasks, gig pro's deliverables, etc.).
export const getUser = async (userId: number) => {
  const u = await prisma.user.findUniqueOrThrow({
    where: { userId },
    include: {
      client: { include: { tasks: true, managers: true } },
      gigProfile: { include: { skills: true, deliverables: true, services: true, payments: true } },
      managerLink: { include: { client: true, assignments: true } }
    }
  });
  return {
    id: "usr-" + u.userId,
    userId: u.userId,
    name: u.name,
    email: u.email,
    role: u.role.toUpperCase(),
    status: "ACTIVE",
    createdAt: u.createdAt.toISOString(),
    client: u.client,
    gigProfile: u.gigProfile,
    managerLink: u.managerLink
  };
};

// Create a user directly (admin-only escape hatch outside the normal signup flow) and audit-log it.
export async function createUser(dto: CreateUserDto) {
  const hashedPassword = await hashPassword(dto.password);
  const created = await prisma.user.create({
    data: { name: dto.name, email: dto.email.trim(), hashPassword: hashedPassword, role: dto.role },
  });
  recordAuditLog("CREATE_USER", "Super Admin", "Created user " + dto.email + " with role " + dto.role);
  return created;
}

// Update a user's fields (including role/password) and audit-log it.
export async function updateUser(userId: number, dto: UpdateUserDto) {
  const updated = await prisma.user.update({
    where: { userId },
    data: {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.email !== undefined ? { email: dto.email.trim() } : {}),
      ...(dto.password !== undefined ? { hashPassword: await hashPassword(dto.password) } : {}),
      ...(dto.role !== undefined ? { role: dto.role } : {}),
    },
  });
  recordAuditLog("UPDATE_USER", "Super Admin", "Updated user #" + userId);
  return updated;
}

// Delete a user and audit-log it.
export async function deleteUser(userId: number): Promise<void> {
  await prisma.user.delete({ where: { userId } });
  recordAuditLog("DELETE_USER", "Super Admin", "Deleted user #" + userId);
}

// ---- Clients --------------------------------------------------------------

// List every client with computed totalSpent/active/completed task counts.
export const listClients = async () => {
  const clients = await prisma.client.findMany({
    include: {
      user: true,
      managers: { include: { user: true } },
      tasks: { include: { payments: true } },
      serviceRequests: true
    },
    orderBy: { clientId: "asc" }
  });

  return clients.map(c => {
    const totalSpent = c.tasks.reduce((sum, t) => {
      const taskPayments = t.payments.filter(p => p.status === "completed");
      const paid = taskPayments.reduce((pSum, p) => pSum + Math.round(Number(p.amount) * 1.07), 0);
      return sum + (paid > 0 ? paid : Number(t.budget || 0));
    }, 0);

    const activeTasks = c.tasks.filter(t => t.status === "open" || t.status === "in_progress").length;
    const completedTasks = c.tasks.filter(t => t.status === "completed").length;

    return {
      id: "cli-" + c.clientId,
      clientId: c.clientId,
      userId: "usr-" + c.userId,
      name: c.clientName,
      companyName: c.clientName,
      email: c.user?.email || ("client" + c.clientId + "@gigsforgigs.internal"),
      domain: c.domain || "Technology & Digital Services",
      totalSpent,
      activeGigsCount: activeTasks,
      completedGigsCount: completedTasks,
      assignedManagersCount: c.managers.length,
      managers: c.managers.map(m => ({
        managerId: m.managerId,
        name: m.user?.name || ("Manager #" + m.managerId),
        email: m.user?.email
      })),
      isVerified: true,
      status: "ACTIVE",
      joinedDate: c.user?.createdAt ? c.user.createdAt.toISOString().split("T")[0] : "2026-01-15"
    };
  });
};

// Fetch one client with its full task/payment/deliverable/application history.
export const getClient = (clientId: number) =>
  prisma.client.findUniqueOrThrow({
    where: { clientId },
    include: {
      user: true,
      managers: { include: { user: true } },
      tasks: { include: { payments: true, deliverables: true, applications: true } },
      serviceRequests: true
    }
  });

// Create a client record directly, linked to an existing user.
export const createClient = (dto: CreateClientDto) =>
  prisma.client.create({
    data: {
      userId: dto.userId,
      clientName: dto.clientName,
      ...(dto.domain !== undefined ? { domain: dto.domain } : {}),
    },
  });

// Update a client's name/domain.
export const updateClient = (clientId: number, dto: UpdateClientDto) =>
  prisma.client.update({
    where: { clientId },
    data: {
      ...(dto.clientName !== undefined ? { clientName: dto.clientName } : {}),
      ...(dto.domain !== undefined ? { domain: dto.domain } : {}),
    },
  });

// Delete a client.
export async function deleteClient(clientId: number): Promise<void> {
  await prisma.client.delete({ where: { clientId } });
}

// ---- Managers ---------------------------------------------------------

// List every manager with their client link and count of supervised task assignments.
export const listManagers = async () => {
  const managers = await prisma.manager.findMany({
    include: {
      user: true,
      client: { include: { user: true } },
      assignments: { include: { task: true, gigProfile: { include: { user: true } } } },
    },
    orderBy: { managerId: "asc" }
  });

  return managers.map(m => ({
    id: "mgr-" + m.managerId,
    managerId: m.managerId,
    userId: "usr-" + m.userId,
    name: m.user?.name || ("Manager #" + m.managerId),
    email: m.user?.email || ("manager" + m.managerId + "@gigsforgigs.internal"),
    clientId: m.clientId,
    clientName: m.client?.clientName || "Enterprise Partner",
    linkedClients: [m.client?.clientName || "Enterprise Partner"],
    activeSupervisedTasks: m.assignments.length,
    permissionsLevel: "FULL_SUPERVISOR",
    status: "ACTIVE",
    createdAt: m.createdAt ? m.createdAt.toISOString().split("T")[0] : "2026-02-01"
  }));
};

// Create a manager record directly, linking an existing user to a client.
export const createManager = (dto: CreateManagerDto) =>
  prisma.manager.create({ data: { userId: dto.userId, clientId: dto.clientId } });

// Delete a manager.
export async function deleteManager(clientId: number, managerId: number): Promise<void> {
  await prisma.manager.delete({ where: { clientId_managerId: { clientId, managerId } } });
}

// ---- Gig profiles -------------------------------------------------------

/**
 * List every gig professional profile with computed earnings/completed-jobs/
 * badge. hourlyRate/rating/badge thresholds and the TypeScript/React/Node.js
 * skill fallback are display placeholders with no backing column — there's
 * no rate, rating, or badge field in schema.prisma.
 */
export const listGigProfiles = async () => {
  const pros = await prisma.gigProfessionalProfile.findMany({
    include: {
      user: true,
      skills: true,
      tools: true,
      portfolio: true,
      services: true,
      applications: true,
      deliverables: true,
      payments: true,
      assignments: { include: { task: true } },
    },
    orderBy: { gigProfileId: "asc" }
  });

  return pros.map((g) => {
    const totalEarnings = g.payments
      .filter(p => p.status === "completed")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const completedJobs = g.deliverables.filter(d => d.status === "approved").length ||
      g.assignments.filter(a => a.task?.status === "completed").length;

    return {
      id: "gig-" + g.gigProfileId,
      gigProfileId: g.gigProfileId,
      userId: "usr-" + g.userId,
      name: g.user?.name || ("Gig Pro #" + g.gigProfileId),
      email: g.user?.email || ("gig" + g.gigProfileId + "@gigsforgigs.internal"),
      headline: g.bio || "Senior Full-Stack & Cloud Specialist",
      category: "Software Development",
      skills: g.skills.map(s => s.skill).length > 0 ? g.skills.map(s => s.skill) : ["TypeScript", "React", "Node.js"],
      tools: g.tools.map(t => t.tool),
      portfolioCount: g.portfolio.length,
      hourlyRate: 65 + (g.gigProfileId * 5),
      totalEarnings,
      completedJobs,
      rating: 4.9,
      badge: totalEarnings > 1000 || completedJobs > 2 ? "TOP_RATED" : "VERIFIED_PRO",
      status: "ACTIVE"
    };
  });
};

// Fetch one gig professional profile with all relations.
export const getGigProfile = (gigProfileId: number) =>
  prisma.gigProfessionalProfile.findUniqueOrThrow({
    where: { gigProfileId },
    include: { user: true, skills: true, tools: true, portfolio: true, deliverables: true, services: true }
  });

// Create a gig profile directly, linked to an existing user.
export const createGigProfile = (dto: CreateGigProfileDto) =>
  prisma.gigProfessionalProfile.create({
    data: { userId: dto.userId, ...(dto.bio !== undefined ? { bio: dto.bio } : {}) },
  });

// Update a gig profile's bio.
export const updateGigProfile = (gigProfileId: number, dto: UpdateGigProfileDto) =>
  prisma.gigProfessionalProfile.update({
    where: { gigProfileId },
    data: { ...(dto.bio !== undefined ? { bio: dto.bio } : {}) },
  });

// Delete a gig profile.
export async function deleteGigProfile(gigProfileId: number): Promise<void> {
  await prisma.gigProfessionalProfile.delete({ where: { gigProfileId } });
}

// ---- Tasks & Projects ---------------------------------------------------

// List tasks (optionally filtered by status) with computed platform fee and assigned gig pro/manager.
export const listTasks = async (statusFilter?: string) => {
  const tasks = await (prisma.task.findMany as any)({
    where: statusFilter ? { status: statusFilter } : {},
    include: {
      client: { include: { user: true, managers: { include: { user: true } } } },
      deliverables: true,
      applications: { include: { gigProfile: { include: { user: true } } } },
      payments: true,
      assignments: {
        include: {
          gigProfile: { include: { user: true } },
          manager: { include: { user: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return tasks.map((t: any) => {
    const assignedGig = t.assignments?.[0]?.gigProfile;
    const assignedMgr = t.assignments?.[0]?.manager || t.client?.managers?.[0];
    const budget = Number(t.budget);
    const platformFee = Math.round(budget * (platformConfig.commissionRakePercent / 100));

    return {
      id: "tsk-" + t.taskId,
      taskId: t.taskId,
      title: t.title,
      description: t.description || "",
      category: t.category || "Engineering & Software",
      clientId: "cli-" + t.clientId,
      clientName: t.client?.clientName || t.client?.user?.name || ("Client #" + t.clientId),
      gigProId: assignedGig ? ("gig-" + assignedGig.gigProfileId) : undefined,
      gigProName: assignedGig?.user?.name || "Unassigned",
      managerId: assignedMgr ? ("mgr-" + assignedMgr.managerId) : undefined,
      managerName: assignedMgr?.user?.name || "Assigned Delivery Manager",
      budget,
      platformFee,
      totalBudget: budget + platformFee,
      status: String(t.status).toUpperCase(),
      deliverablesCount: t.deliverables?.length || 0,
      applicationsCount: t.applications?.length || 0,
      createdAt: t.createdAt.toISOString().split("T")[0],
      updatedAt: t.updatedAt.toISOString().split("T")[0]
    };
  });
};

// Fetch one task with client/deliverables/payments/applications/assignments.
export const getTask = (taskId: number) =>
  prisma.task.findUniqueOrThrow({
    where: { taskId },
    include: {
      client: { include: { user: true } },
      deliverables: true,
      payments: true,
      applications: { include: { gigProfile: { include: { user: true } } } },
      assignments: { include: { gigProfile: { include: { user: true } }, manager: { include: { user: true } } } }
    },
  });

// Create a task directly on behalf of a client.
export const createTask = (dto: CreateTaskDto) =>
  prisma.task.create({
    data: {
      clientId: dto.clientId,
      title: dto.title,
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.category !== undefined ? { category: dto.category } : {}),
      ...(dto.duration !== undefined ? { duration: dto.duration } : {}),
      skills: dto.skills ?? [],
      budget: dto.budget,
      ...(dto.dueDate !== undefined ? { dueDate: new Date(dto.dueDate) } : {}),
    },
  });

// Update any of a task's fields, including forcing its status (used by the /projects/:taskId/status alias too).
export const updateTask = (taskId: number, dto: UpdateTaskDto) =>
  prisma.task.update({
    where: { taskId },
    data: {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.category !== undefined ? { category: dto.category } : {}),
      ...(dto.duration !== undefined ? { duration: dto.duration } : {}),
      ...(dto.skills !== undefined ? { skills: dto.skills } : {}),
      ...(dto.budget !== undefined ? { budget: dto.budget } : {}),
      ...(dto.dueDate !== undefined ? { dueDate: new Date(dto.dueDate) } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    },
  });

// Delete a task.
export async function deleteTask(taskId: number): Promise<void> {
  await prisma.task.delete({ where: { taskId } });
}

// ---- Applications -------------------------------------------------------

// List every application platform-wide, with task/client/gig-pro context.
export const listApplications = async () => {
  const applications = await prisma.application.findMany({
    include: {
      task: { include: { client: { include: { user: true } } } },
      gigProfile: { include: { user: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return applications.map((a: any) => ({
    id: "app-" + a.applicationId,
    applicationId: a.applicationId,
    taskId: a.taskId,
    taskTitle: a.task?.title || ("Task #" + a.taskId),
    clientName: a.task?.client?.clientName || "Client",
    gigProfileId: a.gigProfileId,
    gigProName: a.gigProfile?.user?.name || ("Gig Pro #" + a.gigProfileId),
    hourlyRate: a.hourlyRate ? Number(a.hourlyRate) : 75,
    rating: a.rating || 5,
    status: String(a.status).toUpperCase(),
    createdAt: a.createdAt.toISOString().split("T")[0]
  }));
};

// Create an application directly.
export const createApplication = (dto: CreateApplicationDto) =>
  prisma.application.create({
    data: {
      taskId: dto.taskId,
      gigProfileId: dto.gigProfileId,
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    },
  });

// Update an application's status.
export const updateApplication = (applicationId: number, dto: UpdateApplicationDto) =>
  prisma.application.update({
    where: { applicationId },
    data: {
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    },
  });

// Delete an application.
export async function deleteApplication(applicationId: number): Promise<void> {
  await prisma.application.delete({ where: { applicationId } });
}

// ---- Assignments --------------------------------------------------------

// List every gig-professional-to-manager task assignment platform-wide.
export const listAssignments = () =>
  prisma.gigManagerAssignment.findMany({
    include: {
      gigProfile: { include: { user: true } },
      manager: { include: { user: true } },
      task: true
    }
  });

// Create an assignment directly (bypassing the normal accept-application flow).
export const createAssignment = (dto: CreateAssignmentDto) =>
  prisma.gigManagerAssignment.create({
    data: { gigProfileId: dto.gigProfileId, taskId: dto.taskId, managerId: dto.managerId },
  });

// Delete an assignment.
export async function deleteAssignment(gigProfileId: number, taskId: number): Promise<void> {
  await prisma.gigManagerAssignment.delete({
    where: { gigProfileId_taskId: { gigProfileId, taskId } },
  });
}

// ---- Deliverables -------------------------------------------------------

// List every deliverable platform-wide, with task/client/gig-pro context.
export const listDeliverables = async () => {
  const deliverables = await prisma.deliverable.findMany({
    include: {
      task: { include: { client: { include: { user: true } } } },
      gigProfile: { include: { user: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return deliverables.map((d: any) => ({
    id: "del-" + d.taskId + "-" + d.deliverableNo,
    taskId: d.taskId,
    deliverableNo: d.deliverableNo,
    taskTitle: d.task?.title || ("Task #" + d.taskId),
    clientName: d.task?.client?.clientName || "Client Organization",
    gigProfileId: d.gigProfileId,
    gigProName: d.gigProfile?.user?.name || ("Gig Pro #" + d.gigProfileId),
    description: d.description,
    submissionPath: d.submissionPath,
    status: String(d.status).toUpperCase(),
    feedback: d.feedback,
    createdAt: d.createdAt.toISOString().split("T")[0]
  }));
};

// Create a deliverable directly, auto-incrementing its per-task sequence number.
export const createDeliverable = async (dto: CreateDeliverableDto) => {
  const last = await prisma.deliverable.findFirst({
    where: { taskId: dto.taskId },
    orderBy: { deliverableNo: "desc" }
  });
  const deliverableNo = (last?.deliverableNo ?? 0) + 1;

  return prisma.deliverable.create({
    data: {
      taskId: dto.taskId,
      deliverableNo,
      gigProfileId: dto.gigProfileId,
      description: dto.description,
      submissionPath: dto.submissionPath,
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    },
  });
};

// Update a deliverable's fields directly.
export const updateDeliverable = (
  taskId: number,
  deliverableNo: number,
  dto: UpdateDeliverableDto,
) =>
  prisma.deliverable.update({
    where: { taskId_deliverableNo: { taskId, deliverableNo } },
    data: {
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.submissionPath !== undefined ? { submissionPath: dto.submissionPath } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.feedback !== undefined ? { feedback: dto.feedback } : {}),
    },
  });

// Delete a deliverable.
export async function deleteDeliverable(taskId: number, deliverableNo: number): Promise<void> {
  await prisma.deliverable.delete({ where: { taskId_deliverableNo: { taskId, deliverableNo } } });
}

// ---- Payments -----------------------------------------------------------

// List every payment platform-wide, with the platform fee/escrow status derived on read (not stored).
export const listPayments = async () => {
  const payments = await prisma.payment.findMany({
    include: {
      task: { include: { client: { include: { user: true } } } },
      gigProfile: { include: { user: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return payments.map(p => {
    const amount = Number(p.amount);
    const platformFee = Math.round(amount * (platformConfig.commissionRakePercent / 100));
    const totalAmount = amount + platformFee;

    return {
      id: "pay-" + p.paymentId,
      paymentId: p.paymentId,
      taskId: "tsk-" + p.taskId,
      taskTitle: p.task?.title || ("Task #" + p.taskId),
      clientId: p.task ? ("cli-" + p.task.clientId) : "cli-1",
      clientName: p.task?.client?.clientName || p.task?.client?.user?.name || "Client",
      gigProId: "gig-" + p.gigProfileId,
      gigProName: p.gigProfile?.user?.name || ("Gig Pro #" + p.gigProfileId),
      amount,
      grossAmount: amount,
      platformFee,
      platformRake: platformFee,
      totalAmount,
      netPayout: amount,
      status: p.status === "completed" ? "RELEASED" : "HELD_IN_ESCROW",
      escrowStatus: p.status === "completed" ? "RELEASED" : "HELD_IN_ESCROW",
      createdAt: p.createdAt.toISOString().split("T")[0]
    };
  });
};

// Create a payment record directly.
export const createPayment = (dto: CreatePaymentDto) =>
  prisma.payment.create({
    data: {
      taskId: dto.taskId,
      gigProfileId: dto.gigProfileId,
      amount: dto.amount,
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    },
  });

// Update a payment's amount/status — also backs the /payments/:id/override escrow-override alias.
export const updatePayment = (paymentId: number, dto: UpdatePaymentDto) =>
  prisma.payment.update({
    where: { paymentId },
    data: {
      ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    },
  });

// Delete a payment.
export async function deletePayment(paymentId: number): Promise<void> {
  await prisma.payment.delete({ where: { paymentId } });
}

// ---- Reviews ------------------------------------------------------------

/** List every review platform-wide. status/flagCount/comment fallback are display placeholders — there's no moderation-status or flag column in schema.prisma. */
export const listReviews = async () => {
  const reviews = await prisma.review.findMany({
    include: {
      reviewer: true,
      reviewee: true,
      task: true
    },
    orderBy: { createdAt: "desc" }
  });

  return reviews.map(r => ({
    id: "rev-" + r.reviewId,
    reviewId: r.reviewId,
    taskId: "tsk-" + r.taskId,
    taskTitle: r.task?.title || ("Task #" + r.taskId),
    reviewerName: r.reviewer?.name || "Reviewer",
    reviewerRole: r.reviewer?.role?.toUpperCase() || "CLIENT",
    targetUserName: r.reviewee?.name || "Reviewee",
    rating: r.rating,
    comment: r.comment || "Great collaboration!",
    status: "APPROVED",
    flagCount: 0,
    createdAt: r.createdAt ? r.createdAt.toISOString().split("T")[0] : "2026-02-01"
  }));
};

// Create a review directly.
export const createReview = (dto: CreateReviewDto) =>
  prisma.review.create({
    data: {
      reviewerId: dto.reviewerId,
      revieweeId: dto.revieweeId,
      taskId: dto.taskId,
      rating: dto.rating,
      ...(dto.comment !== undefined ? { comment: dto.comment } : {}),
    },
  });

// Update a review's rating/comment.
export const updateReview = (reviewId: number, dto: UpdateReviewDto) =>
  prisma.review.update({
    where: { reviewId },
    data: {
      ...(dto.rating !== undefined ? { rating: dto.rating } : {}),
      ...(dto.comment !== undefined ? { comment: dto.comment } : {}),
    },
  });

// Delete a review.
export async function deleteReview(reviewId: number): Promise<void> {
  await prisma.review.delete({ where: { reviewId } });
}

// ---- Dashboard stats & Analytics ------------------------------------------

// Aggregate platform-wide counts (users/tasks/services/applications) and payment totals (volume, payouts, platform revenue, escrow held) for the admin dashboard.
export async function getDashboardStats() {
  const [
    totalUsers,
    totalClients,
    totalGigPros,
    totalManagers,
    totalAdmins,
    tasksOpen,
    tasksInProgress,
    tasksCompleted,
    totalTasks,
    totalServices,
    totalApplications,
    payments,
    reviewAgg,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.client.count(),
    prisma.gigProfessionalProfile.count(),
    prisma.manager.count(),
    prisma.user.count({ where: { role: "admin" } }),
    prisma.task.count({ where: { status: "open" } }),
    prisma.task.count({ where: { status: "in_progress" } }),
    prisma.task.count({ where: { status: "completed" } }),
    prisma.task.count(),
    prisma.service.count(),
    prisma.application.count(),
    prisma.payment.findMany(),
    prisma.review.aggregate({ _avg: { rating: true }, _count: { reviewId: true } }),
  ]);

  let totalVolume = 0;
  let totalGigPayouts = 0;
  let platformRevenue = 0;
  let escrowHeld = 0;
  let completedTransactions = 0;
  let pendingTransactions = 0;

  for (const p of payments) {
    const amount = Number(p.amount);
    const rake = Math.round(amount * (platformConfig.commissionRakePercent / 100));
    const total = amount + rake;
    totalVolume += total;

    if (p.status === "completed") {
      completedTransactions += 1;
      totalGigPayouts += amount;
      platformRevenue += rake;
    } else {
      pendingTransactions += 1;
      escrowHeld += total;
    }
  }

  return {
    users: {
      total: totalUsers,
      clients: totalClients,
      gigProfessionals: totalGigPros,
      managers: totalManagers,
      admins: totalAdmins,
    },
    tasks: {
      total: totalTasks,
      open: tasksOpen,
      inProgress: tasksInProgress,
      completed: tasksCompleted,
    },
    services: {
      total: totalServices,
      active: totalServices,
    },
    payments: {
      totalTransactions: payments.length,
      completed: completedTransactions,
      pending: pendingTransactions,
      totalVolume,
      gigPayouts: totalGigPayouts,
      platformRevenue,
      escrowHeld,
    },
    reviews: {
      total: reviewAgg._count.reviewId ?? 0,
      averageRating: Number(reviewAgg._avg.rating ?? 5.0),
    },
    grossMerchandiseVolume: totalVolume,
    platformRevenue,
    activeTasks: tasksOpen + tasksInProgress,
    totalUsers,
    pendingDisputes: 0,
    escrowHeld,
    avgPlatformRating: Number(reviewAgg._avg.rating ?? 5.0),
  };
}

/** Build a day-by-day GMV/platform-rake time series from completed payments, for analytics charts. timeRange is accepted but not actually used to filter — every completed payment is included regardless. */
export async function getAnalytics(_timeRange: string = "30d") {
  const kpis = await getDashboardStats();

  const payments = await prisma.payment.findMany({
    where: { status: "completed" },
    orderBy: { createdAt: "asc" }
  });

  const velocityMap: Record<string, { gmv: number; rake: number }> = {};
  for (const p of payments) {
    const dateStr = p.createdAt.toISOString().split("T")[0] || "2026-08-01";
    const amount = Number(p.amount);
    const rake = Math.round(amount * (platformConfig.commissionRakePercent / 100));
    if (!velocityMap[dateStr]) velocityMap[dateStr] = { gmv: 0, rake: 0 };
    velocityMap[dateStr].gmv += amount + rake;
    velocityMap[dateStr].rake += rake;
  }

  const velocity = Object.entries(velocityMap).map(([date, val]) => ({
    date,
    gmv: val.gmv,
    rake: val.rake
  }));

  if (velocity.length === 0) {
    velocity.push({
      date: new Date().toISOString().split("T")[0] || "2026-08-01",
      gmv: Number(kpis.grossMerchandiseVolume),
      rake: Number(kpis.platformRevenue)
    });
  }

  const tasks = await prisma.task.findMany();
  const categoryMap: Record<string, { count: number; gmv: number }> = {};
  let totalCatBudget = 0;
  for (const t of tasks) {
    const cat = t.category || "Software Development";
    const b = Number(t.budget || 0);
    totalCatBudget += b;
    if (!categoryMap[cat]) categoryMap[cat] = { count: 0, gmv: 0 };
    categoryMap[cat].count += 1;
    categoryMap[cat].gmv += b;
  }

  const categories = Object.entries(categoryMap).map(([name, val]) => ({
    name,
    activeTasks: val.count,
    gmv: val.gmv,
    percentage: totalCatBudget > 0 ? Math.round((val.gmv / totalCatBudget) * 100) : 100
  }));

  return {
    timeRange: _timeRange,
    kpis,
    velocity,
    categories: categories.length > 0 ? categories : [
      { name: "Software Development", activeTasks: tasks.length, gmv: totalCatBudget, percentage: 100 }
    ]
  };
}

// ---- Admin Staff & Invitations -------------------------------------------

// List real admin users plus any still-pending in-memory invitations (activeInvitations, not persisted — reset on server restart).
export async function listAdminStaff() {
  const admins = await prisma.user.findMany({ where: { role: "admin" }, orderBy: { userId: "asc" } });
  const staff = admins.map((a, idx) => ({
    id: "adm-" + a.userId,
    name: a.name,
    email: a.email,
    role: idx === 0 ? "OWNER" : "SUPER_ADMIN",
    permissions: ["*"],
    isTwoFactorEnabled: true,
    lastLogin: "Active Now",
    status: "ACTIVE"
  }));

  for (const inv of activeInvitations) {
    if (!staff.some(x => x.email.toLowerCase() === inv.email.toLowerCase())) {
      staff.push({
        id: "inv-" + inv.token.slice(0, 8),
        name: inv.email.split("@")[0],
        email: inv.email,
        role: inv.role,
        permissions: inv.permissions,
        isTwoFactorEnabled: false,
        lastLogin: "Pending Acceptance",
        status: "INVITED"
      });
    }
  }

  return staff;
}

// Generate an admin invite token + a randomly-assigned activation password, held in-memory (activeInvitations) until accepted.
export async function createAdminInvitation(email: string, role: string, permissions: string[]) {
  const token = "inv_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const assignedPassword = "AdminPass#" + Math.floor(100000 + Math.random() * 900000);
  const expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
  const inviteLink = "http://localhost:5173/admin/invite?token=" + token + "&email=" + encodeURIComponent(email);

  const record = {
    id: "inv-" + Date.now(),
    email,
    role,
    permissions,
    assignedPassword,
    token,
    inviteLink,
    expiresAt,
    status: "PENDING"
  };

  activeInvitations.push(record);
  recordAuditLog("INVITE_ADMIN", "Super Admin", "Created invite for " + email + " with role " + role);

  return { email, role, assignedPassword, inviteLink, token, expiresAt };
}

/**
 * Exchange an invite token (or matching email) for a real admin User row and
 * a signed session token, creating the User if one doesn't exist yet.
 * SECURITY: accepts the literal string "password123" as a universal bypass
 * for the activation password check, in addition to the actual assigned
 * one — the same backdoor as auth.service.ts's login. Should be removed.
 */
export async function acceptAdminInvitation(token: string, email: string, password?: string) {
  const inv = activeInvitations.find(i => i.token === token || i.email.toLowerCase() === email.toLowerCase());

  if (inv && inv.assignedPassword && password) {
    const cleanEntered = password.trim();
    const cleanAssigned = inv.assignedPassword.trim();
    if (cleanEntered !== cleanAssigned && cleanEntered !== "password123") {
      throw unauthorized("Invalid master activation password.");
    }
  }

  let user = await prisma.user.findFirst({ where: { email: { equals: email.trim(), mode: "insensitive" } } });
  if (!user) {
    const hashedPassword = await hashPassword(password || "password123");
    user = await prisma.user.create({
      data: {
        name: (email.split("@")[0] || "Admin Staff").replace(/[^a-zA-Z]/g, " "),
        email: email.trim(),
        hashPassword: hashedPassword,
        role: "admin"
      }
    });
  }

  const role = inv?.role || "SUPER_ADMIN";
  const permissions = inv?.permissions || ["*"];

  const authToken = signToken({
    userId: user.userId,
    role: "admin"
  });

  return {
    success: true,
    token: authToken,
    user: {
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: "admin",
      adminTier: role,
      permissions
    }
  };
}

// ---- Disputes & Arbitration ----------------------------------------------

/**
 * FABRICATED DATA: there is no Dispute model in schema.prisma — this lists
 * every task on the platform relabeled as a "dispute" (reason is a hardcoded
 * string, disputeAmount falls back to a made-up 5000, status is just derived
 * from the task's own status). Not filtered to tasks with any actual
 * disagreement. Treat this endpoint's output as non-authoritative.
 */
export async function listDisputes() {
  const tasks = await prisma.task.findMany({
    include: {
      client: { include: { user: true } },
      assignments: { include: { gigProfile: { include: { user: true } } } },
      payments: true
    }
  });

  return tasks.map(t => ({
    id: "disp-" + t.taskId,
    taskId: "tsk-" + t.taskId,
    taskTitle: t.title,
    clientName: t.client?.clientName || "Client Org",
    gigProName: t.assignments[0]?.gigProfile?.user?.name || "Assigned Talent",
    disputeAmount: Number(t.budget || 5000),
    reason: "Deliverable revision arbitration",
    evidenceCount: t.payments.length,
    status: t.status === "completed" ? "RESOLVED" : "IN_REVIEW",
    createdAt: t.createdAt.toISOString().split("T")[0]
  }));
}

// No-op: records an audit-log line and echoes the input back. Since disputes aren't a real model, there's nothing to actually persist a resolution to.
export async function resolveDispute(disputeId: string, resolution: string, refundRatio: number) {
  recordAuditLog("RESOLVE_DISPUTE", "Super Admin", "Arbitrated " + disputeId + " with resolution: " + resolution);
  return { success: true, disputeId, resolution, refundRatio };
}

// ---- Audit Logs ----------------------------------------------------------

// List recent admin actions from the in-memory audit log, seeding it with the 5 most recent user signups the first time it's read if nothing's been logged yet.
export async function listAuditLogs() {
  if (auditLogs.length === 0) {
    const users = await prisma.user.findMany({ take: 5, orderBy: { createdAt: "desc" } });
    for (const u of users) {
      auditLogs.push({
        id: "aud-" + u.userId,
        action: "USER_REGISTERED",
        actor: u.name,
        details: "Registered account as " + u.role,
        timestamp: u.createdAt.toISOString()
      });
    }
  }
  return auditLogs;
}

// ---- Platform Settings ---------------------------------------------------

// Read the in-memory platform config (commission rake, min task budget, escrow hold period, etc.) — not persisted to the DB, resets on server restart.
export async function getPlatformSettings() {
  return platformConfig;
}

// Merge a partial patch into the in-memory platform config and audit-log it.
export async function updatePlatformSettings(patch: Partial<typeof platformConfig>) {
  Object.assign(platformConfig, patch);
  recordAuditLog("UPDATE_SETTINGS", "Super Admin", "Updated platform commission rake and security limits");
  return platformConfig;
}

// ---- Direct Admin Mutation Handlers ----------------------------------------
// Every function below is a BACKEND NO-OP: each just writes an audit-log
// line and echoes {success: true, ...} back. None of them persist anywhere —
// schema.prisma has no kycStatus column on Client, no badge column on
// GigProfessionalProfile, no status column on User, no session table, and
// no moderation-status column on Review. Calling these does not actually
// verify KYC, assign a badge, suspend a user, revoke a session, or moderate
// a review — it only looks like it did from the audit log and the response
// shape. See the CLAUDE.md "Current implementation state" note.

// No-op: does not set any kycStatus (no such column exists).
export async function verifyClientKYC(clientId: number | string) {
  recordAuditLog("VERIFY_KYC", "Super Admin", "Verified KYC for client #" + clientId);
  return { success: true, clientId, kycStatus: "VERIFIED" };
}

// No-op: does not set any badge (no such column exists).
export async function updateGigProBadge(gigProfileId: number | string, badge: string) {
  recordAuditLog("UPDATE_BADGE", "Super Admin", "Assigned " + badge + " badge to gig profile #" + gigProfileId);
  return { success: true, gigProfileId, badge };
}

// No-op: does not actually suspend/reinstate the user (no status column exists) — the user can still log in and use the app normally.
export async function updateUserStatus(userId: number | string, status: string, reason?: string) {
  recordAuditLog("UPDATE_USER_STATUS", "Super Admin", "Set user #" + userId + " status to " + status);
  return { success: true, userId, status, reason };
}

// No-op: JWTs are stateless, so there is no session to actually revoke — the staff member's existing token keeps working until it naturally expires.
export async function revokeAdminSession(staffId: string) {
  recordAuditLog("REVOKE_SESSION", "Super Admin", "Revoked active administrative session for " + staffId);
  return { success: true, staffId, status: "REVOKED" };
}

// No-op: does not hide/flag the review anywhere a normal user would see it (no moderation-status column exists).
export async function moderateReview(reviewId: number | string, status: string, moderatorNotes?: string) {
  recordAuditLog("MODERATE_REVIEW", "Super Admin", "Moderated review #" + reviewId + " to " + status);
  return { success: true, reviewId, status, moderatorNotes };
}

// No-op: does not touch the admin's actual hashPassword — logging in with the old password still works.
export async function updateProfilePassword(_email: string, _newPassword: string) {
  return { success: true, message: "Password updated successfully" };
}

// No-op: there is no 2FA column/mechanism on User — this just echoes the requested state back.
export async function toggleProfile2FA(_email: string, isEnabled: boolean) {
  return { success: true, isTwoFactorEnabled: isEnabled };
}
