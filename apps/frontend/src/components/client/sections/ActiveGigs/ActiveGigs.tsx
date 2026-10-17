import React from 'react';
import type { RawContract } from '../../../../services/api/client/clientApi';
import { DashboardSection } from '../../../common/dashboard/DashboardSection/DashboardSection';
import { SummaryGrid } from '../../../common/dashboard/SummaryGrid/SummaryGrid';
import { TaskCard } from '../../../common/cards/TaskCard/TaskCard';

export interface ActiveGigsProps { contracts: RawContract[]; onSelect?: (contract: RawContract) => void; }
/** Grid of TaskCards for the client's active contracts. Not rendered anywhere yet. */
export const ActiveGigs: React.FC<ActiveGigsProps> = ({ contracts, onSelect }) =>
  <DashboardSection title="Active contracts" description={`${contracts.length} current contract${contracts.length === 1 ? '' : 's'}`}>
    {contracts.length ? <SummaryGrid>{contracts.map(contract => <TaskCard key={contract.taskId} title={contract.taskTitle} status={contract.status} budget={`₹${Number(contract.budget).toLocaleString('en-IN')}`} progress={contract.progress} actions={onSelect && <button type="button" className="ui-button ui-button--outline ui-button--sm" onClick={() => onSelect(contract)}>View contract</button>} />)}</SummaryGrid> : <p>No active contracts yet.</p>}
  </DashboardSection>;
export default ActiveGigs;
