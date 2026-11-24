import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { adminApi } from '../../services/api/admin/adminApi';
import { authApi, type AuthUser } from '../../services/api/auth/authApi';
import { ApiError } from '../../services/api/httpClient';
import { decodeJwtPayload } from '../../utils/jwt';

export type FrontendRole = 'CLIENT' | 'GIG_PROFESSIONAL' | 'MANAGER' | 'SUPER_ADMIN';
export type AdminTier = 'OWNER' | 'SUPER_ADMIN' | 'FINANCIAL_ADMIN' | 'SUPPORT_ADMIN' | 'CONTENT_MODERATOR' | 'AUDITOR';

export interface UserSession {
  userId: number; role: FrontendRole; name: string; email: string; adminTier?: AdminTier; permissions?: string[];
  appliedTaskIds: string[]; isNewAccount?: boolean; createdAt?: string; twoFactorEnabled?: boolean; status?: string;
  clientId?: number; managerId?: number; gigProfileId?: number;
}
interface TokenPayload { role: 'client' | 'gig_professional' | 'manager' | 'admin'; clientId?: number; managerId?: number; gigProfileId?: number }
export interface AuthState { user: UserSession | null; token: string | null; loading: boolean; authError: string | null; twoFactorRequired: boolean; adminProfileChecked: boolean }
const initialState: AuthState = { user: null, token: null, loading: false, authError: null, twoFactorRequired: false, adminProfileChecked: false };

export const TIER_PERMISSIONS: Record<AdminTier, string[]> = {
  OWNER: ['*'],
  SUPER_ADMIN: ['users:read', 'users:ban', 'payments:read', 'payments:refund', 'payments:release', 'disputes:resolve', 'reviews:moderate', 'settings:manage', 'admins:invite'],
  FINANCIAL_ADMIN: ['users:read', 'payments:read', 'payments:refund', 'payments:release'],
  SUPPORT_ADMIN: ['users:read', 'disputes:resolve', 'reviews:moderate'],
  CONTENT_MODERATOR: ['users:read', 'reviews:moderate'], AUDITOR: ['users:read', 'payments:read'],
};
function frontendRole(role: TokenPayload['role']): FrontendRole {
  const roles: Record<TokenPayload['role'], FrontendRole> = {
    client: 'CLIENT', gig_professional: 'GIG_PROFESSIONAL', manager: 'MANAGER', admin: 'SUPER_ADMIN',
  };
  return roles[role];
}
export function sessionFromAuthResponse(user: AuthUser, token: string): UserSession {
  const payload = decodeJwtPayload<TokenPayload>(token);
  return {
    userId: user.userId, role: frontendRole(payload?.role ?? user.role), name: user.name, email: user.email,
    adminTier: user.adminTier as AdminTier | undefined, permissions: user.permissions, appliedTaskIds: [],
    createdAt: user.createdAt, twoFactorEnabled: user.twoFactorEnabled, status: user.status,
    ...(payload?.clientId !== undefined ? { clientId: payload.clientId } : {}),
    ...(payload?.managerId !== undefined ? { managerId: payload.managerId } : {}),
    ...(payload?.gigProfileId !== undefined ? { gigProfileId: payload.gigProfileId } : {}),
  };
}
function messageOf(error: unknown, fallback: string) { return error instanceof Error ? error.message : fallback; }

