/**
 * Dummy-data seed script. Wipes and repopulates every table with realistic
 * fake data via @faker-js/faker, in dependency order so every foreign key is
 * always pointing at a row that already exists.
 *
 * Run with `npx prisma db seed` (wired up in prisma.config.ts).
 */
import bcrypt from "bcrypt";
import { faker } from "@faker-js/faker";
import {
  prisma,
  Role,
  TaskStatus,
  ApplicationStatus,
  DeliverableStatus,
  PaymentStatus,
  ServiceStatus,
  ServiceRequestStatus,
  InviteStatus,
} from "../index.js";

// Every seeded user shares this password so you can log in as anyone below.
const SEED_PASSWORD = "password123";

const ADMIN_COUNT = 2;
const CLIENT_COUNT = 7;
const MANAGER_COUNT = 4;
const GIG_COUNT = 7;
const TASK_COUNT = 18;
const APPLICATION_COUNT = 18;
const ASSIGNMENT_COUNT = 12;
const SERVICE_PER_GIG = 2;
const SERVICE_REQUEST_COUNT = 15;
const MANAGER_INVITE_COUNT = 10;

function pickUniquePairs<A, B>(
  count: number,
  as: A[],
  bs: B[],
  keyFn: (a: A, b: B) => string,
): Array<{ a: A; b: B }> {
  const seen = new Set<string>();
  const pairs: Array<{ a: A; b: B }> = [];
  const maxAttempts = count * 50;
  let attempts = 0;
  while (pairs.length < count && attempts < maxAttempts) {
    attempts++;
    const a = faker.helpers.arrayElement(as);
    const b = faker.helpers.arrayElement(bs);
    const key = keyFn(a, b);
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({ a, b });
  }
  return pairs;
}

async function clearDatabase() {
  // Reverse dependency order.
  await prisma.serviceRequest.deleteMany();
  await prisma.serviceTag.deleteMany();
  await prisma.service.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.deliverable.deleteMany();
  await prisma.gigManagerAssignment.deleteMany();
  await prisma.application.deleteMany();
  await prisma.task.deleteMany();
  await prisma.managerInvite.deleteMany();
  await prisma.profilePortfolio.deleteMany();
  await prisma.profileTool.deleteMany();
  await prisma.profileSkill.deleteMany();
  await prisma.manager.deleteMany();
  await prisma.gigProfessionalProfile.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
}

async function seedUsers() {
  const hashPassword = await bcrypt.hash(SEED_PASSWORD, 10);

  const adminUsers = [];
  for (let i = 0; i < ADMIN_COUNT; i++) {
    adminUsers.push(
      await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email().toLowerCase(),
          hashPassword,
          role: Role.admin,
        },
      }),
    );
  }

  const clientUsers = [];
  for (let i = 0; i < CLIENT_COUNT; i++) {
    clientUsers.push(
      await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email().toLowerCase(),
          hashPassword,
          role: Role.client,
        },
      }),
    );
  }

  const managerUsers = [];
  for (let i = 0; i < MANAGER_COUNT; i++) {
    managerUsers.push(
      await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email().toLowerCase(),
          hashPassword,
          role: Role.manager,
        },
      }),
    );
  }

  const gigUsers = [];
  for (let i = 0; i < GIG_COUNT; i++) {
    gigUsers.push(
      await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email().toLowerCase(),
          hashPassword,
          role: Role.gig_professional,
        },
      }),
    );
  }

  return { adminUsers, clientUsers, managerUsers, gigUsers };
}

async function seedClients(clientUsers: Array<{ userId: number }>) {
  const clients = [];
  for (const user of clientUsers) {
    clients.push(
      await prisma.client.create({
        data: {
          userId: user.userId,
          clientName: faker.company.name(),
          domain: faker.internet.domainName(),
          numberOfManager: 0,
        },
      }),
    );
  }
  return clients;
}

async function seedManagers(
  managerUsers: Array<{ userId: number }>,
  clients: Array<{ clientId: number }>,
) {
  const managers = [];
  for (const user of managerUsers) {
    const client = faker.helpers.arrayElement(clients);
    const manager = await prisma.manager.create({
      data: {
        userId: user.userId,
        clientId: client.clientId,
      },
    });
    await prisma.client.update({
      where: { clientId: client.clientId },
      data: { numberOfManager: { increment: 1 } },
    });
    managers.push(manager);
  }
  return managers;
}

