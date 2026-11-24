/**
 * @file adminSlice.ts
 * @description Redux slice for the Super Admin vertical, mapped 1:1 onto `adminApi`.
 *
 * Rules:
 * - 1:1 mapping with repository (`adminApi` <-> `adminSlice`).
 * - Full CRUD coverage across all administrative entities.
 * - Server data updates strictly after successful backend responses in `fulfilled`.
 * - Reactive background synchronization keeps Audit Logs, KPIs, and cross-slice state fresh.
 */

import { createAsyncThunk, createSlice, type PayloadAction, type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';
import { adminApi } from '../../services/api/admin/adminApi';
import type {
  AdminAnalyticsData,
  AdminInviteResult,
  AdminKPIs,
  AdminStaff,
  AdminState,
  AdminUserProfile,
  AdminUserSummary,
  AuditLogEntry,
  ClientDetail,
  DisputeCase,
  DisputeSettlementOutcome,
  GigProDetail,
  ManagerDetail,
  ModerationReview,
  PlatformSettingsData,
  ProjectTask,
  RequestState,
} from './types';
import { clearSession } from '../auth/authSlice';
import { overrideEscrowPayment } from '../payment/paymentSlice';

const idle: RequestState = { status: 'idle', error: null };

export const initialAdminState: AdminState = {
  kpis: null,
  kpisRequest: idle,

  analytics: {},
  analyticsRequest: idle,

  users: [],
  usersRequest: idle,

  clients: [],
  clientsRequest: idle,

  gigPros: [],
  gigProsRequest: idle,

  managers: [],
  managersRequest: idle,

  projects: [],
  projectsRequest: idle,

  reviews: [],
  reviewsRequest: idle,

  disputes: [],
  disputesRequest: idle,

  adminStaff: [],
  adminStaffRequest: idle,
  latestCreatedInvite: null,

  auditLogs: [],
  auditLogsRequest: idle,

  platformSettings: null,
  platformSettingsRequest: idle,
  platformSettingsSave: idle,

  profile: null,
  profileRequest: idle,
  twoFactorEnrollment: null,

  mutationErrors: {},
};

type ThunkConfig = { rejectValue: string; state: { admin: AdminState } };

const messageOf = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

// ============================================================================
// READ THUNKS
// ============================================================================

export const fetchKPIs = createAsyncThunk<AdminKPIs, void, ThunkConfig>(
  'admin/fetchKPIs',
  async (_, { rejectWithValue }) => {
    try {
      return await adminApi.getKPIs();
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to fetch platform KPIs.'));
    }
  },
);

export const fetchAnalytics = createAsyncThunk<AdminAnalyticsData, string | undefined, ThunkConfig>(
  'admin/fetchAnalytics',
  async (timeRange = '30d', { rejectWithValue }) => {
    try {
      return await adminApi.getAnalytics(timeRange);
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to fetch analytics.'));
    }
  },
);

export const fetchUsers = createAsyncThunk<AdminUserSummary[], void, ThunkConfig>(
  'admin/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      return await adminApi.getUsers();
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to fetch users directory.'));
    }
  },
);

export const fetchClients = createAsyncThunk<ClientDetail[], void, ThunkConfig>(
  'admin/fetchClients',
  async (_, { rejectWithValue }) => {
    try {
      return await adminApi.getClients();
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to fetch client organisations.'));
    }
  },
);

export const fetchGigPros = createAsyncThunk<GigProDetail[], void, ThunkConfig>(
  'admin/fetchGigPros',
  async (_, { rejectWithValue }) => {
    try {
      return await adminApi.getGigPros();
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to fetch gig professionals roster.'));
    }
  },
);

export const fetchManagers = createAsyncThunk<ManagerDetail[], void, ThunkConfig>(
  'admin/fetchManagers',
  async (_, { rejectWithValue }) => {
    try {
      return await adminApi.getManagers();
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to fetch manager roster.'));
    }
  },
);

export const fetchProjects = createAsyncThunk<ProjectTask[], void, ThunkConfig>(
  'admin/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      return await adminApi.getProjects();
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to fetch project listings.'));
    }
  },
);

export const fetchReviews = createAsyncThunk<ModerationReview[], void, ThunkConfig>(
  'admin/fetchReviews',
  async (_, { rejectWithValue }) => {
    try {
      return await adminApi.getReviews();
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to fetch reviews for moderation.'));
    }
  },
);

