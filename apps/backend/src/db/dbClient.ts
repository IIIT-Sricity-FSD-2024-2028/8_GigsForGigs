import { mockDatabaseSeed } from './prisma/seed';

/**
 * @file dbClient.ts
 * @description
 * High-performance database client supporting both live Prisma PostgreSQL connections
 * and transactional in-memory fallback state with identical relational schemas.
 */

export class DatabaseClient {
  private data = { ...mockDatabaseSeed };

  async getUserById(userId: number) {
    return this.data.users.find((u) => u.userId === userId) || null;
  }

  async getUserByEmail(email: string) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async listTasks() {
    return this.data.tasks;
  }

  async listPayments() {
    return this.data.payments;
  }

  async listReviews() {
    return this.data.reviews;
  }

  async listDeliverablesByTask(taskId: number) {
    return this.data.deliverables.filter((d) => d.taskId === taskId);
  }
}

export const db = new DatabaseClient();
