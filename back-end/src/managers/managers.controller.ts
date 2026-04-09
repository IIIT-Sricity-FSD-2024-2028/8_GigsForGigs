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
import { ManagersService } from './managers.service';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';

@Controller('managers')
export class ManagersController {
  constructor(private readonly managersService: ManagersService) {}

  /**
   * POST /managers
   * Client creates a manager sub-account linked to their profile
   */
  @Post()
  create(@Body() dto: CreateManagerDto) {
    return this.managersService.create(dto);
  }

  /**
   * GET /managers
   * List managers; filter by clientId
   * e.g. GET /managers?clientId=abc
   */
  @Get()
  findAll(@Query('clientId') clientId?: string) {
    return this.managersService.findAll(clientId);
  }

  /**
   * GET /managers/:id
   * Get a single manager profile
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.managersService.findOne(id);
  }

  /**
   * GET /managers/:id/tasks
   * Get all tasks the manager is overseeing
   */
  @Get(':id/tasks')
  getManagerTasks(@Param('id') id: string) {
    return this.managersService.getManagerTasks(id);
  }

  /**
   * PATCH /managers/:id
   * Update manager profile details
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateManagerDto) {
    return this.managersService.update(id, dto);
  }

  /**
   * DELETE /managers/:id
   * Remove a manager from a client's account
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.managersService.remove(id);
  }
}
