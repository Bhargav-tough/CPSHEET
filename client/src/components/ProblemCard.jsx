import { useState } from 'react';
import { getRatingClass } from '../utils/rating';

const ProblemCard = ({
  problem,
  isAdmin,
  isSolved = false,
  onToggleSolved,
  onEdit,
  onDelete,
}) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${problem.name}"?`)) return;
    setDeleting(true);
    await onDelete(problem._id);
    setDeleting(false);
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    if (onToggleSolved) {
      onToggleSolved(problem._id);
    }
  };

  const ratingClass = getRatingClass(problem.rating);

  return (
    <div className={`problem-card ${ratingClass} ${isSolved ? 'is-solved' : ''} fade-in`}>
      <div className="problem-card-header">
        <div className="problem-title-group">
          <button
            type="button"
            className={`solve-toggle-btn ${isSolved ? 'checked' : ''}`}
            onClick={handleToggle}
            title={isSolved ? 'Mark as Unsolved' : 'Mark as Solved (Turns card green)'}
            aria-label={isSolved ? 'Mark as Unsolved' : 'Mark as Solved'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
          <span className={`problem-name ${isSolved ? 'name-solved' : ''}`} title={problem.name}>
            {problem.name}
          </span>
        </div>

        <span className={`problem-rating-pill ${ratingClass}`}>
          {problem.rating}
        </span>
      </div>

      {problem.tags && problem.tags.length > 0 && (
        <div className="problem-tags">
          {problem.tags.map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}

      <div className="problem-card-footer">
        <button
          type="button"
          className={`status-dot-btn ${isSolved ? 'solved' : ''}`}
          onClick={handleToggle}
          title="Click to toggle solved status"
        >
          <span className="status-dot-circle" />
          <span>{isSolved ? 'Solved ✓' : 'Available'}</span>
        </button>

        <div className="problem-actions">
          {isAdmin && (
            <>
              <button
                id={`edit-${problem._id}`}
                className="btn btn-ghost btn-sm btn-icon"
                onClick={() => onEdit(problem)}
                title="Edit problem"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                id={`delete-${problem._id}`}
                className="btn btn-danger btn-sm btn-icon"
                onClick={handleDelete}
                disabled={deleting}
                title="Delete problem"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </button>
            </>
          )}
          <a
            id={`solve-${problem._id}`}
            className="btn-solve"
            href={problem.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Solve
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProblemCard;
