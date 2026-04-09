export interface IReview {
  id: string;
  taskId: string;
  reviewerId: string;       // who wrote the review
  revieweeId: string;       // who received it
  rating: number;           // 1-5
  comment: string;
  createdAt: Date;
}
