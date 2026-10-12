import React from 'react';
import type { GigService } from '../../../../types/gig';
import { ServiceCard as SharedServiceCard } from '../../../common/cards/ServiceCard/ServiceCard';

export interface GigServiceCardProps { service: GigService; onSelect?: (service: GigService) => void; }
export const ServiceCard: React.FC<GigServiceCardProps> = ({ service, onSelect }) =>
  <SharedServiceCard title={service.title} description={service.description} imageUrl={service.thumbnail} tags={service.tags}
    price={`₹${service.price.toLocaleString('en-IN')}`} actions={onSelect && <button type="button" className="ui-button ui-button--outline ui-button--sm" onClick={() => onSelect(service)}>View service</button>} />;
export default ServiceCard;
