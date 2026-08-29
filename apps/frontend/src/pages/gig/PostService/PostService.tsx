/**
 * @file PostService.tsx
 * @description
 * Service creation form view for Gig Professionals.
 * Enables posting packaged gig services with pricing, category tags, delivery timeline, and descriptions.
 */

import React, { useState } from 'react';
import { useGig } from '../../../context/GigContext/GigContext';
import gigApi from '../../../services/api/gig/gigApi';
import { ApiError } from '../../../services/api/httpClient';

export const PostService: React.FC = () => {
  const { setActiveTab, triggerRefresh } = useGig();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [delivery, setDelivery] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !price || Number(price) <= 0) {
      setError('Please fill out all required service fields.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const tags = [category, delivery].filter(Boolean);
      await gigApi.postService({
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        tags: tags.length ? tags : ['Web Development'],
        thumbnail: thumbnail.trim() || undefined
      });
      triggerRefresh();
      setActiveTab('service-published');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to publish service.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* Banner */}
      <div className="admin-card" style={{ padding: 'var(--spacing-xl)' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
          Publish a New Service Offering
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
          Create a fixed-price or custom service tier visible to hiring clients and platform managers.
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

      {/* Form Card */}
      <form className="admin-card" style={{ padding: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }} onSubmit={handleSubmit}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
          Service Details & Specifications
        </h2>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: 'var(--spacing-xs)' }}>
            Service Title *
          </label>
          <input
            type="text"
            className="admin-input"
            placeholder="e.g. Full-Stack React & Node.js Web App Development"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: 'var(--spacing-xs)' }}>
              Category / Domain *
            </label>
            <input
              type="text"
              className="admin-input"
              placeholder="e.g. Frontend Development, UI/UX"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: 'var(--spacing-xs)' }}>
              Estimated Delivery Time *
            </label>
            <input
              type="text"
              className="admin-input"
              placeholder="e.g. 5 Days, 2 Weeks"
              value={delivery}
              onChange={(e) => setDelivery(e.target.value)}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: 'var(--spacing-xs)' }}>
              Fixed Price (USD $) *
            </label>
            <input
              type="number"
              className="admin-input"
              placeholder="1200"
              value={price}
              onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
              min={10}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: 'var(--spacing-xs)' }}>
              Thumbnail Image URL (Optional)
            </label>
            <input
              type="url"
              className="admin-input"
              placeholder="https://images.unsplash.com/..."
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: 'var(--spacing-xs)' }}>
            Service Description & Deliverables Scope *
          </label>
          <textarea
            className="admin-textarea"
            rows={5}
            placeholder="Detailed description of what is included, milestone deliverables, technical stack used, and requirements from the client..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)' }}>
          <button
            type="button"
            className="admin-btn admin-btn-outline"
            onClick={() => setActiveTab('dashboard')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Publishing...' : 'Publish Service'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostService;
