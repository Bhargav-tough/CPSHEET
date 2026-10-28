import { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from './components/Navbar';
import ProblemListBlock from './components/ProblemListBlock';
import PasskeyModal from './components/PasskeyModal';
import UserAuthModal from './components/UserAuthModal';
import AddProblem from './components/AddProblem';
import { API_BASE, authApi } from './api';
import { getRatingClass } from './utils/rating';

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

  // User state (stored in MongoDB)
  const [userToken, setUserToken] = useState(() => localStorage.getItem('cp_user_token') || '');
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [authPromptMessage, setAuthPromptMessage] = useState('');

  // Admin state — passkey persisted in sessionStorage only
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('cp_admin_token') || '');
  const isAdmin = Boolean(adminToken);
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [addProblemRating, setAddProblemRating] = useState(800);

  // Solved state Set (synced with MongoDB when user is logged in)
  const [solvedIds, setSolvedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('cp_solved_problems');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  });

  // Active Rating Tab ('all' or a specific rating number like '800')
  const [activeRatingTab, setActiveRatingTab] = useState('all');

  // Search & Tag Filter
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // Toasts
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  // ─── Restore User Session on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!userToken) return;
    authApi
      .getMe(userToken)
      .then((data) => {
        setUser(data.user);
        if (Array.isArray(data.user.solvedProblems)) {
          const remoteSolved = new Set(data.user.solvedProblems.map((id) => id.toString()));
          setSolvedIds(remoteSolved);
          localStorage.setItem('cp_solved_problems', JSON.stringify([...remoteSolved]));
        }
      })
      .catch(() => {
        localStorage.removeItem('cp_user_token');
        setUserToken('');
        setUser(null);
      });
  }, [userToken]);

  // ─── Fetch problems ─────────────────────────────────────────────────────────
  const fetchProblems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/problems`);
      if (!res.ok) throw new Error('Failed to fetch problems.');
      const data = await res.json();
      setProblems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  // ─── Solved Toggle Handler (Synced to MongoDB) ──────────────────────────────
  const handleToggleSolved = async (problemId) => {
    if (!userToken) {
      // Prompt user to sign in or register so their progress is saved to MongoDB
      setAuthModalMode('login');
      setAuthPromptMessage('Sign in or create an account to save your solved questions to MongoDB across all devices!');
      setShowAuthModal(true);

      // Temporary local toggle for guest convenience
      setSolvedIds((prev) => {
        const next = new Set(prev);
        if (next.has(problemId)) next.delete(problemId);
        else next.add(problemId);
        try {
          localStorage.setItem('cp_solved_problems', JSON.stringify([...next]));
        } catch (e) {
          console.error(e);
        }
        return next;
      });
      return;
    }

    // Authenticated user: update in MongoDB
    try {
      const data = await authApi.toggleSolve(userToken, problemId);
      const updatedSet = new Set(data.solvedProblems.map((id) => id.toString()));
      setSolvedIds(updatedSet);
      localStorage.setItem('cp_solved_problems', JSON.stringify([...updatedSet]));

      const prob = problems.find((p) => p._id === problemId);
      const name = prob?.name || 'Problem';
      if (data.isSolved) {
        showToast(`Marked "${name}" as Solved! 🎯 Synced to MongoDB.`, 'success');
      } else {
        showToast(`Unmarked "${name}". Synced to MongoDB.`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to update solved status', 'error');
    }
  };

  // ─── User Authentication Handlers ───────────────────────────────────────────
  const handleAuthSuccess = async (authData) => {
    setUserToken(authData.token);
    setUser(authData.user);
    localStorage.setItem('cp_user_token', authData.token);
    setShowAuthModal(false);

    // Sync any previously saved local solved problems with MongoDB
    const localArray = Array.from(solvedIds);
    if (localArray.length > 0) {
      try {
        const synced = await authApi.syncSolved(authData.token, localArray);
        const nextSet = new Set(synced.solvedProblems.map((id) => id.toString()));
        setSolvedIds(nextSet);
        localStorage.setItem('cp_solved_problems', JSON.stringify([...nextSet]));
      } catch (e) {
        console.error('Failed to sync local progress:', e);
      }
    } else if (authData.user.solvedProblems) {
      const nextSet = new Set(authData.user.solvedProblems.map((id) => id.toString()));
      setSolvedIds(nextSet);
      localStorage.setItem('cp_solved_problems', JSON.stringify([...nextSet]));
    }

    showToast(`Welcome, @${authData.user.username}! Your progress is synced to MongoDB.`, 'success');
  };

  const handleUserLogout = () => {
    localStorage.removeItem('cp_user_token');
    setUserToken('');
    setUser(null);
    showToast('Signed out. Future progress will only be stored locally.', 'success');
  };

  // ─── Admin Handlers ─────────────────────────────────────────────────────────
  const handleCreateClick = (targetRating = 800) => {
    setAddProblemRating(targetRating);
    if (isAdmin) {
      setEditingProblem(null);
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
        ? 'Admin passkey initialized in MongoDB! Setup locked.'
        : 'Admin session unlocked. Welcome!',
      'success'
    );
  };

  const handleAdminLogout = () => {
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
      setSolvedIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        localStorage.setItem('cp_solved_problems', JSON.stringify([...next]));
        return next;
      });
      showToast('Problem deleted successfully.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSave = (savedProblem, isEdit) => {
    if (isEdit) {
      setProblems((prev) =>
        prev.map((p) => (p._id === savedProblem._id ? savedProblem : p))
      );
      showToast('Problem updated!', 'success');
    } else {
      setProblems((prev) => [savedProblem, ...prev]);
      showToast('New problem added!', 'success');
      // If we added a problem for a specific rating, switch tab to view it
      if (savedProblem.rating) {
        setActiveRatingTab(String(savedProblem.rating));
      }
    }
    setShowForm(false);
    setEditingProblem(null);
  };

  // ─── Rating Stats & Tabs Computation ────────────────────────────────────────
  const ratingMap = useMemo(() => {
    const map = {};
    for (const p of problems) {
      const r = p.rating || 800;
      if (!map[r]) map[r] = [];
      map[r].push(p);
    }
    return map;
  }, [problems]);

  // All distinct ratings found in problems plus standard tiers that have problems
  const availableRatings = useMemo(() => {
    const fromProblems = Object.keys(ratingMap).map(Number);
    const combined = Array.from(new Set([...RATINGS_ORDER.filter((r) => ratingMap[r]?.length > 0), ...fromProblems]));
    return combined.sort((a, b) => a - b);
  }, [ratingMap]);

  // All distinct tags for quick filter
  const allTags = useMemo(() => {
    const tags = new Set();
    for (const p of problems) {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => tags.add(t));
      }
    }
    return Array.from(tags).sort();
  }, [problems]);

  // Filtered problems for the active tab + search + tag filter
  const displayedProblems = useMemo(() => {
    let list = problems;

    // Filter by active tab
    if (activeRatingTab !== 'all') {
      const targetRating = Number(activeRatingTab);
      list = list.filter((p) => p.rating === targetRating);
    }

    // Filter by search query
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => {
        const matchesName = p.name?.toLowerCase().includes(q);
        const matchesRating = String(p.rating).includes(q);
        const matchesTag = p.tags?.some((t) => t.toLowerCase().includes(q));
        return matchesName || matchesRating || matchesTag;
      });
    }

    // Filter by selected tag
    if (selectedTag) {
      list = list.filter((p) => p.tags?.includes(selectedTag));
    }

    return list;
  }, [problems, activeRatingTab, search, selectedTag]);

  // Overall stats
  const totalProblems = problems.length;
  const solvedCount = problems.filter((p) => solvedIds.has(p._id)).length;
  const solvedPercentage = totalProblems > 0 ? Math.round((solvedCount / totalProblems) * 100) : 0;

  return (
    <>
      {/* Navbar with User Auth & Admin Controls */}
      <Navbar
        user={user}
        solvedCount={solvedCount}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode);
          setAuthPromptMessage('');
          setShowAuthModal(true);
        }}
        onUserLogout={handleUserLogout}
        isAdmin={isAdmin}
        onCreateClick={() => handleCreateClick(activeRatingTab === 'all' ? 800 : Number(activeRatingTab))}
        onAdminLogout={handleAdminLogout}
      />

      {/* Hero Header */}
      <section className="hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Codeforces Ladder & Sheet
        </div>
        <h1>Practice. Improve. Repeat.</h1>
        <p>
          Curated Codeforces problem sets categorized by rating. Sign in to sync your solved questions across devices.
        </p>
      </section>

      {/* Global Stats Bar */}
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
          <div className="stat-value">{availableRatings.length}</div>
          <div className="stat-label">Active Ratings</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{allTags.length}</div>
          <div className="stat-label">Problem Tags</div>
        </div>
      </div>

      {/* Main Container */}
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

        {/* Search & Tag Filter Bar */}
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
              placeholder="Search problem title or tags…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearch('')}
                title="Clear search"
              >
                &times;
              </button>
            )}
          </div>

          {allTags.length > 0 && (
            <select
              className="filter-select"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
            >
              <option value="">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* ─── RATING TABS BAR (Horizontal tabs of ratings) ─── */}
        <div className="rating-tabs-container">
          <div className="rating-tabs-header-label">Rating Tabs:</div>
          <div className="rating-tabs-list" role="tablist">
            {/* 'All' Tab */}
            <button
              type="button"
              role="tab"
              aria-selected={activeRatingTab === 'all'}
              className={`rating-tab-btn ${activeRatingTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveRatingTab('all')}
            >
              <span className="tab-rating-label">All</span>
              <span className="tab-count-badge">{totalProblems}</span>
            </button>

            {/* Individual Rating Tabs (800, 900, 1000...) */}
            {availableRatings.map((rating) => {
              const ratingClass = getRatingClass(rating);
              const count = ratingMap[rating]?.length || 0;
              const solvedInRating = (ratingMap[rating] || []).filter((p) => solvedIds.has(p._id)).length;
              const isAllSolvedInRating = count > 0 && solvedInRating === count;

              return (
                <button
                  key={rating}
                  type="button"
                  role="tab"
                  aria-selected={activeRatingTab === String(rating)}
                  className={`rating-tab-btn ${ratingClass} ${activeRatingTab === String(rating) ? 'active' : ''}`}
                  onClick={() => setActiveRatingTab(String(rating))}
                >
                  <span className="tab-rating-label">{rating}</span>
                  <span className={`tab-count-badge ${isAllSolvedInRating ? 'all-solved' : ''}`}>
                    {solvedInRating > 0 ? `${solvedInRating}/${count}` : count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="loading-container">
            <div className="spinner" />
            <span className="loading-text">Loading problem set…</span>
          </div>
        )}

        {/* Error Alert */}
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

        {/* ─── LIST-WISE QUESTION VIEW COVERING THE BLOCK ─── */}
        {!loading && !error && (
          <ProblemListBlock
            activeRating={activeRatingTab}
            problems={displayedProblems}
            solvedSet={solvedIds}
            isAdmin={isAdmin}
            onToggleSolved={handleToggleSolved}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddProblem={(r) => handleCreateClick(r)}
            user={user}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        © <span>Bhargav Dubey</span> — Codeforces Practice Sheet & Ladder
      </footer>

      {/* User Auth Modal (Login / Register) */}
      {showAuthModal && (
        <UserAuthModal
          initialMode={authModalMode}
          promptMessage={authPromptMessage}
          onSuccess={handleAuthSuccess}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* Admin Passkey Modal */}
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
