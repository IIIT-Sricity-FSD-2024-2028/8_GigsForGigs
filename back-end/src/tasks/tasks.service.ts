import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from '../common/enums/task-status.enum';

/**
 * TasksService — stub implementation.
 * All methods return placeholder responses.
 * Replace internals when DB layer is connected.
 */
@Injectable()
export class TasksService {
  create(dto: CreateTaskDto) {
    // TODO: persist task to DB, default status to OPEN
    return {
      message: 'Task created',
      stub: true,
      data: { ...dto, status: TaskStatus.OPEN, id: 'stub-task-id' },
    };
  }

  findAll(filters: {
    status?: string;
    category?: string;
    clientId?: string;
    assignedTo?: string;
    skills?: string;
    minBudget?: string;
    maxBudget?: string;
  }) {
    // TODO: query DB with filters
    return { message: 'All tasks', stub: true, filters, data: [] };
  }

  getMarketplace(filters: {
    category?: string;
    skills?: string;
    minBudget?: string;
    maxBudget?: string;
    sortBy?: string;
  }) {
    // TODO: query open tasks only, apply sorting, return paginated results
    return {
      message: 'Marketplace tasks',
      stub: true,
      filters,
      data: [],
    };
  }

  findOne(id: string) {
    // TODO: DB lookup
    return { message: `Task ${id}`, stub: true, data: { id } };
  }

  getApplications(taskId: string) {
    // TODO: query applications table by taskId
    return {
      message: `Applications for task ${taskId}`,
      stub: true,
      data: [],
    };
  }

  getDeliverables(taskId: string) {
    // TODO: query deliverables table by taskId
    return {
      message: `Deliverables for task ${taskId}`,
      stub: true,
      data: [],
    };
  }

  update(id: string, dto: UpdateTaskDto) {
    // TODO: patch task in DB; guard that status = OPEN
    return { message: `Task ${id} updated`, stub: true, data: dto };
  }

  assign(id: string, gigProfessionalId: string) {
    // TODO: set assignedTo, update status to IN_PROGRESS, auto-reject other applications
    return {
      message: `Task ${id} assigned to ${gigProfessionalId}`,
      stub: true,
      data: { status: TaskStatus.IN_PROGRESS },
    };
  }

  cancel(id: string) {
    // TODO: guard status, no CANCELLED in DB so mapping to COMPLETED (or handle via soft delete)
    return {
      message: `Task ${id} cancelled`,
      stub: true,
      data: { status: TaskStatus.COMPLETED },
    };
  }

  complete(id: string) {
    // TODO: set status COMPLETED, trigger payment release
    return {
      message: `Task ${id} completed`,
      stub: true,
      data: { status: TaskStatus.COMPLETED },
    };
  }

  remove(id: string) {
    // TODO: guard status = OPEN, soft-delete or hard-delete
    return { message: `Task ${id} deleted`, stub: true };
  }
}
