import { useState, useEffect } from 'react';
import { API_BASE } from '../api';

// Modal that handles both:
// 1. First-Time Setup: If no passkey exists in MongoDB yet, prompts the owner to create one.
//    Once saved, setup is permanently locked in the database so nobody else can ever create it.
// 2. Normal Unlock: If already set up, verifies the passkey against MongoDB.
const PasskeyModal = ({ onSuccess, onClose }) => {
  const [isSetup, setIsSetup] = useState(null); // null = checking, false = needs setup, true = created
  const [checking, setChecking] = useState(true);

  const [passkey, setPasskey] = useState('');
  const [confirmPasskey, setConfirmPasskey] = useState('');
  const [showPasskey, setShowPasskey] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check setup status from MongoDB on mount
  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/problems/passkey-status`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setIsSetup(Boolean(data.isSetup));
        } else {
          if (isMounted) setIsSetup(true); // fallback to verify if status endpoint fails
        }
      } catch {
        if (isMounted) setIsSetup(true);
      } finally {
        if (isMounted) setChecking(false);
      }
    };
    checkStatus();
    return () => { isMounted = false; };
  }, []);

  // Handle first-time creation
  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    if (!passkey.trim()) {
      setError('Please enter a passkey.');
      return;
    }
    if (passkey.length < 4) {
      setError('Passkey must be at least 4 characters long.');
      return;
    }
    if (passkey !== confirmPasskey) {
      setError('Passkeys do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/problems/setup-passkey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ passkey: passkey.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sessionStorage.setItem('cp_admin_token', passkey.trim());
        onSuccess(passkey.trim(), true);
      } else {
        setError(data.message || 'Failed to create passkey.');
        // If it was already created by someone else, switch mode
        if (res.status === 403) {
          setIsSetup(true);
        }
      }
    } catch {
      setError('Could not connect to the server. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  // Handle normal verification
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!passkey.trim()) {
      setError('Please enter the passkey.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/problems/verify-passkey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${passkey.trim()}`,
        },
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        sessionStorage.setItem('cp_admin_token', passkey.trim());
        onSuccess(passkey.trim(), false);
      } else if (data.notSetup) {
        setIsSetup(false);
        setError('No passkey exists yet in MongoDB. Create one now.');
      } else {
        setError('Incorrect passkey. Try again.');
        setPasskey('');
      }
    } catch {
      setError('Could not reach the server. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="passkey-title">
        <div className={`modal-icon ${!isSetup && !checking ? 'setup-icon' : ''}`}>
          {!isSetup && !checking ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          )}
        </div>

        {checking ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div className="spinner" style={{ margin: '0 auto 12px', width: '28px', height: '28px' }} />
            <p style={{ margin: 0, fontSize: '0.85rem' }}>Checking admin security status…</p>
          </div>
        ) : !isSetup ? (
          /* FIRST-TIME SETUP VIEW */
          <>
            <div className="setup-badge">First-Time Setup Only</div>
            <h2 id="passkey-title">Create Admin Passkey</h2>
            <p>
              No passkey is stored in MongoDB yet. Create your secret passkey now. Once saved, it is permanently locked so nobody else can ever create it.
            </p>

            <form onSubmit={handleSetupSubmit}>
              <div className="modal-input-wrapper">
                <input
                  id="passkey-input"
                  className={`modal-input ${error ? 'error' : ''}`}
                  type={showPasskey ? 'text' : 'password'}
                  value={passkey}
                  onChange={(e) => { setPasskey(e.target.value); setError(''); }}
                  placeholder="Create new passkey…"
                  autoFocus
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowPasskey((v) => !v)}
                  aria-label="Toggle passkey visibility"
                >
                  {showPasskey ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="modal-input-wrapper">
                <input
                  id="confirm-passkey-input"
                  className={`modal-input ${error ? 'error' : ''}`}
                  type={showPasskey ? 'text' : 'password'}
                  value={confirmPasskey}
                  onChange={(e) => { setConfirmPasskey(e.target.value); setError(''); }}
                  placeholder="Confirm your passkey…"
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="modal-error">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={onClose}>
                  Cancel
                </button>
                <button id="passkey-submit" type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving to MongoDB…' : 'Save & Lock Passkey'}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* REGULAR UNLOCK VIEW */
          <>
            <h2 id="passkey-title">Admin Access</h2>
            <p>Enter your passkey to unlock problem management.</p>

            <form onSubmit={handleVerifySubmit}>
              <div className="modal-input-wrapper">
                <input
                  id="passkey-input"
                  className={`modal-input ${error ? 'error' : ''}`}
                  type={showPasskey ? 'text' : 'password'}
                  value={passkey}
                  onChange={(e) => { setPasskey(e.target.value); setError(''); }}
                  placeholder="Enter passkey…"
                  autoFocus
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowPasskey((v) => !v)}
                  aria-label="Toggle passkey visibility"
                >
                  {showPasskey ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {error && (
                <div className="modal-error">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={onClose}>
                  Cancel
                </button>
                <button id="passkey-submit" type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Verifying…' : 'Unlock'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default PasskeyModal;
