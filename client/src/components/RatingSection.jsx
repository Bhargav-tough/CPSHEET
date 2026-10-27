import ProblemCard from './ProblemCard';
import { getRatingClass } from '../utils/rating';

// Section block grouping all problems of the same rating.
const RatingSection = ({
  rating,
  problems = [],
  isAdmin,
  solvedSet,
  onToggleSolved,
  onEdit,
  onDelete,
  onAddProblemForRating,
}) => {
  const ratingClass = getRatingClass(rating);
  const solvedCount = problems.filter((p) => solvedSet?.has(p._id)).length;
  const progressPercent = problems.length > 0 ? Math.round((solvedCount / problems.length) * 100) : 0;
  const isAllSolved = problems.length > 0 && solvedCount === problems.length;

  return (
    <div className={`rating-section-block ${ratingClass}`} id={`section-${rating}`}>
      <div className="rating-block-header">
        <div className="rating-block-title-row">
          <span className={`rating-badge ${ratingClass}`}>
            {rating}
          </span>
          <span className="rating-count">
            {problems.length} {problems.length === 1 ? 'problem' : 'problems'}
          </span>
        </div>

        {/* Progress tracker */}
        <div className="rating-progress-bar-wrapper">
          <div className="rating-progress-info">
            <span className="rating-progress-label">Solved</span>
            <span className={`rating-progress-stat ${isAllSolved ? 'completed' : ''}`}>
              {solvedCount} / {problems.length} ({progressPercent}%)
            </span>
          </div>
          <div className="rating-progress-track">
            <div
              className={`rating-progress-fill ${isAllSolved ? 'full' : ''}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="rating-block-cards">
        {problems.length === 0 ? (
          <div className="empty-section-block">
            <div className="empty-section-icon">📌</div>
            <div className="empty-section-title">Rating {rating}</div>
            <p className="empty-section-text">No problems added yet.</p>
            {isAdmin && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => onAddProblemForRating && onAddProblemForRating(rating)}
                style={{ marginTop: 10 }}
              >
                + Add {rating} Problem
              </button>
            )}
          </div>
        ) : (
          problems.map((p) => (
            <ProblemCard
              key={p._id}
              problem={p}
              isAdmin={isAdmin}
              isSolved={Boolean(solvedSet?.has(p._id))}
              onToggleSolved={onToggleSolved}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default RatingSection;