async function seedGigProfiles(gigUsers: Array<{ userId: number }>) {
  const profiles = [];
  for (const user of gigUsers) {
    profiles.push(
      await prisma.gigProfessionalProfile.create({
        data: {
          userId: user.userId,
          bio: faker.person.bio(),
        },
      }),
    );
  }
  return profiles;
}

async function seedProfileJoinTables(profiles: Array<{ gigProfileId: number }>) {
  const skillPool = [
    "React",
    "Node.js",
    "TypeScript",
    "Figma",
    "SEO",
    "Copywriting",
    "PostgreSQL",
    "Vue",
    "Python",
    "Data Analysis",
    "UI/UX Design",
    "Video Editing",
  ];
  const toolPool = ["VS Code", "Figma", "Slack", "Jira", "Notion", "GitHub", "Postman", "Docker"];

  const skillRows: Array<{ gigProfileId: number; skill: string }> = [];
  const toolRows: Array<{ gigProfileId: number; tool: string }> = [];
  const portfolioRows: Array<{ gigProfileId: number; url: string }> = [];

  for (const profile of profiles) {
    const skills = faker.helpers.arrayElements(skillPool, faker.number.int({ min: 2, max: 3 }));
    for (const skill of skills) {
      skillRows.push({ gigProfileId: profile.gigProfileId, skill });
    }

    const tools = faker.helpers.arrayElements(toolPool, faker.number.int({ min: 1, max: 2 }));
    for (const tool of tools) {
      toolRows.push({ gigProfileId: profile.gigProfileId, tool });
    }

    const portfolioCount = faker.number.int({ min: 1, max: 2 });
    for (let i = 0; i < portfolioCount; i++) {
      portfolioRows.push({ gigProfileId: profile.gigProfileId, url: faker.internet.url() });
    }
  }

  await prisma.profileSkill.createMany({ data: skillRows });
  await prisma.profileTool.createMany({ data: toolRows });
  await prisma.profilePortfolio.createMany({ data: portfolioRows });

  return { skillCount: skillRows.length, toolCount: toolRows.length, portfolioCount: portfolioRows.length };
}

async function seedTasks(clients: Array<{ clientId: number }>) {
  const tasks = [];
  for (let i = 0; i < TASK_COUNT; i++) {
    const client = faker.helpers.arrayElement(clients);
    tasks.push(
      await prisma.task.create({
        data: {
          clientId: client.clientId,
          title: faker.hacker.phrase().replace(/^\w/, (c) => c.toUpperCase()),
          description: faker.lorem.paragraph(),
          budget: faker.number.int({ min: 200, max: 8000 }),
          dueDate: faker.date.future(),
          status: faker.helpers.arrayElement([TaskStatus.open, TaskStatus.in_progress, TaskStatus.completed]),
        },
      }),
    );
  }
  return tasks;
}

async function seedApplications(
  profiles: Array<{ gigProfileId: number }>,
  tasks: Array<{ taskId: number }>,
) {
  const pairs = pickUniquePairs(
    APPLICATION_COUNT,
    profiles,
    tasks,
    (a, b) => `${a.gigProfileId}:${b.taskId}`,
  );

  const rows = pairs.map(({ a, b }) => ({
    gigProfileId: a.gigProfileId,
    taskId: b.taskId,
    status: faker.helpers.arrayElement([
      ApplicationStatus.pending,
      ApplicationStatus.accepted,
      ApplicationStatus.declined,
    ]),
  }));

  await prisma.application.createMany({ data: rows });
  return rows;
}

async function seedAssignments(
  profiles: Array<{ gigProfileId: number }>,
  tasks: Array<{ taskId: number }>,
  managers: Array<{ managerId: number }>,
) {
  const pairs = pickUniquePairs(
    ASSIGNMENT_COUNT,
    profiles,
    tasks,
    (a, b) => `${a.gigProfileId}:${b.taskId}`,
  );

  const rows = pairs.map(({ a, b }) => ({
    gigProfileId: a.gigProfileId,
    taskId: b.taskId,
    managerId: faker.helpers.arrayElement(managers).managerId,
  }));

  await prisma.gigManagerAssignment.createMany({ data: rows });
  return rows;
}

