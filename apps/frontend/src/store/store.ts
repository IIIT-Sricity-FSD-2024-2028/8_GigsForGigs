import { combineReducers, configureStore, createSlice } from '@reduxjs/toolkit';
import authReducer, { clearSession, logoutManager } from './auth/authSlice';
import managerReducer from './manager/managerSlice';
import clientReducer from './client/clientSlice';
import { configureTokenReader } from '../services/api/httpClient';

const emptyFeature = (name: string) => createSlice({ name, initialState: {}, reducers: {} }).reducer;
const appReducer = combineReducers({
    auth: authReducer,
    client: clientReducer,
    gig: emptyFeature('gig'),
    manager: managerReducer,
    admin: emptyFeature('admin'),
    payment: emptyFeature('payment'),
});
const rootReducer: typeof appReducer = (state, action) => {
  if (clearSession.match(action) || logoutManager.fulfilled.match(action)) state = undefined;
  return appReducer(state, action);
};

export const store = configureStore({ reducer: rootReducer });

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// httpClient receives a selector callback instead of importing this store,
// avoiding an API-client/store circular dependency.
configureTokenReader((actor) => {
  const { user, token } = store.getState().auth;
  if (!user || !token) return null;
  const expectedActor = ({ CLIENT: 'client', MANAGER: 'manager', GIG_PROFESSIONAL: 'gig_professional', SUPER_ADMIN: 'admin' } as const)[user.role];
  return expectedActor === actor ? token : null;
});

