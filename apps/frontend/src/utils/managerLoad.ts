import type { Contract } from '../context/ClientContext';

/** Hires a manager supervises; `managerId` is the ManagerInvite.invite_id of a real manager. */
export const hiresFor = (contracts: Contract[], managerId: string) =>
  contracts.filter((c) => String(c.manager_id) === managerId);

export const activeCount = (contracts: Contract[], managerId: string) =>
  hiresFor(contracts, managerId).filter((c) => c.status === 'IN_PROGRESS').length;