async function seedDeliverables(
  assignments: Array<{ gigProfileId: number; taskId: number }>,
) {
  const rows: Array<{
    taskId: number;
    deliverableNo: number;
    gigProfileId: number;
    description: string;
    submissionPath: string;
    feedback?: string;
    status: DeliverableStatus;
  }> = [];

  // deliverableNo is only unique per task (not per assignment), so multiple
  // gig pros assigned to the same task must keep counting up from where the
  // previous assignment on that task left off.
  const nextDeliverableNo = new Map<number, number>();

  for (const assignment of assignments) {
    const deliverableCount = faker.number.int({ min: 1, max: 2 });
    const start = nextDeliverableNo.get(assignment.taskId) ?? 1;
    for (let no = start; no < start + deliverableCount; no++) {
      const status = faker.helpers.arrayElement([
        DeliverableStatus.submitted,
        DeliverableStatus.approved,
        DeliverableStatus.revision_requested,
        DeliverableStatus.closed,
      ]);
      rows.push({
        taskId: assignment.taskId,
        deliverableNo: no,
        gigProfileId: assignment.gigProfileId,
        description: faker.lorem.sentence(),
        submissionPath: faker.internet.url() + "/" + faker.system.commonFileName("zip"),
        ...(status !== DeliverableStatus.submitted ? { feedback: faker.lorem.sentence() } : {}),
        status,
      });
    }
    nextDeliverableNo.set(assignment.taskId, start + deliverableCount);
  }

  await prisma.deliverable.createMany({ data: rows });
  return rows;
}

async function seedPayments(assignments: Array<{ gigProfileId: number; taskId: number }>) {
  const rows = assignments.map((assignment) => ({
    taskId: assignment.taskId,
    gigProfileId: assignment.gigProfileId,
    amount: faker.number.int({ min: 200, max: 8000 }),
    status: faker.helpers.arrayElement([
      PaymentStatus.pending,
      PaymentStatus.completed,
      PaymentStatus.failed,
    ]),
  }));

  await prisma.payment.createMany({ data: rows });
  return rows;
}

