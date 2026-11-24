/**
 * @file selectors.ts
 * @description Read-side of gigSlice. Keyed lookups return `undefined` until that
 * key has been requested; pages treat that as "not loaded yet".
 */
import type { GigState } from './gigSlice';

type State = { gig: GigState };

export const selectGigTaskSearch = (state: State) => state.gig.taskSearch;
export const selectGigProfile = (state: State) => state.gig.lists.profile;
export const selectActiveTasks = (state: State) => state.gig.lists.activeTasks;
export const selectMarketplaceTasks = (state: State) => state.gig.lists.marketplaceTasks;
export const selectCompletedProjects = (state: State) => state.gig.lists.completedProjects;
export const selectPendingRequests = (state: State) => state.gig.lists.pendingRequests;
export const selectMyApplications = (state: State) => state.gig.lists.applications;
export const selectGigServices = (state: State) => state.gig.lists.services;
export const selectGigEarnings = (state: State) => state.gig.lists.earnings;

export const selectTaskDefinitions = (state: State, taskId: number | null) =>
  taskId === null ? undefined : state.gig.definitions[taskId];
export const selectServiceRequests = (state: State, serviceId: number | null) =>
  serviceId === null ? undefined : state.gig.serviceRequests[serviceId];
export const selectTaskClientProfile = (state: State, taskId: number | null) =>
  taskId === null ? undefined : state.gig.clientProfiles[taskId];
