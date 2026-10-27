// Navbar component — shows the brand logo, title, admin session badge, and Create button.
const Navbar = ({ isAdmin, onCreateClick, onLogout }) => {
  return (
    <nav className="navbar">
      <a className="navbar-brand" href="/">
        <div className="navbar-logo">CP</div>
        <span className="navbar-title">
          CF <span>Sheet</span>
        </span>
      </a>

      <div className="navbar-actions">
        {isAdmin && (
          <>
            <div className="admin-session-badge">
              <span className="admin-session-dot" />
              Admin
            </div>
            <button className="btn btn-outline btn-sm" onClick={onLogout}>
              Logout
            </button>
          </>
        )}
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
