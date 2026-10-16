import React, { useState, useEffect, useRef } from 'react';
import { useClient } from '../../../context/ClientContext';

export interface PostGigProps {
  onNavigate: (viewId: string) => void;
  params?: Record<string, string>;
}

interface AttachedFile {
  id: string;
  name: string;
  size: number;
}

export const PostGig: React.FC<PostGigProps> = ({ onNavigate, params }) => {
  const { addTask, updateTask, tasks } = useClient();
  const editId = params?.editId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState<number | ''>('');
  const [category, setCategory] = useState('dev');
  const [duration, setDuration] = useState('1-3-months');
  const [pricing, setPricing] = useState('fixed');
  const [skills, setSkills] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editId) {
      const task = tasks.find(t => String(t.task_id) === String(editId));
      if (task) {
        setTitle(task.title || '');
        setDescription(task.description || '');
        setBudget(task.budget ? Number(task.budget) : '');
        setCategory(task.category || 'dev');
        setDuration(task.duration || '1-3-months');
        setSkills(task.skills ? task.skills.join(', ') : '');
      }
    }
  }, [editId, tasks]);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);

    const maxSizeBytes = 25 * 1024 * 1024; // 25 MB
    const newFiles: AttachedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > maxSizeBytes) {
        setUploadError(`"${file.name}" exceeds the maximum allowed size of 25MB.`);
        return;
      }
      newFiles.push({
        id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
      });
    }

    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !budget || Number(budget) <= 0) {
      alert('Please fill out all required fields with valid values');
      return;
    }

    try {
      if (editId) {
        await updateTask(editId, title, description, Number(budget), category, duration, skills);
        alert('Task updated successfully!');
      } else {
        await addTask(title, description, Number(budget), category, duration, skills);
        alert('Task published successfully!');
      }
      onNavigate('dashboard');
    } catch (err) {
      console.error('Save task failed:', err);
      alert(err instanceof Error && err.message ? err.message : 'Failed to save this task. Please try again.');
    }
  };

  return (
    <div className="post-gig-form">
      <h1 className="page-title form-page-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        {editId ? 'Edit Task' : 'Post a Task'}
      </h1>
      <p className="form-page-description" style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-lg)' }}>
        {editId
          ? 'Update the details and scope for your existing task.'
          : 'Describe your project requirements so relevant professionals can discover and apply to your task.'}
      </p>

      <form onSubmit={handleSubmit} id="post-gig-form">
        <div className="form-group">
          <label className="form-label" htmlFor="gig-title">Gig Title</label>
          <input
            maxLength={255}
            type="text"
            id="gig-title"
            className="form-input"
            placeholder="e.g. Need a Senior React Developer for 3 months"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="category">Category</label>
            <select
              id="category"
              className="form-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="design">Design &amp; Creative</option>
              <option value="dev">Software Development</option>
              <option value="writing">Writing &amp; Translation</option>
              <option value="marketing">Digital Marketing</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="duration">Expected Duration</label>
            <select
              id="duration"
              className="form-input"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            >
              <option value="one-time">One-time project</option>
              <option value="less-month">Less than 1 month</option>
              <option value="1-3-months">1 to 3 months</option>
              <option value="3-6-months">3 to 6 months</option>
              <option value="ongoing">Ongoing</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="description">Detailed Description</label>
          <textarea
            maxLength={5000}
            id="description"
            className="form-input"
            rows={6}
            placeholder="Describe the project scope, required skills, and specific deliverables you expect..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Pricing Structure</label>
            <div className="pricing-group" style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: '8px' }}>
              <label className="pricing-option" style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="pricing"
                  value="fixed"
                  checked={pricing === 'fixed'}
                  onChange={() => setPricing('fixed')}
                  required
                />{' '}
                Fixed Budget
              </label>
              <label className="pricing-option" style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="pricing"
                  value="hourly"
                  checked={pricing === 'hourly'}
                  onChange={() => setPricing('hourly')}
                />{' '}
                Hourly Rate
              </label>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="budget">Budget (₹)</label>
            <input
              max="99999999.99"
              type="number"
              id="budget"
              className="form-input"
              placeholder="0.00"
              min="5"
              step="1"
              value={budget}
              onChange={(e) => setBudget(e.target.value === '' ? '' : Number(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Required Skills (Comma separated)</label>
          <input
            maxLength={1000}
            type="text"
            id="skills"
            className="form-input"
            placeholder="e.g. React, Node.js, Typescript"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
        </div>

        {/* Attachments Upload Feature */}
        <div className="form-group">
          <label className="form-label">Attachments (Optional)</label>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <div
            className="file-upload-area"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              borderColor: isDragging ? 'var(--color-primary-blue)' : undefined,
              backgroundColor: isDragging ? 'rgba(191, 105, 0, 0.08)' : undefined,
            }}
          >
            <div className="file-upload-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
              </svg>
            </div>
            <p style={{ margin: '4px 0', fontWeight: 600 }}>Click to browse or drag &amp; drop files</p>
            <span className="file-upload-hint" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              PDF, DOCX, ZIP, PNG, JPG (Max 25MB per file)
            </span>
          </div>

          {uploadError && (
            <div style={{ color: '#d32f2f', fontSize: '0.8rem', marginTop: '6px' }}>
              ⚠️ {uploadError}
            </div>
          )}

          {/* Attached Files List */}
          {attachedFiles.length > 0 && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-dark)' }}>
                Attached Files ({attachedFiles.length}):
              </div>
              {attachedFiles.map(file => (
                <div
                  key={file.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#F5F9FA',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.82rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span style={{ fontSize: '1rem' }}>📎</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-dark)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </span>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                      ({formatFileSize(file.size)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#d32f2f',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: '2px 6px',
                      fontSize: '14px'
                    }}
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xl)' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => onNavigate('dashboard')}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" style={{ border: 'none' }}>
            {editId ? 'Save Changes' : 'Publish Gig'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostGig;
