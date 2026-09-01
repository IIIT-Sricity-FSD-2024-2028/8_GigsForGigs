import React, { useState } from 'react';
import { useClient } from '../../../context/ClientContext';

export interface SearchTalentProps {
  onNavigate: (viewId: string) => void;
}

export const SearchTalent: React.FC<SearchTalentProps> = () => {
  const { services, requestService, requestedServices } = useClient();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [rateFilter, setRateFilter] = useState('all');
  const [localRequested, setLocalRequested] = useState<Set<string>>(new Set());

  const allServices = services;

  const handleHireClick = async (serviceId: string) => {
    try {
      await requestService(serviceId);
      setLocalRequested((prev) => new Set(prev).add(serviceId));
      alert('Hiring request sent successfully! The Gig Professional will receive it in their Pending Requests.');
    } catch (err) {
      console.error('Request service failed:', err);
      alert('Failed to send hiring request. Please try again.');
    }
  };

  // Filter logic
  const filteredServices = allServices.filter(service => {
    // Keyword-based category matching (no dedicated category field on GigService)
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
      <div className="talent-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
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
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(service.price)}
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
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-md)' }}>
                    {service.description}
                  </p>
                  <div className="talent-actions" style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'auto' }}>
                    <button
                      type="button"
                      className="btn-view-profile"
                      style={{ flex: 1, padding: '8px 14px', fontSize: '0.8125rem', border: '1px solid var(--color-primary-dark)', background: 'transparent', color: 'var(--color-primary-dark)' }}
                      onClick={() => alert(`Viewing profile of ${service.user?.name || 'Professional'}`)}
                    >
                      View Profile
                    </button>
                    <button
                      type="button"
                      className="btn-hire"
                      style={{ flex: 1, padding: '8px 14px', fontSize: '0.8125rem', border: 'none' }}
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
    </div>
  );
};

export default SearchTalent;
