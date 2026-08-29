import React, { useState, useEffect } from 'react';
import { useClient } from '../../../context/ClientContext';

// Props received from the parent component.
// onNavigate is a callback function supplied by the parent for navigation.
// params contains optional parameters such as editId when editing an existing task.
export interface PostGigProps {
  onNavigate: (viewId: string) => void;
  params?: Record<string, string>;
}
// Destructure the props passed by the parent component.
// onNavigate -> callback from parent
// params -> optional data from parent
export const PostGig: React.FC<PostGigProps> = ({ onNavigate, params }) => {
// Access shared task data and task operations from ClientContext.
// tasks -> shared task data
// addTask -> creates a new task
// updateTask -> updates an existing task
  const { addTask, updateTask, tasks } = useClient();
  // params is a prop received from the parent.
// editId is extracted to determine whether this page is being
// used to create a new task or edit an existing task.
  const editId = params?.editId;
// Local state stores the values entered in the form.
// These values belong to the PostGig component.
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState<number | ''>('');
  const [category, setCategory] = useState('dev');
  const [duration, setDuration] = useState('1-3-months');
  const [pricing, setPricing] = useState('fixed');
  const [skills, setSkills] = useState('');

  useEffect(() => {
    if (editId) {
      const task = tasks.find(t => t.task_id === editId);
      if (task) {
        setTitle(task.title);
        setDescription(task.description);
        setBudget(task.budget);
        setCategory(task.category || 'dev');
        setDuration(task.duration || '1-3-months');
        setSkills(task.skills ? task.skills.join(', ') : '');
      }
    }
  }, [editId, tasks]);

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
// Callback received from the parent.
// Calling onNavigate() sends an event/message from this child component
// back to the parent, asking it to navigate to the dashboard.
      onNavigate('dashboard');
    } catch (err) {
      console.error('Save task failed:', err);
      alert('Failed to save this task. Please try again.');
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
        Describe your project requirements so relevant professionals can discover and apply to your task.
      </p>

      <form onSubmit={handleSubmit} id="post-gig-form">
        
        <div className="form-group">
          <label className="form-label" htmlFor="gig-title">Gig Title</label>
          <input
            type="text"
            id="gig-title"
            className="form-input"
              // Updates the local title state whenever the user types.
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
            type="text"
            id="skills"
            className="form-input"
            placeholder="e.g. React, Node.js, Typescript"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Attachments (Optional)</label>
          <div className="file-upload-area" onClick={() => alert('Mock file upload triggered.')}>
            <div className="file-upload-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
              </svg>
            </div>
            <p>Upload project briefs or brand guidelines</p>
            <span className="file-upload-hint" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>PDF, DOCX, ZIP (Max 25MB)</span>
          </div>
        </div>

        <div className="form-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xl)' }}>
          <button
            type="button"
            className="btn btn-outline"
// Child-to-parent communication using the callback prop.
  // The child does not perform navigation directly;
  // it calls the parent's navigation function.
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
