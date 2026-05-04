import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/rbac/roles.enum';
import { AdminService } from './admin.service';
import {
  CreateUserDto,
  UpdateUserDto,
  CreateClientDto,
  CreateManagerDto,
  CreateGigProfileDto,
  CreateTaskDto,
  UpdateTaskDto,
  CreateApplicationDto,
  CreateAssignmentDto,
  CreateDeliverableDto,
  CreatePaymentDto,
  CreateReviewDto,
} from './dto';

@ApiTags('Admin')
@ApiHeader({
  name: 'x-role',
  description: 'Role for RBAC: CLIENT | MANAGER | GIG_PROFESSIONAL',
  required: true,
})
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Dashboard ──────────────────────────────────────────────

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ── Users ──────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  createUser(@Body() dto: CreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  deleteUser(@Param('id') id: string) {
    this.adminService.deleteUser(id);
  }

  // ── Clients ────────────────────────────────────────────────

  @Get('clients')
  @ApiOperation({ summary: 'Get all clients' })
  @ApiResponse({ status: 200, description: 'Clients retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  getAllClients() {
    return this.adminService.getAllClients();
  }

  @Post('clients')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a client' })
  @ApiBody({ type: CreateClientDto })
  @ApiResponse({ status: 201, description: 'Client created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  createClient(@Body() dto: CreateClientDto) {
    return this.adminService.createClient(dto);
  }

  @Delete('clients/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a client' })
  @ApiResponse({ status: 204, description: 'Client deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  deleteClient(@Param('id') id: string) {
    this.adminService.deleteClient(id);
  }

  // ── Managers ───────────────────────────────────────────────

  @Get('managers')
  @ApiOperation({ summary: 'Get all managers' })
  @ApiResponse({ status: 200, description: 'Managers retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  getAllManagers() {
    return this.adminService.getAllManagers();
  }

  @Post('managers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a manager' })
  @ApiBody({ type: CreateManagerDto })
  @ApiResponse({ status: 201, description: 'Manager created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  createManager(@Body() dto: CreateManagerDto) {
    return this.adminService.createManager(dto);
  }

  @Delete('managers/:clientId/:managerId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a manager' })
  @ApiResponse({ status: 204, description: 'Manager deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  deleteManager(
    @Param('clientId') clientId: string,
    @Param('managerId') managerId: string,
  ) {
    this.adminService.deleteManager(clientId, managerId);
  }

  // ── Gig Profiles ───────────────────────────────────────────

  @Get('gig-profiles')
  @ApiOperation({ summary: 'Get all gig profiles' })
  @ApiResponse({ status: 200, description: 'Gig profiles retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  getAllGigProfiles() {
    return this.adminService.getAllGigProfiles();
  }

  @Post('gig-profiles')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a gig profile' })
  @ApiBody({ type: CreateGigProfileDto })
  @ApiResponse({ status: 201, description: 'Gig profile created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  createGigProfile(@Body() dto: CreateGigProfileDto) {
    return this.adminService.createGigProfile(dto);
  }

  @Delete('gig-profiles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a gig profile' })
  @ApiResponse({ status: 204, description: 'Gig profile deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  deleteGigProfile(@Param('id') id: string) {
    this.adminService.deleteGigProfile(id);
  }

  // ── Tasks ──────────────────────────────────────────────────

  @Get('tasks')
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  getAllTasks() {
    return this.adminService.getAllTasks();
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Get a task by id' })
  @ApiResponse({ status: 200, description: 'Task retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  getTaskById(@Param('id') id: string) {
    return this.adminService.getTaskById(id);
  }

  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a task' })
  @ApiBody({ type: CreateTaskDto })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  createTask(@Body() dto: CreateTaskDto) {
    return this.adminService.createTask(dto);
  }

  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiBody({ type: UpdateTaskDto })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  updateTask(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.adminService.updateTask(id, dto);
  }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 204, description: 'Task deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  deleteTask(@Param('id') id: string) {
    this.adminService.deleteTask(id);
  }

  // ── Applications ───────────────────────────────────────────

  @Get('applications')
  @ApiOperation({ summary: 'Get all applications' })
  @ApiResponse({ status: 200, description: 'Applications retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  getAllApplications() {
    return this.adminService.getAllApplications();
  }

  @Post('applications')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an application' })
  @ApiBody({ type: CreateApplicationDto })
  @ApiResponse({ status: 201, description: 'Application created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  createApplication(@Body() dto: CreateApplicationDto) {
    return this.adminService.createApplication(dto);
  }

  @Delete('applications/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an application' })
  @ApiResponse({ status: 204, description: 'Application deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  deleteApplication(@Param('id') id: string) {
    this.adminService.deleteApplication(id);
  }

  // ── Assignments ────────────────────────────────────────────

  @Get('assignments')
  @ApiOperation({ summary: 'Get all assignments' })
  @ApiResponse({ status: 200, description: 'Assignments retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  getAllAssignments() {
    return this.adminService.getAllAssignments();
  }

  @Post('assignments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an assignment' })
  @ApiBody({ type: CreateAssignmentDto })
  @ApiResponse({ status: 201, description: 'Assignment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  createAssignment(@Body() dto: CreateAssignmentDto) {
    return this.adminService.createAssignment(dto);
  }

  @Delete('assignments/:gigProfileId/:taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an assignment' })
  @ApiResponse({ status: 204, description: 'Assignment deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  deleteAssignment(
    @Param('gigProfileId') gigProfileId: string,
    @Param('taskId') taskId: string,
  ) {
    this.adminService.deleteAssignment(gigProfileId, taskId);
  }

  // ── Deliverables ───────────────────────────────────────────

  @Get('deliverables')
  @ApiOperation({ summary: 'Get all deliverables' })
  @ApiResponse({ status: 200, description: 'Deliverables retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  getAllDeliverables() {
    return this.adminService.getAllDeliverables();
  }

  @Post('deliverables')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a deliverable' })
  @ApiBody({ type: CreateDeliverableDto })
  @ApiResponse({ status: 201, description: 'Deliverable created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  createDeliverable(@Body() dto: CreateDeliverableDto) {
    return this.adminService.createDeliverable(dto);
  }

  @Delete('deliverables/:taskId/:deliverableNo')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a deliverable' })
  @ApiResponse({ status: 204, description: 'Deliverable deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  deleteDeliverable(
    @Param('taskId') taskId: string,
    @Param('deliverableNo', ParseIntPipe) deliverableNo: number,
  ) {
    this.adminService.deleteDeliverable(taskId, deliverableNo);
  }

  // ── Payments ───────────────────────────────────────────────

  @Get('payments')
  @ApiOperation({ summary: 'Get all payments' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  getAllPayments() {
    return this.adminService.getAllPayments();
  }

  @Post('payments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a payment' })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  createPayment(@Body() dto: CreatePaymentDto) {
    return this.adminService.createPayment(dto);
  }

  @Delete('payments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a payment' })
  @ApiResponse({ status: 204, description: 'Payment deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  deletePayment(@Param('id') id: string) {
    this.adminService.deletePayment(id);
  }

  // ── Reviews ────────────────────────────────────────────────

  @Get('reviews')
  @ApiOperation({ summary: 'Get all reviews' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  getAllReviews() {
    return this.adminService.getAllReviews();
  }

  @Post('reviews')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a review' })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  createReview(@Body() dto: CreateReviewDto) {
    return this.adminService.createReview(dto);
  }

  @Delete('reviews/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a review' })
  @ApiResponse({ status: 204, description: 'Review deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT)
  deleteReview(@Param('id') id: string) {
    this.adminService.deleteReview(id);
  }
}
