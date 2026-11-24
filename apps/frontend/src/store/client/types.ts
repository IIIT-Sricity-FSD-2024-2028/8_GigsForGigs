/**
 * @file types.ts
 * @description State interfaces and request status contracts for the Client Redux slice.
 */

import type {
  ClientProfileData,
  RawTask,
  RawApplication,
  ApplicantProfileResponse,
  RawContract,
  TaskDeliverableDefinition,
  RawDeliverable,
  RawService,
  RawServiceRequest,
  RawManager,
  RawManagerInvite,
  RawContractReview,
} from '../../services/api/client/clientApi';

export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface RequestState {
  status: RequestStatus;
  error: string | null;
  requestId?: string;
}

export interface ClientState {
  /** Organization profile for the logged-in client */
  profile: ClientProfileData | null;
  profileRequest: RequestState;
  profileSave: RequestState;

  /** Tasks posted by this client */
  tasks: RawTask[];
  tasksRequest: RequestState;
  taskMutations: Record<number, number>;
  taskActionErrors: Record<number, string | null>;

  /** Candidate applications received on client tasks */
  applications: RawApplication[];
  applicationsRequest: RequestState;
  applicantProfiles: Record<number, ApplicantProfileResponse>;
  applicantProfileRequests: Record<number, RequestState>;
  applicationActionErrors: Record<number, string | null>;

  /** Active and completed contracts (derived from accepted applications) */
  contracts: RawContract[];
  contractsRequest: RequestState;
  contractActionErrors: Record<string, string | null>;

  /** Deliverable milestone definitions keyed by taskId */
  definitionsByTask: Record<number, TaskDeliverableDefinition[]>;
  definitionsRequests: Record<number, RequestState>;
  definitionMutations: Record<number, number>;
  definitionErrors: Record<number, string | null>;

  /** Submitted deliverables by gig professionals keyed by taskId */
  deliverablesByTask: Record<number, RawDeliverable[]>;
  deliverablesRequests: Record<number, RequestState>;
  deliverableActionErrors: Record<string, string | null>;

  /** Marketplace services */
  services: RawService[];
  servicesRequest: RequestState;
  serviceRequests: RawServiceRequest[];
  serviceRequestsRequest: RequestState;
  requestedServiceIds: number[];
  serviceActionError: string | null;

  /** Client's supervised manager roster */
  managers: RawManager[];
  managersRequest: RequestState;
  managerProfiles: Record<number, RawManager>;
  managerProfileRequests: Record<number, RequestState>;
  managerActionErrors: Record<number, string | null>;

  /** Invitations sent to prospective managers */
  invites: RawManagerInvite[];
  invitesRequest: RequestState;
  inviteActionErrors: Record<number, string | null>;
  latestCreatedInvite: RawManagerInvite | null;

  /** Dispute creation status tracked by composite hire key `${taskId}-${gigProfileId}` */
  disputeRequests: Record<string, RequestState>;

  /** Client reviews */
  reviews: RawContractReview[];
  reviewsRequest: RequestState;

  /** Review submission status */
  reviewSubmitState: RequestState;
}
