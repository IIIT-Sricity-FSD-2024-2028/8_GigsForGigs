import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SeedService } from './seed.service';
import { DatabaseService } from '../../common/database/database.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, SeedService, DatabaseService],
  exports: [DatabaseService],
})
export class AdminModule {}