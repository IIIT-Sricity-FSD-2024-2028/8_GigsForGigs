import { Module } from '@nestjs/common';
import { GigController } from './gig.controller';
import { GigService } from './gig.service';

@Module({
  controllers: [GigController],
  providers: [GigService],
})
export class GigModule {}