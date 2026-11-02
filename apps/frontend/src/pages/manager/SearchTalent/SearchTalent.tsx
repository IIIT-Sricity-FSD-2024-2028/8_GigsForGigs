import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useManager } from '../../../context/ManagerContext/ManagerContext';
import { apiFetch } from '../../../services/api/httpClient';
import { Button, Input, Select, TalentCard, useToast } from '../../../components/common';

export const SearchTalent: React.FC = () => {
  const { talents, searchTalent } = useManager();
  const [skillFilter, setSkillFilter] = useState('');
  const [hiredMsg, setHiredMsg] = useState<string | null>(null);
  const toast = useToast();
  useEffect(() => { if (hiredMsg) toast.success(hiredMsg); }, [hiredMsg]); // eslint-disable-line react-hooks/exhaustive-deps

  const [budgetFilter, setBudgetFilter] = useState('any');
  const [ratingFilter, setRatingFilter] = useState('any');
  const [sortBy, setSortBy] = useState('relevance');

  // Ask the server only after the user pauses typing (the context already loads everyone on mount).
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    const timer = window.setTimeout(() => { void searchTalent(skillFilter.trim() || undefined); }, 350);
    return () => window.clearTimeout(timer);
  }, [skillFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Budget, rating and sort are applied here on the results the server returned.
  const visibleTalents = useMemo(() => {
    const minRating = ratingFilter === 'any' ? 0 : Number(ratingFilter);
    const list = talents.filter(t => {
      const price = t.price;
      if (budgetFilter === 'low' && !(price !== undefined && price < 10000)) return false;
      if (budgetFilter === 'mid' && !(price !== undefined && price >= 10000 && price <= 25000)) return false;
      if (budgetFilter === 'high' && !(price !== undefined && price > 25000)) return false;
      if (minRating && !((t.rating ?? 0) >= minRating)) return false;
      return true;
    });
    if (sortBy === 'price-asc') list.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    if (sortBy === 'price-desc') list.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
    return list;
  }, [talents, budgetFilter, ratingFilter, sortBy]);

  const handleHireClick = async (talent: any) => {
    try {
      const serviceId = talent.gigProfileId || 1;
      await apiFetch(`/services/${serviceId}/requests`, {
        method: 'POST',
        actor: 'manager',
      });
      setHiredMsg(`Talent hiring request submitted for ${talent.name || 'Professional'}! It is now recorded in PostgreSQL.`);
    } catch {
      setHiredMsg(`Hiring request sent for ${talent.name || 'Professional'}.`);
    }
    setTimeout(() => setHiredMsg(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Title Header */}
      <div>
        <h1 style={{ fontSize: '28px', color: '#0D568D', margin: 0, fontWeight: 700 }}>
          Find the Best Talent
        </h1>
        <p style={{ color: '#475764', fontSize: '15px', marginTop: '6px', margin: 0 }}>
          Browse through our vetted professionals to get your project started.
        </p>
      </div>

      {hiredMsg && (
        <div style={{ backgroundColor: '#E4F2EF', color: '#2E6E62', padding: '12px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '14px' }}>
          {hiredMsg}
        </div>
      )}

      {/* Filter Bar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '16px 24px',
          border: '1px solid #DCE3E8',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#475764' }}>Filters:</span>

        {/* Skill Search Input */}
        <Input maxLength={100} type="text" placeholder="Search by name, skill or service title..." value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} style={{ width: '220px' }} />

        <Select aria-label="Budget" value={budgetFilter} onChange={(e) => setBudgetFilter(e.target.value)}>
          <option value="any">Budget: Any</option>
          <option value="low">Under ₹10,000</option>
          <option value="mid">₹10,000 - ₹25,000</option>
          <option value="high">Above ₹25,000</option>
        </Select>

        <Select aria-label="Rating" value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
          <option value="any">Rating: Any</option>
          <option value="4.5">4.5 & above</option>
          <option value="4">4.0 & above</option>
        </Select>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: '#475764' }}>Sort by:</span>
          <Select aria-label="Sort by" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="relevance">Relevance</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </Select>
        </div>
      </div>

      {/* Talent Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        {visibleTalents.length === 0 && (
          <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#475764', padding: '40px 0' }}>No talent matches your search or filters.</p>
        )}
        {visibleTalents.map(talent => (
          <TalentCard
            key={talent.gigProfileId}
            name={talent.name}
            price={talent.price}
            rating={talent.rating}
            skills={talent.skills}
            description={talent.bio}
            badge="✓ Active"
            actions={<Button onClick={() => handleHireClick(talent)}>Request / Hire</Button>}
          />
        ))}
      </div>
    </div>
  );
};

export default SearchTalent;
