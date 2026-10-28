import { useState } from 'react';
import { getRatingClass } from '../utils/rating';

const ProblemListBlock = ({
  activeRating,
  problems = [],
  solvedSet,
  isAdmin,
  onToggleSolved,
  onEdit,
  onDelete,
  onAddProblem,
  user,
}) => {
  const [deletingId, setDeletingId] = useState(null);

  const solvedCount = problems.filter((p) => solvedSet?.has(p._id)).length;
  const totalCount = problems.length;
  const progressPercent = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;
  const isAllSolved = totalCount > 0 && solvedCount === totalCount;
  const ratingClass = activeRating === 'all' ? 'rating-all' : getRatingClass(Number(activeRating));

  const handleDelete = async (problem) => {
    if (!window.confirm(`Delete "${problem.name}"?`)) return;
    setDeletingId(problem._id);
    await onDelete(problem._id);
    setDeletingId(null);
  };

  return (
    <div className={`problem-list-block ${ratingClass}`}>
      {/* ─── Block Header covering the top of the block ─── */}
      <div className="list-block-header">
        <div className="list-block-header-left">
          <div className="list-block-title-group">
            <span className={`rating-badge ${ratingClass}`}>
              {activeRating === 'all' ? 'ALL' : activeRating}
            </span>
            <h2 className="list-block-title">
              {activeRating === 'all' ? 'All Practice Problems' : `Rating ${activeRating} Problems`}
            </h2>
          </div>
          <div className="list-block-subtitle">
            <span>{totalCount} {totalCount === 1 ? 'question' : 'questions'}</span>
            <span className="dot-divider">•</span>
            <span className={`solved-stat ${isAllSolved ? 'all-done' : ''}`}>
              {solvedCount} Solved ({progressPercent}%)
            </span>
            {user && (
              <span className="user-synced-pill" title="Saved to your MongoDB account">
                Synced with @{user.username}
              </span>
            )}
          </div>
        </div>

        <div className="list-block-header-right">
          {isAdmin && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onAddProblem(activeRating === 'all' ? 800 : Number(activeRating))}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              + Add {activeRating === 'all' ? '' : `${activeRating} `}Problem
            </button>
          )}
        </div>
      </div>

      {/* Progress Track spanning the block */}
      <div className="list-block-progress-track">
        <div
          className={`list-block-progress-fill ${isAllSolved ? 'full' : ''}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* ─── List-Wise Questions covering the block ─── */}
      {problems.length === 0 ? (
        <div className="list-block-empty">
          <div className="empty-icon">📝</div>
          <h3>No problems found in this tab</h3>
          <p>
            {activeRating === 'all'
              ? 'No problems match your current search or filter.'
              : `No questions have been added for Rating ${activeRating} yet.`}
          </p>
          {isAdmin && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ marginTop: 14 }}
              onClick={() => onAddProblem(activeRating === 'all' ? 800 : Number(activeRating))}
            >
              + Add First {activeRating === 'all' ? '' : `${activeRating} `}Problem
            </button>
          )}
        </div>
      ) : (
        <div className="question-list-table">
          <div className="question-list-thead">
            <div className="col-status">Status</div>
            <div className="col-num">#</div>
            <div className="col-title">Problem Name</div>
            <div className="col-rating">Rating</div>
            <div className="col-tags">Tags</div>
            <div className="col-action">Action</div>
          </div>

          <div className="question-list-tbody">
            {problems.map((problem, index) => {
              const isSolved = Boolean(solvedSet?.has(problem._id));
              const itemRatingClass = getRatingClass(problem.rating);

              return (
                <div
                  key={problem._id}
                  className={`question-row ${isSolved ? 'is-solved' : ''} ${itemRatingClass}`}
                >
                  {/* Status Toggle / Mark as read */}
                  <div className="col-status">
                    <button
                      type="button"
                      className={`row-solve-toggle ${isSolved ? 'checked' : ''}`}
                      onClick={() => onToggleSolved(problem._id)}
                      title={isSolved ? 'Mark as Unsolved' : 'Mark as Read / Solved'}
                      aria-label={isSolved ? 'Mark as Unsolved' : 'Mark as Solved'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Row index */}
                  <div className="col-num">
                    <span className="row-index">{index + 1}</span>
                  </div>

                  {/* Problem Title & CF Link */}
                  <div className="col-title">
                    <a
                      href={problem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`problem-link ${isSolved ? 'title-solved' : ''}`}
                      title={`Open "${problem.name}" on Codeforces`}
                    >
                      <span className="problem-text">{problem.name}</span>
                      <svg className="external-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                    {isSolved && <span className="solved-pill-tag">Solved ✓</span>}
                  </div>

                  {/* Rating Badge */}
                  <div className="col-rating">
                    <span className={`row-rating-badge ${itemRatingClass}`}>
                      {problem.rating}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="col-tags">
                    {problem.tags && problem.tags.length > 0 ? (
                      <div className="row-tags-wrapper">
                        {problem.tags.map((tag) => (
                          <span key={tag} className="tag-chip">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="no-tags">—</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-action">
                    {isAdmin && (
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-icon"
                          onClick={() => onEdit(problem)}
                          title="Edit problem"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={() => handleDelete(problem)}
                          disabled={deletingId === problem._id}
                          title="Delete problem"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4h6v2" />
                          </svg>
                        </button>
                      </div>
                    )}

                    <a
                      href={problem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-solve-pill"
                    >
                      Solve ↗
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemListBlock;

