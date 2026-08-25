import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';

export interface ClientProfileCompletionProps {
  onNavigate: (viewId: string) => void;
}

export const ClientProfileCompletion: React.FC<ClientProfileCompletionProps> = ({ onNavigate }) => {
  const { user, updateUserSession } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [companySize, setCompanySize] = useState('1-10');
  const [founded, setFounded] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !industry) {
      alert('Please fill out all required fields.');
      return;
    }

    // Call update session / api endpoints (matching contract: POST /api/clients/{clientId}/profile)
    updateUserSession({
      name: companyName,
      email: user?.email || 'client@gigsforgigs.com',
    });

    alert('Profile completed successfully!');
    onNavigate('profile-selection');
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-light)', minHeight: '100vh', width: '100%', paddingBottom: 'var(--spacing-xxl)' }}>
      {/* Header */}
      <header className="header" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-white)', padding: 'var(--spacing-md) 0' }}>
        <div className="container header-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto', padding: '0 var(--spacing-lg)' }}>
          <a href="#home" onClick={(e) => { e.preventDefault(); onNavigate('profile-selection'); }} className="logo" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary-blue)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', textDecoration: 'none' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--color-primary-dark)"><circle cx="12" cy="12" r="10"/></svg>
            GigsForGigs
          </a>
        </div>
      </header>

      <main className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 var(--spacing-lg)' }}>
        <div className="form-page-container" style={{ maxWidth: '800px', margin: '40px auto', padding: 'var(--spacing-xxl)', backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)' }}>
          <h1 className="form-section-title" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-md)', paddingBottom: 'var(--spacing-sm)', borderBottom: '2px solid var(--color-bg-light)' }}>
            Complete your Client Profile
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-xxl)' }}>Tell us about your organization so we can help you hire the right talent.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-row" style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
              <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                <label className="form-label" htmlFor="company-name" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-dark)' }}>
                  Company Name *
                </label>
                <input
                  type="text"
                  id="company-name"
                  className="form-input"
                  placeholder="Acme Inc."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                <label className="form-label" htmlFor="industry" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-dark)' }}>
                  Industry *
                </label>
                <select
                  id="industry"
                  className="form-input"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  required
                >
                  <option value="" disabled>Select an industry...</option>
                  <option value="tech">Technology / Software</option>
                  <option value="marketing">Marketing / Agency</option>
                  <option value="finance">Finance</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-md)' }}>
              <label className="form-label" htmlFor="website" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-dark)' }}>
                Company Website
              </label>
              <input
                type="url"
                id="website"
                className="form-input"
                placeholder="https://www.example.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div className="form-row" style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
              <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                <label className="form-label" htmlFor="company-size" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-dark)' }}>
                  Company Size
                </label>
                <select
                  id="company-size"
                  className="form-input"
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                >
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="200+">200+ employees</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                <label className="form-label" htmlFor="founded" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-dark)' }}>
                  Year Founded
                </label>
                <input
                  type="number"
                  id="founded"
                  className="form-input"
                  placeholder="2020"
                  value={founded}
                  onChange={(e) => setFounded(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
              <label className="form-label">Company Logo</label>
              <div className="file-upload-area">
                <div className="file-upload-icon">+</div>
                <p>Click to upload or drag and drop</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>SVG, PNG, JPG (max. 5MB)</span>
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-md)' }}>
              <label className="form-label" htmlFor="desc" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-dark)' }}>
                Company Description
              </label>
              <textarea
                id="desc"
                className="form-input"
                rows={5}
                placeholder="What does your company do?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xxl)' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ textDecoration: 'none' }}
                onClick={() => onNavigate('profile-selection')}
              >
                Back
              </button>
              <button type="submit" className="btn btn-primary">Complete Profile</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ClientProfileCompletion;
