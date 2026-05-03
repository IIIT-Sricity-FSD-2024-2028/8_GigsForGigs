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

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Dashboard ──────────────────────────────────────────────

  @Get('dashboard/stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ── Users ──────────────────────────────────────────────────

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('users/:id')
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  createUser(@Body() dto: CreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteUser(@Param('id') id: string) {
    this.adminService.deleteUser(id);
  }

  // ── Clients ────────────────────────────────────────────────

  @Get('clients')
  getAllClients() {
    return this.adminService.getAllClients();
  }

  @Post('clients')
  @HttpCode(HttpStatus.CREATED)
  createClient(@Body() dto: CreateClientDto) {
    return this.adminService.createClient(dto);
  }

  @Delete('clients/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteClient(@Param('id') id: string) {
    this.adminService.deleteClient(id);
  }

  // ── Managers ───────────────────────────────────────────────

  @Get('managers')
  getAllManagers() {
    return this.adminService.getAllManagers();
  }

  @Post('managers')
  @HttpCode(HttpStatus.CREATED)
  createManager(@Body() dto: CreateManagerDto) {
    return this.adminService.createManager(dto);
  }

  @Delete('managers/:clientId/:managerId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteManager(@Param('clientId') clientId: string, @Param('managerId') managerId: string) {
    this.adminService.deleteManager(clientId, managerId);
  }

  // ── Gig Profiles ───────────────────────────────────────────

  @Get('gig-profiles')
  getAllGigProfiles() {
    return this.adminService.getAllGigProfiles();
  }

  @Post('gig-profiles')
  @HttpCode(HttpStatus.CREATED)
  createGigProfile(@Body() dto: CreateGigProfileDto) {
    return this.adminService.createGigProfile(dto);
  }

  @Delete('gig-profiles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteGigProfile(@Param('id') id: string) {
    this.adminService.deleteGigProfile(id);
  }

  // ── Tasks ──────────────────────────────────────────────────

  @Get('tasks')
  getAllTasks() {
    return this.adminService.getAllTasks();
  }

  @Get('tasks/:id')
  getTaskById(@Param('id') id: string) {
    return this.adminService.getTaskById(id);
  }

  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  createTask(@Body() dto: CreateTaskDto) {
    return this.adminService.createTask(dto);
  }

  @Patch('tasks/:id')
  updateTask(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.adminService.updateTask(id, dto);
  }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTask(@Param('id') id: string) {
    this.adminService.deleteTask(id);
  }

  // ── Applications ───────────────────────────────────────────

  @Get('applications')
  getAllApplications() {
    return this.adminService.getAllApplications();
  }

  @Post('applications')
  @HttpCode(HttpStatus.CREATED)
  createApplication(@Body() dto: CreateApplicationDto) {
    return this.adminService.createApplication(dto);
  }

  @Delete('applications/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteApplication(@Param('id') id: string) {
    this.adminService.deleteApplication(id);
  }

  // ── Assignments ────────────────────────────────────────────

  @Get('assignments')
  getAllAssignments() {
    return this.adminService.getAllAssignments();
  }

  @Post('assignments')
  @HttpCode(HttpStatus.CREATED)
  createAssignment(@Body() dto: CreateAssignmentDto) {
    return this.adminService.createAssignment(dto);
  }

  @Delete('assignments/:gigProfileId/:taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAssignment(@Param('gigProfileId') gigProfileId: string, @Param('taskId') taskId: string) {
    this.adminService.deleteAssignment(gigProfileId, taskId);
  }

  // ── Deliverables ───────────────────────────────────────────

  @Get('deliverables')
  getAllDeliverables() {
    return this.adminService.getAllDeliverables();
  }

  @Post('deliverables')
  @HttpCode(HttpStatus.CREATED)
  createDeliverable(@Body() dto: CreateDeliverableDto) {
    return this.adminService.createDeliverable(dto);
  }

  @Delete('deliverables/:taskId/:deliverableNo')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteDeliverable(
    @Param('taskId') taskId: string,
    @Param('deliverableNo', ParseIntPipe) deliverableNo: number,
  ) {
    this.adminService.deleteDeliverable(taskId, deliverableNo);
  }

  // ── Payments ───────────────────────────────────────────────

  @Get('payments')
  getAllPayments() {
    return this.adminService.getAllPayments();
  }

  @Post('payments')
  @HttpCode(HttpStatus.CREATED)
  createPayment(@Body() dto: CreatePaymentDto) {
    return this.adminService.createPayment(dto);
  }

  @Delete('payments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePayment(@Param('id') id: string) {
    this.adminService.deletePayment(id);
  }

  // ── Reviews ────────────────────────────────────────────────

  @Get('reviews')
  getAllReviews() {
    return this.adminService.getAllReviews();
  }

  @Post('reviews')
  @HttpCode(HttpStatus.CREATED)
  createReview(@Body() dto: CreateReviewDto) {
    return this.adminService.createReview(dto);
  }

  @Delete('reviews/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteReview(@Param('id') id: string) {
    this.adminService.deleteReview(id);
  }
}