async function seedReviews(
  assignments: Array<{ gigProfileId: number; taskId: number }>,
  gigUserByProfileId: Map<number, number>,
  clientUserByTaskId: Map<number, number>,
) {
  const seen = new Set<string>();
  const rows: Array<{
    reviewerId: number;
    revieweeId: number;
    taskId: number;
    rating: number;
    comment: string;
  }> = [];

  for (const assignment of assignments) {
    const reviewerId = clientUserByTaskId.get(assignment.taskId);
    const revieweeId = gigUserByProfileId.get(assignment.gigProfileId);
    if (reviewerId === undefined || revieweeId === undefined) continue;

    const key = `${reviewerId}:${revieweeId}:${assignment.taskId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push({
      reviewerId,
      revieweeId,
      taskId: assignment.taskId,
      rating: faker.number.int({ min: 1, max: 5 }),
      comment: faker.lorem.sentence(),
    });
  }

  await prisma.review.createMany({ data: rows });
  return rows;
}

async function seedServices(profiles: Array<{ gigProfileId: number }>) {
  const services = [];
  for (const profile of profiles) {
    for (let i = 0; i < SERVICE_PER_GIG; i++) {
      services.push(
        await prisma.service.create({
          data: {
            gigProfileId: profile.gigProfileId,
            title: faker.commerce.productName(),
            description: faker.commerce.productDescription(),
            price: faker.number.int({ min: 100, max: 6000 }),
            thumbnail: faker.image.urlPicsumPhotos(),
            status: faker.helpers.arrayElement([
              ServiceStatus.active,
              ServiceStatus.paused,
              ServiceStatus.archived,
            ]),
          },
        }),
      );
    }
  }
  return services;
}

async function seedServiceTags(services: Array<{ serviceId: number }>) {
  const tagPool = ["design", "development", "marketing", "writing", "video", "consulting", "data"];
  const rows: Array<{ serviceId: number; tag: string }> = [];
  for (const service of services) {
    const tags = faker.helpers.arrayElements(tagPool, faker.number.int({ min: 1, max: 3 }));
    for (const tag of tags) {
      rows.push({ serviceId: service.serviceId, tag });
    }
  }
  await prisma.serviceTag.createMany({ data: rows });
  return rows;
}

async function seedServiceRequests(
  services: Array<{ serviceId: number }>,
  clients: Array<{ clientId: number }>,
) {
  const pairs = pickUniquePairs(
    SERVICE_REQUEST_COUNT,
    services,
    clients,
    (a, b) => `${a.serviceId}:${b.clientId}`,
  );

  const rows = pairs.map(({ a, b }) => ({
    serviceId: a.serviceId,
    clientId: b.clientId,
    status: faker.helpers.arrayElement([
      ServiceRequestStatus.pending,
      ServiceRequestStatus.accepted,
      ServiceRequestStatus.declined,
    ]),
  }));

  await prisma.serviceRequest.createMany({ data: rows });
  return rows;
}

async function seedManagerInvites(clients: Array<{ clientId: number }>) {
  const rows = [];
  for (let i = 0; i < MANAGER_INVITE_COUNT; i++) {
    const client = faker.helpers.arrayElement(clients);
    rows.push({
      clientId: client.clientId,
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      status: faker.helpers.arrayElement([InviteStatus.pending, InviteStatus.accepted, InviteStatus.revoked]),
    });
  }
  await prisma.managerInvite.createMany({ data: rows, skipDuplicates: true });
  return rows;
}

async function main() {
  console.log("Clearing existing data...");
  await clearDatabase();

  console.log("Seeding users...");
  const { adminUsers, clientUsers, managerUsers, gigUsers } = await seedUsers();

  console.log("Seeding clients, managers, gig profiles...");
  const clients = await seedClients(clientUsers);
  const managers = await seedManagers(managerUsers, clients);
  const profiles = await seedGigProfiles(gigUsers);

  console.log("Seeding profile skills/tools/portfolio...");
  const profileJoinCounts = await seedProfileJoinTables(profiles);

  console.log("Seeding tasks...");
  const tasks = await seedTasks(clients);

  console.log("Seeding applications...");
  const applications = await seedApplications(profiles, tasks);

  console.log("Seeding manager assignments...");
  const assignments = await seedAssignments(profiles, tasks, managers);

  console.log("Seeding deliverables...");
  const deliverables = await seedDeliverables(assignments);

  console.log("Seeding payments...");
  const payments = await seedPayments(assignments);

  console.log("Seeding reviews...");
  const gigUserByProfileId = new Map(profiles.map((p, i) => [p.gigProfileId, gigUsers[i]!.userId]));
  const clientUserByTaskId = new Map(
    tasks.map((t) => {
      const client = clients.find((c) => c.clientId === t.clientId)!;
      const clientUserIdx = clients.indexOf(client);
      return [t.taskId, clientUsers[clientUserIdx]!.userId];
    }),
  );
  const reviews = await seedReviews(assignments, gigUserByProfileId, clientUserByTaskId);

  console.log("Seeding services...");
  const services = await seedServices(profiles);
  const serviceTags = await seedServiceTags(services);
  const serviceRequests = await seedServiceRequests(services, clients);

  console.log("Seeding manager invites...");
  const managerInvites = await seedManagerInvites(clients);

  console.log("\nSeed summary:");
  console.table({
    User: adminUsers.length + clientUsers.length + managerUsers.length + gigUsers.length,
    Client: clients.length,
    Manager: managers.length,
    GigProfessionalProfile: profiles.length,
    ProfileSkill: profileJoinCounts.skillCount,
    ProfileTool: profileJoinCounts.toolCount,
    ProfilePortfolio: profileJoinCounts.portfolioCount,
    Task: tasks.length,
    Application: applications.length,
    GigManagerAssignment: assignments.length,
    Deliverable: deliverables.length,
    Payment: payments.length,
    Review: reviews.length,
    Service: services.length,
    ServiceTag: serviceTags.length,
    ServiceRequest: serviceRequests.length,
    ManagerInvite: managerInvites.length,
  });
  console.log(`\nAll seeded users share the password: "${SEED_PASSWORD}"`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
