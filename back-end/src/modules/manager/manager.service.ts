import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import {
  Task,
  TaskStatus,
  UserRole,
} from '../../common/database/database.types';
import {
  CreateManagerDeliverableDto,
  ManagerLoginDto,
  ReviewManagerDeliverableDto,
  UpdateManagerMeDto,
} from './dto';

export type DeliverableDecision =
  | 'approved'
  | 'revision_requested'
  | 'rejected';

export interface DeliverableReviewState {
  task_id: string;
  deliverable_no: number;
  manager_id: string;
  decision: DeliverableDecision;
  comment?: string;
  reviewedAt: Date;
}

export interface DeliverableCloseState {
  task_id: string;
  deliverable_no: number;
  manager_id: string;
  closedAt: Date;
}

export type ManagerTaskWithAssignments = Task & {
  assigned_gig_profiles: string[];
};

@Injectable()
export class ManagerService {
  private readonly deliverableReviews = new Map<
    string,
    DeliverableReviewState
  >();
  private readonly deliverableClosures = new Map<
    string,
    DeliverableCloseState
  >();

  constructor(private readonly db: DatabaseService) {}

  // ── Auth ─────────────────────────────────────────────────────

  login(dto: ManagerLoginDto) {
    if (!dto?.email || !dto?.password) {
      throw new BadRequestException('email and password are required');
    }

    let user;
    try {
      user = this.db.getUserByEmail(dto.email);
    } catch (_) {
      throw new BadRequestException('invalid credentials');
    }
    if (user.password !== dto.password) {
      throw new BadRequestException('invalid credentials');
    }
    if (user.role !== UserRole.MANAGER) {
      throw new ForbiddenException('user is not a manager');
    }

    const manager = this.findManagerByUserId(user.user_id);
    if (!manager) {
      throw new ForbiddenException('manager record not found');
    }

    return { user, manager };
  }

  logout() {
    // No session store currently; frontend uses x-user-id.
    return { loggedOut: true };
  }

  // ── Profile ─────────────────────────────────────────────────-

  getMe(userId: string) {
    const ctx = this.requireManagerContext(userId);
    return {
      user: ctx.user,
      manager: ctx.manager,
    };
  }

  updateMe(userId: string, dto: UpdateManagerMeDto) {
    const ctx = this.requireManagerContext(userId);

    const updatedUser = this.db.updateUser(ctx.user.user_id, {
      name: dto?.name,
      email: dto?.email,
      password: dto?.password,
    });

    return {
      user: updatedUser,
      manager: ctx.manager,
    };
  }

  // ── Tasks ───────────────────────────────────────────────────-

  getMyTasks(userId: string, status?: string): ManagerTaskWithAssignments[] {
    const ctx = this.requireManagerContext(userId);
    const assignments = Array.from(this.db.assignments.values()).filter(
      (a) => a.manager_id === ctx.manager.manager_id,
    );

    const tasksById = new Map<
      string,
      { task: Task; gig_profile_ids: string[] }
    >();
    for (const assignment of assignments) {
      const task = this.db.tasks.get(assignment.task_id);
      if (!task) continue;

      const existing = tasksById.get(task.task_id);
      if (existing) {
        if (!existing.gig_profile_ids.includes(assignment.gig_profile_id)) {
          existing.gig_profile_ids.push(assignment.gig_profile_id);
        }
      } else {
        tasksById.set(task.task_id, {
          task,
          gig_profile_ids: [assignment.gig_profile_id],
        });
      }
    }

    let rows = Array.from(tasksById.values());

    if (status === 'active') {
      rows = rows.filter((r) => r.task.status === TaskStatus.IN_PROGRESS);
    }

    return rows.map((r) => ({
      ...r.task,
      assigned_gig_profiles: r.gig_profile_ids,
    }));
  }

  getMyTaskById(userId: string, taskId: string) {
    const ctx = this.requireManagerContext(userId);
    this.requireAnyAssignmentOnTask(ctx.manager.manager_id, taskId);
    return this.db.getTask(taskId);
  }

  // ── Deliverables ─────────────────────────────────────────────

  getDeliverables(userId: string, taskId: string) {
    const ctx = this.requireManagerContext(userId);
    const allowedGigProfiles = this.requireAnyAssignmentOnTask(
      ctx.manager.manager_id,
      taskId,
    );

    const deliverables = Array.from(this.db.deliverables.values()).filter(
      (d) => d.task_id === taskId && allowedGigProfiles.has(d.gig_profile_id),
    );

    return deliverables.map((d) => this.withManagerMeta(d));
  }

