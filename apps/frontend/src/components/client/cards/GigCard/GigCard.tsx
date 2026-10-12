import React from 'react';
import type { RawService } from '../../../../services/api/client/clientApi';
import { ServiceCard } from '../../../common/cards/ServiceCard/ServiceCard';

export interface GigCardProps { service: RawService; onSelect?: (service: RawService) => void; actionLabel?: string; }
export const GigCard: React.FC<GigCardProps> = ({ service, onSelect, actionLabel = 'View service' }) =>
  <ServiceCard title={service.title} description={service.description || undefined} imageUrl={service.thumbnail || undefined}
    price={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(service.price))}
    tags={service.tags.map(tag => tag.tag)} actions={onSelect && <button type="button" className="ui-button ui-button--outline ui-button--sm" onClick={() => onSelect(service)}>{actionLabel}</button>} />;
export default GigCard;
