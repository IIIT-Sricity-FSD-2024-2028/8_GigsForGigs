import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { TaskStatus, UserRole } from '../../common/database/database.types';
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

type ContractStatus = 'pending' | 'active' | 'completed' | 'cancelled';

@Injectable()
export class ClientService {
	constructor(private readonly db: DatabaseService) {}

	signup(dto: AuthSignupDto) {
		const user = this.db.createUser({
			name: dto.name,
			email: dto.email,
			password: dto.password,
			role: UserRole.CLIENT,
		});
		const client = this.db.createClient({ user_id: user.user_id });
		return { user, client };
	}

	login(dto: AuthLoginDto) {
		const user = this.db.getUserByEmail(dto.email);
		if (user.password !== dto.password) {
			throw new BadRequestException('invalid credentials');
		}
		return user;
	}

	completeProfile(clientId: string, dto: ClientProfileDto) {
		const client = this.db.getClient(clientId);
		const updatedClient = { ...client, updatedAt: new Date() };
		this.db.clients.set(updatedClient.client_id, updatedClient);
		return { client: updatedClient, profile: dto };
	}

	createTask(dto: CreateTaskDto) {
		return this.db.createTask({
			client_id: dto.client_id,
			title: dto.title,
			description: dto.description,
			budget: dto.budget,
			status: dto.status ?? TaskStatus.OPEN,
		});
	}

	getTasks(clientId?: string) {
		const tasks = Array.from(this.db.tasks.values());
		return clientId ? tasks.filter((task) => task.client_id === clientId) : tasks;
	}

	updateTask(taskId: string, dto: UpdateTaskDto) {
		const task = this.db.tasks.get(taskId);
		if (!task) throw new NotFoundException(`Task not found: ${taskId}`);
		if (dto.client_id && task.client_id !== dto.client_id) {
			throw new BadRequestException('client_id does not match task client_id');
		}

		const nextStatus = dto.status ?? task.status;
		if (!this.isTaskTransitionAllowed(task.status, nextStatus)) {
			throw new BadRequestException('invalid task status transition');
		}

		const updated = {
			...task,
			title: dto.title ?? task.title,
			description: dto.description ?? task.description,
			budget: dto.budget ?? task.budget,
			status: nextStatus,
			updatedAt: new Date(),
		};

		this.db.tasks.set(updated.task_id, updated);
		return updated;
	}

	assignTask(taskId: string, dto: AssignTaskDto) {
		const task = this.db.tasks.get(taskId);
		if (!task) throw new NotFoundException(`Task not found: ${taskId}`);
		if (task.status !== TaskStatus.OPEN) {
			throw new BadRequestException('task must be OPEN to assign');
		}

		const assignment = this.db.assignManager({
			gig_profile_id: dto.gig_profile_id,
			task_id: taskId,
			manager_id: dto.manager_id,
			client_id: task.client_id,
		});

		const updatedTask = {
			...task,
			status: TaskStatus.IN_PROGRESS,
			updatedAt: new Date(),
		};

		this.db.tasks.set(updatedTask.task_id, updatedTask);
		this.rejectOtherApplications(taskId, dto.gig_profile_id);

		return { task: updatedTask, assignment };
	}

	deleteTask(taskId: string, clientId?: string) {
		const task = this.db.tasks.get(taskId);
		if (!task) throw new NotFoundException(`Task not found: ${taskId}`);
		if (clientId && task.client_id !== clientId) {
			throw new BadRequestException('client_id does not match task client_id');
		}
		this.db.tasks.delete(taskId);
		return { deleted: true, task_id: taskId };
	}

	getApplications(taskId?: string) {
		const applications = Array.from(this.db.applications.values());
		return taskId
			? applications.filter((application) => application.task_id === taskId)
			: applications;
	}

	updateApplication(applicationId: string, dto: UpdateApplicationDto) {
		const application = this.db.applications.get(applicationId);
		if (!application) throw new NotFoundException(`Application not found: ${applicationId}`);

		if (dto.status === 'rejected') {
			this.db.applications.delete(applicationId);
			return { application_id: applicationId, status: 'rejected' };
		}

		return { application, status: 'shortlisted' };
	}

	getContracts(clientId?: string, status?: string) {
		if (!clientId) return [];

		const tasks = Array.from(this.db.tasks.values()).filter(
			(task) => task.client_id === clientId,
		);

		const contracts = tasks.map((task) => {
			const assignment = Array.from(this.db.assignments.values()).find(
				(item) => item.task_id === task.task_id,
			);
			const contractStatus = this.mapContractStatus(task.status);
			return {
				task_id: task.task_id,
				client_id: task.client_id,
				gig_profile_id: assignment?.gig_profile_id ?? null,
				status: contractStatus,
				title: task.title,
				budget: task.budget,
				createdAt: task.createdAt,
				updatedAt: task.updatedAt,
			};
		});

		return status ? contracts.filter((contract) => contract.status === status) : contracts;
	}

	getDeliverables(taskId: string) {
		return Array.from(this.db.deliverables.values()).filter(
			(deliverable) => deliverable.task_id === taskId,
		);
	}

