// Navbar component — shows the brand logo, user account status, admin session badge, and action buttons.
const Navbar = ({
  user,
  solvedCount,
  onOpenAuth,
  onUserLogout,
  isAdmin,
  onCreateClick,
  onAdminLogout,
}) => {
  return (
    <nav className="navbar">
      <a className="navbar-brand" href="/">
        <div className="navbar-logo">CP</div>
        <span className="navbar-title">
          CF <span>Sheet</span>
        </span>
      </a>

      <div className="navbar-actions">
        {/* User Account Section */}
        {user ? (
          <div className="user-profile-bar">
            <div className="user-pill" title={`Signed in as ${user.username}`}>
              <span className="user-avatar-icon">👤</span>
              <span className="user-name">@{user.username}</span>
              <span className="user-solved-count">{solvedCount} solved</span>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onUserLogout}
              title="Sign out of account"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-outline btn-sm user-auth-btn"
            onClick={() => onOpenAuth('login')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Sign In / Register
          </button>
        )}

        {/* Admin Session Badge */}
        {isAdmin && (
          <div className="admin-session-group">
            <div className="admin-session-badge">
              <span className="admin-session-dot" />
              Admin
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm btn-admin-logout"
              onClick={onAdminLogout}
              title="End Admin Session"
            >
              Admin Logout
            </button>
          </div>
        )}

        {/* Create Problem Button */}
        <button
          id="create-problem-btn"
          className="btn btn-primary btn-sm"
          onClick={onCreateClick}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
