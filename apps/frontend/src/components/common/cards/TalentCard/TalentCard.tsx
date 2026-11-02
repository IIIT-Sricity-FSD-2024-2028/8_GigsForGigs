import React from 'react';
import { Avatar } from '../../Avatar/Avatar';

export interface TalentCardProps {
  name: string;
  /** Line under the name: service title, role, ... */
  title?: string;
  price?: number;
  /** Average review rating (1-5); omit when the professional has no reviews yet. */
  rating?: number;
  skills?: string[];
  description?: string;
  /** Small pill in the banner corner, e.g. "Active". */
  badge?: string;
  avatarUrl?: string;
  /** Buttons shown at the bottom of the card. */
  actions?: React.ReactNode;
  className?: string;
}

const formatPrice = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

/** Card for a gig professional / service listing: avatar, name, price, rating, skills, description and an actions slot. Used by both Search Talent pages. */
export const TalentCard: React.FC<TalentCardProps> = ({ name, title, price, rating, skills = [], description, badge, avatarUrl, actions, className = '' }) =>
  <article className={`ui-talent-card ${className}`.trim()}>
    <div className="ui-talent-card__body">
      {badge && <span className="ui-talent-card__badge">{badge}</span>}
      <Avatar name={name} src={avatarUrl} size={64} className="ui-talent-card__avatar" />
      <div className="ui-talent-card__header">
        <strong>{name}</strong>
        {price !== undefined && <span className="ui-talent-card__price">{formatPrice(price)}</span>}
      </div>
      {title && <div className="ui-talent-card__title">{title}</div>}
      <div className="ui-talent-card__rating">{rating !== undefined ? <><span aria-hidden="true">★</span> {rating.toFixed(1)}</> : 'No reviews yet'}</div>
      {skills.length > 0 && <div className="ui-talent-card__skills">{skills.map(skill => <span key={skill} className="skill-chip">{skill}</span>)}</div>}
      {description && <p className="ui-talent-card__description">{description}</p>}
      {actions && <div className="ui-talent-card__actions">{actions}</div>}
    </div>
  </article>;

export default TalentCard;
