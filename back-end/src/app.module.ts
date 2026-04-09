import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { ApplicationsModule } from './applications/applications.module';
import { DeliverablesModule } from './deliverables/deliverables.module';
import { ManagersModule } from './managers/managers.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    TasksModule,
    ApplicationsModule,
    DeliverablesModule,
    ManagersModule,
    PaymentsModule,
    ReviewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
