import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ClientModule } from './modules/client/client.module';
import { GigModule } from './modules/gig/gig.module';
import { ManagerModule } from './modules/manager/manager.module';
import { AdminModule } from './modules/super-admin/admin.module';
import { TaskModule } from './modules/task/task.module';
import { ServiceModule } from './modules/service/service.module';
import { ContractModule } from './modules/contract/contract.module';
import { ApplicationModule } from './modules/application/application.module';
import { DeliverableModule } from './modules/deliverable/deliverable.module';
import { ReviewModule } from './modules/review/review.module';

@Module({
  imports: [
    AuthModule,
    ClientModule,
    GigModule,
    ManagerModule,
    AdminModule,
    TaskModule,
    ServiceModule,
    ContractModule,
    ApplicationModule,
    DeliverableModule,
    ReviewModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
