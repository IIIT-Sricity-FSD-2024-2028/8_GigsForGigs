import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import {
  ApplicationStatus,
  TaskStatus,
} from '../../common/database/database.types';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { RespondRequestDto, RequestAction } from './dto/respond-request.dto';
import { SubmitDeliverableDto } from './dto/submit-deliverable.dto';
import { PostServiceDto } from './dto/post-service.dto';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class GigService {
  constructor(private readonly db: DatabaseService) {}

  // ── Helpers ───────────────────────────────────────────────────

  private requireGigProfileForUser(userId: string) {
    console.log('requireGigProfileForUser called with userId:', userId);
    const profile = this.db.getGigProfileByUserId(userId);
    if (!profile) {
      console.log('Available gig profiles:', this.db.getAllGigProfiles());
      throw new NotFoundException(`No gig profile found for user: ${userId}`);
    }
    return profile;
  }

  // ── 1. GET /gig/profile ───────────────────────────────────────

  getProfile(userId: string) {
    const profile = this.requireGigProfileForUser(userId);
    const user = this.db.getUserById(userId);

    return {
      ...profile,
      name: user.name,
      email: user.email,
      skills: this.db.getSkills(profile.gig_profile_id),
      tools: this.db.getTools(profile.gig_profile_id),
      portfolio: this.db.getPortfolio(profile.gig_profile_id),
    };
  }

  // ── 2. PUT /gig/profile ───────────────────────────────────────

  updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = this.requireGigProfileForUser(userId);

    // Update bio
    if (dto.bio !== undefined) {
      this.db.updateGigProfile(profile.gig_profile_id, { bio: dto.bio });
    }

    // Add skills (append unique)
    if (dto.skills && dto.skills.length > 0) {
      for (const skill of dto.skills) {
        this.db.addSkill(profile.gig_profile_id, skill);
      }
    }

    // Add tools (append unique)
    if (dto.tools && dto.tools.length > 0) {
      for (const tool of dto.tools) {
        this.db.addTool(profile.gig_profile_id, tool);
      }
    }

    // Add portfolio items (append unique)
    if (dto.portfolio && dto.portfolio.length > 0) {
      for (const item of dto.portfolio) {
        this.db.addPortfolio(profile.gig_profile_id, item);
      }
    }

    return this.getProfile(userId);
  }

  // ── 3. GET /gig/tasks/marketplace ─────────────────────────────

  getMarketplaceTasks() {
    return this.db
      .getAllTasks()
      .filter((task) => task.status === TaskStatus.OPEN);
  }

  // ── 4. POST /gig/applications ─────────────────────────────────

  applyToTask(userId: string, dto: CreateApplicationDto) {
    const profile = this.requireGigProfileForUser(userId);

    // Ensure the task exists and is OPEN
    const task = this.db.getTask(dto.taskId);
    if (task.status !== TaskStatus.OPEN) {
      throw new BadRequestException('Can only apply to OPEN tasks');
    }

    // applyToTask in DatabaseService enforces UNIQUE(gig_profile_id, task_id)
    return this.db.applyToTask({
      gig_profile_id: profile.gig_profile_id,
      task_id: dto.taskId,
    });
  }

  // ── 5. DELETE /gig/applications/:id ───────────────────────────

  withdrawApplication(userId: string, applicationId: string) {
    const profile = this.requireGigProfileForUser(userId);
    const app = this.db.getApplication(applicationId);

    // Ensure the application belongs to this gig professional
    if (app.gig_profile_id !== profile.gig_profile_id) {
      throw new ForbiddenException(
        'You can only withdraw your own applications',
      );
    }

    // Can only withdraw PENDING applications
    if (app.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException('Can only withdraw PENDING applications');
    }

    this.db.deleteApplication(applicationId);
    return { message: 'Application withdrawn successfully' };
  }

  // ── 6. GET /gig/requests/pending ──────────────────────────────

  getPendingRequests(userId: string) {
    const profile = this.requireGigProfileForUser(userId);

    return this.db
      .getAllApplications()
      .filter(
        (app) =>
          app.gig_profile_id === profile.gig_profile_id &&
          app.status === ApplicationStatus.SHORTLISTED,
      )
      .map((app) => {
        const task = this.db.getTask(app.task_id);
        return { ...app, task };
      });
  }

  // ── 7. POST /gig/requests/:id/respond ─────────────────────────

  respondToRequest(
    userId: string,
    applicationId: string,
    dto: RespondRequestDto,
  ) {
    const profile = this.requireGigProfileForUser(userId);
    const app = this.db.getApplication(applicationId);

    // Ownership check
    if (app.gig_profile_id !== profile.gig_profile_id) {
      throw new ForbiddenException('You can only respond to your own requests');
    }

    // Must be SHORTLISTED to respond
    if (app.status !== ApplicationStatus.SHORTLISTED) {
      throw new BadRequestException('Can only respond to SHORTLISTED requests');
    }

    if (dto.action === RequestAction.ACCEPTED) {
      // Accept: update application status → ACCEPTED
      this.db.updateApplicationStatus(
        applicationId,
        ApplicationStatus.ACCEPTED,
      );

      // Update task to IN_PROGRESS + assign to this gig pro
      this.db.updateTask(app.task_id, {
        status: TaskStatus.IN_PROGRESS,
        assigned_to: profile.gig_profile_id,
      });

      return { message: 'Request accepted. Task is now in progress.' };
    } else {
      // Decline: update application status → DECLINED
      this.db.updateApplicationStatus(
        applicationId,
        ApplicationStatus.DECLINED,
      );
      return { message: 'Request declined.' };
    }
  }

  // ── 8. GET /gig/tasks/active ──────────────────────────────────

  getActiveTasks(userId: string) {
    const profile = this.requireGigProfileForUser(userId);

    return this.db
      .getAllTasks()
      .filter(
        (task) =>
          task.status === TaskStatus.IN_PROGRESS &&
          task.assigned_to === profile.gig_profile_id,
      )
      .map((task) => {
        // Include deliverables for this task
        const deliverables = this.db
          .getAllDeliverables()
          .filter(
            (d) =>
              d.task_id === task.task_id &&
              d.gig_profile_id === profile.gig_profile_id,
          );
        return { ...task, deliverables };
      });
  }

  // ── 9. POST /gig/deliverables ─────────────────────────────────

  submitDeliverable(userId: string, dto: SubmitDeliverableDto) {
    const profile = this.requireGigProfileForUser(userId);

    // Ensure the task is assigned to this gig pro
    const task = this.db.getTask(dto.taskId);
    if (task.assigned_to !== profile.gig_profile_id) {
      throw new ForbiddenException('You are not assigned to this task');
    }

    if (task.status !== TaskStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Can only submit deliverables for IN_PROGRESS tasks',
      );
    }

    const content = dto.notes
      ? `${dto.content}\n\nNotes: ${dto.notes}`
      : dto.content;

    return this.db.createDeliverable({
      task_id: dto.taskId,
      gig_profile_id: profile.gig_profile_id,
      content,
    });
  }

  // ── 10. POST /gig/services ────────────────────────────────────

  postService(userId: string, dto: PostServiceDto) {
    const profile = this.requireGigProfileForUser(userId);

    return this.db.createService({
      gig_profile_id: profile.gig_profile_id,
      title: dto.title,
      description: dto.description,
      price: dto.price,
      tags: dto.tags,
    });
  }

  // ── 11. GET /gig/services/mine ────────────────────────────────

  getMyServices(userId: string) {
    const profile = this.requireGigProfileForUser(userId);

    return this.db
      .getAllServices()
      .filter((s) => s.gig_profile_id === profile.gig_profile_id);
  }

  // ── 12. POST /gig/reviews ────────────────────────────────────

  submitReview(userId: string, dto: CreateReviewDto) {
    // reviewer = current user, reviewee = dto.revieweeId
    return this.db.createReview({
      reviewer_id: userId,
      reviewee_id: dto.revieweeId,
      task_id: dto.taskId,
      rating: dto.rating,
      comment: dto.comment,
    });
  }

  // ── 13. GET /gig/projects/completed ───────────────────────────

  getCompletedProjects(userId: string) {
    const profile = this.requireGigProfileForUser(userId);

    return this.db
      .getAllTasks()
      .filter(
        (task) =>
          task.status === TaskStatus.COMPLETED &&
          task.assigned_to === profile.gig_profile_id,
      )
      .map((task) => {
        // Include reviews and payments
        const reviews = this.db
          .getAllReviews()
          .filter((r) => r.task_id === task.task_id);

        const payment = this.db
          .getAllPayments()
          .find(
            (p) =>
              p.task_id === task.task_id &&
              p.gig_profile_id === profile.gig_profile_id,
          );

        return { ...task, reviews, payment: payment || null };
      });
  }

  // ── 14. GET /gig/earnings ─────────────────────────────────────

  getTotalEarnings(userId: string) {
    const profile = this.requireGigProfileForUser(userId);

    const payments = this.db
      .getAllPayments()
      .filter((p) => p.gig_profile_id === profile.gig_profile_id);

    const totalEarnings = payments.reduce((sum, p) => sum + p.amount, 0);
    const completedTasks = this.db
      .getAllTasks()
      .filter(
        (t) =>
          t.status === TaskStatus.COMPLETED &&
          t.assigned_to === profile.gig_profile_id,
      ).length;

    return {
      totalEarnings,
      completedTasks,
      payments,
    };
  }
}
