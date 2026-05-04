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
import { DatabaseModule } from './common/database/database.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    DatabaseModule,
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
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
