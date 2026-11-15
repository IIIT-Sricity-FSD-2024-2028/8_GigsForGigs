/**
 * @file ProfileDetails.tsx
 * @description
 * Presentational building blocks shared by every counterparty profile view
 * (the client's Applicant Profile modal, the gig professional's Client
 * Details card and Client Profile page), so they look and behave the same.
 * Every block renders a clear fallback for empty/missing data.
 */
import React from 'react';
import { Avatar } from '../Avatar';
import { safeHttpUrl } from '../../../utils/safeUrl';
import { formatDate } from '../../../utils/format';
import type { ProfileRating, PublicReview } from '../../../types/profile';

export interface ProfileHeaderProps {
  name: string;
  /** Line under the name, e.g. email or industry. */
  subtitle?: React.ReactNode;
  /** Badges shown under the subtitle (verification, status, ...). */
  badges?: React.ReactNode;
  avatarSize?: number;
}

/** Avatar, name, subtitle and badges at the top of a profile. */
export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ name, subtitle, badges, avatarSize = 56 }) => (
  <div className="profile-header">
    <Avatar name={name} size={avatarSize} />
    <div className="profile-header__identity">
      <h3 className="profile-header__name">{name}</h3>
      {subtitle && <div className="profile-header__subtitle">{subtitle}</div>}
      {badges && <div className="profile-header__badges">{badges}</div>}
    </div>
  </div>
);

/** A titled block within a profile. */
export const ProfileSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="profile-section">
    <h4>{title}</h4>
    {children}
  </section>
);

/** Label/value tiles for facts and counts. */
export const ProfileFacts: React.FC<{ items: Array<{ label: string; value: React.ReactNode }> }> = ({ items }) => (
  <dl className="profile-facts">
    {items.map((item) => (
      <div key={item.label}>
        <dt>{item.label}</dt>
        <dd>{item.value}</dd>
      </div>
    ))}
  </dl>
);

/** Paragraph of free text, or a muted fallback when there is none. */
export const ProfileText: React.FC<{ text: string | null | undefined; emptyText: string }> = ({ text, emptyText }) =>
  text?.trim() ? <p className="profile-text">{text}</p> : <p className="profile-muted">{emptyText}</p>;

/** Pills for skills/tools/tags. */
export const ProfileChips: React.FC<{ items: string[]; emptyText: string }> = ({ items, emptyText }) =>
  items.length === 0 ? <p className="profile-muted">{emptyText}</p> : (
    <ul className="profile-chips">{items.map((item) => <li key={item}>{item}</li>)}</ul>
  );

/** External links; anything that isn't a safe http(s) URL is shown as plain text, never as a link. */
export const ProfileLinks: React.FC<{ urls: string[]; emptyText: string }> = ({ urls, emptyText }) =>
  urls.length === 0 ? <p className="profile-muted">{emptyText}</p> : (
    <ul className="profile-list profile-links">
      {urls.map((url) => {
        const href = safeHttpUrl(url);
        return <li key={url}>{href ? <a href={href} target="_blank" rel="noopener noreferrer">{url}</a> : <span>{url}</span>}</li>;
      })}
    </ul>
  );

const stars = (rating: number) => {
  const whole = Math.max(0, Math.min(5, Math.round(rating)));
  return '★'.repeat(whole) + '☆'.repeat(5 - whole);
};

/** "★★★★☆ 4.2 (12 reviews)", or "No reviews yet". */
export const RatingSummary: React.FC<{ rating: ProfileRating }> = ({ rating }) =>
  rating.average === null || rating.count === 0 ? <span className="profile-muted">No reviews yet</span> : (
    <span className="profile-rating">
      <span className="profile-rating__stars" aria-hidden="true">{stars(rating.average)}</span>
      <span>{rating.average.toFixed(1)} <span className="profile-muted">({rating.count} review{rating.count === 1 ? '' : 's'})</span></span>
    </span>
  );

/** The latest published reviews someone received. */
export const ReviewList: React.FC<{ reviews: PublicReview[]; emptyText: string }> = ({ reviews, emptyText }) =>
  reviews.length === 0 ? <p className="profile-muted">{emptyText}</p> : (
    <ul className="profile-list">
      {reviews.map((review) => (
        <li key={review.reviewId} className="profile-review">
          <span className="profile-rating__stars" role="img" aria-label={`${review.rating} out of 5 stars`}>{stars(review.rating)}</span>
          <p className="profile-text">{review.comment?.trim() ? `“${review.comment}”` : 'No written comment.'}</p>
          <div className="profile-review__meta">{review.reviewerName} · {review.taskTitle} · {formatDate(review.createdAt)}</div>
        </li>
      ))}
    </ul>
  );