  getDeliverable(userId: string, taskId: string, deliverableNoRaw: string) {
    const ctx = this.requireManagerContext(userId);
    const allowedGigProfiles = this.requireAnyAssignmentOnTask(
      ctx.manager.manager_id,
      taskId,
    );
    const deliverableNo = this.parsePositiveInt(
      'deliverableNo',
      deliverableNoRaw,
    );

    const key = this.deliverableKey(taskId, deliverableNo);
    const deliverable = this.db.deliverables.get(key);
    if (!deliverable) {
      throw new NotFoundException('deliverable not found');
    }
    if (!allowedGigProfiles.has(deliverable.gig_profile_id)) {
      throw new ForbiddenException('not assigned to this deliverable');
    }

    return this.withManagerMeta(deliverable);
  }

  createDeliverable(
    userId: string,
    taskId: string,
    dto: CreateManagerDeliverableDto,
  ) {
    const user = this.db.getUserById(userId);
    const deliverableNo = dto?.deliverable_no;
    const content = dto?.content ?? dto?.description;

    if (!content) {
      throw new BadRequestException('description is required');
    }

    const task = this.db.getTask(taskId);
    const requestedGigProfileId = dto?.gig_profile_id ?? dto?.assignedGigId;
    const gigProfileId = this.resolveWorkingGigProfileId(
      taskId,
      requestedGigProfileId,
      task.assigned_to,
    );

    if (user.role === UserRole.CLIENT) {
      if (!this.isTaskClientUser(task.client_id, userId)) {
        throw new ForbiddenException('client does not own this task');
      }

      return this.createDeliverableForTask(
        taskId,
        gigProfileId,
        content,
        deliverableNo,
      );
    }

    const ctx = this.requireManagerContext(userId);

    const match = Array.from(this.db.assignments.values()).find(
      (a) =>
        a.task_id === taskId &&
        a.manager_id === ctx.manager.manager_id &&
        a.gig_profile_id === gigProfileId,
    );
    if (!match) {
      throw new ForbiddenException(
        'no assignment exists for this manager on that task',
      );
    }

    const created = this.db.createDeliverable({
      task_id: taskId,
      deliverable_no: deliverableNo,
      gig_profile_id: gigProfileId,
      content,
    });

    return this.withManagerMeta(created);
  }

  reviewDeliverable(
    userId: string,
    taskId: string,
    deliverableNoRaw: string,
    dto: ReviewManagerDeliverableDto,
  ) {
    const ctx = this.requireManagerContext(userId);
    const deliverableNo = this.parsePositiveInt(
      'deliverableNo',
      deliverableNoRaw,
    );

    // Ensures assignment exists + deliverable visible
    const deliverable = this.getDeliverable(
      userId,
      taskId,
      String(deliverableNo),
    );

    const decision = this.normalizeDecision(dto?.decision);
    const comment = dto?.comment;

    const state: DeliverableReviewState = {
      task_id: taskId,
      deliverable_no: deliverableNo,
      manager_id: ctx.manager.manager_id,
      decision,
      comment,
      reviewedAt: new Date(),
    };

    this.deliverableReviews.set(
      this.deliverableKey(taskId, deliverableNo),
      state,
    );
    return this.withManagerMeta(deliverable);
  }

  closeDeliverable(userId: string, taskId: string, deliverableNoRaw: string) {
    const ctx = this.requireManagerContext(userId);
    const deliverableNo = this.parsePositiveInt(
      'deliverableNo',
      deliverableNoRaw,
    );

    // Ensures assignment exists + deliverable visible
    const deliverable = this.getDeliverable(
      userId,
      taskId,
      String(deliverableNo),
    );

    const state: DeliverableCloseState = {
      task_id: taskId,
      deliverable_no: deliverableNo,
      manager_id: ctx.manager.manager_id,
      closedAt: new Date(),
    };

    this.deliverableClosures.set(
      this.deliverableKey(taskId, deliverableNo),
      state,
    );
    return this.withManagerMeta(deliverable);
  }

  // ── Internals ───────────────────────────────────────────────-

