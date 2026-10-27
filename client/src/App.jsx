import { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import RatingSection from './components/RatingSection';
import PasskeyModal from './components/PasskeyModal';
import AddProblem from './components/AddProblem';
import { API_BASE } from './api';

const RATINGS_ORDER = [
  800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700,
  1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700,
  2800, 2900, 3000, 3100, 3200, 3300, 3400, 3500,
];

// ─── Toast Component ─────────────────────────────────────────────────────────
const Toast = ({ toasts }) => (
  <div className="toast-container">
    {toasts.map((t) => (
      <div key={t.id} className={`toast toast-${t.type}`}>
        {t.type === 'success' ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
        {t.message}
      </div>
    ))}
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Admin state — passkey persisted in sessionStorage only
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('cp_admin_token') || '');
  const isAdmin = Boolean(adminToken);

  // UI state
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [addProblemRating, setAddProblemRating] = useState(800);
  const [viewMode, setViewMode] = useState('board'); // 'board' (horizontal) or 'grid'

  // Solved state persisted in localStorage
  const [solvedIds, setSolvedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('cp_solved_problems');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  });

  // Filters
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  // Toasts
  const [toasts, setToasts] = useState([]);

  // Horizontal board reference for smooth scrolling
  const boardRef = useRef(null);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  // ─── Fetch problems ─────────────────────────────────────────────────────────
  const fetchProblems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (ratingFilter) params.append('rating', ratingFilter);

      const res = await fetch(`${API_BASE}/problems?${params}`);
      if (!res.ok) throw new Error('Failed to fetch problems.');
      const data = await res.json();
      setProblems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, ratingFilter]);

  useEffect(() => {
    const timeout = setTimeout(fetchProblems, 300);
    return () => clearTimeout(timeout);
  }, [fetchProblems]);

  // ─── Solved Toggle Handler ──────────────────────────────────────────────────
  const handleToggleSolved = (problemId) => {
    setSolvedIds((prev) => {
      const next = new Set(prev);
      const isNowSolved = !next.has(problemId);
      if (isNowSolved) {
        next.add(problemId);
        const prob = problems.find((p) => p._id === problemId);
        showToast(`Marked "${prob?.name || 'Problem'}" as Solved! 🎯`, 'success');
      } else {
        next.delete(problemId);
        showToast('Problem unmarked.', 'success');
      }
      try {
        localStorage.setItem('cp_solved_problems', JSON.stringify([...next]));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // ─── Admin Handlers ─────────────────────────────────────────────────────────
  const handleCreateClick = (targetRating = 800) => {
    setAddProblemRating(targetRating);
    if (isAdmin) {
      setEditingProblem(null);
      setShowForm(true);
    } else {
      setShowPasskeyModal(true);
    }
  };

  const handlePasskeySuccess = (token, isFirstTime = false) => {
    setAdminToken(token);
    setShowPasskeyModal(false);
    setEditingProblem(null);
    setShowForm(true);
    showToast(
      isFirstTime
        ? 'Passkey saved to MongoDB! Setup permanently locked.'
        : 'Admin access granted. Welcome, Bhargav!',
      'success'
    );
  };

  const handleLogout = () => {
    sessionStorage.removeItem('cp_admin_token');
    setAdminToken('');
    setShowForm(false);
    setEditingProblem(null);
    showToast('Logged out of admin session.', 'success');
  };

  const handleEdit = (problem) => {
    setEditingProblem(problem);
    setAddProblemRating(problem.rating);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/problems/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error('Delete failed.');
      setProblems((prev) => prev.filter((p) => p._id !== id));
      // Clean up from solved if present
      setSolvedIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        localStorage.setItem('cp_solved_problems', JSON.stringify([...next]));
        return next;
      });
      showToast('Problem deleted.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSave = (saved, isUpdate) => {
    if (isUpdate) {
      setProblems((prev) => prev.map((p) => (p._id === saved._id ? saved : p)));
    } else {
      setProblems((prev) => [...prev, saved]);
    }
    setShowForm(false);
    setEditingProblem(null);
  };

  // ─── Group problems by rating ───────────────────────────────────────────────
  const ratingMap = {};
  problems.forEach((p) => {
    if (!ratingMap[p.rating]) ratingMap[p.rating] = [];
    ratingMap[p.rating].push(p);
  });

  // Calculate highest rating that exists
  const highestProblemRating = problems.length
    ? Math.max(...problems.map((p) => p.rating))
    : 1500;

  // Horizontal Ladder: 800, 900, 1000, 1100, 1200, 1300, 1400, 1500...
  const boardLadder = RATINGS_ORDER.filter(
    (r) => r <= Math.max(2000, highestProblemRating) || (ratingMap[r] && ratingMap[r].length > 0)
  );

  const displayRatings = ratingFilter
    ? [Number(ratingFilter)]
    : search
      ? RATINGS_ORDER.filter((r) => ratingMap[r] && ratingMap[r].length > 0)
      : boardLadder;

  const totalProblems = problems.length;
  const solvedCount = problems.filter((p) => solvedIds.has(p._id)).length;
  const uniqueRatings = Object.keys(ratingMap).length;
  const uniqueTags = [...new Set(problems.flatMap((p) => p.tags))].length;
  const solvedPercentage = totalProblems > 0 ? Math.round((solvedCount / totalProblems) * 100) : 0;

  // Horizontal Board scroll helpers
  const scrollBoard = (offset) => {
    if (boardRef.current) {
      boardRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const scrollToRating = (rating) => {
    const el = document.getElementById(`section-${rating}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }
  };

  return (
    <>
      {/* Navbar */}
      <Navbar isAdmin={isAdmin} onCreateClick={() => handleCreateClick(800)} onLogout={handleLogout} />

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Competitive Programming Ladder
        </div>
        <h1>Practice. Improve. Repeat.</h1>
        <p>Curated Codeforces problem ladder with horizontal 800, 900, 1000… rating sections and solved question marking.</p>
      </section>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-value">{totalProblems}</div>
          <div className="stat-label">Total Problems</div>
        </div>
        <div className="stat-item stat-item-highlight">
          <div className="stat-value">
            {solvedCount} <span className="stat-sub">/ {totalProblems}</span>
          </div>
          <div className="stat-label">Solved ({solvedPercentage}%)</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{uniqueRatings}</div>
          <div className="stat-label">Active Ratings</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{uniqueTags}</div>
          <div className="stat-label">Tags</div>
        </div>
      </div>

      {/* Filter Bar with Horizontal Controls */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="search-problems"
            className="search-input"
            type="text"
            placeholder="Search problems or tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          id="filter-rating"
          className="filter-select"
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
        >
          <option value="">All Ratings (800 - 3500)</option>
          {RATINGS_ORDER.map((r) => (
            <option key={r} value={r}>Rating {r} {ratingMap[r] ? `(${ratingMap[r].length})` : ''}</option>
          ))}
        </select>

        {/* View Mode Switcher */}
        <div className="view-mode-toggle" role="group" aria-label="Layout mode">
          <button
            type="button"
            className={`view-mode-btn ${viewMode === 'board' ? 'active' : ''}`}
            onClick={() => setViewMode('board')}
            title="Horizontal Board view (800, 900, 1000... aligned horizontally)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="5" height="18" rx="1" />
              <rect x="10" y="3" width="5" height="18" rx="1" />
              <rect x="17" y="3" width="5" height="18" rx="1" />
            </svg>
            Horizontal Board
          </button>
          <button
            type="button"
            className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid List view"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Grid
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content">
        {/* Admin Form */}
        {isAdmin && showForm && (
          <AddProblem
            adminToken={adminToken}
            editingProblem={editingProblem}
            initialRating={addProblemRating}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingProblem(null); }}
            showToast={showToast}
          />
        )}

        {/* Loading */}
        {loading && (
          <div className="loading-container">
            <div className="spinner" />
            <span className="loading-text">Loading problem set…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <h3>Could not load problems</h3>
            <p>{error}</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={fetchProblems}>
              Retry
            </button>
          </div>
        )}

        {/* Problem Board Layout */}
        {!loading && !error && (
          <>
            {displayRatings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h3>No problems found</h3>
                <p>
                  {search
                    ? `No matches for "${search}". Try a different keyword or tag.`
                    : 'No problems added yet. Click Create to get started!'}
                </p>
              </div>
            ) : viewMode === 'board' ? (
              <div className="ratings-horizontal-board-wrapper">
                {/* Horizontal Quick Jump Navigation Strip */}
                <div className="ratings-nav-bar">
                  <button
                    type="button"
                    className="board-scroll-btn"
                    onClick={() => scrollBoard(-450)}
                    title="Scroll left"
                    aria-label="Scroll left"
                  >
                    ‹
                  </button>

                  <div className="ratings-nav-pills">
                    {displayRatings.map((r) => {
                      const count = ratingMap[r]?.length || 0;
                      const solvedInR = (ratingMap[r] || []).filter((p) => solvedIds.has(p._id)).length;
                      return (
                        <button
                          key={r}
                          type="button"
                          className="rating-nav-pill"
                          onClick={() => scrollToRating(r)}
                          title={`Jump to Rating ${r} (${count} problems)`}
                        >
                          <span className="pill-rating">{r}</span>
                          {count > 0 && (
                            <span className={`pill-count ${solvedInR === count ? 'all-solved' : ''}`}>
                              {solvedInR}/{count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    className="board-scroll-btn"
                    onClick={() => scrollBoard(450)}
                    title="Scroll right"
                    aria-label="Scroll right"
                  >
                    ›
                  </button>
                </div>

                {/* ─── Horizontal Sections Block Row (800, 900, 1000... horizontally aligned) ─── */}
                <div className="ratings-board" ref={boardRef}>
                  {displayRatings.map((rating) => (
                    <RatingSection
                      key={rating}
                      rating={rating}
                      problems={ratingMap[rating] || []}
                      isAdmin={isAdmin}
                      solvedSet={solvedIds}
                      onToggleSolved={handleToggleSolved}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onAddProblemForRating={(r) => handleCreateClick(r)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* Grid view fallback */
              <div className="ratings-grid-view">
                {displayRatings.map((rating) => (
                  <RatingSection
                    key={rating}
                    rating={rating}
                    problems={ratingMap[rating] || []}
                    isAdmin={isAdmin}
                    solvedSet={solvedIds}
                    onToggleSolved={handleToggleSolved}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddProblemForRating={(r) => handleCreateClick(r)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        © <span>Bhargav Dubey</span> — Codeforces Practice Sheet & Ladder
      </footer>

      {/* Passkey Modal */}
      {showPasskeyModal && (
        <PasskeyModal
          onSuccess={handlePasskeySuccess}
          onClose={() => setShowPasskeyModal(false)}
        />
      )}

      {/* Toasts */}
      <Toast toasts={toasts} />
    </>
  );
}

export default App;

