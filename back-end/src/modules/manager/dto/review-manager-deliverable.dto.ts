export class ReviewManagerDeliverableDto {
  /** One of: approved | revision_requested | rejected */
  decision?: string;
  comment?: string;
}
