import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/rbac/roles.enum';
import { GigService } from './gig.service';
import {
  UpdateProfileDto,
  CreateApplicationDto,
  RespondRequestDto,
  SubmitDeliverableDto,
  PostServiceDto,
  CreateReviewDto,
} from './dto';

@ApiTags('Gig')
@ApiHeader({
  name: 'x-role',
  description: 'Role for RBAC: CLIENT | MANAGER | GIG_PROFESSIONAL',
  required: true,
})
@Controller('gig')
export class GigController {
  constructor(private readonly gigService: GigService) {}

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

  // ── 1. GET /gig/profile ───────────────────────────────────────

  @Get('profile')
  @ApiOperation({ summary: 'Get the gig professional profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.GIG_PROFESSIONAL)
  getProfile(@Headers('x-user-id') userId: string) {
    return this.gigService.getProfile(this.extractUserId(userId));
  }

  // ── 2. PUT /gig/profile ───────────────────────────────────────

  @Put('profile')
  @ApiOperation({ summary: 'Update the gig professional profile' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.GIG_PROFESSIONAL)
  updateProfile(
    @Headers('x-user-id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.gigService.updateProfile(this.extractUserId(userId), dto);
  }

  // ── 3. GET /gig/tasks/marketplace ─────────────────────────────

  @Get('tasks/marketplace')
  @ApiOperation({ summary: 'Get marketplace tasks' })
  @ApiResponse({ status: 200, description: 'Marketplace tasks retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.GIG_PROFESSIONAL)
  getMarketplaceTasks() {
    return this.gigService.getMarketplaceTasks();
  }

  // ── 4. POST /gig/applications ─────────────────────────────────

  @Post('applications')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Apply to a task' })
  @ApiBody({ type: CreateApplicationDto })
  @ApiResponse({ status: 201, description: 'Application created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.GIG_PROFESSIONAL)
  applyToTask(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.gigService.applyToTask(this.extractUserId(userId), dto);
  }

  // ── 5. DELETE /gig/applications/:id ───────────────────────────

  @Delete('applications/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw an application' })
  @ApiResponse({ status: 200, description: 'Application withdrawn successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.GIG_PROFESSIONAL)
  withdrawApplication(
    @Headers('x-user-id') userId: string,
    @Param('id') applicationId: string,
  ) {
    return this.gigService.withdrawApplication(
      this.extractUserId(userId),
      applicationId,
    );
  }

  // ── 6. GET /gig/requests/pending ──────────────────────────────

  @Get('requests/pending')
  @ApiOperation({ summary: 'Get pending requests' })
  @ApiResponse({ status: 200, description: 'Pending requests retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.GIG_PROFESSIONAL)
  getPendingRequests(@Headers('x-user-id') userId: string) {
    return this.gigService.getPendingRequests(this.extractUserId(userId));
  }

  // ── 7. POST /gig/requests/:id/respond ─────────────────────────

  @Post('requests/:id/respond')
  @ApiOperation({ summary: 'Respond to a request' })
  @ApiBody({ type: RespondRequestDto })
  @ApiResponse({ status: 200, description: 'Request response saved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.GIG_PROFESSIONAL)
  respondToRequest(
    @Headers('x-user-id') userId: string,
    @Param('id') applicationId: string,
    @Body() dto: RespondRequestDto,
  ) {
    return this.gigService.respondToRequest(
      this.extractUserId(userId),
      applicationId,
      dto,
    );
  }

  // ── 8. GET /gig/tasks/active ──────────────────────────────────

  @Get('tasks/active')
  @ApiOperation({ summary: 'Get active tasks' })
  @ApiResponse({ status: 200, description: 'Active tasks retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.GIG_PROFESSIONAL)
  getActiveTasks(@Headers('x-user-id') userId: string) {
    return this.gigService.getActiveTasks(this.extractUserId(userId));
  }

  // ── 9. POST /gig/deliverables ─────────────────────────────────

  @Post('deliverables')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a deliverable' })
  @ApiBody({ type: SubmitDeliverableDto })
  @ApiResponse({ status: 201, description: 'Deliverable submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.GIG_PROFESSIONAL)
  submitDeliverable(
    @Headers('x-user-id') userId: string,
    @Body() dto: SubmitDeliverableDto,
  ) {
    return this.gigService.submitDeliverable(this.extractUserId(userId), dto);
  }

  // ── 10. POST /gig/services ────────────────────────────────────

  @Post('services')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Post a service' })
  @ApiBody({ type: PostServiceDto })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.GIG_PROFESSIONAL)
  postService(
    @Headers('x-user-id') userId: string,
    @Body() dto: PostServiceDto,
  ) {
    return this.gigService.postService(this.extractUserId(userId), dto);
  }

  // ── 11. GET /gig/services/mine ────────────────────────────────

  @Get('services/mine')
  @ApiOperation({ summary: 'Get the current gig professional services' })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.GIG_PROFESSIONAL)
  getMyServices(@Headers('x-user-id') userId: string) {
    return this.gigService.getMyServices(this.extractUserId(userId));
  }

  // ── 12. POST /gig/reviews ────────────────────────────────────

  @Post('reviews')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a review' })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({ status: 201, description: 'Review submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.GIG_PROFESSIONAL)
  submitReview(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.gigService.submitReview(this.extractUserId(userId), dto);
  }

  // ── 13. GET /gig/projects/completed ───────────────────────────

  @Get('projects/completed')
  @ApiOperation({ summary: 'Get completed projects' })
  @ApiResponse({ status: 200, description: 'Completed projects retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.GIG_PROFESSIONAL)
  getCompletedProjects(@Headers('x-user-id') userId: string) {
    return this.gigService.getCompletedProjects(this.extractUserId(userId));
  }

  // ── 14. GET /gig/earnings ─────────────────────────────────────

  @Get('earnings')
  @ApiOperation({ summary: 'Get total earnings' })
  @ApiResponse({ status: 200, description: 'Earnings retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(Role.CLIENT, Role.GIG_PROFESSIONAL)
  getTotalEarnings(@Headers('x-user-id') userId: string) {
    return this.gigService.getTotalEarnings(this.extractUserId(userId));
  }
}
