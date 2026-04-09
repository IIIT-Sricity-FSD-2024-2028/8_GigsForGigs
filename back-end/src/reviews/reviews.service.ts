import { Injectable } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';

/**
 * ReviewsService — stub implementation.
 */
@Injectable()
export class ReviewsService {
  create(dto: CreateReviewDto) {
    // TODO: check task is COMPLETED, check reviewer hasn't already reviewed this task
    return {
      message: 'Review submitted',
      stub: true,
      data: { ...dto, id: 'stub-review-id' },
    };
  }

  findAll(filters: {
    taskId?: string;
    reviewerId?: string;
    revieweeId?: string;
  }) {
    return { message: 'All reviews', stub: true, filters, data: [] };
  }

  findOne(id: string) {
    return { message: `Review ${id}`, stub: true, data: { id } };
  }

  getAverageRating(userId: string) {
    // TODO: aggregate ratings from DB where revieweeId = userId
    return {
      message: `Average rating for user ${userId}`,
      stub: true,
      data: { averageRating: 0, totalReviews: 0 },
    };
  }

  remove(id: string) {
    // TODO: admin-only guard, hard-delete
    return { message: `Review ${id} removed`, stub: true };
  }
}
