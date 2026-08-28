/**
 * @file GigProfileCompletion.tsx
 * @description
 * Profile completion and editing view for Gig Professionals.
 * Allows updating bio summaries, skill tags, development tools, and external portfolio links.
 */

import React, { useEffect, useState } from 'react';
import { useGig } from '../../../context/GigContext/GigContext';
import gigApi from '../../../services/api/gig/gigApi';
import { ApiError } from '../../../services/api/httpClient';

export const GigProfileCompletion: React.FC = () => {
  const { setActiveTab, triggerRefresh } = useGig();
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    gigApi.getProfile().then((prof) => {
      if (mounted && prof) {
        setBio(prof.bio || '');
        setSkills((prof.skills || []).join(', '));
        setPortfolio((prof.portfolio || []).join(', '));
        setLoading(false);
      }
    }).catch((err) => {
      if (mounted) {
        setError(err instanceof ApiError ? err.message : 'Failed to load profile.');
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
      const portfolioArray = portfolio.split(',').map((p) => p.trim()).filter(Boolean);

      await gigApi.updateProfile({
        bio: bio.trim(),
        skills: skillsArray,
        portfolio: portfolioArray
      });

      triggerRefresh();
      setActiveTab('profile');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed updating profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
        Loading Profile Editor...
      </div>
    );
  }

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
          <textarea
            className="admin-textarea"
            rows={5}
            placeholder="Write a concise overview of your background, experience level, and tech stack specialty..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: 'var(--spacing-xs)' }}>
            Skills & Frameworks (Comma separated)
          </label>
          <input
            type="text"
            className="admin-input"
            placeholder="React, TypeScript, Node.js, PostgreSQL, GraphQL"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: 'var(--spacing-xs)' }}>
            Portfolio URLs (Comma separated)
          </label>
          <input
            type="text"
            className="admin-input"
            placeholder="https://github.com/my-repo, https://dribbble.com/my-design"
            value={portfolio}
            onChange={(e) => setPortfolio(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)' }}>
          <button
            type="button"
            className="admin-btn admin-btn-outline"
            onClick={() => setActiveTab('profile')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GigProfileCompletion;
