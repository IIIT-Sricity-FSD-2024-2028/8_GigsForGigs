import { Module } from '@nestjs/common';
import { GigController } from './gig.controller';
import { GigService } from './gig.service';
import { DatabaseService } from '../../common/database/database.service';

@Module({
  controllers: [GigController],
  providers: [GigService],
})
export class GigModule {}