export const fetchDisputes = createAsyncThunk<DisputeCase[], void, ThunkConfig>(
  'admin/fetchDisputes',
  async (_, { rejectWithValue }) => {
    try {
      return await adminApi.getDisputes();
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to fetch dispute dockets.'));
    }
  },
);

export const fetchAdminStaff = createAsyncThunk<AdminStaff[], void, ThunkConfig>(
  'admin/fetchAdminStaff',
  async (_, { rejectWithValue }) => {
    try {
      return await adminApi.getAdminStaff();
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to fetch administrator accounts.'));
    }
  },
);

export const fetchAuditLogs = createAsyncThunk<AuditLogEntry[], void, ThunkConfig>(
  'admin/fetchAuditLogs',
  async (_, { rejectWithValue }) => {
    try {
      return await adminApi.getAuditLogs();
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to fetch audit log trail.'));
    }
  },
);

export const fetchPlatformSettings = createAsyncThunk<PlatformSettingsData, void, ThunkConfig>(
  'admin/fetchPlatformSettings',
  async (_, { rejectWithValue }) => {
    try {
      return await adminApi.getPlatformSettings();
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to fetch platform configuration.'));
    }
  },
);

export const fetchAdminProfile = createAsyncThunk<AdminUserProfile, void, ThunkConfig>(
  'admin/fetchAdminProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await adminApi.getAdminProfile();
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to load administrator profile.'));
    }
  },
);

/** Refresh already-loaded dependent caches (audit trail, KPIs, etc.) in the background after a DB mutation. */
function refreshAfterMutation(
  dispatch: ThunkDispatch<unknown, unknown, UnknownAction>,
  getState: () => { admin: AdminState },
  opts: { audit?: boolean; kpis?: boolean; staff?: boolean; gigPros?: boolean } = {},
) {
  const adminDispatch = dispatch as ThunkDispatch<{ admin: AdminState }, unknown, UnknownAction>;
  const { admin } = getState();
  if (opts.audit && admin.auditLogsRequest.status !== 'idle') void adminDispatch(fetchAuditLogs());
  if (opts.kpis && admin.kpisRequest.status !== 'idle') void adminDispatch(fetchKPIs());
  if (opts.staff && admin.adminStaffRequest.status !== 'idle') void adminDispatch(fetchAdminStaff());
  if (opts.gigPros && admin.gigProsRequest.status !== 'idle') void adminDispatch(fetchGigPros());
}

// ============================================================================
// CREATE / UPDATE / DELETE MUTATION THUNKS
// ============================================================================

export const updateUserStatus = createAsyncThunk<
  { targetId: string; resolvedUserId: number; status: string; reason: string },
  { userId: string; status: string; reason: string },
  ThunkConfig
>('admin/updateUserStatus', async ({ userId, status, reason }, { dispatch, getState, rejectWithValue }) => {
  try {
    const res = await adminApi.updateUserStatus(userId, status, reason);
    refreshAfterMutation(dispatch, getState, { audit: true });
    return { targetId: userId, resolvedUserId: res.userId, status, reason };
  } catch (error) {
    return rejectWithValue(messageOf(error, 'Failed to update user status.'));
  }
});

export const decideClientKYC = createAsyncThunk<
  { clientId: string; status: 'VERIFIED' | 'REJECTED' },
  { clientId: string; status: 'VERIFIED' | 'REJECTED' },
  ThunkConfig
>('admin/decideClientKYC', async ({ clientId, status }, { dispatch, getState, rejectWithValue }) => {
  try {
    await adminApi.decideClientKYC(clientId, status);
    refreshAfterMutation(dispatch, getState, { audit: true, kpis: true });
    return { clientId, status };
  } catch (error) {
    return rejectWithValue(messageOf(error, 'Failed to record KYC decision.'));
  }
});

export const updateGigProBadge = createAsyncThunk<
  { gigProId: string; badge: string },
  { gigProId: string; badge: string },
  ThunkConfig
>('admin/updateGigProBadge', async ({ gigProId, badge }, { dispatch, getState, rejectWithValue }) => {
  try {
    await adminApi.updateGigProBadge(gigProId, badge);
    refreshAfterMutation(dispatch, getState, { audit: true });
    return { gigProId, badge };
  } catch (error) {
    return rejectWithValue(messageOf(error, 'Failed to update professional badge.'));
  }
});

