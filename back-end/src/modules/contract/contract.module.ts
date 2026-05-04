import { Module } from '@nestjs/common';
import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';

@Module({
  controllers: [ContractController],
  providers: [ContractService],
})
export class ContractModule {}
