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

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Dashboard ──────────────────────────────────────────────

  @Get('dashboard/stats')
  @Roles(Role.CLIENT)
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ── Users ──────────────────────────────────────────────────

  @Get('users')
  @Roles(Role.CLIENT)
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('users/:id')
  @Roles(Role.CLIENT)
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.CLIENT)
  createUser(@Body() dto: CreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @Patch('users/:id')
  @Roles(Role.CLIENT)
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.CLIENT)
  deleteUser(@Param('id') id: string) {
    this.adminService.deleteUser(id);
  }

  // ── Clients ────────────────────────────────────────────────

  @Get('clients')
  @Roles(Role.CLIENT)
  getAllClients() {
    return this.adminService.getAllClients();
  }

  @Post('clients')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.CLIENT)
  createClient(@Body() dto: CreateClientDto) {
    return this.adminService.createClient(dto);
  }

  @Delete('clients/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.CLIENT)
  deleteClient(@Param('id') id: string) {
    this.adminService.deleteClient(id);
  }

  // ── Managers ───────────────────────────────────────────────

  @Get('managers')
  @Roles(Role.CLIENT)
  getAllManagers() {
    return this.adminService.getAllManagers();
  }

  @Post('managers')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.CLIENT)
  createManager(@Body() dto: CreateManagerDto) {
    return this.adminService.createManager(dto);
  }

  @Delete('managers/:clientId/:managerId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.CLIENT)
  deleteManager(
    @Param('clientId') clientId: string,
    @Param('managerId') managerId: string,
  ) {
    this.adminService.deleteManager(clientId, managerId);
  }

  // ── Gig Profiles ───────────────────────────────────────────

  @Get('gig-profiles')
  @Roles(Role.CLIENT)
  getAllGigProfiles() {
    return this.adminService.getAllGigProfiles();
  }

  @Post('gig-profiles')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.CLIENT)
  createGigProfile(@Body() dto: CreateGigProfileDto) {
    return this.adminService.createGigProfile(dto);
  }

  @Delete('gig-profiles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.CLIENT)
  deleteGigProfile(@Param('id') id: string) {
    this.adminService.deleteGigProfile(id);
  }

  // ── Tasks ──────────────────────────────────────────────────

  @Get('tasks')
  @Roles(Role.CLIENT)
  getAllTasks() {
    return this.adminService.getAllTasks();
  }

  @Get('tasks/:id')
  @Roles(Role.CLIENT)
  getTaskById(@Param('id') id: string) {
    return this.adminService.getTaskById(id);
  }

  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.CLIENT)
  createTask(@Body() dto: CreateTaskDto) {
    return this.adminService.createTask(dto);
  }

  @Patch('tasks/:id')
  @Roles(Role.CLIENT)
  updateTask(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.adminService.updateTask(id, dto);
  }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.CLIENT)
  deleteTask(@Param('id') id: string) {
    this.adminService.deleteTask(id);
  }

  // ── Applications ───────────────────────────────────────────

  @Get('applications')
  @Roles(Role.CLIENT)
  getAllApplications() {
    return this.adminService.getAllApplications();
  }

  @Post('applications')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.CLIENT)
  createApplication(@Body() dto: CreateApplicationDto) {
    return this.adminService.createApplication(dto);
  }

  @Delete('applications/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.CLIENT)
  deleteApplication(@Param('id') id: string) {
    this.adminService.deleteApplication(id);
  }

  // ── Assignments ────────────────────────────────────────────

  @Get('assignments')
  @Roles(Role.CLIENT)
  getAllAssignments() {
    return this.adminService.getAllAssignments();
  }

  @Post('assignments')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.CLIENT)
  createAssignment(@Body() dto: CreateAssignmentDto) {
    return this.adminService.createAssignment(dto);
  }

  @Delete('assignments/:gigProfileId/:taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.CLIENT)
  deleteAssignment(
    @Param('gigProfileId') gigProfileId: string,
    @Param('taskId') taskId: string,
  ) {
    this.adminService.deleteAssignment(gigProfileId, taskId);
  }

  // ── Deliverables ───────────────────────────────────────────

  @Get('deliverables')
  @Roles(Role.CLIENT)
  getAllDeliverables() {
    return this.adminService.getAllDeliverables();
  }

  @Post('deliverables')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.CLIENT)
  createDeliverable(@Body() dto: CreateDeliverableDto) {
    return this.adminService.createDeliverable(dto);
  }

  @Delete('deliverables/:taskId/:deliverableNo')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.CLIENT)
  deleteDeliverable(
    @Param('taskId') taskId: string,
    @Param('deliverableNo', ParseIntPipe) deliverableNo: number,
  ) {
    this.adminService.deleteDeliverable(taskId, deliverableNo);
  }

  // ── Payments ───────────────────────────────────────────────

  @Get('payments')
  @Roles(Role.CLIENT)
  getAllPayments() {
    return this.adminService.getAllPayments();
  }

  @Post('payments')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.CLIENT)
  createPayment(@Body() dto: CreatePaymentDto) {
    return this.adminService.createPayment(dto);
  }

  @Delete('payments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.CLIENT)
  deletePayment(@Param('id') id: string) {
    this.adminService.deletePayment(id);
  }

  // ── Reviews ────────────────────────────────────────────────

  @Get('reviews')
  @Roles(Role.CLIENT)
  getAllReviews() {
    return this.adminService.getAllReviews();
  }

  @Post('reviews')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.CLIENT)
  createReview(@Body() dto: CreateReviewDto) {
    return this.adminService.createReview(dto);
  }

  @Delete('reviews/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.CLIENT)
  deleteReview(@Param('id') id: string) {
    this.adminService.deleteReview(id);
  }
}