  private createDeliverableForTask(
    taskId: string,
    gigProfileId: string,
    content: string,
    deliverableNo?: number,
  ) {
    this.db.getTask(taskId);
    this.db.getGigProfile(gigProfileId);

    const nextNo =
      deliverableNo ??
      Math.max(
        0,
        ...Array.from(this.db.deliverables.values())
          .filter((deliverable) => deliverable.task_id === taskId)
          .map((deliverable) => deliverable.deliverable_no),
      ) + 1;

    const key = this.deliverableKey(taskId, nextNo);
    if (this.db.deliverables.has(key)) {
      throw new BadRequestException('deliverable composite key must be unique');
    }

    const now = new Date();
    const deliverable = {
      task_id: taskId,
      deliverable_no: nextNo,
      gig_profile_id: gigProfileId,
      content: content.trim(),
      status: 'pending' as const,
      createdAt: now,
      updatedAt: now,
    };

    this.db.deliverables.set(key, deliverable);
    return this.withManagerMeta(deliverable);
  }

  private isTaskClientUser(clientId: string, userId: string): boolean {
    if (clientId === userId) {
      return true;
    }

    return Array.from(this.db.clients.values()).some(
      (client) => client.client_id === clientId && client.user_id === userId,
    );
  }

  private resolveWorkingGigProfileId(
    taskId: string,
    requestedGigProfileId?: string,
    assignedTo?: string,
  ): string {
    if (assignedTo) {
      if (requestedGigProfileId && requestedGigProfileId !== assignedTo) {
        throw new BadRequestException(
          'deliverable gig must match the gig assigned to this task',
        );
      }
      return assignedTo;
    }

    if (requestedGigProfileId) {
      return requestedGigProfileId;
    }

    const assignedGigProfiles = Array.from(this.db.assignments.values())
      .filter((assignment) => assignment.task_id === taskId)
      .map((assignment) => assignment.gig_profile_id);

    if (assignedGigProfiles.length === 1) {
      return assignedGigProfiles[0];
    }

    throw new BadRequestException(
      'task does not have a working gig assigned',
    );
  }

  private requireManagerContext(userId: string) {
    const user = this.db.getUserById(userId);
    if (user.role !== UserRole.MANAGER) {
      throw new ForbiddenException('user is not a manager');
    }

    const manager = this.findManagerByUserId(user.user_id);
    if (!manager) {
      throw new ForbiddenException('manager record not found');
    }

    return { user, manager };
  }

  private findManagerByUserId(userId: string) {
    for (const manager of this.db.managers.values()) {
      if (manager.user_id === userId) {
        return manager;
      }
    }
    return null;
  }

  private requireAnyAssignmentOnTask(
    managerId: string,
    taskId: string,
  ): Set<string> {
    const gigProfileIds = new Set<string>();
    for (const assignment of this.db.assignments.values()) {
      if (
        assignment.manager_id === managerId &&
        assignment.task_id === taskId
      ) {
        gigProfileIds.add(assignment.gig_profile_id);
      }
    }
    if (gigProfileIds.size === 0) {
      throw new ForbiddenException(
        'no assignment exists for this manager on that task',
      );
    }
    return gigProfileIds;
  }

  private deliverableKey(taskId: string, deliverableNo: number): string {
    return `${taskId}_${deliverableNo}`;
  }

  private parsePositiveInt(field: string, raw: string): number {
    const n = Number.parseInt(String(raw), 10);
    if (!Number.isInteger(n) || n <= 0) {
      throw new BadRequestException(`${field} must be a positive integer`);
    }
    return n;
  }

  private normalizeDecision(raw: string | undefined): DeliverableDecision {
    if (typeof raw !== 'string' || raw.trim().length === 0) {
      throw new BadRequestException(
        'decision must be one of: approved, revision_requested, rejected',
      );
    }

    const value = raw.trim().toLowerCase();
    if (
      value === 'approved' ||
      value === 'revision_requested' ||
      value === 'rejected'
    ) {
      return value;
    }
    throw new BadRequestException(
      'decision must be one of: approved, revision_requested, rejected',
    );
  }

  private withManagerMeta<
    T extends { task_id: string; deliverable_no: number },
  >(deliverable: T) {
    const key = this.deliverableKey(
      deliverable.task_id,
      deliverable.deliverable_no,
    );
    const review = this.deliverableReviews.get(key) ?? null;
    const close = this.deliverableClosures.get(key) ?? null;
    return {
      ...deliverable,
      manager_review: review,
      manager_closed: close ? true : false,
      manager_closed_at: close?.closedAt ?? null,
    };
  }
}
