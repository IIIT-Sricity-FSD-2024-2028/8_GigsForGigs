import { Module } from '@nestjs/common';
import { DeliverableController } from './deliverable.controller';
import { DeliverableService } from './deliverable.service';

@Module({
  controllers: [DeliverableController],
  providers: [DeliverableService],
})
export class DeliverableModule {}