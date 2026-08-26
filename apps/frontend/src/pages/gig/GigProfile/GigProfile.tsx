/**
 * @file GigProfile.tsx
 * @description
 * Gig Professional public/private profile view.
 * Visualizes user identity, bio, verified skills, posted services, client ratings, and portfolio links.
 */

import React, { useEffect, useState } from 'react';
import { useGig } from '../../../context/GigContext/GigContext';
import gigApi from '../../../services/api/gig/gigApi';
import type { GigProfile as IGigProfile, GigService } from '../../../types/gig';

export const GigProfile: React.FC = () => {
  const { setActiveTab, refreshTrigger } = useGig();
  const [profile, setProfile] = useState<IGigProfile | null>(null);
  const [services, setServices] = useState<GigService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([gigApi.getProfile(), gigApi.getServices()])
      .then(([prof, srvs]) => {
        if (mounted) {
          setProfile(prof);
          setServices(srvs);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [refreshTrigger]);

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amt);

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
        Loading Gig Profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="admin-card" style={{ padding: 'var(--spacing-xxl)', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Unable to load Gig Professional profile.</p>
      </div>
    );
  }

  const initials = profile.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || 'GP';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      {/* Top Banner Card */}
      <div
        className="admin-card"
        style={{
          padding: 'var(--spacing-xl)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--spacing-lg)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-dark)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            {initials}
          </div>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
              {profile.name}
            </h1>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
              {profile.email} • Verified Gig Professional
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginTop: '4px' }}>
              <span style={{ color: '#facc15', fontSize: '1rem' }}>★ ★ ★ ★ ★</span>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-dark)' }}>
                {profile.rating || 4.9} ({profile.completedProjectsCount || 14} Reviews)
              </span>
            </div>
          </div>
        </div>

        <button
          className="admin-btn admin-btn-outline"
          onClick={() => setActiveTab('profile-completion')}
        >
          Edit Profile & Skills
        </button>
      </div>

      {/* Grid Layout (2 Columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-xl)' }}>
        {/* Left Column: Bio & Services */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
          {/* About Me */}
          <div className="admin-card" style={{ padding: 'var(--spacing-xl)' }}>
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-md)' }}>
              About Me
            </h2>
            <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-dark)', lineHeight: 1.6 }}>
              {profile.bio || 'No bio added yet.'}
            </p>
          </div>

          {/* Published Services */}
          <div className="admin-card" style={{ padding: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                My Published Services ({services.length})
              </h2>
              <button
                className="admin-btn admin-btn-primary admin-btn-sm"
                onClick={() => setActiveTab('post-service')}
              >
                + Post Service
              </button>
            </div>

            {services.length === 0 ? (
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                No services posted yet.
              </p>
            ) : (
              services.map((srv) => (
                <div
                  key={srv.service_id}
                  style={{
                    display: 'flex',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    backgroundColor: 'var(--color-bg-white)'
                  }}
                >
                  <div
                    style={{
                      width: '120px',
                      backgroundColor: 'rgba(8, 75, 131, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-primary-dark)',
                      fontWeight: 800
                    }}
                  >
                    SERVICE
                  </div>
                  <div style={{ padding: 'var(--spacing-md)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-dark)' }}>
                        {srv.title}
                      </h3>
                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        {srv.description}
                      </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--spacing-sm)' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        Tags: {srv.tags.join(', ')}
                      </span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                        {formatCurrency(srv.price)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Skills & Portfolio */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
          {/* Skills Badges */}
          <div className="admin-card" style={{ padding: 'var(--spacing-xl)' }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-md)' }}>
              Skills & Expertise
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
              {profile.skills && profile.skills.length > 0 ? (
                profile.skills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: 'var(--color-bg-light)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      color: 'var(--color-primary-dark)'
                    }}
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>No skills added.</span>
              )}
            </div>
          </div>

          {/* Portfolio Links */}
          <div className="admin-card" style={{ padding: 'var(--spacing-xl)' }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-md)' }}>
              Portfolio & Work Samples
            </h3>
            {profile.portfolio && profile.portfolio.length > 0 ? (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {profile.portfolio.map((link, idx) => (
                  <li key={idx} style={{ fontSize: 'var(--font-size-xs)' }}>
                    <a href={link} target="_blank" rel="noreferrer" style={{ color: 'var(--color-info-text)', fontWeight: 600, textDecoration: 'none' }}>
                      🔗 {link}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>No portfolio links added.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GigProfile;
