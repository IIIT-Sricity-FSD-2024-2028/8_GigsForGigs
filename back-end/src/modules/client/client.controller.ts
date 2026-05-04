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
import { ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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

@ApiTags('Auth', 'Client')
@ApiHeader({
  name: 'x-role',
  description: 'Role for RBAC: CLIENT | MANAGER | GIG_PROFESSIONAL',
  required: true,
})
@Controller('api')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post('auth/signup')
  @ApiOperation({ summary: 'Sign up a new user' })
  @ApiBody({ type: AuthSignupDto })
  @ApiResponse({ status: 201, description: 'User signed up successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER, Role.GIG_PROFESSIONAL)
  signup(@Body() dto: AuthSignupDto) {
    return this.clientService.signup(dto);
  }

  @Post('auth/login')
  @ApiOperation({ summary: 'Log in a user' })
  @ApiBody({ type: AuthLoginDto })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER, Role.GIG_PROFESSIONAL)
  login(@Body() dto: AuthLoginDto) {
    return this.clientService.login(dto);
  }

  @Post('clients/:clientId/profile')
  @ApiOperation({ summary: 'Complete a client profile' })
  @ApiBody({ type: ClientProfileDto })
  @ApiResponse({ status: 201, description: 'Client profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER)
  completeProfile(
    @Param('clientId') clientId: string,
    @Body() dto: ClientProfileDto,
  ) {
    return this.clientService.completeProfile(clientId, dto);
  }

  @Post('tasks')
  @ApiOperation({ summary: 'Create a new task' })
  @ApiBody({ type: CreateTaskDto })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER)
  createTask(@Body() dto: CreateTaskDto) {
    return this.clientService.createTask(dto);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Get tasks for a client' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER)
  getTasks(@Query('clientId') clientId?: string) {
    return this.clientService.getTasks(clientId);
  }

  @Put('tasks/:taskId')
  @ApiOperation({ summary: 'Update a task' })
  @ApiBody({ type: UpdateTaskDto })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER)
  updateTask(@Param('taskId') taskId: string, @Body() dto: UpdateTaskDto) {
    return this.clientService.updateTask(taskId, dto);
  }

  @Patch('tasks/:taskId')
  @ApiOperation({ summary: 'Assign a task' })
  @ApiBody({ type: AssignTaskDto })
  @ApiResponse({ status: 200, description: 'Task assigned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER)
  assignTask(@Param('taskId') taskId: string, @Body() dto: AssignTaskDto) {
    return this.clientService.assignTask(taskId, dto);
  }

  @Delete('tasks/:taskId')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER)
  deleteTask(
    @Param('taskId') taskId: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.clientService.deleteTask(taskId, clientId);
  }

  @Get('applications')
  @ApiOperation({ summary: 'Get applications for a task' })
  @ApiResponse({ status: 200, description: 'Applications retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER)
  getApplications(@Query('taskId') taskId?: string) {
    return this.clientService.getApplications(taskId);
  }

  @Patch('applications/:applicationId')
  @ApiOperation({ summary: 'Update an application status' })
  @ApiBody({ type: UpdateApplicationDto })
  @ApiResponse({ status: 200, description: 'Application updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER)
  updateApplication(
    @Param('applicationId') applicationId: string,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.clientService.updateApplication(applicationId, dto);
  }

  @Get('contracts')
  @ApiOperation({ summary: 'Get contracts' })
  @ApiResponse({ status: 200, description: 'Contracts retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER)
  getContracts(
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
  ) {
    return this.clientService.getContracts(clientId, status);
  }

  @Get('tasks/:taskId/deliverables')
  @ApiOperation({ summary: 'Get task deliverables' })
  @ApiResponse({ status: 200, description: 'Deliverables retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER)
  getDeliverables(@Param('taskId') taskId: string) {
    return this.clientService.getDeliverables(taskId);
  }

  @Patch('deliverables/:deliverableId')
  @ApiOperation({ summary: 'Review a deliverable' })
  @ApiBody({ type: UpdateDeliverableDto })
  @ApiResponse({ status: 200, description: 'Deliverable updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER)
  updateDeliverable(
    @Param('deliverableId') deliverableId: string,
    @Body() dto: UpdateDeliverableDto,
  ) {
    return this.clientService.updateDeliverable(deliverableId, dto);
  }

  @Get('services')
  @ApiOperation({ summary: 'Get services' })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER)
  getServices() {
    return this.clientService.getServices();
  }

  @Post('services/:serviceId/requests')
  @ApiOperation({ summary: 'Create a service request' })
  @ApiBody({ type: CreateServiceRequestDto })
  @ApiResponse({ status: 201, description: 'Service request created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER)
  createServiceRequest(
    @Param('serviceId') serviceId: string,
    @Body() dto: CreateServiceRequestDto,
  ) {
    return this.clientService.createServiceRequest(serviceId, dto);
  }

  @Get('requests')
  @ApiOperation({ summary: 'Get client requests' })
  @ApiResponse({ status: 200, description: 'Requests retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.MANAGER)
  getRequests(@Query('clientId') clientId?: string) {
    return this.clientService.getRequests(clientId);
  }

  @Post('manager-invites')
  @ApiOperation({ summary: 'Create a manager invite' })
  @ApiBody({ type: CreateManagerInviteDto })
  @ApiResponse({ status: 201, description: 'Manager invite created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  createManagerInvite(@Body() dto: CreateManagerInviteDto) {
    return this.clientService.createManagerInvite(dto);
  }

  @Get('manager-invites')
  @ApiOperation({ summary: 'Get manager invites' })
  @ApiResponse({ status: 200, description: 'Manager invites retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  getManagerInvites(@Query('clientId') clientId?: string) {
    return this.clientService.getManagerInvites(clientId);
  }
}
