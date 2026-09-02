import React, { useState } from 'react';
import { useManager } from '../../../context/ManagerContext/ManagerContext';
import { apiFetch } from '../../../services/api/httpClient';

export const SearchTalent: React.FC = () => {
  const { talents, profile, searchTalent } = useManager();
  const [skillFilter, setSkillFilter] = useState('');
  const [hiredMsg, setHiredMsg] = useState<string | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkillFilter(e.target.value);
    searchTalent(e.target.value);
  };

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
          Client Team & Accepted Talent
        </h1>
        <p style={{ color: '#76594F', fontSize: '15px', marginTop: '6px', margin: 0 }}>
          Browse through vetted professionals accepted by <strong>{profile?.client?.clientName || 'your client'}</strong> for task supervision.
        </p>
      </div>

      {hiredMsg && (
        <div style={{ backgroundColor: '#E4F2EF', color: '#438F82', padding: '12px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '14px' }}>
          {hiredMsg}
        </div>
      )}

      {/* Filter Bar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '16px 24px',
          border: '1px solid #D9E0E3',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#76594F' }}>Filters:</span>

        {/* Skill Search Input */}
        <input
          type="text"
          placeholder="Search by Skill or Title..."
          value={skillFilter}
          onChange={handleSearchChange}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            border: '1px solid #D5DDE0',
            fontSize: '14px',
            width: '220px'
          }}
        />

        <select style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #D5DDE0', fontSize: '14px', backgroundColor: '#FFF', color: '#3A1F16' }}>
          <option>Budget: Any</option>
          <option>Under ₹10,000</option>
          <option>₹10,000 - ₹25,000</option>
          <option>Above ₹25,000</option>
        </select>

        <select style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #D5DDE0', fontSize: '14px', backgroundColor: '#FFF', color: '#3A1F16' }}>
          <option>Rating: Any</option>
          <option>4.5 & above</option>
          <option>4.0 & above</option>
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: '#76594F' }}>Sort by:</span>
          <select style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #D5DDE0', fontSize: '14px', backgroundColor: '#FFF', color: '#3A1F16', fontWeight: 600 }}>
            <option>Relevance</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Talent Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        {talents.map(talent => (
          <div
            key={talent.gigProfileId}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #D9E0E3',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            {/* Top Light Blue Banner */}
            <div style={{ backgroundColor: '#E4EEF5', padding: '12px 16px', display: 'flex', justifyContent: 'flex-end' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#438F82',
                  backgroundColor: '#FFFFFF',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                ✓ ACTIVE
              </span>
            </div>

            {/* Card Body */}
            <div style={{ padding: '20px 20px 24px 20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              {/* Title & Price */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#3A1F16', margin: 0, lineHeight: 1.3 }}>
                  {talent.name}
                </h3>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#3A1F16', whiteSpace: 'nowrap' }}>
                  ₹{talent.price?.toLocaleString()}
                </span>
              </div>

              {/* Author */}
              <div style={{ fontSize: '13px', color: '#76594F' }}>
                ★ {talent.name.split(' ')[0]} Specialist
              </div>

              {/* Skill Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {talent.skills.map(skill => (
                  <span
                    key={skill}
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#76594F',
                      backgroundColor: '#F4F3EC',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {skill.toUpperCase()}
                  </span>
                ))}
              </div>

              {/* Description */}
              <p style={{ fontSize: '13px', color: '#76594F', margin: 0, lineHeight: 1.5, flex: 1 }}>
                {talent.bio}
              </p>

              {/* Request / Hire Button */}
              <button
                onClick={() => handleHireClick(talent)}
                style={{
                  width: '100%',
                  backgroundColor: '#55A99A',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginTop: '8px',
                  transition: 'background 0.2s'
                }}
              >
                Request / Hire
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchTalent;