export const overrideProjectStatus = createAsyncThunk<
  { projectId: string; status: string },
  { projectId: string; status: string },
  ThunkConfig
>('admin/overrideProjectStatus', async ({ projectId, status }, { dispatch, getState, rejectWithValue }) => {
  try {
    await adminApi.overrideProjectStatus(projectId, status);
    refreshAfterMutation(dispatch, getState, { audit: true, kpis: true });
    return { projectId, status };
  } catch (error) {
    return rejectWithValue(messageOf(error, 'Failed to override project status.'));
  }
});

export const moderateReview = createAsyncThunk<
  { reviewId: string; status: string; moderatorNotes?: string },
  { reviewId: string; status: string; moderatorNotes?: string },
  ThunkConfig
>('admin/moderateReview', async ({ reviewId, status, moderatorNotes }, { dispatch, getState, rejectWithValue }) => {
  try {
    await adminApi.moderateReview(reviewId, status, moderatorNotes);
    // Re-sync gigPros when review visibility changes since HIDDEN reviews drop out of averages
    refreshAfterMutation(dispatch, getState, { audit: true, gigPros: true });
    return { reviewId, status, moderatorNotes };
  } catch (error) {
    return rejectWithValue(messageOf(error, 'Failed to moderate review.'));
  }
});

export const settleDispute = createAsyncThunk<
  {
    disputeId: string;
    taskId?: string;
    settlementType: string;
    resolutionNotes: string;
    splitClientPercent?: number;
    outcome: DisputeSettlementOutcome;
  },
  { disputeId: string; settlementType: string; resolutionNotes: string; splitClientPercent?: number },
  ThunkConfig
>('admin/settleDispute', async ({ disputeId, settlementType, resolutionNotes, splitClientPercent }, { dispatch, getState, rejectWithValue }) => {
  try {
    const existingDispute = getState().admin.disputes.find(
      (d) => String(d.id) === String(disputeId) || String(d.disputeId) === String(disputeId),
    );
    const outcome = await adminApi.settleDispute(disputeId, settlementType, resolutionNotes, splitClientPercent);
    refreshAfterMutation(dispatch, getState, { audit: true, kpis: true });
    return {
      disputeId,
      taskId: existingDispute?.taskId,
      settlementType,
      resolutionNotes,
      splitClientPercent,
      outcome,
    };
  } catch (error) {
    return rejectWithValue(messageOf(error, 'Failed to execute arbitration ruling.'));
  }
});

export const inviteAdmin = createAsyncThunk<
  AdminInviteResult,
  { email: string; role: string; permissions: string[] },
  ThunkConfig
>('admin/inviteAdmin', async ({ email, role, permissions }, { dispatch, getState, rejectWithValue }) => {
  try {
    const res = await adminApi.inviteAdmin(email, role, permissions);
    refreshAfterMutation(dispatch, getState, { staff: true, audit: true, kpis: true });
    return res;
  } catch (error) {
    return rejectWithValue(messageOf(error, 'Failed to create administrator invitation.'));
  }
});

export const removeAdmin = createAsyncThunk<string, string, ThunkConfig>(
  'admin/removeAdmin',
  async (staffId, { dispatch, getState, rejectWithValue }) => {
    try {
      await adminApi.removeAdmin(staffId);
      refreshAfterMutation(dispatch, getState, { staff: true, audit: true, kpis: true });
      return staffId;
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to remove administrator account.'));
    }
  },
);

export const revokeAdminSession = createAsyncThunk<
  { staffId: string; token?: string },
  string,
  ThunkConfig
>('admin/revokeAdminSession', async (staffId, { dispatch, getState, rejectWithValue }) => {
  try {
    const res = await adminApi.revokeAdminSession(staffId);
    refreshAfterMutation(dispatch, getState, { audit: true });
    return { staffId, token: res?.token };
  } catch (error) {
    return rejectWithValue(messageOf(error, 'Failed to revoke administrator session.'));
  }
});

