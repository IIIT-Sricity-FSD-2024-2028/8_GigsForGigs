import React from 'react';
import { BaseCard } from '../../../common/cards/BaseCard/BaseCard';
import { StatusBadge } from '../../../common/status/StatusBadge/StatusBadge';

export interface DisputeRecord { id: string | number; title: string; reason: string; status: string; openedAt?: string; }
export interface DisputeCardProps { dispute: DisputeRecord; actions?: React.ReactNode; }
export const DisputeCard: React.FC<DisputeCardProps> = ({ dispute, actions }) =>
  <BaseCard title={dispute.title} actions={<StatusBadge status={dispute.status} />}><p>{dispute.reason}</p><footer className="dispute-card__footer"><span>{dispute.openedAt ? new Date(dispute.openedAt).toLocaleDateString() : `Case #${dispute.id}`}</span>{actions}</footer></BaseCard>;
export default DisputeCard;
