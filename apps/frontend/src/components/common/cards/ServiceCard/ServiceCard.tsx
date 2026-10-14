import React from 'react';
import { BaseCard } from '../BaseCard/BaseCard';
import { Badge } from '../../Badge/Badge';
import { safeHttpUrl } from '../../../../utils/helpers/safeUrl';

export interface ServiceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  price?: React.ReactNode;
  tags?: string[];
  imageUrl?: string;
  actions?: React.ReactNode;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, price, tags = [], imageUrl, actions, className = '', ...props }) =>
  <BaseCard title={title} description={description} className={`service-card ${className}`.trim()} {...props}>
    {safeHttpUrl(imageUrl) && <img className="service-card__image" src={safeHttpUrl(imageUrl)} alt="" loading="lazy" referrerPolicy="no-referrer" />}
    {tags.length > 0 && <ul className="service-card__tags" aria-label="Service tags">{tags.map(tag => <li key={tag}><Badge variant="info">{tag}</Badge></li>)}</ul>}
    {(price !== undefined || actions) && <footer className="service-card__footer">{price !== undefined && <strong>{price}</strong>}{actions}</footer>}
  </BaseCard>;

export default ServiceCard;
