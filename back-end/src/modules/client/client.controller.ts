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

@Controller('api')
export class ClientController {
	constructor(private readonly clientService: ClientService) {}

	@Post('auth/signup')
	signup(@Body() dto: AuthSignupDto) {
		return this.clientService.signup(dto);
	}

	@Post('auth/login')
	login(@Body() dto: AuthLoginDto) {
		return this.clientService.login(dto);
	}

	@Post('clients/:clientId/profile')
	completeProfile(@Param('clientId') clientId: string, @Body() dto: ClientProfileDto) {
		return this.clientService.completeProfile(clientId, dto);
	}

	@Post('tasks')
	createTask(@Body() dto: CreateTaskDto) {
		return this.clientService.createTask(dto);
	}

	@Get('tasks')
	getTasks(@Query('clientId') clientId?: string) {
		return this.clientService.getTasks(clientId);
	}

	@Put('tasks/:taskId')
	updateTask(@Param('taskId') taskId: string, @Body() dto: UpdateTaskDto) {
		return this.clientService.updateTask(taskId, dto);
	}

	@Patch('tasks/:taskId')
	assignTask(@Param('taskId') taskId: string, @Body() dto: AssignTaskDto) {
		return this.clientService.assignTask(taskId, dto);
	}

	@Delete('tasks/:taskId')
	deleteTask(@Param('taskId') taskId: string, @Query('clientId') clientId?: string) {
		return this.clientService.deleteTask(taskId, clientId);
	}

	@Get('applications')
	getApplications(@Query('taskId') taskId?: string) {
		return this.clientService.getApplications(taskId);
	}

	@Patch('applications/:applicationId')
	updateApplication(
		@Param('applicationId') applicationId: string,
		@Body() dto: UpdateApplicationDto,
	) {
		return this.clientService.updateApplication(applicationId, dto);
	}

	@Get('contracts')
	getContracts(@Query('clientId') clientId?: string, @Query('status') status?: string) {
		return this.clientService.getContracts(clientId, status);
	}

	@Get('tasks/:taskId/deliverables')
	getDeliverables(@Param('taskId') taskId: string) {
		return this.clientService.getDeliverables(taskId);
	}

	@Patch('deliverables/:deliverableId')
	updateDeliverable(
		@Param('deliverableId') deliverableId: string,
		@Body() dto: UpdateDeliverableDto,
	) {
		return this.clientService.updateDeliverable(deliverableId, dto);
	}

	@Get('services')
	getServices() {
		return this.clientService.getServices();
	}

	@Post('services/:serviceId/requests')
	createServiceRequest(
		@Param('serviceId') serviceId: string,
		@Body() dto: CreateServiceRequestDto,
	) {
		return this.clientService.createServiceRequest(serviceId, dto);
	}

	@Get('requests')
	getRequests(@Query('clientId') clientId?: string) {
		return this.clientService.getRequests(clientId);
	}

	@Post('manager-invites')
	createManagerInvite(@Body() dto: CreateManagerInviteDto) {
		return this.clientService.createManagerInvite(dto);
	}

	@Get('manager-invites')
	getManagerInvites(@Query('clientId') clientId?: string) {
		return this.clientService.getManagerInvites(clientId);
	}
}