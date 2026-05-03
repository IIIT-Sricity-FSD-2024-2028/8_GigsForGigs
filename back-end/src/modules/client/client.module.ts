import { Module } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';

@Module({
  controllers: [ClientController],
  providers: [ClientService, DatabaseService],
})
export class ClientModule {}