import React, { useState } from 'react';
import { useClient, type Service } from '../../../context/ClientContext';
import { Button, SearchBar, Select, TalentCard, useToast } from '../../../components/common';

export interface SearchTalentProps {
  onNavigate: (viewId: string) => void;
}

export const SearchTalent: React.FC<SearchTalentProps> = () => {
  const toast = useToast();
  const { services, requestService, requestedServices } = useClient();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [rateFilter, setRateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [localRequested, setLocalRequested] = useState<Set<string>>(new Set());
  const [selectedProfile, setSelectedProfile] = useState<Service | null>(null);

  const allServices = services;

  const handleHireClick = async (serviceId: string) => {
    try {
      await requestService(serviceId);
      setLocalRequested((prev) => new Set(prev).add(serviceId));
      toast.success('Hiring request sent! Once the Gig Professional accepts, you will be asked to pay the escrow amount (service price + 10% platform fee) to start work.');
    } catch (err) {
      console.error('Request service failed:', err);
      toast.error(err instanceof Error && err.message ? err.message : 'Failed to send hiring request. Please try again.');
    }
  };

  // Filter logic
  const query = searchTerm.trim().toLowerCase();
  const filteredServices = allServices.filter(service => {
    if (query) {
      const haystack = [service.title, service.user?.name, ...service.skills].join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    if (categoryFilter !== 'all' && service.category !== categoryFilter) return false;

    if (rateFilter !== 'all') {
      const price = service.price;
      if (rateFilter === 'low' && price >= 1000) return false;
      if (rateFilter === 'mid' && (price < 1000 || price > 5000)) return false;
      if (rateFilter === 'high' && price <= 5000) return false;
    }

    return true;
  });

  const getBannerVariant = (serviceId: string) => {
    if (serviceId.includes('101') || serviceId === 'srv-1') return 'blue';
    if (serviceId.includes('102') || serviceId === 'srv-2') return 'gold';
    return 'pink';
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
        <h1 className="page-title">Search Gigs ({allServices.length})</h1>
        <p className="page-subtitle">Browse vetted professionals and premium services posted by Gig Professionals available for immediate hire.</p>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar" style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)', backgroundColor: 'var(--color-white)', padding: 'var(--spacing-md) var(--spacing-lg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', alignItems: 'center' }}>
        <span className="filter-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          Filter By:
        </span>
        <div style={{ flex: 2 }}><SearchBar aria-label="Search talent" placeholder="Search by name, skill or service..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>

        <div className="filter-divider" style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-border)' }}></div>

        <Select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Category" style={{ flex: 1 }}>
          <option value="all">All Categories</option>
          <option value="design">Design &amp; Creative</option>
          <option value="dev">Software Development</option>
          <option value="writing">Writing &amp; Translation</option>
          <option value="marketing">Digital Marketing</option>
        </Select>

        <div className="filter-divider" style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-border)' }}></div>

        <Select className="filter-select" value={rateFilter} onChange={(e) => setRateFilter(e.target.value)} aria-label="Rate Range" style={{ flex: 1 }}>
          <option value="all">All Rates</option>
          <option value="low">Under ₹1,000</option>
          <option value="mid">₹1,000 - ₹5,000</option>
          <option value="high">Over ₹5,000</option>
        </Select>
      </div>

      {(() => {
        const isRequested = (service: Service) => localRequested.has(service.service_id) || requestedServices.has(service.service_id);
        const availableServices = filteredServices.filter(s => !isRequested(s));
        const requestedServicesList = filteredServices.filter(isRequested);

        const renderCard = (service: Service) => (
          <TalentCard
            key={service.service_id}
            name={service.user?.name || 'Gig Professional'}
            title={service.title}
            price={service.price}
            rating={service.rating}
            skills={service.skills}
            description={service.description}
            badge="★ Active"
            actions={<>
              <Button variant="outline" size="sm" type="button" onClick={() => setSelectedProfile(service)}>View Profile</Button>
              <Button variant="outline" size="sm" type="button" disabled={isRequested(service)} onClick={() => handleHireClick(service.service_id)}>{isRequested(service) ? 'Requested' : 'Request / Hire'}</Button>
            </>}
          />
        );

        if (filteredServices.length === 0) {
          return (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--spacing-xxl)' }}>
              No talent listings match your search or filters.
            </p>
          );
        }

        return (
          <>
            {/* Talent Grid */}
            <div className="talent-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
              {availableServices.length === 0 ? (
                <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--spacing-xxl)' }}>
                  No available talent listings match your search or filters.
                </p>
              ) : (
                availableServices.map(renderCard)
              )}
            </div>

            {requestedServicesList.length > 0 && (
              <div className="requested-talent-section">
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-dark)', marginBottom: 'var(--spacing-md)' }}>
                  Already Requested ({requestedServicesList.length})
                </h2>
                <div className="talent-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
                  {requestedServicesList.map(renderCard)}
                </div>
              </div>
            )}
          </>
        );
      })()}

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
              className={`talent-banner talent-banner-${getBannerVariant(selectedProfile.service_id)}`}
              style={{
                height: '110px',
                position: 'relative',
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '12px 16px'
              }}
            >
              <Button variant="outline" type="button" onClick={() => setSelectedProfile(null)} title="Close profile" style={{ width: '32px' }}>
                ✕
              </Button>
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
                  <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.95rem' }}>{selectedProfile.rating !== undefined ? `★ ${selectedProfile.rating.toFixed(1)} / 5.0` : 'No reviews yet'}</div>
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
                <Button variant="outline" type="button" onClick={() => setSelectedProfile(null)}>
                  Close
                </Button>
                <Button variant="outline" type="button" disabled={localRequested.has(selectedProfile.service_id) || requestedServices.has(selectedProfile.service_id)} onClick={() => {
                    handleHireClick(selectedProfile.service_id);
                  }}>
                  {localRequested.has(selectedProfile.service_id) || requestedServices.has(selectedProfile.service_id) ? 'Request Already Sent' : 'Request / Hire Professional'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchTalent;
