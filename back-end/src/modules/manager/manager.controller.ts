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
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/rbac/roles.enum';
import {
  CreateManagerDeliverableDto,
  ManagerLoginDto,
  ReviewManagerDeliverableDto,
  UpdateManagerMeDto,
} from './dto';
import { ManagerService } from './manager.service';

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
  @Roles(Role.CLIENT, Role.MANAGER)
  login(@Body() dto: ManagerLoginDto) {
    return this.managerService.login(dto);
  }

  @Post('auth/manager/logout')
  @Roles(Role.CLIENT, Role.MANAGER)
  logout() {
    return this.managerService.logout();
  }

  // ── Profile ──────────────────────────────────────────────────

  @Get('managers/me')
  @Roles(Role.CLIENT, Role.MANAGER)
  getMe(@Headers('x-user-id') userId: string) {
    return this.managerService.getMe(this.extractUserId(userId));
  }

  @Patch('managers/me')
  @Roles(Role.CLIENT, Role.MANAGER)
  updateMe(
    @Headers('x-user-id') userId: string,
    @Body() dto: UpdateManagerMeDto,
  ) {
    return this.managerService.updateMe(this.extractUserId(userId), dto);
  }

  // ── Tasks ────────────────────────────────────────────────────

  @Get('managers/me/tasks')
  @Roles(Role.CLIENT, Role.MANAGER)
  getMyTasks(
    @Headers('x-user-id') userId: string,
    @Query('status') status?: string,
  ) {
    return this.managerService.getMyTasks(this.extractUserId(userId), status);
  }

  @Get('managers/me/tasks/:taskId')
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