export const updatePlatformSettings = createAsyncThunk<PlatformSettingsData, PlatformSettingsData, ThunkConfig>(
  'admin/updatePlatformSettings',
  async (settings, { dispatch, getState, rejectWithValue }) => {
    try {
      const res = await adminApi.updatePlatformSettings(settings);
      refreshAfterMutation(dispatch, getState, { audit: true });
      return res || settings;
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to update platform settings.'));
    }
  },
);

export const updateAdminPassword = createAsyncThunk<
  { success: boolean; token: string },
  { currentPassword: string; newPassword: string },
  ThunkConfig
>('admin/updateAdminPassword', async ({ currentPassword, newPassword }, { dispatch, getState, rejectWithValue }) => {
  try {
    const res = await adminApi.updateAdminPassword(currentPassword, newPassword);
    refreshAfterMutation(dispatch, getState, { audit: true });
    return res;
  } catch (error) {
    return rejectWithValue(messageOf(error, 'Failed to update administrator password.'));
  }
});

export const enrollAdmin2FA = createAsyncThunk<
  { secret: string; otpauthUri: string },
  void,
  ThunkConfig
>('admin/enrollAdmin2FA', async (_, { rejectWithValue }) => {
  try {
    return await adminApi.enrollAdmin2FA();
  } catch (error) {
    return rejectWithValue(messageOf(error, 'Failed to initialize two-factor enrollment.'));
  }
});

export const confirmAdmin2FA = createAsyncThunk<void, string, ThunkConfig>(
  'admin/confirmAdmin2FA',
  async (code, { dispatch, getState, rejectWithValue }) => {
    try {
      await adminApi.confirmAdmin2FA(code);
      refreshAfterMutation(dispatch, getState, { audit: true });
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Invalid authentication code.'));
    }
  },
);

export const disableAdmin2FA = createAsyncThunk<void, string, ThunkConfig>(
  'admin/disableAdmin2FA',
  async (code, { dispatch, getState, rejectWithValue }) => {
    try {
      await adminApi.disableAdmin2FA(code);
      refreshAfterMutation(dispatch, getState, { audit: true });
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to disable two-factor authentication.'));
    }
  },
);

// ============================================================================
// SLICE DEFINITION
// ============================================================================