export const signup = createAsyncThunk<{ user: UserSession; token: string }, { name: string; email: string; password: string; role: 'CLIENT' | 'GIG_PROFESSIONAL' }, { rejectValue: string }>(
  'auth/signup', async (input, { rejectWithValue }) => {
    try {
      const response = await authApi.signup(input.name, input.email, input.password, input.role === 'CLIENT' ? 'client' : 'gig_professional');
      if (!response?.token || !response.user?.role) throw new Error('Invalid signup response from server.');
      return { user: { ...sessionFromAuthResponse(response.user, response.token), isNewAccount: true }, token: response.token };
    } catch (error) { return rejectWithValue(messageOf(error, 'Registration failed. Please try again.')); }
  },
);
export const login = createAsyncThunk<{ user: UserSession; token: string }, { email: string; password: string; totpCode?: string }, { rejectValue: { message: string; twoFactorRequired: boolean } }>(
  'auth/login', async (input, { rejectWithValue }) => {
    try {
      const response = await authApi.login(input.email.trim(), input.password, input.totpCode);
      if (!response?.token || !response.user?.role) throw new Error('Invalid authentication response from server.');
      return { user: sessionFromAuthResponse(response.user, response.token), token: response.token };
    } catch (error) {
      const twoFactorRequired = error instanceof ApiError && !!(error.errors as { twoFactorRequired?: boolean } | undefined)?.twoFactorRequired;
      return rejectWithValue({ message: messageOf(error, 'Authentication failed. Please verify your credentials.'), twoFactorRequired });
    }
  },
);
export const acceptManagerInvite = createAsyncThunk<{ user: UserSession; token: string }, { token: string; password: string }, { rejectValue: string }>(
  'auth/acceptManagerInvite', async (input, { rejectWithValue }) => {
    try {
      const response = await authApi.acceptManagerInvite(input.token, input.password);
      if (!response?.token || !response.user?.role) throw new Error('Invalid invitation response from server.');
      return { user: { ...sessionFromAuthResponse(response.user, response.token), isNewAccount: true }, token: response.token };
    } catch (error) { return rejectWithValue(messageOf(error, 'Could not activate your manager account.')); }
  },
);
export const acceptAdminInvite = createAsyncThunk<{ user: UserSession; token: string }, { token: string; email: string; password: string; newPassword: string }, { rejectValue: string }>(
  'auth/acceptAdminInvite', async (input, { rejectWithValue }) => {
    try {
      const response = await authApi.acceptAdminInvite(input.token, input.email, input.password, input.newPassword);
      if (!response?.token || !response.user?.role) throw new Error('Invalid invitation response from server.');
      return { user: sessionFromAuthResponse(response.user, response.token), token: response.token };
    } catch (error) { return rejectWithValue(messageOf(error, 'Could not activate your administrator account.')); }
  },
);
export const refreshAdminSession = createAsyncThunk<Partial<UserSession>, void, { rejectValue: string }>(
  'auth/refreshAdminSession', async (_, { rejectWithValue }) => {
    try {
      const profile = await adminApi.getAdminProfile();
      return {
        ...(profile?.adminTier ? { adminTier: profile.adminTier as AdminTier } : {}),
        ...(profile?.permissions ? { permissions: profile.permissions } : {}),
        ...(profile?.isTwoFactorEnabled !== undefined ? { twoFactorEnabled: profile.isTwoFactorEnabled } : {}),
        ...(profile?.status ? { status: profile.status } : {}), ...(profile?.createdAt ? { createdAt: profile.createdAt } : {}),
      };
    } catch (error) { return rejectWithValue(messageOf(error, 'Could not refresh administrator session.')); }
  },
);
export const logoutManager = createAsyncThunk<void, void>(
  'auth/logoutManager', async () => { try { await authApi.managerLogout(); } catch { /* Clear local in-memory session even if the server is unreachable. */ } },
);

const authSlice = createSlice({
  name: 'auth', initialState,
  reducers: {
    clearSession() { return initialState; },
    clearAuthError(state) { state.authError = null; },
    replaceToken(state, action: PayloadAction<string>) { state.token = action.payload; },
    updateUserSession(state, action: PayloadAction<Partial<UserSession>>) {
      state.user = state.user ? { ...state.user, ...action.payload } : action.payload as UserSession;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(signup.pending, (s) => { s.loading = true; s.authError = null; })
      .addCase(signup.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user; s.token = a.payload.token; })
      .addCase(signup.rejected, (s, a) => { s.loading = false; s.authError = a.payload ?? 'Registration failed. Please try again.'; })
      .addCase(login.pending, (s) => { s.loading = true; s.authError = null; s.twoFactorRequired = false; })
      .addCase(login.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user; s.token = a.payload.token; s.twoFactorRequired = false; s.adminProfileChecked = false; })
      .addCase(login.rejected, (s, a) => { s.loading = false; s.authError = a.payload?.message ?? a.error.message ?? 'Authentication failed.'; s.twoFactorRequired = a.payload?.twoFactorRequired ?? false; })
      .addCase(acceptManagerInvite.pending, (s) => { s.loading = true; s.authError = null; })
      .addCase(acceptManagerInvite.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user; s.token = a.payload.token; })
      .addCase(acceptManagerInvite.rejected, (s, a) => { s.loading = false; s.authError = a.payload ?? 'Could not activate your manager account.'; })
      .addCase(acceptAdminInvite.pending, (s) => { s.loading = true; s.authError = null; })
      .addCase(acceptAdminInvite.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user; s.token = a.payload.token; s.adminProfileChecked = false; })
      .addCase(acceptAdminInvite.rejected, (s, a) => { s.loading = false; s.authError = a.payload ?? 'Could not activate your administrator account.'; })
      .addCase(logoutManager.pending, (s) => { s.loading = true; })
      .addCase(logoutManager.fulfilled, () => initialState)
      .addCase(refreshAdminSession.pending, (s) => { s.adminProfileChecked = true; })
      .addCase(refreshAdminSession.fulfilled, (s, a) => { if (s.user?.role === 'SUPER_ADMIN') s.user = { ...s.user, ...a.payload }; });
  },
});
export const { clearSession, clearAuthError, replaceToken, updateUserSession } = authSlice.actions;
export default authSlice.reducer;
