import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const RATINGS = [800,900,1000,1100,1200,1300,1400,1500,1600,1700,1800,1900,2000,2100,2200,2300,2400,2500,2600,2700,2800,2900,3000,3100,3200,3300,3400,3500];

const COMMON_TAGS = [
  'math','implementation','greedy','dp','data structures','brute force',
  'constructive algorithms','graphs','sortings','binary search','dfs and similar',
  'trees','strings','number theory','combinatorics','two pointers','bitmasks',
  'geometry','shortest paths','hashing',
];

// Form panel for adding or editing a Codeforces problem.
const AddProblem = ({ adminToken, editingProblem, initialRating = 800, onSave, onCancel, showToast }) => {
  const isEditing = Boolean(editingProblem);

  const [form, setForm] = useState({
    name: '',
    url: '',
    rating: initialRating || 800,
    tags: '',
  });
  const [loading, setLoading] = useState(false);

  // Populate form when editing or setting initial rating
  useEffect(() => {
    if (editingProblem) {
      setForm({
        name: editingProblem.name,
        url: editingProblem.url,
        rating: editingProblem.rating,
        tags: editingProblem.tags?.join(', ') || '',
      });
    } else {
      setForm({ name: '', url: '', rating: initialRating || 800, tags: '' });
    }
  }, [editingProblem, initialRating]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const addTag = (tag) => {
    setForm((prev) => {
      const current = prev.tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (!current.includes(tag)) {
        return { ...prev, tags: [...current, tag].join(', ') };
      }
      return prev;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) {
      showToast('Name and URL are required.', 'error');
      return;
    }

    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      name: form.name.trim(),
      url: form.url.trim(),
      rating: Number(form.rating),
      tags,
    };

    setLoading(true);

    try {
      const url = isEditing
        ? `${API_BASE}/problems/${editingProblem._id}`
        : `${API_BASE}/problems`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Request failed');
      }

      const saved = await res.json();
      showToast(isEditing ? 'Problem updated!' : 'Problem added!', 'success');
      onSave(saved, isEditing);
    } catch (err) {
      showToast(err.message || 'Something went wrong.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <div className="admin-panel-title">
          {isEditing ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit <span>Problem</span>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              Add <span>Problem</span>
            </>
          )}
        </div>
        <button className="btn btn-ghost btn-icon" onClick={onCancel} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Problem Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="prob-name">Problem Name</label>
            <input
              id="prob-name"
              className="form-input"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Watermelon"
              required
            />
          </div>

          {/* Rating */}
          <div className="form-group">
            <label className="form-label" htmlFor="prob-rating">Rating</label>
            <select
              id="prob-rating"
              className="form-select"
              name="rating"
              value={form.rating}
              onChange={handleChange}
            >
              {RATINGS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Codeforces URL */}
          <div className="form-group full-width">
            <label className="form-label" htmlFor="prob-url">Codeforces URL</label>
            <input
              id="prob-url"
              className="form-input"
              name="url"
              type="url"
              value={form.url}
              onChange={handleChange}
              placeholder="https://codeforces.com/problemset/problem/4/A"
              required
            />
          </div>

          {/* Tags */}
          <div className="form-group full-width">
            <label className="form-label" htmlFor="prob-tags">Tags (comma separated)</label>
            <input
              id="prob-tags"
              className="form-input"
              name="tags"
              type="text"
              value={form.tags}
              onChange={handleChange}
              placeholder="e.g. math, greedy, dp"
            />
            {/* Quick tag chips */}
            <div className="problem-tags" style={{ marginTop: 8 }}>
              {COMMON_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="tag"
                  style={{ cursor: 'pointer', background: 'none', border: '1px solid rgba(108,99,255,0.25)' }}
                  onClick={() => addTag(tag)}
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            Cancel
          </button>
          <button id="save-problem-btn" type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving…' : isEditing ? 'Update Problem' : 'Add Problem'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProblem;