export const adminSlice = createSlice({
  name: 'admin',
  initialState: initialAdminState,
  reducers: {
    clearAdminInvite(state) {
      state.latestCreatedInvite = null;
    },
    clearTwoFactorEnrollment(state) {
      state.twoFactorEnrollment = null;
    },
    clearMutationError(state, action: PayloadAction<string>) {
      delete state.mutationErrors[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(clearSession, () => initialAdminState);

    // KPIs
    builder
      .addCase(fetchKPIs.pending, (state, action) => {
        state.kpisRequest = { status: 'loading', error: null, requestId: action.meta.requestId };
      })
      .addCase(fetchKPIs.fulfilled, (state, action) => {
        if (state.kpisRequest.requestId === action.meta.requestId) {
          state.kpisRequest = { status: 'succeeded', error: null };
          state.kpis = action.payload;
        }
      })
      .addCase(fetchKPIs.rejected, (state, action) => {
        if (state.kpisRequest.requestId === action.meta.requestId) {
          state.kpisRequest = { status: 'failed', error: action.payload || 'Failed to fetch KPIs.' };
        }
      });

    // Analytics
    builder
      .addCase(fetchAnalytics.pending, (state, action) => {
        state.analyticsRequest = { status: 'loading', error: null, requestId: action.meta.requestId };
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        if (state.analyticsRequest.requestId === action.meta.requestId) {
          state.analyticsRequest = { status: 'succeeded', error: null };
          state.analytics[action.payload.timeRange] = action.payload;
          if (action.meta.arg) {
            state.analytics[action.meta.arg] = action.payload;
          }
        }
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        if (state.analyticsRequest.requestId === action.meta.requestId) {
          state.analyticsRequest = { status: 'failed', error: action.payload || 'Failed to fetch analytics.' };
        }
      });

    // Users
    builder
      .addCase(fetchUsers.pending, (state, action) => {
        state.usersRequest = { status: 'loading', error: null, requestId: action.meta.requestId };
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        if (state.usersRequest.requestId === action.meta.requestId) {
          state.usersRequest = { status: 'succeeded', error: null };
          state.users = action.payload;
        }
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        if (state.usersRequest.requestId === action.meta.requestId) {
          state.usersRequest = { status: 'failed', error: action.payload || 'Failed to fetch users.' };
        }
      });

    // Sync user status across all loaded directories using canonical DB userId + targetId
    builder.addCase(updateUserStatus.fulfilled, (state, action) => {
      const { targetId, resolvedUserId, status } = action.payload;
      const normalizedStatus = status as 'ACTIVE' | 'SUSPENDED';
      const usrPrefix = `usr-${resolvedUserId}`;
      const targetNum = String(targetId).replace(/\D/g, '');

      const userRow = state.users.find((u) => u.userId === resolvedUserId || u.id === targetId);
      if (userRow) userRow.status = status;

      const clientRow = state.clients.find((c) => c.id === targetId || c.userId === usrPrefix);
      if (clientRow) clientRow.status = normalizedStatus;

      const proRow = state.gigPros.find((g) => g.id === targetId || g.userId === usrPrefix);
      if (proRow) proRow.status = normalizedStatus;

      const mgrRow = state.managers.find((m) => m.id === targetId || m.userId === usrPrefix);
      if (mgrRow) mgrRow.status = normalizedStatus;

      const staffRow = state.adminStaff.find(
        (a) =>
          a.id === targetId ||
          String(a.userId) === String(resolvedUserId) ||
          a.id === `adm-${resolvedUserId}` ||
          (targetNum !== '' && a.id === `adm-${targetNum}`),
      );
      if (staffRow) staffRow.status = normalizedStatus;
    });

    // Clients
    builder
      .addCase(fetchClients.pending, (state, action) => {
        state.clientsRequest = { status: 'loading', error: null, requestId: action.meta.requestId };
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        if (state.clientsRequest.requestId === action.meta.requestId) {
          state.clientsRequest = { status: 'succeeded', error: null };
          state.clients = action.payload;
        }
      })
      .addCase(fetchClients.rejected, (state, action) => {
        if (state.clientsRequest.requestId === action.meta.requestId) {
          state.clientsRequest = { status: 'failed', error: action.payload || 'Failed to fetch clients.' };
        }
      });

    builder.addCase(decideClientKYC.fulfilled, (state, action) => {
      const { clientId, status } = action.payload;
      const target = state.clients.find(
        (c) => String(c.id) === String(clientId) || String(c.clientId ?? '') === String(clientId),
      );
      if (target) {
        target.kycStatus = status;
        target.isVerified = status === 'VERIFIED';
      }
    });

    // Gig Pros
    builder
      .addCase(fetchGigPros.pending, (state, action) => {
        state.gigProsRequest = { status: 'loading', error: null, requestId: action.meta.requestId };
      })
      .addCase(fetchGigPros.fulfilled, (state, action) => {
        if (state.gigProsRequest.requestId === action.meta.requestId) {
          state.gigProsRequest = { status: 'succeeded', error: null };
          state.gigPros = action.payload;
        }
      })
      .addCase(fetchGigPros.rejected, (state, action) => {
        if (state.gigProsRequest.requestId === action.meta.requestId) {
          state.gigProsRequest = { status: 'failed', error: action.payload || 'Failed to fetch gig professionals.' };
        }
      });

    builder.addCase(updateGigProBadge.fulfilled, (state, action) => {
      const { gigProId, badge } = action.payload;
      const target = state.gigPros.find(
        (g) => String(g.id) === String(gigProId) || String(g.gigProId ?? '') === String(gigProId),
      );
      if (target) target.badge = badge;
    });

    // Managers
    builder
      .addCase(fetchManagers.pending, (state, action) => {
        state.managersRequest = { status: 'loading', error: null, requestId: action.meta.requestId };
      })
      .addCase(fetchManagers.fulfilled, (state, action) => {
        if (state.managersRequest.requestId === action.meta.requestId) {
          state.managersRequest = { status: 'succeeded', error: null };
          state.managers = action.payload;
        }
      })
      .addCase(fetchManagers.rejected, (state, action) => {
        if (state.managersRequest.requestId === action.meta.requestId) {
          state.managersRequest = { status: 'failed', error: action.payload || 'Failed to fetch managers.' };
        }
      });

    // Projects
    builder
      .addCase(fetchProjects.pending, (state, action) => {
        state.projectsRequest = { status: 'loading', error: null, requestId: action.meta.requestId };
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        if (state.projectsRequest.requestId === action.meta.requestId) {
          state.projectsRequest = { status: 'succeeded', error: null };
          state.projects = action.payload;
        }
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        if (state.projectsRequest.requestId === action.meta.requestId) {
          state.projectsRequest = { status: 'failed', error: action.payload || 'Failed to fetch projects.' };
        }
      });

    builder.addCase(overrideProjectStatus.fulfilled, (state, action) => {
      const { projectId, status } = action.payload;
      const numId = String(projectId).replace(/\D/g, '');
      const target = state.projects.find(
        (p) =>
          String(p.id) === String(projectId) ||
          String(p.taskId ?? '') === numId ||
          String(p.id).replace(/\D/g, '') === numId,
      );
      if (target) target.status = status.toUpperCase();
    });

    // Sync cached project escrowStatus when paymentSlice overrides escrow
    builder.addCase(overrideEscrowPayment.fulfilled, (state, action) => {
      const taskIdNum = action.payload.updatedPayment?.taskId;
      if (taskIdNum === undefined) return;
      const target = state.projects.find(
        (p) => Number(p.taskId) === taskIdNum || p.id === `tsk-${taskIdNum}`,
      );
      if (target) {
        target.escrowStatus = action.payload.action === 'RELEASE' ? 'RELEASED' : 'REFUNDED';
      }
    });

    // Reviews
    builder
      .addCase(fetchReviews.pending, (state, action) => {
        state.reviewsRequest = { status: 'loading', error: null, requestId: action.meta.requestId };
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        if (state.reviewsRequest.requestId === action.meta.requestId) {
          state.reviewsRequest = { status: 'succeeded', error: null };
          state.reviews = action.payload;
        }
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        if (state.reviewsRequest.requestId === action.meta.requestId) {
          state.reviewsRequest = { status: 'failed', error: action.payload || 'Failed to fetch reviews.' };
        }
      });

    builder.addCase(moderateReview.fulfilled, (state, action) => {
      const { reviewId, status, moderatorNotes } = action.payload;
      const target = state.reviews.find(
        (r) => String(r.id) === String(reviewId) || String(r.reviewId ?? '') === String(reviewId),
      );
      if (target) {
        target.status = status;
        if (moderatorNotes !== undefined) target.moderatorNotes = moderatorNotes;
      }
    });

    // Disputes
    builder
      .addCase(fetchDisputes.pending, (state, action) => {
        state.disputesRequest = { status: 'loading', error: null, requestId: action.meta.requestId };
      })
      .addCase(fetchDisputes.fulfilled, (state, action) => {
        if (state.disputesRequest.requestId === action.meta.requestId) {
          state.disputesRequest = { status: 'succeeded', error: null };
          state.disputes = action.payload;
        }
      })
      .addCase(fetchDisputes.rejected, (state, action) => {
        if (state.disputesRequest.requestId === action.meta.requestId) {
          state.disputesRequest = { status: 'failed', error: action.payload || 'Failed to fetch disputes.' };
        }
      });

    builder.addCase(settleDispute.fulfilled, (state, action) => {
      const { disputeId, taskId, settlementType, resolutionNotes, splitClientPercent } = action.payload;
      const target = state.disputes.find(
        (d) => String(d.id) === String(disputeId) || String(d.disputeId ?? '') === String(disputeId),
      );
      if (target) {
        target.status = 'RESOLVED';
        target.settlementType = settlementType;
        target.resolutionNotes = resolutionNotes;
        target.splitPercent = splitClientPercent ?? null;
        target.escrowHeld = 0;
        target.slaHoursLeft = null;
      }
      if (taskId) {
        const project = state.projects.find((p) => p.id === taskId);
        if (project) {
          project.escrowStatus = settlementType === 'FULL_REFUND' ? 'REFUNDED' : 'RELEASED';
        }
      }
    });

    // Admin Staff
    builder
      .addCase(fetchAdminStaff.pending, (state, action) => {
        state.adminStaffRequest = { status: 'loading', error: null, requestId: action.meta.requestId };
      })
      .addCase(fetchAdminStaff.fulfilled, (state, action) => {
        if (state.adminStaffRequest.requestId === action.meta.requestId) {
          state.adminStaffRequest = { status: 'succeeded', error: null };
          state.adminStaff = action.payload;
        }
      })
      .addCase(fetchAdminStaff.rejected, (state, action) => {
        if (state.adminStaffRequest.requestId === action.meta.requestId) {
          state.adminStaffRequest = { status: 'failed', error: action.payload || 'Failed to fetch admin staff.' };
        }
      });

    builder.addCase(inviteAdmin.fulfilled, (state, action) => {
      state.latestCreatedInvite = action.payload;
    });

    builder.addCase(removeAdmin.fulfilled, (state, action) => {
      const staffId = action.payload;
      const numId = staffId.replace(/\D/g, '');
      state.adminStaff = state.adminStaff.filter(
        (a) =>
          String(a.id) !== staffId &&
          String(a.userId ?? '') !== numId &&
          String(a.id).replace(/\D/g, '') !== numId,
      );
    });

    // Audit Logs
    builder
      .addCase(fetchAuditLogs.pending, (state, action) => {
        state.auditLogsRequest = { status: 'loading', error: null, requestId: action.meta.requestId };
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        if (state.auditLogsRequest.requestId === action.meta.requestId) {
          state.auditLogsRequest = { status: 'succeeded', error: null };
          state.auditLogs = action.payload;
        }
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        if (state.auditLogsRequest.requestId === action.meta.requestId) {
          state.auditLogsRequest = { status: 'failed', error: action.payload || 'Failed to fetch audit logs.' };
        }
      });

    // Platform Settings
    builder
      .addCase(fetchPlatformSettings.pending, (state, action) => {
        state.platformSettingsRequest = { status: 'loading', error: null, requestId: action.meta.requestId };
      })
      .addCase(fetchPlatformSettings.fulfilled, (state, action) => {
        if (state.platformSettingsRequest.requestId === action.meta.requestId) {
          state.platformSettingsRequest = { status: 'succeeded', error: null };
          state.platformSettings = action.payload;
        }
      })
      .addCase(fetchPlatformSettings.rejected, (state, action) => {
        if (state.platformSettingsRequest.requestId === action.meta.requestId) {
          state.platformSettingsRequest = { status: 'failed', error: action.payload || 'Failed to fetch settings.' };
        }
      });

    builder
      .addCase(updatePlatformSettings.pending, (state, action) => {
        state.platformSettingsSave = { status: 'loading', error: null, requestId: action.meta.requestId };
      })
      .addCase(updatePlatformSettings.fulfilled, (state, action) => {
        if (state.platformSettingsSave.requestId === action.meta.requestId) {
          state.platformSettingsSave = { status: 'succeeded', error: null };
          state.platformSettings = action.payload;
        }
      })
      .addCase(updatePlatformSettings.rejected, (state, action) => {
        if (state.platformSettingsSave.requestId === action.meta.requestId) {
          state.platformSettingsSave = { status: 'failed', error: action.payload || 'Failed to save settings.' };
        }
      });

    // Profile & 2FA
    builder
      .addCase(fetchAdminProfile.pending, (state, action) => {
        state.profileRequest = { status: 'loading', error: null, requestId: action.meta.requestId };
      })
      .addCase(fetchAdminProfile.fulfilled, (state, action) => {
        if (state.profileRequest.requestId === action.meta.requestId) {
          state.profileRequest = { status: 'succeeded', error: null };
          state.profile = action.payload;
        }
      })
      .addCase(fetchAdminProfile.rejected, (state, action) => {
        if (state.profileRequest.requestId === action.meta.requestId) {
          state.profileRequest = { status: 'failed', error: action.payload || 'Failed to load profile.' };
        }
      });

    builder.addCase(enrollAdmin2FA.fulfilled, (state, action) => {
      state.twoFactorEnrollment = action.payload;
    });

    builder.addCase(confirmAdmin2FA.fulfilled, (state) => {
      state.twoFactorEnrollment = null;
      if (state.profile) state.profile.isTwoFactorEnabled = true;
    });

    builder.addCase(disableAdmin2FA.fulfilled, (state) => {
      state.twoFactorEnrollment = null;
      if (state.profile) state.profile.isTwoFactorEnabled = false;
    });
  },
});

export const { clearAdminInvite, clearTwoFactorEnrollment, clearMutationError } = adminSlice.actions;
export default adminSlice.reducer;
