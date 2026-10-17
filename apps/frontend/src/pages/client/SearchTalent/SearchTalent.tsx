import React, { useState } from 'react';
import { useClient, type Service } from '../../../context/ClientContext';

export interface SearchTalentProps {
  onNavigate: (viewId: string) => void;
}

export const SearchTalent: React.FC<SearchTalentProps> = () => {
  const { services, requestService, requestedServices } = useClient();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [rateFilter, setRateFilter] = useState('all');
  const [localRequested, setLocalRequested] = useState<Set<string>>(new Set());
  const [selectedProfile, setSelectedProfile] = useState<Service | null>(null);

  const allServices = services;

  const handleHireClick = async (serviceId: string) => {
    try {
      await requestService(serviceId);
      setLocalRequested((prev) => new Set(prev).add(serviceId));
      alert('Hiring request sent! Once the Gig Professional accepts, you will be asked to pay the escrow amount (service price + 10% platform fee) to start work.');
    } catch (err) {
      console.error('Request service failed:', err);
      alert(err instanceof Error && err.message ? err.message : 'Failed to send hiring request. Please try again.');
    }
  };

  // Filter logic
  const filteredServices = allServices.filter(service => {
    // Keyword-based category matching
    if (categoryFilter !== 'all') {
      const titleLower = service.title.toLowerCase();
      if (categoryFilter === 'design' && !titleLower.includes('design') && !titleLower.includes('configurator')) return false;
      if (categoryFilter === 'dev' && !titleLower.includes('dashboard') && !titleLower.includes('developer') && !titleLower.includes('api')) return false;
      if (categoryFilter === 'writing' && !titleLower.includes('copywriting') && !titleLower.includes('content')) return false;
    }

    if (rateFilter !== 'all') {
      const price = service.price;
      if (rateFilter === 'low' && price > 1000) return false;
      if (rateFilter === 'mid' && (price < 1000 || price > 5000)) return false;
      if (rateFilter === 'high' && price < 5000) return false;
    }

    return true;
  });

  const getBannerClass = (serviceId: string) => {
    if (serviceId.includes('101') || serviceId === 'srv-1') return 'talent-banner-blue';
    if (serviceId.includes('102') || serviceId === 'srv-2') return 'talent-banner-gold';
    return 'talent-banner-pink';
  };

  const getInitials = (nameStr?: string) => {
    if (!nameStr) return 'GP';
    return nameStr.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="page-title">Search Talent &amp; Marketplace Services ({allServices.length})</h1>
        <p className="page-subtitle">Browse vetted professionals and premium services posted by Gig Professionals available for immediate hire.</p>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar" style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)', backgroundColor: 'var(--color-white)', padding: 'var(--spacing-md) var(--spacing-lg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', alignItems: 'center' }}>
        <span className="filter-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          Filter By:
        </span>
        <select
          className="filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Category"
          style={{ flex: 1, padding: '6px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}
        >
          <option value="all">All Categories</option>
          <option value="design">Design &amp; Creative</option>
          <option value="dev">Software Development</option>
          <option value="writing">Writing &amp; Translation</option>
        </select>

        <div className="filter-divider" style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-border)' }}></div>

        <select
          className="filter-select"
          value={rateFilter}
          onChange={(e) => setRateFilter(e.target.value)}
          aria-label="Rate Range"
          style={{ flex: 1, padding: '6px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}
        >
          <option value="all">All Rates</option>
          <option value="low">Under ₹1,000</option>
          <option value="mid">₹1,000 - ₹5,000</option>
          <option value="high">Over ₹5,000</option>
        </select>
      </div>

      {/* Talent Grid */}
      <div className="talent-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
        {filteredServices.length === 0 ? (
          <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--spacing-xxl)' }}>
            No talent listings match the selected filters.
          </p>
        ) : (
          filteredServices.map(service => {
            const isRequested = localRequested.has(service.service_id) || requestedServices.has(service.service_id);
            return (
              <article key={service.service_id} className="talent-card" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-white)' }}>
                <div className={`talent-banner ${getBannerClass(service.service_id)}`} style={{ height: '80px', position: 'relative' }}>
                  <span className="talent-vetted-badge" style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(255, 255, 255, 0.9)', color: 'var(--color-secondary)', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 600 }}>
                    ★ Active
                  </span>
                </div>
                <div className="talent-body" style={{ padding: 'var(--spacing-lg)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div className="talent-photo" style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--color-border)', overflow: 'hidden', marginTop: '-48px', border: '3px solid var(--color-white)' }}>
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, backgroundColor: '#c4d6e4', color: 'var(--color-primary-dark)' }}>
                      {getInitials(service.user?.name)}
                    </div>
                  </div>
                  <div className="talent-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 'var(--spacing-sm)' }}>
                    <span className="talent-name" style={{ fontSize: '1.0625rem', fontWeight: 700 }}>
                      {service.user?.name || 'Gig Professional'}
                    </span>
                    <span className="talent-rate" style={{ fontSize: '1rem', fontWeight: 700 }}>
                      {formatCurrency(service.price)}
                    </span>
                  </div>
                  <div className="talent-title" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                    {service.title}
                  </div>
                  <div className="talent-rating" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem', marginBottom: 'var(--spacing-md)' }}>
                    <span className="star" style={{ color: '#f59e0b' }}>★</span> 4.9 <span className="review-count" style={{ color: 'var(--color-text-muted)' }}>(vetted)</span>
                  </div>
                  <div className="talent-skills" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: 'var(--spacing-lg)' }}>
                    {service.skills.map((skill: string, idx: number) => (
                      <span key={idx} className="skill-chip">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-md)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                    {service.description}
                  </p>
                  <div className="talent-actions" style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'auto' }}>
                    <button
                      type="button"
                      className="btn-view-profile"
                      style={{ flex: 1, padding: '8px 14px', fontSize: '0.8125rem', border: '1px solid var(--color-primary-dark)', background: 'transparent', color: 'var(--color-primary-dark)', cursor: 'pointer', borderRadius: '4px' }}
                      onClick={() => setSelectedProfile(service)}
                    >
                      View Profile
                    </button>
                    <button
                      type="button"
                      className="btn-hire"
                      style={{ flex: 1, padding: '8px 14px', fontSize: '0.8125rem', border: 'none', cursor: isRequested ? 'not-allowed' : 'pointer', borderRadius: '4px' }}
                      disabled={isRequested}
                      onClick={() => handleHireClick(service.service_id)}
                    >
                      {isRequested ? 'Requested' : 'Request / Hire'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Gig Professional Profile Modal */}
      {selectedProfile && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
          onClick={() => setSelectedProfile(null)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Banner */}
            <div
              className={`talent-banner ${getBannerClass(selectedProfile.service_id)}`}
              style={{
                height: '110px',
                position: 'relative',
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '12px 16px'
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedProfile(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.85)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: 'var(--color-text-dark)'
                }}
                title="Close profile"
              >
                ✕
              </button>
            </div>

            {/* Profile Content */}
            <div style={{ padding: '0 24px 24px 24px' }}>
              {/* Photo & Identity */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '-45px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    backgroundColor: '#c4d6e4',
                    color: 'var(--color-primary-dark)',
                    border: '4px solid #FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  {getInitials(selectedProfile.user?.name)}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
                    Starting Rate / Price
                  </span>
                  <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                    {formatCurrency(selectedProfile.price)}
                  </span>
                </div>
              </div>

              {/* Name & Headline */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text-dark)', margin: 0 }}>
                    {selectedProfile.user?.name || 'Gig Professional'}
                  </h2>
                  <span
                    style={{
                      backgroundColor: '#E6F4EA',
                      color: '#137333',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      border: '1px solid #CEEAD6'
                    }}
                  >
                    ✓ Verified Pro
                  </span>
                </div>
                <p style={{ fontSize: '0.95rem', color: '#0D568D', fontWeight: 600, margin: '4px 0 0 0' }}>
                  {selectedProfile.title}
                </p>
                {selectedProfile.user?.email && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>
                    ✉️ {selectedProfile.user.email}
                  </p>
                )}
              </div>

              {/* Trust & Rating Badges */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  backgroundColor: '#F8FAFB',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border)',
                  marginBottom: '20px',
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Rating</div>
                  <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.95rem' }}>★ 4.9 / 5.0</div>
                </div>
                <div style={{ width: '1px', backgroundColor: 'var(--color-border)' }}></div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Job Success</div>
                  <div style={{ fontWeight: 700, color: '#137333', fontSize: '0.95rem' }}>100% Verified</div>
                </div>
                <div style={{ width: '1px', backgroundColor: 'var(--color-border)' }}></div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Response Time</div>
                  <div style={{ fontWeight: 700, color: '#0D568D', fontSize: '0.95rem' }}>&lt; 2 Hours</div>
                </div>
              </div>

              {/* Bio & Scope */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  About &amp; Service Offering
                </h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-dark)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
                  {selectedProfile.description}
                </p>
              </div>

              {/* Skills */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Verified Skills
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedProfile.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#F2F6F8',
                        color: '#084875',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        border: '1px solid #D5E5E9'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedProfile(null)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--color-text-dark)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={localRequested.has(selectedProfile.service_id) || requestedServices.has(selectedProfile.service_id)}
                  onClick={() => {
                    handleHireClick(selectedProfile.service_id);
                  }}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: localRequested.has(selectedProfile.service_id) || requestedServices.has(selectedProfile.service_id) ? '#9E9E9E' : '#B45F00',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: localRequested.has(selectedProfile.service_id) || requestedServices.has(selectedProfile.service_id) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {localRequested.has(selectedProfile.service_id) || requestedServices.has(selectedProfile.service_id) ? 'Request Already Sent' : 'Request / Hire Professional'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchTalent;
