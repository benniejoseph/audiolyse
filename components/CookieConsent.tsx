'use client';

import { useState, useEffect } from 'react';

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="cookie-consent">
      <div className="cookie-content">
        <p>
          We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
          {' '}
          <a href="/privacy" className="cookie-link">Learn more</a>
        </p>
        <button onClick={handleAccept} className="cookie-btn">
          Got it
        </button>
      </div>
      <style jsx>{`
        .cookie-consent {
          position: fixed;
          bottom: 20px;
          right: 20px;
          left: 20px;
          max-width: 400px;
          background: var(--card);
          border: 1px solid var(--accent);
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          z-index: 9999;
          animation: slideUp 0.3s ease-out;
        }
        @media (min-width: 768px) {
          .cookie-consent {
            left: auto;
          }
        }
        .cookie-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        p {
          margin: 0;
          font-size: 0.9rem;
          color: var(--text);
        }
        .cookie-link {
          color: var(--accent);
          text-decoration: underline;
        }
        .cookie-btn {
          align-self: flex-end;
          background: var(--accent);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .cookie-btn:hover {
          opacity: 0.9;
        }
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
