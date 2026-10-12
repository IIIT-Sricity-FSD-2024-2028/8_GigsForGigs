import React from 'react';
import type { TalentProfile } from '../../../../types/manager';
import { DashboardSection } from '../../../common/dashboard/DashboardSection/DashboardSection';
import { SummaryGrid } from '../../../common/dashboard/SummaryGrid/SummaryGrid';
import { TalentCard } from '../../cards/TalentCard/TalentCard';

export interface TalentOverviewProps { talent: TalentProfile[]; onSelect?: (profile: TalentProfile) => void; }
export const TalentOverview: React.FC<TalentOverviewProps> = ({ talent, onSelect }) =>
  <DashboardSection title="Talent overview" description={`${talent.length} professional${talent.length === 1 ? '' : 's'}`}><SummaryGrid>{talent.map(profile => <TalentCard key={profile.gigProfileId} talent={profile} actions={onSelect && <button type="button" className="ui-button ui-button--outline ui-button--sm" onClick={() => onSelect(profile)}>View profile</button>} />)}</SummaryGrid></DashboardSection>;
export default TalentOverview;
