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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * POST /users
   * Admin-level user creation
   */
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  /**
   * GET /users
   * List all users. Filter by role, isActive, clientId
   * e.g. GET /users?role=gig_professional&isActive=true
   */
  @Get()
  findAll(
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.usersService.findAll({ role, isActive, clientId });
  }

  /**
   * GET /users/me
   * Get profile of currently authenticated user (auth context needed)
   */
  @Get('me')
  getMe() {
    return this.usersService.getMe();
  }

  /**
   * GET /users/:id
   * Get a single user by ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * GET /users/:id/stats
   * Get aggregated stats for a user (tasks posted, earnings, rating etc.)
   */
  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    return this.usersService.getStats(id);
  }

  /**
   * GET /users/:id/tasks
   * Get all tasks associated with this user (posted by client or assigned to gig pro)
   */
  @Get(':id/tasks')
  getUserTasks(@Param('id') id: string) {
    return this.usersService.getUserTasks(id);
  }

  /**
   * GET /users/:id/applications
   * Get all applications submitted by this user
   */
  @Get(':id/applications')
  getUserApplications(@Param('id') id: string) {
    return this.usersService.getUserApplications(id);
  }

  /**
   * GET /users/:id/reviews
   * Get all reviews received by this user
   */
  @Get(':id/reviews')
  getUserReviews(@Param('id') id: string) {
    return this.usersService.getUserReviews(id);
  }

  /**
   * PATCH /users/:id
   * Update user profile fields
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  /**
   * PATCH /users/:id/activate
   * Admin: activate a suspended user account
   */
  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.usersService.setActiveStatus(id, true);
  }

  /**
   * PATCH /users/:id/deactivate
   * Admin: deactivate / suspend a user account
   */
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.usersService.setActiveStatus(id, false);
  }

  /**
   * DELETE /users/:id
   * Hard-delete a user record (admin only)
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
