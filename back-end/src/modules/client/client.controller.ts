import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  AssignTaskDto,
  AuthLoginDto,
  AuthSignupDto,
  ClientProfileDto,
  CreateManagerInviteDto,
  CreateServiceRequestDto,
  CreateTaskDto,
  UpdateApplicationDto,
  UpdateDeliverableDto,
  UpdateTaskDto,
} from './dto';
import { ClientService } from './client.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/rbac/roles.enum';

@Controller('api')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post('auth/signup')
  @Roles(Role.CLIENT, Role.MANAGER, Role.GIG_PROFESSIONAL)
  signup(@Body() dto: AuthSignupDto) {
    return this.clientService.signup(dto);
  }

  @Post('auth/login')
  @Roles(Role.CLIENT, Role.MANAGER, Role.GIG_PROFESSIONAL)
  login(@Body() dto: AuthLoginDto) {
    return this.clientService.login(dto);
  }

  @Post('clients/:clientId/profile')
  @Roles(Role.CLIENT, Role.MANAGER)
  completeProfile(
    @Param('clientId') clientId: string,
    @Body() dto: ClientProfileDto,
  ) {
    return this.clientService.completeProfile(clientId, dto);
  }

  @Post('tasks')
  @Roles(Role.CLIENT, Role.MANAGER)
  createTask(@Body() dto: CreateTaskDto) {
    return this.clientService.createTask(dto);
  }

  @Get('tasks')
  @Roles(Role.CLIENT, Role.MANAGER)
  getTasks(@Query('clientId') clientId?: string) {
    return this.clientService.getTasks(clientId);
  }

  @Put('tasks/:taskId')
  @Roles(Role.CLIENT, Role.MANAGER)
  updateTask(@Param('taskId') taskId: string, @Body() dto: UpdateTaskDto) {
    return this.clientService.updateTask(taskId, dto);
  }

  @Patch('tasks/:taskId')
  @Roles(Role.CLIENT, Role.MANAGER)
  assignTask(@Param('taskId') taskId: string, @Body() dto: AssignTaskDto) {
    return this.clientService.assignTask(taskId, dto);
  }

  @Delete('tasks/:taskId')
  @Roles(Role.CLIENT, Role.MANAGER)
  deleteTask(
    @Param('taskId') taskId: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.clientService.deleteTask(taskId, clientId);
  }

  @Get('applications')
  @Roles(Role.CLIENT, Role.MANAGER)
  getApplications(@Query('taskId') taskId?: string) {
    return this.clientService.getApplications(taskId);
  }

  @Patch('applications/:applicationId')
  @Roles(Role.CLIENT, Role.MANAGER)
  updateApplication(
    @Param('applicationId') applicationId: string,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.clientService.updateApplication(applicationId, dto);
  }

  @Get('contracts')
  @Roles(Role.CLIENT, Role.MANAGER)
  getContracts(
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
  ) {
    return this.clientService.getContracts(clientId, status);
  }

  @Get('tasks/:taskId/deliverables')
  @Roles(Role.CLIENT, Role.MANAGER)
  getDeliverables(@Param('taskId') taskId: string) {
    return this.clientService.getDeliverables(taskId);
  }

  @Patch('deliverables/:deliverableId')
  @Roles(Role.CLIENT, Role.MANAGER)
  updateDeliverable(
    @Param('deliverableId') deliverableId: string,
    @Body() dto: UpdateDeliverableDto,
  ) {
    return this.clientService.updateDeliverable(deliverableId, dto);
  }

  @Get('services')
  @Roles(Role.CLIENT, Role.MANAGER)
  getServices() {
    return this.clientService.getServices();
  }

  @Post('services/:serviceId/requests')
  @Roles(Role.CLIENT, Role.MANAGER)
  createServiceRequest(
    @Param('serviceId') serviceId: string,
    @Body() dto: CreateServiceRequestDto,
  ) {
    return this.clientService.createServiceRequest(serviceId, dto);
  }

  @Get('requests')
  @Roles(Role.CLIENT, Role.MANAGER)
  getRequests(@Query('clientId') clientId?: string) {
    return this.clientService.getRequests(clientId);
  }

  @Post('manager-invites')
  @Roles(Role.CLIENT)
  createManagerInvite(@Body() dto: CreateManagerInviteDto) {
    return this.clientService.createManagerInvite(dto);
  }

  @Get('manager-invites')
  @Roles(Role.CLIENT)
  getManagerInvites(@Query('clientId') clientId?: string) {
    return this.clientService.getManagerInvites(clientId);
  }
}
