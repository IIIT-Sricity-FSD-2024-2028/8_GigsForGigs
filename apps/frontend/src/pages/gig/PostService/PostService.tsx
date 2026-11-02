/**
 * @file PostService.tsx
 * @description
 * Service creation form view for Gig Professionals.
 * Enables posting packaged gig services with pricing, category tags, delivery timeline, and descriptions.
 */

import React, { useEffect, useState } from 'react';
import { useGig } from '../../../context/GigContext/GigContext';
import gigApi from '../../../services/api/gig/gigApi';
import { ApiError } from '../../../services/api/httpClient';
import { Button, Input, Select, TextArea, useToast } from '../../../components/common';

/** Same keys as task categories (PostGig) so client-side category filters line up. */
const SERVICE_CATEGORIES = [
  { value: 'design', label: 'Design & Creative' },
  { value: 'dev', label: 'Software Development' },
  { value: 'writing', label: 'Writing & Translation' },
  { value: 'marketing', label: 'Digital Marketing' }
];

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
  const toast = useToast();
  useEffect(() => { if (error) toast.error(error); }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !price || Number(price) <= 0) {
      setError('Please fill out all required service fields.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const categoryLabel = SERVICE_CATEGORIES.find(c => c.value === category)?.label;
      const tags = [categoryLabel, delivery].filter((t): t is string => !!t);
      await gigApi.postService({
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        tags: tags.length ? tags : ['Web Development'],
        category,
        thumbnail: thumbnail.trim() || undefined
      });
      triggerRefresh();
      setActiveTab('my-services');
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
          <Input className="admin-input" maxLength={255} type="text" placeholder="e.g. Full-Stack React & Node.js Web App Development" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: 'var(--spacing-xs)' }}>
              Category / Domain *
            </label>
            <Select className="admin-input" value={category} onChange={(e) => setCategory(e.target.value)} required>
              <option value="" disabled>Select a category</option>
              {SERVICE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
          </div>

          <div>
            <label htmlFor="service-delivery" style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: 'var(--spacing-xs)' }}>
              Estimated Delivery Time *
            </label>
            <Select className="admin-input" id="service-delivery" value={delivery} onChange={(e) => setDelivery(e.target.value)} required>
              <option value="" disabled>Select expected duration</option>
              <option value="less-month">Less than 1 month</option>
              <option value="1-3-months">1 to 3 months</option>
              <option value="3-6-months">3 to 6 months</option>
            </Select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: 'var(--spacing-xs)' }}>
              Fixed Price (INR ₹) *
            </label>
            <Input className="admin-input" max="99999999.99" step="0.01" type="number" placeholder="1200" value={price} onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')} min={10} required />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: 'var(--spacing-xs)' }}>
              Thumbnail Image URL (Optional)
            </label>
            <Input className="admin-input" maxLength={500} type="url" placeholder="https://images.unsplash.com/..." value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: 'var(--spacing-xs)' }}>
            Service Description & Deliverables Scope *
          </label>
          <TextArea className="admin-textarea" maxLength={5000} rows={5} placeholder="Detailed description of what is included, milestone deliverables, technical stack used, and requirements from the client..." value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)' }}>
          <Button variant="outline" type="button" onClick={() => setActiveTab('dashboard')}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Publishing...' : 'Publish Service'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PostService;
