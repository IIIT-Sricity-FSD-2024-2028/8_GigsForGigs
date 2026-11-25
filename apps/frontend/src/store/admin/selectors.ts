/**
 * @file selectors.ts
 * @description Memoized selectors for the Super Admin Redux domain.
 */

import type { RootState } from '../store';

const selectAdminState = (state: RootState) => state.admin;

export const selectKPIs = (state: RootState) => selectAdminState(state).kpis;
export const selectKPIsRequest = (state: RootState) => selectAdminState(state).kpisRequest;

export const selectAnalyticsMap = (state: RootState) => selectAdminState(state).analytics;
export const selectAnalyticsRequest = (state: RootState) => selectAdminState(state).analyticsRequest;
export const selectAnalyticsByRange = (state: RootState, range: string) => selectAdminState(state).analytics[range] ?? null;

export const selectUsers = (state: RootState) => selectAdminState(state).users;
export const selectUsersRequest = (state: RootState) => selectAdminState(state).usersRequest;

export const selectClients = (state: RootState) => selectAdminState(state).clients;
export const selectClientsRequest = (state: RootState) => selectAdminState(state).clientsRequest;
export const selectClientDossierById = (state: RootState, clientId: string) =>
  selectAdminState(state).clientDossiers[clientId] ?? null;
export const selectClientDossierRequest = (state: RootState) => selectAdminState(state).clientDossierRequest;

export const selectGigPros = (state: RootState) => selectAdminState(state).gigPros;
export const selectGigProsRequest = (state: RootState) => selectAdminState(state).gigProsRequest;
export const selectGigProDossierById = (state: RootState, gigProId: string) =>
  selectAdminState(state).gigProDossiers[gigProId] ?? null;
export const selectGigProDossierRequest = (state: RootState) => selectAdminState(state).gigProDossierRequest;

export const selectManagers = (state: RootState) => selectAdminState(state).managers;
export const selectManagersRequest = (state: RootState) => selectAdminState(state).managersRequest;
export const selectAssignments = (state: RootState) => selectAdminState(state).assignments;
export const selectAssignmentsRequest = (state: RootState) => selectAdminState(state).assignmentsRequest;

export const selectProjects = (state: RootState) => selectAdminState(state).projects;
export const selectProjectsRequest = (state: RootState) => selectAdminState(state).projectsRequest;

export const selectReviews = (state: RootState) => selectAdminState(state).reviews;
export const selectReviewsRequest = (state: RootState) => selectAdminState(state).reviewsRequest;

export const selectDisputes = (state: RootState) => selectAdminState(state).disputes;
export const selectDisputesRequest = (state: RootState) => selectAdminState(state).disputesRequest;

export const selectAdminStaff = (state: RootState) => selectAdminState(state).adminStaff;
export const selectAdminStaffRequest = (state: RootState) => selectAdminState(state).adminStaffRequest;
export const selectLatestCreatedInvite = (state: RootState) => selectAdminState(state).latestCreatedInvite;

export const selectAuditLogs = (state: RootState) => selectAdminState(state).auditLogs;
export const selectAuditLogsRequest = (state: RootState) => selectAdminState(state).auditLogsRequest;

export const selectPlatformSettings = (state: RootState) => selectAdminState(state).platformSettings;
export const selectPlatformSettingsRequest = (state: RootState) => selectAdminState(state).platformSettingsRequest;
export const selectPlatformSettingsSave = (state: RootState) => selectAdminState(state).platformSettingsSave;

export const selectAdminProfile = (state: RootState) => selectAdminState(state).profile;
export const selectAdminProfileRequest = (state: RootState) => selectAdminState(state).profileRequest;
export const selectTwoFactorEnrollment = (state: RootState) => selectAdminState(state).twoFactorEnrollment;
