import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /**
   * POST /tasks
   * Client or Manager posts a new gig
   */
  @Post()
  create(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto);
  }

  /**
   * GET /tasks
   * Browse all tasks with optional filters
   * e.g. GET /tasks?status=open&category=design&clientId=abc&skills=React
   */
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('clientId') clientId?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('skills') skills?: string,
    @Query('minBudget') minBudget?: string,
    @Query('maxBudget') maxBudget?: string,
  ) {
    return this.tasksService.findAll({
      status,
      category,
      clientId,
      assignedTo,
      skills,
      minBudget,
      maxBudget,
    });
  }

  /**
   * GET /tasks/marketplace
   * Public listing of open tasks — sorted for gig professional explore page
   */
  @Get('marketplace')
  getMarketplace(
    @Query('category') category?: string,
    @Query('skills') skills?: string,
    @Query('minBudget') minBudget?: string,
    @Query('maxBudget') maxBudget?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.tasksService.getMarketplace({
      category,
      skills,
      minBudget,
      maxBudget,
      sortBy,
    });
  }

  /**
   * GET /tasks/:id
   * Get a single task by ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  /**
   * GET /tasks/:id/applications
   * Get all applications for a specific task (client/manager view)
   */
  @Get(':id/applications')
  getApplications(@Param('id') id: string) {
    return this.tasksService.getApplications(id);
  }

  /**
   * GET /tasks/:id/deliverables
   * Get all deliverables submitted for a task
   */
  @Get(':id/deliverables')
  getDeliverables(@Param('id') id: string) {
    return this.tasksService.getDeliverables(id);
  }

  /**
   * PATCH /tasks/:id
   * Update task details (only when status = open)
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  /**
   * PATCH /tasks/:id/assign
   * Assign a gig professional to a task (sets status to in_progress)
   */
  @Patch(':id/assign')
  assign(
    @Param('id') id: string,
    @Body('gigProfessionalId') gigProfessionalId: string,
  ) {
    return this.tasksService.assign(id, gigProfessionalId);
  }

  /**
   * PATCH /tasks/:id/cancel
   * Cancel an open task
   */
  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.tasksService.cancel(id);
  }

  /**
   * PATCH /tasks/:id/complete
   * Mark task as completed (triggered after deliverable approval)
   */
  @Patch(':id/complete')
  complete(@Param('id') id: string) {
    return this.tasksService.complete(id);
  }

  /**
   * DELETE /tasks/:id
   * Delete a task (only when status = open)
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
