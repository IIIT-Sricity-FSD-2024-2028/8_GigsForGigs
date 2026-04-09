import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * POST /reviews
   * Submit a review after task completion (both parties can review each other)
   */
  @Post()
  create(@Body() dto: CreateReviewDto) {
    return this.reviewsService.create(dto);
  }

  /**
   * GET /reviews
   * List reviews; filter by taskId, reviewerId, revieweeId
   */
  @Get()
  findAll(
    @Query('taskId') taskId?: string,
    @Query('reviewerId') reviewerId?: string,
    @Query('revieweeId') revieweeId?: string,
  ) {
    return this.reviewsService.findAll({ taskId, reviewerId, revieweeId });
  }

  /**
   * GET /reviews/:id
   * Get a single review
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  /**
   * GET /reviews/user/:userId/average-rating
   * Get the average rating for a user (shown on profiles)
   */
  @Get('user/:userId/average-rating')
  getAverageRating(@Param('userId') userId: string) {
    return this.reviewsService.getAverageRating(userId);
  }

  /**
   * DELETE /reviews/:id
   * Admin-only: remove a review (e.g. spam/abuse)
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
