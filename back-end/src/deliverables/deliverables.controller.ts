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
import { DeliverablesService } from './deliverables.service';
import { CreateDeliverableDto } from './dto/create-deliverable.dto';
import { UpdateDeliverableDto } from './dto/update-deliverable.dto';

@Controller('deliverables')
export class DeliverablesController {
  constructor(private readonly deliverablesService: DeliverablesService) { }

  /**
   * POST /deliverables
   * Gig professional submits work for a task
   */
  @Post()
  create(@Body() dto: CreateDeliverableDto) {
    return this.deliverablesService.create(dto);
  }

  /**
   * GET /deliverables
   * List deliverables; filter by taskId or submittedBy
   * e.g. GET /deliverables?taskId=abc&status=submitted
   */
  @Get()
  findAll(
    @Query('taskId') taskId?: string,
    @Query('submittedBy') submittedBy?: string,
    @Query('status') status?: string,
  ) {
    return this.deliverablesService.findAll({ taskId, submittedBy, status });
  }

  /**
   * GET /deliverables/:id
   * Get a single deliverable by ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deliverablesService.findOne(id);
  }

  /**
   * PATCH /deliverables/:id/approve
   * Client approves deliverable and releases payment
   */
  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.deliverablesService.approve(id);
  }

  /**
   * PATCH /deliverables/:id/request-revision
   * Client requests changes from gig professional
   */
  @Patch(':id/request-revision')
  requestRevision(
    @Param('id') id: string,
    @Body('revisionNote') revisionNote: string,
  ) {
    return this.deliverablesService.requestRevision(id, revisionNote);
  }

  /**
   * PATCH /deliverables/:id
   * Generic update (e.g. gig professional re-submits after revision)
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDeliverableDto) {
    return this.deliverablesService.update(id, dto);
  }

  /**
   * DELETE /deliverables/:id
   * Delete a submitted (not-yet-approved) deliverable
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deliverablesService.remove(id);
  }
}
