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
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  /**
   * POST /applications
   * Gig professional applies to a task
   */
  @Post()
  create(@Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(dto);
  }

  /**
   * GET /applications
   * List applications with optional filters
   * e.g. GET /applications?taskId=abc&applicantId=xyz&status=pending
   */
  @Get()
  findAll(
    @Query('taskId') taskId?: string,
    @Query('applicantId') applicantId?: string,
    @Query('status') status?: string,
  ) {
    return this.applicationsService.findAll({ taskId, applicantId, status });
  }

  /**
   * GET /applications/:id
   * Get a single application by ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  /**
   * PATCH /applications/:id
   * Generic status update (used for accept/decline by gig pro)
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    return this.applicationsService.update(id, dto);
  }

  /**
   * PATCH /applications/:id/shortlist
   * Client/Manager shortlists an applicant
   */
  @Patch(':id/shortlist')
  shortlist(@Param('id') id: string) {
    return this.applicationsService.shortlist(id);
  }

  /**
   * PATCH /applications/:id/reject
   * Client/Manager rejects an applicant
   */
  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body('note') note?: string,
  ) {
    return this.applicationsService.reject(id, note);
  }

  /**
   * PATCH /applications/:id/hire
   * Client approves & hires — sets task to in_progress, auto-rejects others
   */
  @Patch(':id/hire')
  hire(@Param('id') id: string) {
    return this.applicationsService.hire(id);
  }

  /**
   * PATCH /applications/:id/accept
   * Gig professional accepts a hire request
   */
  @Patch(':id/accept')
  accept(@Param('id') id: string) {
    return this.applicationsService.accept(id);
  }

  /**
   * PATCH /applications/:id/decline
   * Gig professional declines a hire request
   */
  @Patch(':id/decline')
  decline(@Param('id') id: string) {
    return this.applicationsService.decline(id);
  }

  /**
   * DELETE /applications/:id
   * Gig professional withdraws their application
   */
  @Delete(':id')
  withdraw(@Param('id') id: string) {
    return this.applicationsService.withdraw(id);
  }
}
