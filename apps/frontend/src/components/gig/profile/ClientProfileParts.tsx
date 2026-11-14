/**
 * @file ClientProfileParts.tsx
 * @description
 * Pieces of a client's profile shared by the gig professional's Client Details
 * card (applied/active task details) and the full Client Profile page.
 */
import React from 'react';
import { Badge } from '../../common/Badge';
import { ProfileHeader } from '../../common/ProfileDetails';
import type { PublicClientProfile } from '../../../types/profile';

/** Organisation name, industry and verification status. */
export const ClientIdentityHeader: React.FC<{ profile: PublicClientProfile; avatarSize?: number }> = ({ profile, avatarSize }) => (
  <ProfileHeader
    name={profile.organizationName}
    avatarSize={avatarSize}
    subtitle={profile.domain || 'Industry not specified'}
    badges={profile.isVerified
      ? <Badge variant="success">✓ Verified client</Badge>
      : <Badge variant="neutral">Verification pending</Badge>}
  />
);

/** The client's email once they have hired the viewer; until then, why it isn't shown. */
export const ClientContactLine: React.FC<{ profile: PublicClientProfile }> = ({ profile }) =>
  profile.contactEmail
    ? <p className="profile-text">{profile.contactName} · <a href={`mailto:${profile.contactEmail}`}>{profile.contactEmail}</a></p>
    : <p className="profile-muted">{profile.contactName} · Contact email is shared once this client hires you.</p>;