	updateDeliverable(deliverableId: string, dto: UpdateDeliverableDto) {
		const deliverable = this.db.deliverables.get(deliverableId);
		if (!deliverable) throw new NotFoundException(`Deliverable not found: ${deliverableId}`);

		const task = this.db.tasks.get(deliverable.task_id);
		if (!task) throw new NotFoundException(`Task not found: ${deliverable.task_id}`);

		if (dto.action === 'approve') {
			const updatedTask = {
				...task,
				status: TaskStatus.COMPLETED,
				updatedAt: new Date(),
			};

			this.db.tasks.set(updatedTask.task_id, updatedTask);

			const payment = this.db.createPayment({
				task_id: deliverable.task_id,
				gig_profile_id: deliverable.gig_profile_id,
				amount: task.budget,
			});

			return { deliverable, task: updatedTask, payment, status: 'approved' };
		}

		return { deliverable, task, status: 'revision_requested' };
	}

	getServices() {
		return Array.from(this.db.gigProfiles.values()).map((gigProfile) => {
			const user = this.db.users.get(gigProfile.user_id) ?? null;
			return {
				service_id: gigProfile.gig_profile_id,
				gig_profile_id: gigProfile.gig_profile_id,
				user,
				skills: this.db.profileSkills.get(gigProfile.gig_profile_id) ?? [],
				tools: this.db.profileTools.get(gigProfile.gig_profile_id) ?? [],
				portfolio: this.db.profilePortfolio.get(gigProfile.gig_profile_id) ?? [],
				createdAt: gigProfile.createdAt,
				updatedAt: gigProfile.updatedAt,
			};
		});
	}

	createServiceRequest(serviceId: string, dto: CreateServiceRequestDto) {
		const task = this.db.createTask({
			client_id: dto.client_id,
			title: dto.title,
			description: dto.description,
			budget: dto.budget,
			status: TaskStatus.OPEN,
		});

		const application = this.db.applyToTask({
			gig_profile_id: serviceId,
			task_id: task.task_id,
		});

		return { task, request: application };
	}

	getRequests(clientId?: string) {
		if (!clientId) return [];

		const tasks = Array.from(this.db.tasks.values()).filter(
			(task) => task.client_id === clientId,
		);
		const taskIds = new Set(tasks.map((task) => task.task_id));

		return Array.from(this.db.applications.values())
			.filter((application) => taskIds.has(application.task_id))
			.map((application) => {
				const task = this.db.tasks.get(application.task_id);
				const assignment = Array.from(this.db.assignments.values()).find(
					(item) => item.task_id === application.task_id,
				);
				const status = this.mapRequestStatus(task?.status, assignment, application.gig_profile_id);
				return {
					application_id: application.application_id,
					task_id: application.task_id,
					gig_profile_id: application.gig_profile_id,
					status,
					task,
				};
			});
	}

	createManagerInvite(dto: CreateManagerInviteDto) {
		const managerUser = this.db.createUser({
			name: dto.name,
			email: dto.email,
			password: dto.password,
			role: UserRole.MANAGER,
		});

		const manager = this.db.createManager({
			client_id: dto.client_id,
			user_id: managerUser.user_id,
			manager_id: dto.manager_id,
		});

		return { manager, user: managerUser };
	}

	getManagerInvites(clientId?: string) {
		const managers = Array.from(this.db.managers.values());
		return (clientId ? managers.filter((mgr) => mgr.client_id === clientId) : managers).map(
			(manager) => ({
				...manager,
				user: this.db.users.get(manager.user_id) ?? null,
			}),
		);
	}

	private rejectOtherApplications(taskId: string, acceptedGigProfileId: string) {
		for (const [applicationId, application] of this.db.applications.entries()) {
			if (application.task_id !== taskId) continue;
			if (application.gig_profile_id === acceptedGigProfileId) continue;
			this.db.applications.delete(applicationId);
		}
	}

	private isTaskTransitionAllowed(current: TaskStatus, next: TaskStatus) {
		if (current === next) return true;
		if (current === TaskStatus.OPEN && next === TaskStatus.IN_PROGRESS) return true;
		if (current === TaskStatus.IN_PROGRESS && next === TaskStatus.COMPLETED) return true;
		return false;
	}

	private mapContractStatus(status: TaskStatus): ContractStatus {
		if (status === TaskStatus.OPEN) return 'pending';
		if (status === TaskStatus.IN_PROGRESS) return 'active';
		if (status === TaskStatus.COMPLETED) return 'completed';
		return 'cancelled';
	}

	private mapRequestStatus(
		taskStatus: TaskStatus | undefined,
		assignment: { gig_profile_id: string } | undefined,
		gigProfileId: string,
	) {
		if (taskStatus === TaskStatus.COMPLETED) return 'completed';
		if (assignment?.gig_profile_id === gigProfileId && taskStatus === TaskStatus.IN_PROGRESS) {
			return 'accepted';
		}
		if (assignment && assignment.gig_profile_id !== gigProfileId) return 'declined';
		return 'pending';
	}
}