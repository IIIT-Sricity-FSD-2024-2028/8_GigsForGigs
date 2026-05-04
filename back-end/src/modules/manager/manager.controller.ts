import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/rbac/roles.enum';
import {
  CreateManagerDeliverableDto,
  ManagerLoginDto,
  ReviewManagerDeliverableDto,
  UpdateManagerMeDto,
} from './dto';
import { ManagerService } from './manager.service';

@ApiTags('Auth', 'Manager')
@ApiHeader({
  name: 'x-role',
  description: 'Role for RBAC: CLIENT | MANAGER | GIG_PROFESSIONAL',
  required: true,
})
@Controller('api')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  /**
   * Extract the user ID from the x-user-id header.
   * In production this would come from a JWT guard.
   */
  private extractUserId(header: string | undefined): string {
    if (!header || header.trim().length === 0) {
      throw new BadRequestException('x-user-id header is required');
    }
    return header.trim();
  }

  // ── Auth ─────────────────────────────────────────────────────

  @Post('auth/manager/login')
  @ApiOperation({ summary: 'Log in a manager' })
  @ApiBody({ type: ManagerLoginDto })
  @ApiResponse({ status: 200, description: 'Manager logged in successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER)
  login(@Body() dto: ManagerLoginDto) {
    return this.managerService.login(dto);
  }

  @Post('auth/manager/logout')
  @ApiOperation({ summary: 'Log out a manager' })
  @ApiResponse({ status: 200, description: 'Manager logged out successfully' })
  @Roles(Role.CLIENT, Role.MANAGER)
  logout() {
    return this.managerService.logout();
  }

  // ── Profile ──────────────────────────────────────────────────

  @Get('managers/me')
  @ApiOperation({ summary: 'Get the current manager profile' })
  @ApiResponse({ status: 200, description: 'Manager profile retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER)
  getMe(@Headers('x-user-id') userId: string) {
    return this.managerService.getMe(this.extractUserId(userId));
  }

  @Patch('managers/me')
  @ApiOperation({ summary: 'Update the current manager profile' })
  @ApiBody({ type: UpdateManagerMeDto })
  @ApiResponse({ status: 200, description: 'Manager profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER)
  updateMe(
    @Headers('x-user-id') userId: string,
    @Body() dto: UpdateManagerMeDto,
  ) {
    return this.managerService.updateMe(this.extractUserId(userId), dto);
  }

  // ── Tasks ────────────────────────────────────────────────────

  @Get('managers/me/tasks')
  @ApiOperation({ summary: 'Get tasks assigned to the current manager' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER)
  getMyTasks(
    @Headers('x-user-id') userId: string,
    @Query('status') status?: string,
  ) {
    return this.managerService.getMyTasks(this.extractUserId(userId), status);
  }

  @Get('managers/me/tasks/:taskId')
  @ApiOperation({ summary: 'Get a manager task by id' })
  @ApiResponse({ status: 200, description: 'Task retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER)
  getMyTaskById(
    @Headers('x-user-id') userId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.managerService.getMyTaskById(
      this.extractUserId(userId),
      taskId,
    );
  }

  // ── Deliverables ─────────────────────────────────────────────

  @Get('managers/me/tasks/:taskId/deliverables')
  @ApiOperation({ summary: 'Get all deliverables for a manager task' })
  @ApiResponse({ status: 200, description: 'Deliverables retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER)
  getDeliverables(
    @Headers('x-user-id') userId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.managerService.getDeliverables(
      this.extractUserId(userId),
      taskId,
    );
  }

  @Get('managers/me/tasks/:taskId/deliverables/:deliverableNo')
  @ApiOperation({ summary: 'Get a single deliverable for a manager task' })
  @ApiResponse({ status: 200, description: 'Deliverable retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER)
  getDeliverable(
    @Headers('x-user-id') userId: string,
    @Param('taskId') taskId: string,
    @Param('deliverableNo') deliverableNo: string,
  ) {
    return this.managerService.getDeliverable(
      this.extractUserId(userId),
      taskId,
      deliverableNo,
    );
  }

  @Post('managers/me/tasks/:taskId/deliverables')
  @ApiOperation({ summary: 'Create a deliverable for a manager task' })
  @ApiBody({ type: CreateManagerDeliverableDto })
  @ApiResponse({ status: 201, description: 'Deliverable created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER)
  createDeliverable(
    @Headers('x-user-id') userId: string,
    @Param('taskId') taskId: string,
    @Body() dto: CreateManagerDeliverableDto,
  ) {
    return this.managerService.createDeliverable(
      this.extractUserId(userId),
      taskId,
      dto,
    );
  }

  @Patch('managers/me/tasks/:taskId/deliverables/:deliverableNo/review')
  @ApiOperation({ summary: 'Review a manager deliverable' })
  @ApiBody({ type: ReviewManagerDeliverableDto })
  @ApiResponse({ status: 200, description: 'Deliverable reviewed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER)
  reviewDeliverable(
    @Headers('x-user-id') userId: string,
    @Param('taskId') taskId: string,
    @Param('deliverableNo') deliverableNo: string,
    @Body() dto: ReviewManagerDeliverableDto,
  ) {
    return this.managerService.reviewDeliverable(
      this.extractUserId(userId),
      taskId,
      deliverableNo,
      dto,
    );
  }

  @Patch('managers/me/tasks/:taskId/deliverables/:deliverableNo/close')
  @ApiOperation({ summary: 'Close a manager deliverable' })
  @ApiResponse({ status: 200, description: 'Deliverable closed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER)
  closeDeliverable(
    @Headers('x-user-id') userId: string,
    @Param('taskId') taskId: string,
    @Param('deliverableNo') deliverableNo: string,
  ) {
    return this.managerService.closeDeliverable(
      this.extractUserId(userId),
      taskId,
      deliverableNo,
    );
  }
}
