/**
 * @file GigProfileCompletion.tsx
 * @description
 * Profile completion and editing view for Gig Professionals.
 * Allows updating bio summaries, skill tags, development tools, and external portfolio links.
 */

import React, { useEffect, useState } from 'react';
import { useGigNavigation } from '../../../hooks/useGigNavigation';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchGigProfile, rejectionMessage, updateGigProfile } from '../../../store/gig/gigSlice';
import { selectGigProfile } from '../../../store/gig/selectors';
import type { GigProfile } from '../../../types/gig';
import { Loader } from '../../../components/common/Loader';
import { Button, Input, TextArea, useToast } from '../../../components/common';

/** Draft form; mounted only once the profile has loaded, so its initial values come straight from the server profile. */
const GigProfileForm: React.FC<{ profile: GigProfile }> = ({ profile }) => {
  const { setActiveTab } = useGigNavigation();
  const dispatch = useAppDispatch();
  // Form drafts stay local until save.
  const [bio, setBio] = useState(profile.bio || '');
  const [skills, setSkills] = useState((profile.skills || []).join(', '));
  const [portfolio, setPortfolio] = useState((profile.portfolio || []).join(', '));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  useEffect(() => { if (error) toast.error(error); }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
      const portfolioArray = portfolio.split(',').map((p) => p.trim()).filter(Boolean);

      await dispatch(updateGigProfile({
        bio: bio.trim(),
        skills: skillsArray,
        portfolio: portfolioArray
      })).unwrap();

      setActiveTab('profile');
    } catch (err) {
      setError(rejectionMessage(err, 'Failed updating profile.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* Banner */}
      <div className="admin-card" style={{ padding: 'var(--spacing-xl)' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
          Complete & Update Your Profile
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
          Highlight your software skills, past client experience, and work sample links to attract top clients.
        </p>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#FDE8E8',
            color: '#9B1C1C',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600
          }}
        >
          {error}
        </div>
      )}

      {/* Form */}
      <form className="admin-card" style={{ padding: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }} onSubmit={handleSubmit}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
          Professional Identity Settings
        </h2>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: 'var(--spacing-xs)' }}>
            Bio Summary *
          </label>
          <TextArea className="admin-textarea" maxLength={5000} rows={5} placeholder="Write a concise overview of your background, experience level, and tech stack specialty..." value={bio} onChange={(e) => setBio(e.target.value)} required />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: 'var(--spacing-xs)' }}>
            Skills & Frameworks (Comma separated)
          </label>
          <Input className="admin-input" maxLength={1000} type="text" placeholder="React, TypeScript, Node.js, PostgreSQL, GraphQL" value={skills} onChange={(e) => setSkills(e.target.value)} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: 'var(--spacing-xs)' }}>
            Portfolio URLs (Comma separated)
          </label>
          <Input className="admin-input" maxLength={2000} type="text" placeholder="https://github.com/my-repo, https://dribbble.com/my-design" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)' }}>
          <Button variant="outline" type="button" onClick={() => setActiveTab('profile')}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export const GigProfileCompletion: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: profile, error } = useAppSelector(selectGigProfile);
  const toast = useToast();
  useEffect(() => { void dispatch(fetchGigProfile()); }, [dispatch]);
  useEffect(() => { if (error) toast.error(error); }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!profile) return error ? null : <Loader label="Loading Profile Editor..." />;
  return <GigProfileForm profile={profile} />;
};

export default GigProfileCompletion;
