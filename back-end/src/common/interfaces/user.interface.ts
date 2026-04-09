import { UserRole } from '../enums/user-role.enum';

export interface IUser {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  name: string;
  phone?: string;
  bio?: string;
  skills?: string[];
  portfolioUrl?: string;
  avatarUrl?: string;
  isFirstTimeUser: boolean;
  isActive: boolean;
  referredBy?: string;    // userId of referrer
  clientId?: string;      // for managers: linked client
  createdAt: Date;
  updatedAt: Date;
}
